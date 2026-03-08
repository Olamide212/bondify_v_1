const express = require('express');
const router = express.Router();
const { getPlans, getSubscriptionStatus, activatePremium, cancelPremium } = require('../controllers/premiumController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.get('/plans', getPlans);
router.get('/status', getSubscriptionStatus);
router.post('/activate', activatePremium);
router.post('/cancel', cancelPremium);

module.exports = router;
