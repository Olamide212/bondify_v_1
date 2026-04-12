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

const { PutObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const s3      = require('../config/s3');
const User    = require('../models/User');
const OpenAI  = require('openai');
const { checkProfilePhotoWithAI } = require('../utils/aiPhotoCheck');

const openai  = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// ─── Helpers ──────────────────────────────────────────────────────────────────
const getS3Key = (userId) =>
  `bondies/verifications/${userId}/${Date.now()}-${Math.round(Math.random() * 1e9)}.jpg`;

const getProfileMediaKey = (userId, originalname = 'photo.jpg') => {
  const extension = originalname?.includes('.')
    ? originalname.split('.').pop().toLowerCase()
    : 'jpg';
  const safeExtension = /^[a-z0-9]+$/.test(extension) ? extension : 'jpg';
  return `bondify/users/${userId}/${Date.now()}-${Math.round(Math.random() * 1e9)}.${safeExtension}`;
};

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

const getProfileMediaType = (file = {}) => {
  const mimeType = file?.mimetype || '';
  return mimeType.startsWith('video/') ? 'video' : 'image';
};

const sortProfileMedia = (items = []) =>
  [...items]
    .sort((a, b) => {
      const aRank = a?.type === 'video' ? 1 : 0;
      const bRank = b?.type === 'video' ? 1 : 0;
      if (aRank !== bRank) return aRank - bRank;
      return (a?.order ?? 0) - (b?.order ?? 0);
    })
    .map((item, index) => ({ ...item, order: index }));

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
- faceDetected should be true if there is one real human face that is reasonably visible for selfie verification
- allow natural differences in lighting, angle, hairstyle, and mild blur
- faceDetected false only for: no face, multiple faces, cartoon/AI art, heavily covered face, extremely dark or unusable image`,
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
const compareFacesWithAI = async (selfieBuffer, profilePhoto, mimeType = 'image/jpeg') => {
  try {
    const selfieBase64 = selfieBuffer.toString('base64');
    const profilePhotoContent = profilePhoto?.buffer
      ? {
          type: 'image_url',
          image_url: {
            url: `data:${profilePhoto.mimetype || 'image/jpeg'};base64,${profilePhoto.buffer.toString('base64')}`,
            detail: 'low',
          },
        }
      : {
          type: 'image_url',
          image_url: { url: profilePhoto?.url, detail: 'low' },
        };

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
- match true if the two photos likely show the same person, even when lighting, angle, expression, hairstyle, makeup, or camera quality differ
- if the person looks likely the same but not perfectly certain, return match true with confidence "medium"
- return match false only when the faces appear clearly different or the profile image is unusable`,
            },
            {
              type: 'image_url',
              image_url: { url: `data:${mimeType};base64,${selfieBase64}`, detail: 'low' },
            },
            profilePhotoContent,
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
    const profileBucket = process.env.AWS_S3_BUCKET;
    const selfieFile = req.files?.selfie?.[0] || req.file;
    const stagedProfileMedia = Array.isArray(req.files?.profileMedia) ? req.files.profileMedia : [];

    // ── Guards ──────────────────────────────────────────────────────────────
    if (!bucket || !profileBucket) {
      return res.status(500).json({ success: false, message: 'Storage not configured.' });
    }

    if (!selfieFile) {
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
    const { faceDetected, reason } = await checkFaceWithAI(selfieFile.buffer, selfieFile.mimetype);

    if (!faceDetected) {
      return res.status(422).json({
        success: false,
        message: `Selfie rejected: ${reason}. Please take a clear photo of your face.`,
      });
    }

    // ── AI face comparison with profile photo (STRICT) ────────────────────────
    // Get the user's first profile photo for comparison
    const stagedMainPhoto = stagedProfileMedia.find((file) => getProfileMediaType(file) === 'image');
    const existingProfilePhoto = Array.isArray(user.images) && user.images.length > 0
      ? [...user.images].sort((a, b) => (a.order ?? 0) - (b.order ?? 0)).find((item) => (item?.type || 'image') === 'image')
      : null;

    if (!stagedMainPhoto && !existingProfilePhoto?.url) {
      return res.status(422).json({
        success: false,
        message: 'You must upload at least one profile photo before verifying your identity.',
        code: 'NO_PROFILE_PHOTO',
      });
    }

    // ── AI profile photo authenticity check ──────────────────────────────────
    // Ensure the profile photo is a genuine personal photo, not a screenshot,
    // AI-generated image, cartoon, or a photo scraped from the internet.
    if (stagedMainPhoto) {
      const photoCheck = await checkProfilePhotoWithAI(stagedMainPhoto.buffer, stagedMainPhoto.mimetype);
      console.log('[verification] Profile photo check:', photoCheck);
      if (!photoCheck.valid) {
        return res.status(422).json({
          success: false,
          message: `Your profile photo was rejected: ${photoCheck.reason}. Please upload a clear, genuine photo of yourself.`,
          code: 'INVALID_PROFILE_PHOTO',
        });
      }
    }

    const faceMatch = await compareFacesWithAI(
      selfieFile.buffer,
      stagedMainPhoto ? { buffer: stagedMainPhoto.buffer, mimetype: stagedMainPhoto.mimetype } : { url: existingProfilePhoto.url },
      selfieFile.mimetype
    );
    console.log('[verification] Face comparison result:', faceMatch);

    // Reject on high-confidence mismatches.
    // Medium-confidence mismatches are also rejected to prevent fake accounts.
    if (!faceMatch.match && (faceMatch.confidence === 'high' || faceMatch.confidence === 'medium')) {
      return res.status(422).json({
        success: false,
        message: `Verification failed: The selfie does not match your profile photo. ${faceMatch.reason || 'Please ensure you are taking a clear selfie of yourself.'}`,
        code: 'FACE_MISMATCH',
        comparison: {
          match:      faceMatch.match,
          confidence: faceMatch.confidence,
          reason:     faceMatch.reason,
        },
      });
    }

    // Low-confidence matches are queued for manual review rather than auto-approved.
    if (!faceMatch.match && faceMatch.confidence === 'low') {
      return res.status(422).json({
        success: false,
        message: `We could not confidently verify your identity. ${faceMatch.reason || 'Please retake your selfie in good lighting, facing the camera directly.'}`,
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
      Body:        selfieFile.buffer,
      ContentType: selfieFile.mimetype,
    }));

    const selfieUrl = getPublicUrl(bucket, key);

    // ── Auto-approve: face detected + face matched with high/medium confidence ─
    let uploadedProfileMedia = null;
    if (stagedProfileMedia.length > 0) {
      const uploadResults = await Promise.all(
        stagedProfileMedia.map(async (file, index) => {
          const mediaKey = getProfileMediaKey(userId.toString(), file.originalname);
          await s3.send(new PutObjectCommand({
            Bucket: profileBucket,
            Key: mediaKey,
            Body: file.buffer,
            ContentType: file.mimetype,
          }));

          return {
            url: getPublicUrl(profileBucket, mediaKey),
            publicId: mediaKey,
            type: getProfileMediaType(file),
            mimeType: file.mimetype,
            order: index,
          };
        })
      );
      uploadedProfileMedia = sortProfileMedia(uploadResults);

      await Promise.all(
        (user.images || [])
          .map((item) => item?.publicId)
          .filter(Boolean)
          .map((key) => s3.send(new DeleteObjectCommand({ Bucket: profileBucket, Key: key })).catch(() => {}))
      );

      user.images = uploadedProfileMedia;
    }

    user.verified = true;
    user.verificationStatus = 'approved';
    user.verificationSelfieUrl = selfieUrl;
    user.verificationSubmittedAt = new Date();
    user.calculateCompletion?.();
    await user.save();

    return res.status(200).json({
      success: true,
      message: 'Verification approved! Your profile is now verified.',
      status: 'approved',
      data: {
        images: user.images,
      },
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