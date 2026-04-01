const express = require('express');
const router  = express.Router();
const {
  getMatches,
  getMatch,
  unmatch,
  getUnmatchedUsers,
  getInteractionStatus,
  requestRematch,
  respondToRematch,
} = require('../controllers/matchController');
const { protect } = require('../middleware/auth');

router.get('/',    protect, getMatches);

// Must come BEFORE /:id — otherwise Express treats "interaction" as the :id param
router.get('/unmatched',              protect, getUnmatchedUsers);
router.get('/interaction/:targetId',  protect, getInteractionStatus);

router.get('/:id',    protect, getMatch);
router.delete('/:id', protect, unmatch);

// Rematch
router.post('/:id/rematch',         protect, requestRematch);
router.post('/:id/rematch/respond', protect, respondToRematch);

module.exports = router;