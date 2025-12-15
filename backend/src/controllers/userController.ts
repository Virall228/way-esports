import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt, { JwtPayload } from 'jsonwebtoken';
import { Document, Types } from 'mongoose';
import User, { IUser } from '../models/User';

type UserDocument = Document<unknown, {}, IUser> & IUser & { _id: Types.ObjectId };

interface AuthRequest extends Request {
  user?: UserDocument;
}

interface JwtUserPayload extends JwtPayload {
  userId: string;
  email: string;
  role: string;
}

// Helper function to convert Mongoose document to plain object
const toPlainObject = (doc: UserDocument) => {
  const obj = doc.toObject();
  const { password, ...userData } = obj;
  return userData;
};

interface AuthRequest extends Request {
  user?: IUser;
}

interface JwtUserPayload extends JwtPayload {
  userId: string;
  email: string;
  role: string;
}

const SALT_ROUNDS = 10;
const JWT_EXPIRATION = '24h';

interface RegisterRequest extends Request {
  body: {
    email: string;
    password: string;
    name: string;
  };
}

interface RegisterRequest extends Request {
  body: {
    email: string;
    password: string;
    name: string;
  };
}

export const register = async (req: RegisterRequest, res: Response) => {
  try {
    const { email, password, name } = req.body;
    
    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'Email already in use' });
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
    
    // Create user
    const user = new User({
      email,
      password: hashedPassword,
      name,
      role: 'user' // Default role
    });
    
    await user.save();
    
    // Generate JWT
    const token = jwt.sign(
      { userId: user._id.toString(), email: user.email, role: user.role },
      process.env.JWT_SECRET || 'your_jwt_secret',
      { expiresIn: JWT_EXPIRATION }
    );
    
    // Return user data (without password) and token
    const userData = toPlainObject(user);
    res.status(201).json({ user: userData, token });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Error registering user' });
  }
};

interface LoginRequest extends Request {
  body: {
    email: string;
    password: string;
  };
}

export const login = async (req: LoginRequest, res: Response) => {
  try {
    const { email, password } = req.body;
    
    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    // Generate JWT
    const token = jwt.sign(
      { userId: user._id.toString(), email: user.email, role: user.role },
      process.env.JWT_SECRET || 'your_jwt_secret',
      { expiresIn: '24h' }
    );
    
    // Return user data (without password) and token
    const userData = toPlainObject(user);
    res.json({ user: userData, token });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Error logging in' });
  }
};

export const getProfile = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const user = await User.findById(req.user._id).select('-password').lean();
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json(user);
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Error fetching profile' });
  }
};

// Admin only
export const getAllUsers = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user || (req.user.role !== 'admin' && req.user.role !== 'developer')) {
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
