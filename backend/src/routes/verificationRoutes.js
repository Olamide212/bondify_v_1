const express = require('express');
const router  = express.Router();
const {
  submitVerification,
  approveVerification,
  rejectVerification,
} = require('../controllers/verificationController');
const { protect } = require('../middleware/auth');
const upload = require('../middleware/upload');

router.use(protect);

// ── User ──────────────────────────────────────────────────────────────────────
// POST /api/profile/verify   (called from the app — field name: "selfie")
router.post(
  '/verify',
  upload.fields([
    { name: 'selfie', maxCount: 1 },
    { name: 'profileMedia', maxCount: 6 },
  ]),
  submitVerification
);

// ── Admin ─────────────────────────────────────────────────────────────────────
// Add your admin middleware here before going to production
// e.g. router.use(requireAdmin);
router.patch('/admin/verify/:userId/approve', approveVerification);
router.patch('/admin/verify/:userId/reject',  rejectVerification);

module.exports = router;