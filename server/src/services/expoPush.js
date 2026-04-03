const { logger } = require('../utils/logger');

const EXPO_PUSH_API_URL = 'https://exp.host/--/api/v2/push/send';
const EXPO_PUSH_BATCH_SIZE = 100;

function isExpoPushToken(token) {
  return (
    typeof token === 'string' &&
    /^(Expo|Exponent)PushToken\[[^\]]+\]$/.test(token)
  );
}

async function sendExpoPushNotifications(messages) {
  const validMessages = messages.filter((message) => isExpoPushToken(message.to));

  if (validMessages.length === 0) {
    return { sentCount: 0 };
  }

  for (let index = 0; index < validMessages.length; index += EXPO_PUSH_BATCH_SIZE) {
    const batch = validMessages.slice(index, index + EXPO_PUSH_BATCH_SIZE);

    const response = await fetch(EXPO_PUSH_API_URL, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Accept-Encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(batch),
    });

    const payload = await response.json().catch(() => null);

    if (!response.ok) {
      logger.error('Expo push request failed.', {
        status: response.status,
        payload,
      });

      throw new Error('Failed to deliver Expo push notifications.');
    }

    if (Array.isArray(payload?.data)) {
      payload.data.forEach((ticket) => {
        if (ticket?.status === 'error') {
          logger.warn('Expo push ticket returned an error.', {
            details: ticket.details,
            message: ticket.message,
          });
        }
      });
    }
  }

  return { sentCount: validMessages.length };
}

module.exports = {
  isExpoPushToken,
  sendExpoPushNotifications,
};
