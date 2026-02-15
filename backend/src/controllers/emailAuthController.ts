import { Request, Response } from 'express';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import User from '../models/User';
import EmailOtp from '../models/EmailOtp';
import Session from '../models/Session';

const OTP_TTL_MINUTES = 10;
const OTP_MAX_ATTEMPTS = 5;
const SESSION_TTL_DAYS = 30;

const normalizeEmail = (raw: string) => raw.trim().toLowerCase();

const hash = (value: string) => crypto.createHash('sha256').update(value).digest('hex');

const randomNumericCode = (len: number) => {
  const bytes = crypto.randomBytes(len);
  const digits = Array.from(bytes).map((b) => (b % 10).toString());
  return digits.join('').slice(0, len);
};

const randomToken = () => crypto.randomBytes(32).toString('hex');

const getBootstrapAdminTelegramId = (): number | null => {
  const raw = process.env.BOOTSTRAP_ADMIN_TELEGRAM_ID || process.env.ADMIN_TELEGRAM_ID;
  if (!raw) return null;
  const parsed = parseInt(raw, 10);
  return Number.isFinite(parsed) ? parsed : null;
};

const getBootstrapAdminEmail = (): string | null => {
  const raw = process.env.BOOTSTRAP_ADMIN_EMAIL;
  return raw ? raw.trim().toLowerCase() : null;
};

const applyAdminBootstrapByEmail = (user: any, email: string) => {
  const bootstrapEmail = getBootstrapAdminEmail();
  if (!bootstrapEmail) return user;
  if (email !== bootstrapEmail) return user;
  if (user.role === 'admin' || user.role === 'developer') return user;

  user.role = 'admin';
  return user;
};

export const requestEmailOtp = async (req: Request, res: Response) => {
  try {
    const emailRaw = (req.body?.email || '').toString();
    if (!emailRaw) {
      return res.status(400).json({ success: false, error: 'email is required' });
    }

    const email = normalizeEmail(emailRaw);

    const code = randomNumericCode(6);
    const codeHash = hash(code);
    const expiresAt = new Date(Date.now() + OTP_TTL_MINUTES * 60 * 1000);

    await EmailOtp.create({ email, codeHash, expiresAt, attempts: 0 });

    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      console.log(`Email OTP for ${email}: ${code}`);
    }

    res.json({ success: true });
  } catch (error: any) {
    console.error('requestEmailOtp error:', error);
    res.status(500).json({ success: false, error: 'Failed to request OTP' });
  }
};

export const verifyEmailOtp = async (req: Request, res: Response) => {
  try {
    const emailRaw = (req.body?.email || '').toString();
    const codeRaw = (req.body?.code || '').toString();

    if (!emailRaw || !codeRaw) {
      return res.status(400).json({ success: false, error: 'email and code are required' });
    }

    const email = normalizeEmail(emailRaw);
    const codeHash = hash(codeRaw);

    const otp = await EmailOtp.findOne({ email }).sort({ createdAt: -1 });
    if (!otp) {
      return res.status(400).json({ success: false, error: 'Invalid code' });
    }

    if (otp.expiresAt.getTime() < Date.now()) {
      return res.status(400).json({ success: false, error: 'Code expired' });
    }

    if ((otp.attempts || 0) >= OTP_MAX_ATTEMPTS) {
      return res.status(400).json({ success: false, error: 'Too many attempts' });
    }

    if (otp.codeHash !== codeHash) {
      otp.attempts = (otp.attempts || 0) + 1;
      await otp.save();
      return res.status(400).json({ success: false, error: 'Invalid code' });
    }

    let userDoc: any = await User.findOne({ email });

    if (!userDoc) {
      const bootstrapEmail = getBootstrapAdminEmail();
      const bootstrapTelegramId = getBootstrapAdminTelegramId();
      const shouldBindToBootstrapTelegram =
        Boolean(bootstrapEmail && bootstrapTelegramId && email === bootstrapEmail);

      if (shouldBindToBootstrapTelegram) {
        const existingBootstrapUser = await User.findOne({ telegramId: bootstrapTelegramId });
        if (existingBootstrapUser) {
          existingBootstrapUser.email = email;
          existingBootstrapUser.newsletter_subscriber = true;
          userDoc = applyAdminBootstrapByEmail(existingBootstrapUser, email);
        }
      }
    }

    if (!userDoc) {
      const localPart = email.split('@')[0] || 'user';
      const created = new User({
        email,
        newsletter_subscriber: true,
        username: `email_${localPart}`,
        firstName: 'User',
        role: 'user'
      });

      userDoc = applyAdminBootstrapByEmail(created, email);
      await userDoc.save();
    } else {
      userDoc.newsletter_subscriber = true;
      userDoc = applyAdminBootstrapByEmail(userDoc, email);
      await userDoc.save();
    }

    const user = userDoc.toObject();

    const sessionToken = randomToken();
    const tokenHash = hash(sessionToken);
    const expiresAt = new Date(Date.now() + SESSION_TTL_DAYS * 24 * 60 * 60 * 1000);

    await Session.create({ user: user._id, tokenHash, expiresAt });

    const jwtToken = jwt.sign(
      { userId: user._id.toString(), email, role: user.role },
      process.env.JWT_SECRET || 'your_jwt_secret',
      { expiresIn: `${SESSION_TTL_DAYS}d` }
    );

    await EmailOtp.deleteMany({ email });

    res.json({
      success: true,
      user,
      token: jwtToken,
      sessionToken
    });
  } catch (error: any) {
    console.error('verifyEmailOtp error:', error);
    res.status(500).json({ success: false, error: 'Failed to verify OTP' });
  }
};

export const logoutSession = async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(200).json({ success: true });
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      return res.status(200).json({ success: true });
    }

    const tokenHash = hash(token);
    await Session.deleteOne({ tokenHash });
    res.json({ success: true });
  } catch (error: any) {
    console.error('logoutSession error:', error);
    res.status(500).json({ success: false, error: 'Failed to logout' });
  }
};
