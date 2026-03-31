const express = require('express');
const router = express.Router();
const {
  getDiscoveryProfiles,
  performAction,
  getLikedYou,
  getYouLiked,
  getPassed,
  rewindPass,
} = require('../controllers/discoverController');
const { protect } = require('../middleware/auth');

router.get('/', protect, getDiscoveryProfiles);
router.get('/liked-you', protect, getLikedYou);
router.get('/you-liked', protect, getYouLiked);
router.get('/passed', protect, getPassed);
router.post('/action', protect, performAction);
router.post('/rewind', protect, rewindPass);

module.exports = router;
