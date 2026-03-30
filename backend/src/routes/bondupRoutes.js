const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const upload = require('../middleware/upload');
const {
  createBondup,
  getPublicBondups,
  getCircleBondups,
  joinBondup,
  leaveBondup,
  deleteBondup,
  getBondup,
  getMyBondups,
  getBondupProfile,
  sendFriendRequest,
  getFriendRequests,
  acceptFriendRequest,
  declineFriendRequest,
  getFriends,
  getFriendStatus,
  getMutualFriends,
  getSocialProfile,
  updateSocialProfile,
  uploadSocialPhoto,
} = require('../controllers/bondupController');

// All routes require authentication
router.use(protect);

// CRUD
router.post('/create', createBondup);
router.get('/public', getPublicBondups);
router.get('/circle', getCircleBondups);
router.get('/my', getMyBondups);
router.get('/profile/:userId', getBondupProfile);
router.post('/friend-request/:userId', sendFriendRequest);
router.get('/friend-requests', getFriendRequests);
router.post('/friend-request/:requestId/accept', acceptFriendRequest);
router.post('/friend-request/:requestId/decline', declineFriendRequest);
router.get('/friends/:userId?', getFriends);
router.get('/friend-status/:userId', getFriendStatus);
router.get('/mutual-friends/:userId', getMutualFriends);
router.get('/:id', getBondup);
router.delete('/:id', deleteBondup);

// Social Profile
router.get('/social-profile', getSocialProfile);
router.patch('/social-profile', updateSocialProfile);
router.post('/social-profile/photo', upload.single('profilePhoto'), uploadSocialPhoto);

module.exports = router;
