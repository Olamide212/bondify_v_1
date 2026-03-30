const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
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
  acceptFriendRequest,
  declineFriendRequest,
  getFriends,
  getFriendStatus,
  getMutualFriends,
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
router.post('/friend-request/:requestId/accept', acceptFriendRequest);
router.post('/friend-request/:requestId/decline', declineFriendRequest);
router.get('/friends/:userId?', getFriends);
router.get('/friend-status/:userId', getFriendStatus);
router.get('/mutual-friends/:userId', getMutualFriends);
router.get('/:id', getBondup);
router.delete('/:id', deleteBondup);

// Join / Leave
router.post('/join/:id', joinBondup);
router.post('/leave/:id', leaveBondup);

module.exports = router;
