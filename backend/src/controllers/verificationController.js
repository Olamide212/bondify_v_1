const Verification = require('../models/Verification');
const User = require('../models/User');
const Notification = require('../models/Notification');
const { uploadToS3, deleteFromS3 } = require('../utils/imageHelper');

// ─────────────────────────────────────────────
//  SUBMIT VERIFICATION
// ─────────────────────────────────────────────
const submitVerification = async (req, res, next) => {
  try {
    const { idType } = req.body;

    if (!idType) {
      return res.status(400).json({ success: false, message: 'idType is required' });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Please upload a clear photo of yourself holding your ID',
      });
    }

    // Check if existing verification
    const existing = await Verification.findOne({ user: req.user._id });
    if (existing) {
      if (existing.status === 'pending' || existing.status === 'under_review') {
        return res.status(400).json({
          success: false,
          message: 'A verification request is already pending. Please wait for review.',
        });
      }
      if (existing.status === 'approved') {
        return res.status(400).json({ success: false, message: 'Account is already verified' });
      }
    }

    // Upload image to S3
    const uploadResult = await uploadToS3(req.file, `verifications/${req.user._id}`);

    const verificationData = {
      user: req.user._id,
      idType,
      selfieWithIdUrl: { url: uploadResult.url, publicId: uploadResult.publicId },
      status: 'pending',
      submittedAt: new Date(),
    };

    let verification;
    if (existing) {
      // Resubmission after rejection — delete old image if exists
      if (existing.selfieWithIdUrl?.publicId) {
        await deleteFromS3(existing.selfieWithIdUrl.publicId).catch(() => {});
      }
      verification = await Verification.findByIdAndUpdate(existing._id, verificationData, { new: true });
    } else {
      verification = await Verification.create(verificationData);
    }

    // Update user verification status
    await User.findByIdAndUpdate(req.user._id, { verificationStatus: 'pending' });

    res.status(201).json({
      success: true,
      message: 'Verification submitted successfully. We will review within 24-48 hours.',
      data: {
        id: verification._id,
        status: verification.status,
        submittedAt: verification.submittedAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────
//  GET MY VERIFICATION STATUS
// ─────────────────────────────────────────────
const getVerificationStatus = async (req, res, next) => {
  try {
    const verification = await Verification.findOne({ user: req.user._id }).select(
      '-selfieWithIdUrl.publicId'
    );

    if (!verification) {
      return res.json({
        success: true,
        data: { status: 'unverified', message: 'No verification submitted yet' },
      });
    }

    res.json({
      success: true,
      data: {
        status: verification.status,
        idType: verification.idType,
        submittedAt: verification.submittedAt,
        reviewedAt: verification.reviewedAt,
        rejectionReason: verification.status === 'rejected' ? verification.rejectionReason : undefined,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────
//  ADMIN: REVIEW VERIFICATION
// ─────────────────────────────────────────────
const reviewVerification = async (req, res, next) => {
  try {
    const { verificationId } = req.params;
    const { action, rejectionReason } = req.body; // action: 'approve' | 'reject'

    if (!['approve', 'reject'].includes(action)) {
      return res.status(400).json({ success: false, message: 'action must be approve or reject' });
    }

    const verification = await Verification.findById(verificationId).populate('user', 'email');
    if (!verification) {
      return res.status(404).json({ success: false, message: 'Verification not found' });
    }

    const status = action === 'approve' ? 'approved' : 'rejected';

    await Verification.findByIdAndUpdate(verificationId, {
      status,
      reviewedAt: new Date(),
      reviewedBy: req.user._id,
      rejectionReason: action === 'reject' ? rejectionReason : undefined,
    });

    // Update user
    const userUpdate = {
      verificationStatus: action === 'approve' ? 'verified' : 'rejected',
    };
    if (action === 'approve') userUpdate.verified = true;

    await User.findByIdAndUpdate(verification.user._id, userUpdate);

    // Notify user
    await Notification.create({
      recipient: verification.user._id,
      type: action === 'approve' ? 'verification_approved' : 'verification_rejected',
      title: action === 'approve' ? '✅ Identity Verified!' : '❌ Verification Rejected',
      body:
        action === 'approve'
          ? 'Your identity has been verified. Your profile now shows a verified badge!'
          : `Your verification was rejected. Reason: ${rejectionReason || 'Please resubmit with a clearer photo.'}`,
    });

    res.json({ success: true, message: `Verification ${status}` });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────
//  ADMIN: LIST PENDING VERIFICATIONS
// ─────────────────────────────────────────────
const listPendingVerifications = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const verifications = await Verification.find({ status: { $in: ['pending', 'under_review'] } })
      .populate('user', 'firstName lastName email images')
      .sort({ submittedAt: 1 }) // oldest first
      .skip(skip)
      .limit(limit);

    const total = await Verification.countDocuments({ status: { $in: ['pending', 'under_review'] } });

    res.json({
      success: true,
      data: verifications,
      pagination: { total, page, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  submitVerification,
  getVerificationStatus,
  reviewVerification,
  listPendingVerifications,
};
