const express = require('express');
const router = express.Router();
const { uploadPhotos, deletePhoto, uploadChatMedia } = require('../controllers/uploadController');
const { protect } = require('../middleware/auth');
const upload = require('../middleware/upload');
const chatUpload = require('../middleware/chatUpload');

router.post('/photos', protect, upload.array('photos', 6), uploadPhotos);
router.post('/chat-media', protect, chatUpload.single('file'), uploadChatMedia);
router.delete('/photos/:publicId', protect, deletePhoto);
router.delete('/photos/*', protect, deletePhoto);

module.exports = router;
