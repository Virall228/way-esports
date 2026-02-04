import { Request, Response } from 'express';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import User from '../models/User';
import Session from '../models/Session';

const JWT_EXPIRATION = '24h';
const SESSION_TTL_DAYS = 30;

const hash = (value: string) => crypto.createHash('sha256').update(value).digest('hex');
const randomToken = () => crypto.randomBytes(32).toString('hex');

const createSessionToken = async (userId: string) => {
  const sessionToken = randomToken();
  const tokenHash = hash(sessionToken);
  const expiresAt = new Date(Date.now() + SESSION_TTL_DAYS * 24 * 60 * 60 * 1000);
  await Session.create({ user: userId, tokenHash, expiresAt });
  return sessionToken;
};

const getBootstrapAdminTelegramId = (): number | null => {
  const raw = process.env.BOOTSTRAP_ADMIN_TELEGRAM_ID;
  if (!raw) return null;
  const num = parseInt(raw, 10);
  return Number.isFinite(num) ? num : null;
};

// Register endpoint
export const register = async (req: Request, res: Response) => {
  try {
    const { telegramId, username, firstName, lastName, photoUrl } = req.body || {};

    if (!telegramId || !username || !firstName) {
      return res.status(400).json({ error: 'telegramId, username and firstName are required' });
    }

    const telegramIdNumber = typeof telegramId === 'string' ? parseInt(telegramId, 10) : telegramId;
    if (!Number.isFinite(telegramIdNumber)) {
      return res.status(400).json({ error: 'telegramId must be a number' });
    }

    const bootstrapAdminTelegramId = getBootstrapAdminTelegramId();
    const shouldBeAdmin = bootstrapAdminTelegramId !== null && telegramIdNumber === bootstrapAdminTelegramId;

    const existingUser = await User.findOne({ telegramId: telegramIdNumber });
    if (existingUser) {
      if (shouldBeAdmin && existingUser.role !== 'admin' && existingUser.role !== 'developer') {
        existingUser.role = 'admin';
        await existingUser.save();
      }
      const jwtToken = jwt.sign(
        { userId: existingUser._id.toString(), telegramId: existingUser.telegramId, role: existingUser.role },
        process.env.JWT_SECRET || 'your_jwt_secret',
        { expiresIn: JWT_EXPIRATION }
      );

      const sessionToken = await createSessionToken(existingUser._id.toString());
      return res.status(200).json({ user: existingUser.toObject(), token: sessionToken, jwtToken });
    }

    const user = await new User({
      telegramId: telegramIdNumber,
      username,
      firstName,
      lastName,
      photoUrl,
      role: shouldBeAdmin ? 'admin' : 'user'
    }).save();

    const jwtToken = jwt.sign(
      { userId: user._id.toString(), telegramId: user.telegramId, role: user.role },
      process.env.JWT_SECRET || 'your_jwt_secret',
      { expiresIn: JWT_EXPIRATION }
    );

    const sessionToken = await createSessionToken(user._id.toString());

    res.status(201).json({ user: user.toObject(), token: sessionToken, jwtToken });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Error registering user' });
  }
};

// Login endpoint
export const login = async (req: Request, res: Response) => {
  try {
    const { telegramId } = req.body || {};

    if (!telegramId) {
      return res.status(400).json({ error: 'telegramId is required' });
    }

    const telegramIdNumber = typeof telegramId === 'string' ? parseInt(telegramId, 10) : telegramId;
    if (!Number.isFinite(telegramIdNumber)) {
      return res.status(400).json({ error: 'telegramId must be a number' });
    }

    const user = await User.findOne({ telegramId: telegramIdNumber });
    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    const jwtToken = jwt.sign(
      { userId: user._id.toString(), telegramId: user.telegramId, role: user.role },
      process.env.JWT_SECRET || 'your_jwt_secret',
      { expiresIn: JWT_EXPIRATION }
    );

    const sessionToken = await createSessionToken(user._id.toString());

    res.json({ user: user.toObject(), token: sessionToken, jwtToken });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Error logging in' });
  }
};

// Get user profile
export const getProfile = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const reqUser: any = req.user;
    const userId = reqUser?._id?.toString();
    const telegramId = typeof reqUser?.id === 'string' ? parseInt(reqUser.id, 10) : reqUser?.id;

    const user = userId
      ? await User.findById(userId).lean()
      : await User.findOne({ telegramId }).lean();
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json(user);
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Error fetching profile' });
  }
};

// Telegram Mini App authentication
// This endpoint uses validated Telegram initData from telegramAuthMiddleware
export const authenticateTelegram = async (req: Request, res: Response) => {
  try {
    const telegramInitData = (req as any).telegramInitData;
    const telegramUser = (req as any).telegramUser;

    if (!telegramInitData || !telegramUser) {
      return res.status(400).json({ 
        success: false,
        error: 'Telegram user data not found' 
      });
    }

    const telegramId = telegramUser.id;
    if (!telegramId) {
      return res.status(400).json({ 
        success: false,
        error: 'Telegram user ID not found' 
      });
    }

    const bootstrapAdminTelegramId = getBootstrapAdminTelegramId();
    const shouldBeAdmin = bootstrapAdminTelegramId !== null && telegramId === bootstrapAdminTelegramId;

    // Find or create user
    let user = await User.findOne({ telegramId });
    
    if (user) {
      // Update user data from Telegram
      user.username = telegramUser.username || user.username || `user_${telegramId}`;
      user.firstName = telegramUser.first_name || user.firstName;
      user.lastName = telegramUser.last_name || user.lastName;
      user.photoUrl = telegramUser.photo_url || user.photoUrl;
      
      // Update admin role if needed
      if (shouldBeAdmin && user.role !== 'admin' && user.role !== 'developer') {
        user.role = 'admin';
      }
      
      await user.save();
    } else {
      // Create new user
      user = await new User({
        telegramId,
        username: telegramUser.username || `user_${telegramId}`,
        firstName: telegramUser.first_name || 'User',
        lastName: telegramUser.last_name,
        photoUrl: telegramUser.photo_url,
        role: shouldBeAdmin ? 'admin' : 'user'
      });
      await user.save();
    }

    // Generate JWT token
    const jwtToken = jwt.sign(
      { 
        userId: user._id.toString(), 
        telegramId: user.telegramId, 
        role: user.role 
      },
      process.env.JWT_SECRET || 'your_jwt_secret',
      { expiresIn: JWT_EXPIRATION }
    );

    const sessionToken = await createSessionToken(user._id.toString());

    res.json({ 
      success: true,
      user: user.toObject(), 
      token: sessionToken,
      jwtToken
    });
  } catch (error) {
    console.error('Telegram authentication error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Error authenticating with Telegram' 
    });
  }
};

// Admin only: Get all users
export const getAllUsers = async (req: Request, res: Response) => {
  try {
    const role = (req.user as any)?.role;
    if (!req.user || (role !== 'admin' && role !== 'developer')) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const users = await User.find({})
      .select('-password')
      .sort({ createdAt: -1 })
      .lean();
    
    res.json(users);
  } catch (error) {
    console.error('Get all users error:', error);
    res.status(500).json({ error: 'Error fetching users' });
  }
};
