const axios = require('axios');

const EXPO_PUSH_ENDPOINT = 'https://exp.host/--/api/v2/push/send';

const isExpoPushToken = (token) => {
  if (!token || typeof token !== 'string') return false;
  return /^Expo(nent)?PushToken\[[^\]]+\]$/.test(token.trim());
};

const sendExpoPushNotification = async ({ to, title, body, data = {} }) => {
  if (!isExpoPushToken(to)) return false;

  const payload = {
    to,
    title,
    body,
    data,
    sound: 'default',
    priority: 'high',
    channelId: 'default',
  };

  try {
    await axios.post(EXPO_PUSH_ENDPOINT, payload, {
      headers: {
        Accept: 'application/json',
        'Accept-encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      },
      timeout: 8000,
    });

    return true;
  } catch (error) {
    const message = error?.response?.data || error?.message || error;
    console.error('[expo-push] Failed to send push:', message);
    return false;
  }
};

module.exports = {
  isExpoPushToken,
  sendExpoPushNotification,
};
