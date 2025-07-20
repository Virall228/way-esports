const crypto = require('crypto');

const validateTelegramWebAppData = (req, res, next) => {
  try {
    const { initData } = req.body;
    if (!initData) {
      return res.status(401).json({ error: 'No Telegram data provided' });
    }

    const urlParams = new URLSearchParams(initData);
    const hash = urlParams.get('hash');
    urlParams.delete('hash');

    // Sort parameters alphabetically
    const params = Array.from(urlParams.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, value]) => `${key}=${value}`)
      .join('\n');

    // Create a check hash
    const secretKey = crypto.createHmac('sha256', 'WebAppData')
      .update(process.env.TELEGRAM_BOT_TOKEN)
      .digest();
    
    const checkHash = crypto.createHmac('sha256', secretKey)
      .update(params)
      .digest('hex');

    if (checkHash !== hash) {
      return res.status(401).json({ error: 'Invalid Telegram data' });
    }

    // Add validated user data to request
    req.telegramUser = JSON.parse(urlParams.get('user'));
    next();
  } catch (error) {
    console.error('Telegram auth error:', error);
    res.status(401).json({ error: 'Authentication failed' });
  }
};

module.exports = validateTelegramWebAppData; 