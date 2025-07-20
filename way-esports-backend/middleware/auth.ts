import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { User, IUser } from '../models/User';

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

    if (!req.user.isAdmin) {
      throw new Error();
    }

    next();
  } catch (error) {
    res.status(403).json({ message: 'Access denied' });
  }
};

export const teamCaptainAuth = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    await auth(req, res, () => {});

    const team = await req.user.getTeam();
    if (!team || !team.captain.equals(req.user._id)) {
      throw new Error();
    }

    req.team = team;
    next();
  } catch (error) {
    res.status(403).json({ message: 'Must be team captain' });
  }
}; 