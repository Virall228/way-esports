import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';

interface TelegramUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code?: string;
  photo_url?: string;
}

interface InitData {
  query_id: string;
  user: TelegramUser;
  auth_date: number;
  hash: string;
}

export const telegramAuthMiddleware = (req: Request, res: Response, next: NextFunction) => {
  try {
    const telegramInitData = req.headers['x-telegram-data'] as string;
    
    if (!telegramInitData) {
      return res.status(401).json({
        success: false,
        error: 'No Telegram data provided'
      });
    }

    // Parse the init data
    const searchParams = new URLSearchParams(telegramInitData);
    const hash = searchParams.get('hash');
    searchParams.delete('hash');

    // Sort parameters alphabetically
    const params = Array.from(searchParams.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, value]) => `${key}=${value}`)
      .join('\n');

    // Create data check string
    const secretKey = crypto.createHmac('sha256', 'WebAppData')
      .update(process.env.BOT_TOKEN || '')
      .digest();

    // Calculate hash
    const calculatedHash = crypto.createHmac('sha256', secretKey)
      .update(params)
      .digest('hex');

    // Verify hash
    if (calculatedHash !== hash) {
      return res.status(401).json({
        success: false,
        error: 'Invalid Telegram data'
      });
    }

    // Check auth date
    const authDate = parseInt(searchParams.get('auth_date') || '0', 10);
    const now = Math.floor(Date.now() / 1000);
    
    if (now - authDate > 86400) { // 24 hours
      return res.status(401).json({
        success: false,
        error: 'Telegram data expired'
      });
    }

    // Add user data to request
    const userData = JSON.parse(searchParams.get('user') || '{}');
    req.user = userData;

    next();
  } catch (error) {
    console.error('Telegram auth error:', error);
    res.status(401).json({
      success: false,
      error: 'Authentication failed'
    });
  }
}; 