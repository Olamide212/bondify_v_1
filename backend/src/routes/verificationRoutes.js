const express = require('express');
const router = express.Router();
const {
  submitVerification,
  getVerificationStatus,
  reviewVerification,
  listPendingVerifications,
} = require('../controllers/verificationController');
const { protect } = require('../middleware/auth');
const upload = require('../middleware/upload');

router.use(protect);

// User routes
router.post('/submit', upload.single('idSelfie'), submitVerification);
router.get('/status', getVerificationStatus);

// Admin routes (add admin middleware in production)
router.get('/admin/pending', listPendingVerifications);
router.patch('/admin/:verificationId/review', reviewVerification);

module.exports = router;
