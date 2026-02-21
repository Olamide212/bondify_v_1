const cloudinary = require('../config/cloudinary');
const User = require('../models/User');

// @desc    Upload profile photos
// @route   POST /api/upload/photos
// @access  Private
const uploadPhotos = async (req, res, next) => {
  try {
    const userId = req.user._id;

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

    const uploadPromises = req.files.map((file, index) => {
      return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          {
            folder: `bondify/users/${userId}`,
            resource_type: 'image',
            transformation: [
              { width: 800, height: 800, crop: 'limit', quality: 'auto' },
            ],
          },
          (error, result) => {
            if (error) {
              reject(error);
            } else {
              resolve({
                url: result.secure_url,
                publicId: result.public_id,
                order: (user.images?.length || 0) + index,
              });
            }
          }
        );
        stream.end(file.buffer);
      });
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
    const { publicId } = req.params;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Remove from cloudinary
    await cloudinary.uploader.destroy(publicId);

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

module.exports = {
  uploadPhotos,
  deletePhoto,
};
