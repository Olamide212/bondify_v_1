const express = require('express');
const router  = express.Router();
const {
  getMatches,
  getMatch,
  unmatch,
  getUnmatchedUsers,
  getInteractionStatus,
} = require('../controllers/matchController');
const { protect } = require('../middleware/auth');

router.get('/',    protect, getMatches);

// Must come BEFORE /:id — otherwise Express treats "interaction" as the :id param
router.get('/unmatched',              protect, getUnmatchedUsers);
router.get('/interaction/:targetId',  protect, getInteractionStatus);

router.get('/:id',    protect, getMatch);
router.delete('/:id', protect, unmatch);

module.exports = router;