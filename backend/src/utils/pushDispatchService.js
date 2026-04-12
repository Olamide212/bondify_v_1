const User = require('../models/User');
const { sendExpoPushNotification } = require('./expoPushService');

const OFFLINE_WINDOW_MS = 3 * 60 * 1000;

const isEffectivelyOnline = (user) => {
  if (!user) return false;
  const threshold = Date.now() - OFFLINE_WINDOW_MS;
  return (
    user.online === true &&
    user.lastActive &&
    new Date(user.lastActive).getTime() > threshold
  );
};

const sendPushToUser = async ({
  userId,
  title,
  body,
  data = {},
  settingKey = null,
  onlyWhenOffline = true,
}) => {
  if (!userId || !title || !body) return false;

  const user = await User.findById(userId)
    .select('pushToken online lastActive notificationSettings')
    .lean();

  if (!user?.pushToken) return false;
  if (user.notificationSettings?.pushNotifications === false) return false;
  if (settingKey && user.notificationSettings?.[settingKey] === false) return false;
  if (onlyWhenOffline && isEffectivelyOnline(user)) return false;

  return sendExpoPushNotification({
    to: user.pushToken,
    title,
    body,
    data,
  });
};

module.exports = {
  sendPushToUser,
  isEffectivelyOnline,
};
