const crypto = require('crypto');

const validateTelegramWebAppData = (telegramInitData) => {
  try {
    const initData = new URLSearchParams(telegramInitData);
    const hash = initData.get('hash');
    initData.delete('hash');
    initData.sort();

    const dataCheckString = Array.from(initData.entries())
      .map(([key, value]) => `${key}=${value}`)
      .join('\n');

    const secretKey = crypto
      .createHmac('sha256', 'WebAppData')
      .update(process.env.BOT_TOKEN)
      .digest();

    const generatedHash = crypto
      .createHmac('sha256', secretKey)
      .update(dataCheckString)
      .digest('hex');

    return hash === generatedHash;
  } catch (error) {
    console.error('Error validating Telegram WebApp data:', error);
    return false;
  }
};

module.exports = {
  validateTelegramWebAppData
}; 