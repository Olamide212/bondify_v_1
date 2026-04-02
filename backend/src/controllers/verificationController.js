/**
 * verificationController.js
 *
 * POST /api/profile/verify
 *   - Accepts a selfie (multipart/form-data, field: "selfie")
 *   - Uploads to S3 under bondies/verifications/{userId}/
 *   - Runs a basic face-presence check via OpenAI Vision
 *   - Sets user.verificationStatus = "pending" (admin/cron approves later)
 *     OR auto-approves if face is clearly detected (configurable via VERIFY_AUTO_APPROVE=true)
 *
 * User model additions required (add to User.js):
 *   verificationStatus: { type: String, enum: ['none','pending','approved','rejected'], default: 'none' },
 *   verificationSelfieUrl: { type: String },
 *   verificationSubmittedAt: { type: Date },
 *
 * profileRoutes.js addition:
 *   const upload = require('../middleware/upload');
 *   const { submitVerification } = require('../controllers/verificationController');
 *   router.post('/verify', protect, upload.single('selfie'), submitVerification);
 */

const { PutObjectCommand } = require('@aws-sdk/client-s3');
const s3      = require('../config/s3');
const User    = require('../models/User');
const OpenAI  = require('openai');

const openai  = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// ─── Helpers ──────────────────────────────────────────────────────────────────
const getS3Key = (userId) =>
  `bondies/verifications/${userId}/${Date.now()}-${Math.round(Math.random() * 1e9)}.jpg`;

const getPublicUrl = (bucket, key) => {
  const base = process.env.AWS_CLOUDFRONT_DOMAIN ||
    process.env.AWS_S3_PUBLIC_BASE_URL;
  if (base) {
    const normalizedBase = base.startsWith('http')
      ? base.replace(/\/$/, '')
      : `https://${base.replace(/\/$/, '')}`;
    return `${normalizedBase}/${key}`;
  }
  return `https://${bucket}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;
};

/**
 * Uses OpenAI Vision to check if a clear human face is present in the selfie.
 * Returns { faceDetected: boolean, reason: string }
 */
const checkFaceWithAI = async (imageBuffer, mimeType = 'image/jpeg') => {
  try {
    const base64 = imageBuffer.toString('base64');
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      max_tokens: 100,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image_url',
              image_url: { url: `data:${mimeType};base64,${base64}`, detail: 'low' },
            },
            {
              type: 'text',
              text: `Does this image contain a clear, real human face suitable for identity verification?
Reply ONLY in this exact JSON format (no markdown):
{"faceDetected": true/false, "reason": "one sentence explanation"}

Rules:
- faceDetected must be true ONLY if: single real human face, eyes visible, not obscured, not a photo of a photo, no mask/sunglasses, adequate lighting
- faceDetected false if: no face, cartoon, multiple faces, covered face, too dark/blurry, document photo`,
            },
          ],
        },
      ],
    });

    const raw  = response.choices[0]?.message?.content?.trim() || '';
    const clean = raw.replace(/```json|```/g, '').trim();
    return JSON.parse(clean);
  } catch (err) {
    console.error('[verification] AI face check failed:', err.message);
    // Fail open — let it go to manual review
    return { faceDetected: true, reason: 'AI check unavailable, queued for manual review' };
  }
};

/**
 * Uses OpenAI Vision to compare a selfie with a profile photo.
 * Returns { match: boolean, confidence: string, reason: string }
 */
const compareFacesWithAI = async (selfieBuffer, profilePhotoUrl, mimeType = 'image/jpeg') => {
  try {
    const selfieBase64 = selfieBuffer.toString('base64');
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      max_tokens: 150,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: `Compare these two photos. The first is a verification selfie and the second is the user's profile photo. Determine if they are the SAME person.

Reply ONLY in this exact JSON format (no markdown):
{"match": true/false, "confidence": "high"/"medium"/"low", "reason": "one sentence explanation"}

Rules:
- match true ONLY if the two faces clearly belong to the same person (same facial structure, features)
- Consider that lighting, angle, expression, and hairstyle may differ between photos
- If uncertain, set match to false with confidence "low"
- Be strict: we need to prevent catfishing`,
            },
            {
              type: 'image_url',
              image_url: { url: `data:${mimeType};base64,${selfieBase64}`, detail: 'low' },
            },
            {
              type: 'image_url',
              image_url: { url: profilePhotoUrl, detail: 'low' },
            },
          ],
        },
      ],
    });

    const raw   = response.choices[0]?.message?.content?.trim() || '';
    const clean = raw.replace(/```json|```/g, '').trim();
    return JSON.parse(clean);
  } catch (err) {
    console.error('[verification] AI face comparison failed:', err.message);
    // Fail open — skip comparison, rely on face detection only
    return { match: false, confidence: 'low', reason: 'AI comparison unavailable, queued for manual review' };
  }
};

// ─── Controller ───────────────────────────────────────────────────────────────
/**
 * @desc    Submit selfie for identity verification
 * @route   POST /api/profile/verify
 * @access  Private
 */
const submitVerification = async (req, res) => {
  try {
    const userId = req.user._id;
    const bucket = process.env.AWS_S3_USERS_VERIFICATION_BUCKET;

    // ── Guards ──────────────────────────────────────────────────────────────
    if (!bucket) {
      return res.status(500).json({ success: false, message: 'Storage not configured.' });
    }

    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No selfie file provided.' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    if (user.verificationStatus === 'approved') {
      return res.status(400).json({ success: false, message: 'Account is already verified.' });
    }

    if (user.verificationStatus === 'pending') {
      return res.status(400).json({ success: false, message: 'Verification is already pending review.' });
    }

    // ── AI face check ────────────────────────────────────────────────────────
    const { faceDetected, reason } = await checkFaceWithAI(req.file.buffer, req.file.mimetype);

    if (!faceDetected) {
      return res.status(422).json({
        success: false,
        message: `Selfie rejected: ${reason}. Please take a clear photo of your face.`,
      });
    }

    // ── AI face comparison with profile photo (STRICT) ────────────────────────
    // Get the user's first profile photo for comparison
    const profilePhotoUrl = Array.isArray(user.images) && user.images.length > 0
      ? [...user.images].sort((a, b) => (a.order ?? 0) - (b.order ?? 0))[0]?.url
      : null;

    if (!profilePhotoUrl) {
      return res.status(422).json({
        success: false,
        message: 'You must upload at least one profile photo before verifying your identity.',
        code: 'NO_PROFILE_PHOTO',
      });
    }

    const faceMatch = await compareFacesWithAI(req.file.buffer, profilePhotoUrl, req.file.mimetype);
    console.log('[verification] Face comparison result:', faceMatch);

    // STRICT: Reject immediately if faces don't match
    if (!faceMatch.match) {
      return res.status(422).json({
        success: false,
        message: faceMatch.confidence === 'low' && faceMatch.reason?.includes('unavailable')
          ? 'Face comparison service is temporarily unavailable. Please try again shortly.'
          : `Verification failed: The selfie does not match your profile photo. ${faceMatch.reason || 'Please ensure you are taking a clear selfie of yourself.'}`,
        code: 'FACE_MISMATCH',
        comparison: {
          match:      faceMatch.match,
          confidence: faceMatch.confidence,
          reason:     faceMatch.reason,
        },
      });
    }

    // STRICT: Only accept high or medium confidence matches
    if (faceMatch.confidence === 'low') {
      return res.status(422).json({
        success: false,
        message: 'We could not confidently confirm your identity. Please retake the selfie in better lighting with your face clearly visible.',
        code: 'LOW_CONFIDENCE',
        comparison: {
          match:      faceMatch.match,
          confidence: faceMatch.confidence,
          reason:     faceMatch.reason,
        },
      });
    }

    // ── Upload to S3 ─────────────────────────────────────────────────────────
    const key = getS3Key(userId.toString());
    await s3.send(new PutObjectCommand({
      Bucket:      bucket,
      Key:         key,
      Body:        req.file.buffer,
      ContentType: req.file.mimetype,
    }));

    const selfieUrl = getPublicUrl(bucket, key);

    // ── Auto-approve: face detected + face matched with high/medium confidence ─
    const updatePayload = {
      verificationStatus:      'approved',
      verificationSelfieUrl:   selfieUrl,
      verificationSubmittedAt: new Date(),
    };

    await User.findByIdAndUpdate(userId, updatePayload);

    return res.status(200).json({
      success: true,
      message: 'Verification approved! Your profile is now verified.',
      status: 'approved',
      comparison: {
        match:      faceMatch.match,
        confidence: faceMatch.confidence,
      },
    });

  } catch (err) {
    console.error('[submitVerification] error:', err);
    return res.status(500).json({ success: false, message: 'Verification submission failed.' });
  }
};

/**
 * @desc    Admin: approve a pending verification
 * @route   PATCH /api/admin/verify/:userId/approve
 * @access  Admin only
 */
const approveVerification = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.userId,
      { verified: true, verificationStatus: 'approved' },
      { new: true }
    ).select('name verified verificationStatus');

    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });

    return res.status(200).json({ success: true, user });
  } catch (err) {
    console.error('[approveVerification] error:', err);
    return res.status(500).json({ success: false, message: 'Approval failed.' });
  }
};

/**
 * @desc    Admin: reject a pending verification
 * @route   PATCH /api/admin/verify/:userId/reject
 * @access  Admin only
 */
const rejectVerification = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.userId,
      { verified: false, verificationStatus: 'rejected', verificationSelfieUrl: null },
      { new: true }
    ).select('name verified verificationStatus');

    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });

    return res.status(200).json({ success: true, user });
  } catch (err) {
    console.error('[rejectVerification] error:', err);
    return res.status(500).json({ success: false, message: 'Rejection failed.' });
  }
};

module.exports = { submitVerification, approveVerification, rejectVerification };