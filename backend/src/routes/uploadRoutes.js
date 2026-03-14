const express = require('express');
const router = express.Router();
const { uploadPhotos, deletePhoto, uploadChatMedia, uploadPostMedia } = require('../controllers/uploadController');
const { protect } = require('../middleware/auth');
const upload = require('../middleware/upload');
const chatUpload = require('../middleware/chatUpload');
const postUpload = require('../middleware/postUpload');

router.post('/photos', protect, upload.array('photos', 6), uploadPhotos);
router.post('/chat-media', protect, chatUpload.single('file'), uploadChatMedia);
router.post('/post-media', protect, postUpload.array('media', 4), uploadPostMedia);
router.delete('/photos/:publicId', protect, deletePhoto);
router.delete('/photos/*', protect, deletePhoto);

module.exports = router;
