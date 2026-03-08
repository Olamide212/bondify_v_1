const express = require('express');
const router = express.Router();
const {
  getMatches,
  getMatch,
  unmatch,
} = require('../controllers/matchController');
const { protect } = require('../middleware/auth');

router.get('/', protect, getMatches);
router.get('/:id', protect, getMatch);
router.delete('/:id', protect, unmatch);

module.exports = router;
