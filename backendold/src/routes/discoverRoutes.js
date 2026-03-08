const express = require('express');
const router = express.Router();
const {
  getDiscoveryProfiles,
  performAction,
  getLikedYou,
  getYouLiked,
  getPassed,
} = require('../controllers/discoverController');
const { protect } = require('../middleware/auth');

router.get('/', protect, getDiscoveryProfiles);
router.get('/liked-you', protect, getLikedYou);
router.get('/you-liked', protect, getYouLiked);
router.get('/passed', protect, getPassed);
router.post('/action', protect, performAction);

module.exports = router;
