import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import jwt, { JwtPayload } from 'jsonwebtoken';
import User from '../models/User';
import Session from '../models/Session';

type JwtUserPayload = JwtPayload & { userId: string };

function isJwtUserPayload(decoded: string | JwtPayload): decoded is JwtUserPayload {
  return typeof decoded !== 'string' && typeof (decoded as any).userId === 'string';
}

export const authenticateJWT = async (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader) {
    return res.status(401).json({ error: 'No token provided' });
  }

  const token = authHeader.split(' ')[1];
  if (!token) {
    return res.status(401).json({ error: 'Invalid token format' });
  }
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret');

    if (!isJwtUserPayload(decoded)) {
      return res.status(403).json({ error: 'Invalid token payload' });
    }

    const user = await User.findById(decoded.userId);

    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    req.user = user;
    next();
  } catch (error) {
    try {
      const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
      const session: any = await Session.findOne({ tokenHash, expiresAt: { $gt: new Date() } }).lean();

      if (!session?.user) {
        return res.status(403).json({ error: 'Invalid or expired token' });
      }

      const user = await User.findById(session.user);
      if (!user) {
        return res.status(401).json({ error: 'User not found' });
      }

      req.user = user;
      next();
    } catch {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
  }
};

export const isAdmin = (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  const role = (req.user as any).role;
  if (role === 'admin' || role === 'developer') {
    next();
  } else {
    res.status(403).json({ error: 'Admin access required' });
  }
};
