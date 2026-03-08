const express = require('express');
const router = express.Router();
const {
  createEvent,
  getEvents,
  getEvent,
  updateEvent,
  deleteEvent,
  rsvpEvent,
  getMyEvents,
} = require('../controllers/eventController');
const { protect } = require('../middleware/auth');
const upload = require('../middleware/upload');

router.use(protect);

router.get('/', getEvents);
router.get('/mine', getMyEvents);
router.post('/', upload.single('coverImage'), createEvent);
router.get('/:id', getEvent);
router.patch('/:id', upload.single('coverImage'), updateEvent);
router.delete('/:id', deleteEvent);
router.post('/:id/rsvp', rsvpEvent);

module.exports = router;
