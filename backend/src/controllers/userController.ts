import { Request, Response } from 'express';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import User from '../models/User';
import Session from '../models/Session';
import { verifyGoogleIdToken, verifyAppleIdentityToken } from '../services/oauthTokenVerifier';
import { logAuthEvent } from '../services/authLogService';
import ReferralService from '../services/referralService';

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
  const raw = process.env.BOOTSTRAP_ADMIN_TELEGRAM_ID || process.env.ADMIN_TELEGRAM_ID;
  if (!raw) return null;
  const num = parseInt(raw, 10);
  return Number.isFinite(num) ? num : null;
};

const getBootstrapAdminEmail = (): string | null => {
  return process.env.BOOTSTRAP_ADMIN_EMAIL || null;
};

const checkAdminBootstrap = async (user: any) => {
  const bootstrapId = getBootstrapAdminTelegramId();
  const bootstrapEmail = getBootstrapAdminEmail();

  const userTelegramId = Number(user.telegramId);
  const userEmail = typeof user.email === 'string' ? user.email.toLowerCase() : null;

  const isIdMatch = typeof bootstrapId === 'number' && Number.isFinite(userTelegramId) && userTelegramId === bootstrapId;
  const isEmailMatch = Boolean(bootstrapEmail && userEmail && userEmail === bootstrapEmail.toLowerCase());

  if (isIdMatch || isEmailMatch) {
    if (user.role !== 'admin' && user.role !== 'developer') {
      user.role = 'admin';
      await user.save();
      console.log(`User ${user.username} promoted to admin via bootstrap (${isIdMatch ? 'ID' : 'Email'})`);
    }
  }
};

const SALT_ROUNDS = 12;

const normalizeEmail = (email: string): string => email.trim().toLowerCase();

const usernameFromEmail = (email: string): string => {
  const base = email.split('@')[0] || 'user';
  const normalized = base.replace(/[^a-zA-Z0-9_]/g, '').slice(0, 24);
  return normalized || 'user';
};

const ensureUniqueUsername = async (seed: string): Promise<string> => {
  let candidate = seed;
  let attempt = 0;

  while (attempt < 20) {
    // eslint-disable-next-line no-await-in-loop
    const exists = await User.exists({ username: candidate });
    if (!exists) return candidate;
    attempt += 1;
    candidate = `${seed}_${Math.floor(Math.random() * 10000)}`;
  }

  return `${seed}_${Date.now()}`;
};

const getDuplicateField = (error: any): string | null => {
  if (!error || error.code !== 11000) return null;
  const keyPattern = error.keyPattern || {};
  const keyValue = error.keyValue || {};
  return Object.keys(keyPattern)[0] || Object.keys(keyValue)[0] || null;
};

const saveUserWithRetries = async (
  user: any,
  options?: { maxAttempts?: number; seedUsername?: string }
) => {
  const maxAttempts = options?.maxAttempts ?? 5;
  const seedUsername = options?.seedUsername || user.username || 'user';

  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    try {
      await user.save();
      return;
    } catch (error: any) {
      const duplicateField = getDuplicateField(error);
      if (!duplicateField) throw error;

      if (duplicateField === 'email') {
        const conflict: any = new Error('email_conflict');
        conflict.statusCode = 409;
        throw conflict;
      }

      if (duplicateField === 'telegramId') {
        const conflict: any = new Error('telegram_conflict');
        conflict.statusCode = 409;
        throw conflict;
      }

      if (duplicateField === 'username') {
        // eslint-disable-next-line no-await-in-loop
        user.username = await ensureUniqueUsername(seedUsername);
        continue;
      }

      if (duplicateField === 'referralCode') {
        user.referralCode = user.generateReferralCode();
        continue;
      }

      throw error;
    }
  }

  throw new Error('Unable to persist user due unique constraint conflicts');
};

const issueAuthResponse = async (user: any) => {
  const jwtToken = jwt.sign(
    { userId: user._id.toString(), telegramId: user.telegramId, role: user.role },
    process.env.JWT_SECRET || 'your_jwt_secret',
    { expiresIn: JWT_EXPIRATION }
  );
  const sessionToken = await createSessionToken(user._id.toString());

  return {
    user: user.toObject(),
    token: jwtToken,
    sessionToken,
    jwtToken
  };
};

const buildNamePair = (fallbackName: string, fullName?: string | null, firstName?: string | null, lastName?: string | null) => {
  if (firstName && firstName.trim()) {
    return {
      firstName: firstName.trim(),
      lastName: lastName?.trim() || undefined
    };
  }

  if (fullName && fullName.trim()) {
    const parts = fullName.trim().split(/\s+/);
    return {
      firstName: parts[0] || fallbackName,
      lastName: parts.slice(1).join(' ') || undefined
    };
  }

  return {
    firstName: fallbackName,
    lastName: lastName?.trim() || undefined
  };
};

const getRequestMeta = (req: Request) => ({
  ip: req.ip || req.socket.remoteAddress || undefined,
  userAgent: req.get('user-agent') || undefined
});

const processReferralIfProvided = async (referralCodeRaw: unknown, userId: string) => {
  if (typeof referralCodeRaw !== 'string') return;
  const referralCode = referralCodeRaw.trim();
  if (!referralCode) return;
  try {
    await ReferralService.processReferral(referralCode, userId);
  } catch (error) {
    console.error('Referral processing failed:', error);
  }
};

// Register endpoint
export const register = async (req: Request, res: Response) => {
  try {
    const { telegramId, username, firstName, lastName, photoUrl, referralCode } = req.body || {};

    if (!telegramId || !username || !firstName) {
      const meta = getRequestMeta(req);
      await logAuthEvent({
        event: 'register',
        status: 'failed',
        method: 'telegram_id',
        identifier: telegramId ? String(telegramId) : undefined,
        reason: 'missing_required_fields',
        ip: meta.ip,
        userAgent: meta.userAgent
      });
      return res.status(400).json({ error: 'telegramId, username and firstName are required' });
    }

    const telegramIdNumber = typeof telegramId === 'string' ? parseInt(telegramId, 10) : telegramId;
    if (!Number.isFinite(telegramIdNumber)) {
      const meta = getRequestMeta(req);
      await logAuthEvent({
        event: 'register',
        status: 'failed',
        method: 'telegram_id',
        identifier: String(telegramId),
        reason: 'invalid_telegram_id',
        ip: meta.ip,
        userAgent: meta.userAgent
      });
      return res.status(400).json({ error: 'telegramId must be a number' });
    }

    const existingUser = await User.findOne({ telegramId: telegramIdNumber });
    if (existingUser) {
      await checkAdminBootstrap(existingUser);
      const meta = getRequestMeta(req);
      await logAuthEvent({
        userId: existingUser._id?.toString(),
        event: 'login',
        status: 'success',
        method: 'telegram_id',
        identifier: String(telegramIdNumber),
        reason: 'existing_user',
        ip: meta.ip,
        userAgent: meta.userAgent
      });
      return res.status(200).json(await issueAuthResponse(existingUser));
    }

    const user = new User({
      telegramId: telegramIdNumber,
      username,
      firstName,
      lastName,
      photoUrl,
      role: 'user'
    });

    await checkAdminBootstrap(user);
    if (user.isNew) {
      await saveUserWithRetries(user, {
        seedUsername: typeof username === 'string' && username.trim() ? username.trim() : `user_${telegramIdNumber}`
      });
    }
    await processReferralIfProvided(referralCode, user._id.toString());
    const meta = getRequestMeta(req);
    await logAuthEvent({
      userId: user._id?.toString(),
      event: 'register',
      status: 'success',
      method: 'telegram_id',
      identifier: String(telegramIdNumber),
      ip: meta.ip,
      userAgent: meta.userAgent
    });
    res.status(201).json(await issueAuthResponse(user));
  } catch (error) {
    console.error('Registration error:', error);
    const statusCode = (error as any)?.statusCode;
    const duplicateField = getDuplicateField(error as any);
    if (statusCode === 409 || duplicateField === 'email') {
      return res.status(409).json({ error: 'User with this email already exists' });
    }
    if (duplicateField === 'telegramId') {
      return res.status(409).json({ error: 'User with this Telegram ID already exists' });
    }
    const meta = getRequestMeta(req);
    await logAuthEvent({
      event: 'register',
      status: 'failed',
      method: 'telegram_id',
      identifier: req.body?.telegramId ? String(req.body.telegramId) : undefined,
      reason: 'server_error',
      ip: meta.ip,
      userAgent: meta.userAgent
    });
    res.status(500).json({ error: 'Error registering user' });
  }
};

// Login endpoint
export const login = async (req: Request, res: Response) => {
  try {
    const { telegramId } = req.body || {};

    if (!telegramId) {
      const meta = getRequestMeta(req);
      await logAuthEvent({
        event: 'login',
        status: 'failed',
        method: 'telegram_id',
        reason: 'missing_telegram_id',
        ip: meta.ip,
        userAgent: meta.userAgent
      });
      return res.status(400).json({ error: 'telegramId is required' });
    }

    const telegramIdNumber = typeof telegramId === 'string' ? parseInt(telegramId, 10) : telegramId;
    if (!Number.isFinite(telegramIdNumber)) {
      const meta = getRequestMeta(req);
      await logAuthEvent({
        event: 'login',
        status: 'failed',
        method: 'telegram_id',
        identifier: String(telegramId),
        reason: 'invalid_telegram_id',
        ip: meta.ip,
        userAgent: meta.userAgent
      });
      return res.status(400).json({ error: 'telegramId must be a number' });
    }

    const bootstrapId = getBootstrapAdminTelegramId();
    let user = await User.findOne({ telegramId: telegramIdNumber });

    // Allow bootstrap-admin login from any browser by Telegram ID only.
    // If admin user does not exist yet, create it on first login.
    if (!user && bootstrapId && telegramIdNumber === bootstrapId) {
      user = new User({
        telegramId: telegramIdNumber,
        username: `admin_${telegramIdNumber}`,
        firstName: 'Admin',
        role: 'admin'
      });
    }

    if (!user) {
      // Fallback: create a basic account on first Telegram-ID login.
      // This keeps browser auth flow simple for new users.
      user = new User({
        telegramId: telegramIdNumber,
        username: `user_${telegramIdNumber}`,
        firstName: 'Player',
        role: 'user'
      });
    }

    await checkAdminBootstrap(user);
    if (user.isNew) {
      await saveUserWithRetries(user, { seedUsername: user.username || `user_${telegramIdNumber}` });
    }
    const meta = getRequestMeta(req);
    await logAuthEvent({
      userId: user._id?.toString(),
      event: 'login',
      status: 'success',
      method: 'telegram_id',
      identifier: String(telegramIdNumber),
      ip: meta.ip,
      userAgent: meta.userAgent
    });
    res.json(await issueAuthResponse(user));
  } catch (error) {
    console.error('Login error:', error);
    const statusCode = (error as any)?.statusCode;
    if (statusCode === 409 && (error as any)?.message === 'telegram_conflict') {
      return res.status(409).json({ error: 'Telegram ID already in use' });
    }
    const meta = getRequestMeta(req);
    await logAuthEvent({
      event: 'login',
      status: 'failed',
      method: 'telegram_id',
      identifier: req.body?.telegramId ? String(req.body.telegramId) : undefined,
      reason: 'server_error',
      ip: meta.ip,
      userAgent: meta.userAgent
    });
    res.status(500).json({ error: 'Error logging in' });
  }
};

// Email + password registration
export const registerWithEmailPassword = async (req: Request, res: Response) => {
  try {
    const { email, password, username, firstName, lastName, referralCode } = req.body || {};

    if (!email || !password) {
      const meta = getRequestMeta(req);
      await logAuthEvent({
        event: 'register',
        status: 'failed',
        method: 'email_password',
        identifier: email ? String(email) : undefined,
        reason: 'missing_email_or_password',
        ip: meta.ip,
        userAgent: meta.userAgent
      });
      return res.status(400).json({ error: 'email and password are required' });
    }

    if (typeof password !== 'string' || password.length < 8) {
      const meta = getRequestMeta(req);
      await logAuthEvent({
        event: 'register',
        status: 'failed',
        method: 'email_password',
        identifier: String(email),
        reason: 'weak_password',
        ip: meta.ip,
        userAgent: meta.userAgent
      });
      return res.status(400).json({ error: 'password must be at least 8 characters' });
    }

    const normalizedEmail = normalizeEmail(String(email));

    const existing = await User.findOne({ email: normalizedEmail });
    if (existing) {
      // If user already exists and password matches, treat registration as login.
      if (existing.passwordHash) {
        const samePassword = await bcrypt.compare(password, existing.passwordHash);
        if (samePassword) {
          await checkAdminBootstrap(existing);
          const meta = getRequestMeta(req);
          await logAuthEvent({
            userId: existing._id?.toString(),
            event: 'login',
            status: 'success',
            method: 'email_password',
            identifier: normalizedEmail,
            reason: 'register_existing_account_login',
            ip: meta.ip,
            userAgent: meta.userAgent
          });
          return res.status(200).json(await issueAuthResponse(existing));
        }
      }

      const meta = getRequestMeta(req);
      await logAuthEvent({
        userId: existing._id?.toString(),
        event: 'register',
        status: 'failed',
        method: 'email_password',
        identifier: normalizedEmail,
        reason: 'email_already_exists',
        ip: meta.ip,
        userAgent: meta.userAgent
      });
      return res.status(409).json({ error: 'User with this email already exists', email: normalizeEmail(String(req.body?.email || '')) });
    }

    const fallbackUsername = usernameFromEmail(normalizedEmail);
    const safeUsername = await ensureUniqueUsername(
      typeof username === 'string' && username.trim() ? username.trim() : fallbackUsername
    );
    const nameInfo = buildNamePair('User', null, firstName || null, lastName || null);
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    const user = new User({
      email: normalizedEmail,
      username: safeUsername,
      firstName: nameInfo.firstName,
      lastName: nameInfo.lastName,
      passwordHash,
      role: 'user',
      newsletter_subscriber: true
    });

    await checkAdminBootstrap(user);
    if (user.isNew) {
      await saveUserWithRetries(user, { seedUsername: safeUsername });
    }
    await processReferralIfProvided(referralCode, user._id.toString());

    const meta = getRequestMeta(req);
    await logAuthEvent({
      userId: user._id?.toString(),
      event: 'register',
      status: 'success',
      method: 'email_password',
      identifier: normalizedEmail,
      ip: meta.ip,
      userAgent: meta.userAgent
    });

    res.status(201).json(await issueAuthResponse(user));
  } catch (error) {
    console.error('Email registration error:', error);
    const statusCode = (error as any)?.statusCode;
    const duplicateField = getDuplicateField(error as any);
    if (statusCode === 409 || duplicateField === 'email') {
      return res.status(409).json({ error: 'User with this email already exists' });
    }
    if (duplicateField === 'username') {
      return res.status(409).json({ error: 'Username already exists. Try again.' });
    }
    const meta = getRequestMeta(req);
    await logAuthEvent({
      event: 'register',
      status: 'failed',
      method: 'email_password',
      identifier: req.body?.email ? String(req.body.email) : undefined,
      reason: 'server_error',
      ip: meta.ip,
      userAgent: meta.userAgent
    });
    res.status(500).json({ error: 'Error registering with email/password' });
  }
};

// Email + password login
export const loginWithEmailPassword = async (req: Request, res: Response) => {
  try {
    const { identifier, email, username, password } = req.body || {};

    const rawIdentifier = (identifier || email || username || '').toString().trim();
    if (!rawIdentifier || !password) {
      const meta = getRequestMeta(req);
      await logAuthEvent({
        event: 'login',
        status: 'failed',
        method: 'email_password',
        identifier: rawIdentifier || undefined,
        reason: 'missing_identifier_or_password',
        ip: meta.ip,
        userAgent: meta.userAgent
      });
      return res.status(400).json({ error: 'identifier and password are required' });
    }

    const isEmailIdentifier = rawIdentifier.includes('@');
    const userQuery = isEmailIdentifier
      ? { email: normalizeEmail(rawIdentifier) }
      : { username: rawIdentifier };

    const user: any = await User.findOne(userQuery);
    if (!user) {
      const meta = getRequestMeta(req);
      await logAuthEvent({
        event: 'login',
        status: 'failed',
        method: 'email_password',
        identifier: rawIdentifier,
        reason: 'invalid_credentials',
        ip: meta.ip,
        userAgent: meta.userAgent
      });
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    if (!user.passwordHash) {
      const meta = getRequestMeta(req);
      await logAuthEvent({
        userId: user._id?.toString(),
        event: 'login',
        status: 'failed',
        method: 'email_password',
        identifier: rawIdentifier,
        reason: 'password_login_not_configured',
        ip: meta.ip,
        userAgent: meta.userAgent
      });
      return res.status(400).json({ error: 'Password login is not configured for this account' });
    }

    const isValid = await bcrypt.compare(String(password), user.passwordHash);
    if (!isValid) {
      const meta = getRequestMeta(req);
      await logAuthEvent({
        userId: user._id?.toString(),
        event: 'login',
        status: 'failed',
        method: 'email_password',
        identifier: rawIdentifier,
        reason: 'invalid_credentials',
        ip: meta.ip,
        userAgent: meta.userAgent
      });
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    await checkAdminBootstrap(user);
    const meta = getRequestMeta(req);
    await logAuthEvent({
      userId: user._id?.toString(),
      event: 'login',
      status: 'success',
      method: 'email_password',
      identifier: rawIdentifier,
      ip: meta.ip,
      userAgent: meta.userAgent
    });
    res.json(await issueAuthResponse(user));
  } catch (error) {
    console.error('Email login error:', error);
    const meta = getRequestMeta(req);
    await logAuthEvent({
      event: 'login',
      status: 'failed',
      method: 'email_password',
      identifier: req.body?.identifier || req.body?.email || req.body?.username || undefined,
      reason: 'server_error',
      ip: meta.ip,
      userAgent: meta.userAgent
    });
    res.status(500).json({ error: 'Error logging in with email/password' });
  }
};

const upsertSocialUser = async (params: {
  provider: 'google' | 'apple';
  providerId: string;
  email: string | null;
  firstName?: string | null;
  lastName?: string | null;
  fullName?: string | null;
}) => {
  const { provider, providerId, email, firstName, lastName, fullName } = params;
  const providerField = provider === 'google' ? 'googleId' : 'appleSub';
  const normalizedEmail = email ? normalizeEmail(email) : null;

  let user: any = await User.findOne({ [providerField]: providerId });
  if (!user && normalizedEmail) {
    user = await User.findOne({ email: normalizedEmail });
  }

  if (user) {
    user[providerField] = providerId;
    if (normalizedEmail && !user.email) {
      user.email = normalizedEmail;
    }
    if (!user.firstName || user.firstName === 'User') {
      const names = buildNamePair('User', fullName, firstName, lastName);
      user.firstName = names.firstName;
      if (names.lastName) user.lastName = names.lastName;
    }
    await checkAdminBootstrap(user);
    await user.save();
    return user;
  }

  const names = buildNamePair('User', fullName, firstName, lastName);
  const seedUsername = normalizedEmail ? usernameFromEmail(normalizedEmail) : `${provider}_${providerId.slice(0, 12)}`;
  const safeUsername = await ensureUniqueUsername(seedUsername);

  user = new User({
    email: normalizedEmail || undefined,
    username: safeUsername,
    firstName: names.firstName,
    lastName: names.lastName,
    [providerField]: providerId,
    role: 'user',
    newsletter_subscriber: true
  });

  await checkAdminBootstrap(user);
  await user.save();
  return user;
};

// Google OAuth login/register
export const authenticateGoogle = async (req: Request, res: Response) => {
  try {
    const idToken = (req.body?.idToken || '').toString();
    if (!idToken) {
      return res.status(400).json({ error: 'idToken is required' });
    }

    const verified = await verifyGoogleIdToken(idToken);
    if (!verified.providerId) {
      return res.status(400).json({ error: 'Invalid Google token payload' });
    }
    if (verified.email && !verified.emailVerified) {
      return res.status(400).json({ error: 'Google email is not verified' });
    }

    const user = await upsertSocialUser({
      provider: 'google',
      providerId: verified.providerId,
      email: verified.email,
      firstName: verified.firstName,
      lastName: verified.lastName,
      fullName: verified.fullName
    });

    const meta = getRequestMeta(req);
    await logAuthEvent({
      userId: user._id?.toString(),
      event: 'login',
      status: 'success',
      method: 'google',
      identifier: verified.email || verified.providerId,
      ip: meta.ip,
      userAgent: meta.userAgent
    });

    res.json(await issueAuthResponse(user));
  } catch (error: any) {
    console.error('Google auth error:', error);
    const meta = getRequestMeta(req);
    await logAuthEvent({
      event: 'login',
      status: 'failed',
      method: 'google',
      reason: error?.message || 'google_auth_failed',
      ip: meta.ip,
      userAgent: meta.userAgent
    });
    res.status(401).json({ error: error?.message || 'Google authentication failed' });
  }
};

// Apple OAuth login/register
export const authenticateApple = async (req: Request, res: Response) => {
  try {
    const identityToken = (req.body?.identityToken || '').toString();
    if (!identityToken) {
      return res.status(400).json({ error: 'identityToken is required' });
    }

    const verified = await verifyAppleIdentityToken(identityToken);
    if (verified.email && !verified.emailVerified) {
      return res.status(400).json({ error: 'Apple email is not verified' });
    }
    const user = await upsertSocialUser({
      provider: 'apple',
      providerId: verified.providerId,
      email: verified.email,
      firstName: req.body?.firstName || null,
      lastName: req.body?.lastName || null
    });

    const meta = getRequestMeta(req);
    await logAuthEvent({
      userId: user._id?.toString(),
      event: 'login',
      status: 'success',
      method: 'apple',
      identifier: verified.email || verified.providerId,
      ip: meta.ip,
      userAgent: meta.userAgent
    });

    res.json(await issueAuthResponse(user));
  } catch (error: any) {
    console.error('Apple auth error:', error);
    const meta = getRequestMeta(req);
    await logAuthEvent({
      event: 'login',
      status: 'failed',
      method: 'apple',
      reason: error?.message || 'apple_auth_failed',
      ip: meta.ip,
      userAgent: meta.userAgent
    });
    res.status(401).json({ error: error?.message || 'Apple authentication failed' });
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
      ? await User.findById(userId)
      : await User.findOne({ telegramId });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check for admin bootstrap every time profile is fetched
    await checkAdminBootstrap(user);

    res.json(user.toObject());
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

    // Find or create user
    let user = await User.findOne({ telegramId });

    if (user) {
      // Update user data from Telegram
      user.username = telegramUser.username || user.username || `user_${telegramId}`;
      user.firstName = telegramUser.first_name || user.firstName;
      user.lastName = telegramUser.last_name || user.lastName;
      user.photoUrl = telegramUser.photo_url || user.photoUrl;
    } else {
      // Create new user
      user = new User({
        telegramId,
        username: telegramUser.username || `user_${telegramId}`,
        firstName: telegramUser.first_name || 'User',
        lastName: telegramUser.last_name,
        photoUrl: telegramUser.photo_url,
        role: 'user'
      });
    }

    // Check/apply admin role
    await checkAdminBootstrap(user);
    if (user.isNew) {
      await saveUserWithRetries(user, { seedUsername: user.username || `user_${telegramId}` });
    } else {
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

    const meta = getRequestMeta(req);
    await logAuthEvent({
      userId: user._id?.toString(),
      event: 'login',
      status: 'success',
      method: 'telegram_webapp',
      identifier: String(telegramId),
      ip: meta.ip,
      userAgent: meta.userAgent
    });

    res.json({
      success: true,
      user: user.toObject(),
      token: jwtToken,
      sessionToken,
      jwtToken
    });
  } catch (error) {
    console.error('Telegram authentication error:', error);
    const meta = getRequestMeta(req);
    await logAuthEvent({
      event: 'login',
      status: 'failed',
      method: 'telegram_webapp',
      reason: 'telegram_webapp_auth_failed',
      ip: meta.ip,
      userAgent: meta.userAgent
    });
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

// Admin only: Update user (balance, role, subscription, etc.)
export const updateUser = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const {
      role,
      isBanned,
      isSubscribed,
      subscriptionExpiresAt,
      freeEntriesCount,
      balance,
      firstName,
      lastName,
      username
    } = req.body;

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Update fields if provided
    if (role) user.role = role;
    if (typeof isBanned === 'boolean') user.isBanned = isBanned;
    if (typeof isSubscribed === 'boolean') user.isSubscribed = isSubscribed;
    if (subscriptionExpiresAt !== undefined) user.subscriptionExpiresAt = subscriptionExpiresAt;
    if (typeof freeEntriesCount === 'number') user.freeEntriesCount = freeEntriesCount;
    if (firstName) user.firstName = firstName;
    if (lastName) user.lastName = lastName;
    if (username) user.username = username;

    // Update balance and log transaction if balance changed
    if (typeof balance === 'number') {
      const balanceDiff = balance - user.wallet.balance;
      if (balanceDiff !== 0) {
        user.wallet.transactions.push({
          type: balanceDiff > 0 ? 'deposit' : 'withdrawal',
          amount: Math.abs(balanceDiff),
          description: `Admin adjustment: ${balanceDiff > 0 ? 'added' : 'removed'} by admin`,
          date: new Date(),
          status: 'completed'
        });
        user.wallet.balance = balance;
      }
    }

    await user.save();

    res.json({
      success: true,
      message: 'User updated successfully',
      user: user.toObject()
    });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ error: 'Error updating user' });
  }
};
