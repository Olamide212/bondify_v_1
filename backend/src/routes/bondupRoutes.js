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
} = require('../controllers/bondupController');

// All routes require authentication
router.use(protect);

// CRUD
router.post('/create', createBondup);
router.get('/public', getPublicBondups);
router.get('/circle', getCircleBondups);
router.get('/my', getMyBondups);
router.get('/:id', getBondup);
router.delete('/:id', deleteBondup);

// Join / Leave
router.post('/join/:id', joinBondup);
router.post('/leave/:id', leaveBondup);

module.exports = router;
