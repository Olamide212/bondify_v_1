const Notification = require('../models/Notification');

// ─────────────────────────────────────────────
//  GET MY NOTIFICATIONS
// ─────────────────────────────────────────────
const getNotifications = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 30;
    const skip = (page - 1) * limit;

    const [notifications, total, unreadCount] = await Promise.all([
      Notification.find({ recipient: req.user._id })
        .populate('sender', 'firstName lastName images')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Notification.countDocuments({ recipient: req.user._id }),
      Notification.countDocuments({ recipient: req.user._id, read: false }),
    ]);

    res.json({
      success: true,
      data: notifications,
      unreadCount,
      pagination: { total, page, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────
//  MARK AS READ
// ─────────────────────────────────────────────
const markAsRead = async (req, res, next) => {
  try {
    const { notificationId } = req.params;

    await Notification.findOneAndUpdate(
      { _id: notificationId, recipient: req.user._id },
      { read: true, readAt: new Date() }
    );

    res.json({ success: true, message: 'Notification marked as read' });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────
//  MARK ALL AS READ
// ─────────────────────────────────────────────
const markAllAsRead = async (req, res, next) => {
  try {
    await Notification.updateMany(
      { recipient: req.user._id, read: false },
      { read: true, readAt: new Date() }
    );
    res.json({ success: true, message: 'All notifications marked as read' });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────
//  DELETE NOTIFICATION
// ─────────────────────────────────────────────
const deleteNotification = async (req, res, next) => {
  try {
    await Notification.findOneAndDelete({ _id: req.params.notificationId, recipient: req.user._id });
    res.json({ success: true, message: 'Notification deleted' });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────
//  HELPER: Create a notification (used internally)
// ─────────────────────────────────────────────
const createNotification = async ({ recipient, sender, type, title, body, data }) => {
  try {
    await Notification.create({ recipient, sender, type, title, body, data });
  } catch (err) {
    console.error('Notification creation error:', err);
  }
};

module.exports = { getNotifications, markAsRead, markAllAsRead, deleteNotification, createNotification };
