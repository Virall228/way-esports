import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { config } from '../config';

export interface TelegramUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code?: string;
  photo_url?: string;
}

export interface TelegramInitData {
  query_id?: string;
  user?: TelegramUser;
  auth_date: number;
  hash: string;
  [key: string]: any;
}

/**
 * Validates Telegram WebApp initData
 * @param initData - Raw initData string from Telegram WebApp
 * @param botToken - Telegram bot token
 * @returns Parsed and validated initData or null if invalid
 */
export function validateTelegramInitData(initData: string, botToken: string): TelegramInitData | null {
  try {
    if (!initData || !botToken) {
      return null;
    }

    // Parse the init data
    const searchParams = new URLSearchParams(initData);
    const hash = searchParams.get('hash');
    
    if (!hash) {
      return null;
    }

    // Remove hash from params for validation
    searchParams.delete('hash');

    // Sort parameters alphabetically and create data check string
    const dataCheckString = Array.from(searchParams.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, value]) => `${key}=${value}`)
      .join('\n');

    // Create secret key from bot token
    const secretKey = crypto
      .createHmac('sha256', 'WebAppData')
      .update(botToken)
      .digest();

    // Calculate hash
    const calculatedHash = crypto
      .createHmac('sha256', secretKey)
      .update(dataCheckString)
      .digest('hex');

    // Verify hash
    if (calculatedHash !== hash) {
      console.error('Telegram hash mismatch');
      return null;
    }

    // Check auth date (should be within 24 hours)
    const authDate = parseInt(searchParams.get('auth_date') || '0', 10);
    const now = Math.floor(Date.now() / 1000);
    
    if (now - authDate > 86400) { // 24 hours
      console.error('Telegram data expired');
      return null;
    }

    // Parse user data if present
    const userParam = searchParams.get('user');
    const user = userParam ? JSON.parse(userParam) : null;

    return {
      query_id: searchParams.get('query_id') || undefined,
      user: user,
      auth_date: authDate,
      hash: hash
    };
  } catch (error) {
    console.error('Error validating Telegram initData:', error);
    return null;
  }
}

/**
 * Middleware to validate Telegram WebApp initData
 * Expects initData in header 'X-Telegram-Data' or body 'initData'
 */
export const telegramAuthMiddleware = (req: Request, res: Response, next: NextFunction) => {
  try {
    // Get initData from header or body
    const telegramInitData = (req.headers['x-telegram-data'] as string) || 
                            (req.body?.initData as string);
    
    if (!telegramInitData) {
      return res.status(401).json({
        success: false,
        error: 'No Telegram initData provided'
      });
    }

    const botToken = config.telegramBotToken || process.env.TELEGRAM_BOT_TOKEN || process.env.BOT_TOKEN || '';
    
    if (!botToken) {
      console.error('TELEGRAM_BOT_TOKEN is not configured');
      return res.status(500).json({
        success: false,
        error: 'Server configuration error'
      });
    }

    const validatedData = validateTelegramInitData(telegramInitData, botToken);
    
    if (!validatedData) {
      return res.status(401).json({
        success: false,
        error: 'Invalid or expired Telegram initData'
      });
    }

    // Attach validated data to request
    (req as any).telegramInitData = validatedData;
    if (validatedData.user) {
      (req as any).telegramUser = validatedData.user;
    }

    next();
  } catch (error) {
    console.error('Telegram auth middleware error:', error);
    res.status(401).json({
      success: false,
      error: 'Authentication failed'
    });
  }
}; 