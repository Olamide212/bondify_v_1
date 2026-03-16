const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  getPlans,
  createPlan,
  joinPlan,
  leavePlan,
  deletePlan,
  getMyPlans,
} = require('../controllers/planController');

router.use(protect);

// ── Plans ─────────────────────────────────────────────────────────────────────
router.get('/',              getPlans);
router.post('/',             createPlan);
router.get('/my',            getMyPlans);
router.post('/:planId/join', joinPlan);
router.post('/:planId/leave', leavePlan);
router.delete('/:planId',    deletePlan);

module.exports = router;
