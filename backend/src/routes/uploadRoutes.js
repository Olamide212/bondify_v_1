const express = require('express');
const router = express.Router();
const { uploadPhotos, deletePhoto } = require('../controllers/uploadController');
const { protect } = require('../middleware/auth');
const upload = require('../middleware/upload');

router.post('/photos', protect, upload.array('photos', 6), uploadPhotos);
router.delete('/photos/:publicId', protect, deletePhoto);

module.exports = router;
