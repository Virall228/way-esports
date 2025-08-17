import { Request, Response, NextFunction } from 'express';

interface AuthRequest extends Request {
  user?: {
    id: string;
    username: string;
  };
}

// Mock authentication middleware for testing
export const mockAuth = (req: AuthRequest, res: Response, next: NextFunction) => {
  // Add a mock user to the request
  req.user = {
    id: 'mock-user-123',
    username: 'testuser'
  };
  
  next();
};