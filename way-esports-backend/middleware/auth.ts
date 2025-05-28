import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { User } from '../models/User';

interface AuthRequest extends Request {
  user?: any;
}

export const auth = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
      throw new Error();
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    const user = await User.findOne({ _id: decoded._id, 'tokens.token': token });

    if (!user) {
      throw new Error();
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Please authenticate' });
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