/**
 * mapRoutes.js
 * Mount at: /api/map
 */

const express = require('express');
const router  = express.Router();
const { protect } = require('../middleware/auth');
const {
  updateLocation,
  getNearbyUsers,
  getMyStatus,
  createStatus,
  deleteStatus,
  reactToStatus,
  getAISuggestions,
} = require('../controllers/mapController');

router.patch('/location',            protect, updateLocation);    // PATCH  /api/map/location
router.get('/nearby',                protect, getNearbyUsers);    // GET    /api/map/nearby
router.get('/status',                protect, getMyStatus);       // GET    /api/map/status
router.post('/status',               protect, createStatus);      // POST   /api/map/status
router.delete('/status',             protect, deleteStatus);      // DELETE /api/map/status
router.post('/status/:id/react',     protect, reactToStatus);     // POST   /api/map/status/:id/react
router.post('/status/ai-suggest',    protect, getAISuggestions);  // POST   /api/map/status/ai-suggest

module.exports = router;