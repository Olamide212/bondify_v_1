const express = require('express');
const router = express.Router();
const {
  getDiscoveryProfiles,
  performAction,
} = require('../controllers/discoverController');
const { protect } = require('../middleware/auth');

router.get('/', protect, getDiscoveryProfiles);
router.post('/action', protect, performAction);

module.exports = router;
