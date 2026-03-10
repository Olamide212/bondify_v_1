/**
 * verificationController.js
 *
 * POST /api/profile/verify
 *   - Accepts a selfie (multipart/form-data, field: "selfie")
 *   - Uploads to S3 under bondify/verifications/{userId}/
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
const AUTO_APPROVE = process.env.VERIFY_AUTO_APPROVE === 'true';

// ─── Helpers ──────────────────────────────────────────────────────────────────
const getS3Key = (userId) =>
  `bondify/verifications/${userId}/${Date.now()}-${Math.round(Math.random() * 1e9)}.jpg`;

const getPublicUrl = (bucket, key) => {
  const base = process.env.AWS_S3_PUBLIC_BASE_URL;
  if (base) return `${base.replace(/\/$/, '')}/${key}`;
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

// ─── Controller ───────────────────────────────────────────────────────────────
/**
 * @desc    Submit selfie for identity verification
 * @route   POST /api/profile/verify
 * @access  Private
 */
const submitVerification = async (req, res) => {
  try {
    const userId = req.user._id;
    const bucket = process.env.AWS_S3_BUCKET;

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

    if (user.verified) {
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

    // ── Upload to S3 ─────────────────────────────────────────────────────────
    const key = getS3Key(userId.toString());
    await s3.send(new PutObjectCommand({
      Bucket:      bucket,
      Key:         key,
      Body:        req.file.buffer,
      ContentType: req.file.mimetype,
    }));

    const selfieUrl = getPublicUrl(bucket, key);

    // ── Update user ──────────────────────────────────────────────────────────
    const newStatus = AUTO_APPROVE ? 'approved' : 'pending';
    const updatePayload = {
      verificationStatus:      newStatus,
      verificationSelfieUrl:   selfieUrl,
      verificationSubmittedAt: new Date(),
    };

    if (AUTO_APPROVE) {
      updatePayload.verified = true;
    }

    await User.findByIdAndUpdate(userId, updatePayload);

    return res.status(200).json({
      success: true,
      message: AUTO_APPROVE
        ? 'Verification approved. Your profile is now verified!'
        : 'Selfie submitted successfully. We will review it shortly.',
      status:  newStatus,
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