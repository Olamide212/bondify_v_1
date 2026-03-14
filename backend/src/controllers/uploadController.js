const {
  PutObjectCommand,
  DeleteObjectCommand,
} = require('@aws-sdk/client-s3');
const s3 = require('../config/s3');
const User = require('../models/User');

const getContentType = (file) => file?.mimetype || 'image/jpeg';

const getObjectKey = (userId, originalname) => {
  const extension = originalname?.includes('.')
    ? originalname.split('.').pop().toLowerCase()
    : 'jpg';
  const safeExtension = /^[a-z0-9]+$/.test(extension) ? extension : 'jpg';
  return `bondify/users/${userId}/${Date.now()}-${Math.round(
    Math.random() * 1e9
  )}.${safeExtension}`;
};

const getPublicUrl = (bucket, key) => {
  const baseUrl = process.env.AWS_S3_PUBLIC_BASE_URL;
  if (baseUrl) {
    return `${baseUrl.replace(/\/$/, '')}/${key}`;
  }

  const region = process.env.AWS_REGION;
  return `https://${bucket}.s3.${region}.amazonaws.com/${key}`;
};

const getChatMediaType = (mimeType = '') => {
  if (mimeType.startsWith('audio/')) return 'voice';
  return 'image';
};

const getChatObjectKey = (userId, originalname, mimeType = '') => {
  const fallbackExtension = mimeType.startsWith('audio/') ? 'm4a' : 'jpg';
  const extension = originalname?.includes('.')
    ? originalname.split('.').pop().toLowerCase()
    : fallbackExtension;
  const safeExtension = /^[a-z0-9]+$/.test(extension)
    ? extension
    : fallbackExtension;
  return `bondify/chat/${userId}/${Date.now()}-${Math.round(
    Math.random() * 1e9
  )}.${safeExtension}`;
};

// @desc    Upload profile photos
// @route   POST /api/upload/photos
// @access  Private
const uploadPhotos = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const bucket = process.env.AWS_S3_BUCKET;

    if (!bucket) {
      return res.status(500).json({
        success: false,
        message: 'Missing AWS_S3_BUCKET configuration',
      });
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No files uploaded',
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    const existingCount = Array.isArray(user.images) ? user.images.length : 0;
    const incomingCount = Array.isArray(req.files) ? req.files.length : 0;

    if (existingCount + incomingCount > 6) {
      return res.status(400).json({
        success: false,
        message: 'You can upload up to 6 photos only',
      });
    }

    const uploadPromises = req.files.map(async (file, index) => {
      const objectKey = getObjectKey(userId, file.originalname);

      await s3.send(
        new PutObjectCommand({
          Bucket: bucket,
          Key: objectKey,
          Body: file.buffer,
          ContentType: getContentType(file),
        })
      );

      return {
        url: getPublicUrl(bucket, objectKey),
        publicId: objectKey,
        order: (user.images?.length || 0) + index,
      };
    });

    const uploadedImages = await Promise.all(uploadPromises);

    // Append new images to existing ones
    user.images = [...(user.images || []), ...uploadedImages];
    user.calculateCompletion();
    await user.save();

    res.json({
      success: true,
      message: 'Photos uploaded successfully',
      data: { images: user.images },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a profile photo
// @route   DELETE /api/upload/photos/:publicId
// @access  Private
const deletePhoto = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const publicId = req.params.publicId || req.params[0];
    const bucket = process.env.AWS_S3_BUCKET;
    if (!publicId) {
      return res.status(400).json({
        success: false,
        message: 'Missing photo identifier',
      });
    }


    if (!bucket) {
      return res.status(500).json({
        success: false,
        message: 'Missing AWS_S3_BUCKET configuration',
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Remove from S3
    await s3.send(
      new DeleteObjectCommand({
        Bucket: bucket,
        Key: publicId,
      })
    );

    // Remove from user's images array
    user.images = (user.images || []).filter(
      (img) => img.publicId !== publicId
    );
    user.calculateCompletion();
    await user.save();

    res.json({
      success: true,
      message: 'Photo deleted successfully',
      data: { images: user.images },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Upload chat media (image/audio)
// @route   POST /api/upload/chat-media
// @access  Private
const uploadChatMedia = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const bucket = process.env.AWS_S3_BUCKET;

    if (!bucket) {
      return res.status(500).json({
        success: false,
        message: 'Missing AWS_S3_BUCKET configuration',
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded',
      });
    }

    const mimeType = req.file?.mimetype || '';
    const mediaType = getChatMediaType(mimeType);
    const objectKey = getChatObjectKey(userId, req.file.originalname, mimeType);

    await s3.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: objectKey,
        Body: req.file.buffer,
        ContentType: getContentType(req.file),
      })
    );

    const mediaUrl = getPublicUrl(bucket, objectKey);

    res.json({
      success: true,
      message: 'Chat media uploaded successfully',
      data: {
        mediaUrl,
        publicId: objectKey,
        mediaType,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Upload post media (images/videos)
// @route   POST /api/upload/post-media
// @access  Private
const getPostObjectKey = (userId, originalname) => {
  const extension = originalname?.includes('.')
    ? originalname.split('.').pop().toLowerCase()
    : 'jpg';
  const safeExtension = /^[a-z0-9]+$/.test(extension) ? extension : 'jpg';
  return `bondify/posts/${userId}/${Date.now()}-${Math.round(
    Math.random() * 1e9
  )}.${safeExtension}`;
};

const uploadPostMedia = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const bucket = process.env.AWS_S3_BUCKET;

    if (!bucket) {
      return res.status(500).json({
        success: false,
        message: 'Missing AWS_S3_BUCKET configuration',
      });
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No files uploaded',
      });
    }

    const uploaded = [];
    for (const file of req.files) {
      const objectKey = getPostObjectKey(userId, file.originalname);
      await s3.send(
        new PutObjectCommand({
          Bucket: bucket,
          Key: objectKey,
          Body: file.buffer,
          ContentType: getContentType(file),
        })
      );
      uploaded.push({
        url: getPublicUrl(bucket, objectKey),
        publicId: objectKey,
      });
    }

    res.json({
      success: true,
      message: 'Post media uploaded successfully',
      data: uploaded,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  uploadPhotos,
  deletePhoto,
  uploadChatMedia,
  uploadPostMedia,
};
