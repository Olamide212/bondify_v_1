const Event = require('../models/Event');
const User = require('../models/User');
const { uploadToS3, deleteFromS3 } = require('../utils/imageHelper');

// ─────────────────────────────────────────────
//  CREATE EVENT
// ─────────────────────────────────────────────
const createEvent = async (req, res, next) => {
  try {
    const {
      title,
      description,
      category,
      date,
      endDate,
      address,
      city,
      country,
      latitude,
      longitude,
      isOnline,
      onlineLink,
      maxAttendees,
      isPremiumOnly,
      isPublic,
      tags,
    } = req.body;

    if (!title || !date) {
      return res.status(400).json({ success: false, message: 'Title and date are required' });
    }

    // Only premium users can create premium-only events
    if (isPremiumOnly && !req.user.isPremium) {
      return res.status(403).json({
        success: false,
        message: 'Only premium users can create premium-only events',
      });
    }

    let coverImage;
    if (req.file) {
      const result = await uploadToS3(req.file, `events/${req.user._id}`);
      coverImage = { url: result.url, publicId: result.publicId };
    }

    const event = await Event.create({
      creator: req.user._id,
      title,
      description,
      category,
      date: new Date(date),
      endDate: endDate ? new Date(endDate) : undefined,
      location: {
        type: 'Point',
        coordinates: [parseFloat(longitude) || 0, parseFloat(latitude) || 0],
        address,
        city,
        country,
        isOnline: Boolean(isOnline),
        onlineLink,
      },
      maxAttendees: maxAttendees ? parseInt(maxAttendees) : null,
      isPremiumOnly: Boolean(isPremiumOnly),
      isPublic: isPublic !== false,
      tags: Array.isArray(tags) ? tags : tags ? tags.split(',').map((t) => t.trim()) : [],
      coverImage,
      attendees: [{ user: req.user._id, status: 'going' }],
    });

    res.status(201).json({ success: true, message: 'Event created successfully', data: event });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────
//  GET EVENTS (feed)
// ─────────────────────────────────────────────
const getEvents = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, category, latitude, longitude, radius = 100 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const filter = {
      status: { $in: ['upcoming', 'ongoing'] },
      date: { $gte: new Date() },
    };

    if (category) filter.category = category;

    // Premium-only events: non-premium users can see them but not RSVP
    // (visibility filtering is optional per business logic)

    let query;
    if (latitude && longitude) {
      query = Event.find({
        ...filter,
        'location.coordinates': {
          $nearSphere: {
            $geometry: { type: 'Point', coordinates: [parseFloat(longitude), parseFloat(latitude)] },
            $maxDistance: parseInt(radius) * 1000,
          },
        },
      });
    } else {
      query = Event.find(filter).sort({ date: 1 });
    }

    const [events, total] = await Promise.all([
      query
        .populate('creator', 'firstName lastName images verified')
        .skip(skip)
        .limit(parseInt(limit)),
      Event.countDocuments(filter),
    ]);

    res.json({
      success: true,
      data: events,
      pagination: { total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) },
    });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────
//  GET SINGLE EVENT
// ─────────────────────────────────────────────
const getEvent = async (req, res, next) => {
  try {
    const event = await Event.findById(req.params.id)
      .populate('creator', 'firstName lastName images verified isPremium')
      .populate('attendees.user', 'firstName lastName images verified');

    if (!event) return res.status(404).json({ success: false, message: 'Event not found' });

    res.json({ success: true, data: event });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────
//  UPDATE EVENT
// ─────────────────────────────────────────────
const updateEvent = async (req, res, next) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ success: false, message: 'Event not found' });

    if (event.creator.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to edit this event' });
    }

    const allowed = ['title', 'description', 'category', 'date', 'endDate', 'maxAttendees', 'isPublic', 'tags', 'status'];
    const updates = {};
    allowed.forEach((k) => { if (req.body[k] !== undefined) updates[k] = req.body[k]; });

    if (req.file) {
      if (event.coverImage?.publicId) await deleteFromS3(event.coverImage.publicId).catch(() => {});
      const result = await uploadToS3(req.file, `events/${req.user._id}`);
      updates.coverImage = { url: result.url, publicId: result.publicId };
    }

    const updated = await Event.findByIdAndUpdate(req.params.id, updates, { new: true });
    res.json({ success: true, message: 'Event updated', data: updated });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────
//  DELETE EVENT
// ─────────────────────────────────────────────
const deleteEvent = async (req, res, next) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ success: false, message: 'Event not found' });

    if (event.creator.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    if (event.coverImage?.publicId) await deleteFromS3(event.coverImage.publicId).catch(() => {});
    await Event.findByIdAndDelete(req.params.id);

    res.json({ success: true, message: 'Event deleted' });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────
//  RSVP TO EVENT
// ─────────────────────────────────────────────
const rsvpEvent = async (req, res, next) => {
  try {
    const { status } = req.body; // 'going' | 'interested' | 'not_going'

    if (!['going', 'interested', 'not_going'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }

    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ success: false, message: 'Event not found' });

    if (event.isPremiumOnly && !req.user.isPremium) {
      return res.status(403).json({
        success: false,
        message: 'This event is for premium members only',
      });
    }

    if (event.maxAttendees && event.attendees.filter((a) => a.status === 'going').length >= event.maxAttendees) {
      return res.status(400).json({ success: false, message: 'Event is full' });
    }

    const attendeeIdx = event.attendees.findIndex(
      (a) => a.user.toString() === req.user._id.toString()
    );

    if (attendeeIdx > -1) {
      event.attendees[attendeeIdx].status = status;
    } else {
      event.attendees.push({ user: req.user._id, status });
    }

    await event.save();
    res.json({ success: true, message: `RSVP updated to "${status}"`, data: { status } });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────
//  MY EVENTS
// ─────────────────────────────────────────────
const getMyEvents = async (req, res, next) => {
  try {
    const created = await Event.find({ creator: req.user._id }).sort({ date: -1 }).limit(50);
    const attending = await Event.find({
      'attendees.user': req.user._id,
      creator: { $ne: req.user._id },
    })
      .populate('creator', 'firstName lastName images')
      .sort({ date: 1 })
      .limit(50);

    res.json({ success: true, data: { created, attending } });
  } catch (error) {
    next(error);
  }
};

module.exports = { createEvent, getEvents, getEvent, updateEvent, deleteEvent, rsvpEvent, getMyEvents };
