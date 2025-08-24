import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User';
import { IUser } from '../src/models/User';

export interface AuthRequest extends Request {
  user?: IUser;
  token?: string;
}

export const auth = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) {
      throw new Error();
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as { _id: string };
    const user = await User.findOne({ _id: decoded._id, 'tokens.token': token });

    if (!user) {
      throw new Error();
    }

    req.token = token;
    req.user = user;
    next();
  } catch (error) {
    res.status(401).send({ error: 'Please authenticate.' });
  }
};

export const admin = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (req.user && (req.user.role === 'admin' || req.user.role === 'developer')) {
    next();
  } else {
    res.status(403).send({ error: 'Access denied.' });
  }
};

export const adminAuth = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    await auth(req, res, () => {});

    if (!req.user || req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Access denied' });
    }

    next();
  } catch (error) {
    res.status(403).json({ message: 'Access denied' });
  }
};

export const teamCaptainAuth = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    await auth(req, res, () => {});

    if (!req.user) {
        return res.status(401).json({ message: 'User not authenticated' });
    }
    const team = await req.user.getTeam();
    if (!team || !team.captain.equals(req.user._id)) {
        return res.status(403).json({ message: 'Not team captain' });
    }

    req.team = team;
    next();
  } catch (error) {
    res.status(403).json({ message: 'Must be team captain' });
  }
}; 