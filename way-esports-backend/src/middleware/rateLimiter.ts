import rateLimit from 'express-rate-limit';

export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: {
    success: false,
    error: 'Too many requests, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

export const authLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // Limit each IP to 5 failed requests per windowMs
  message: {
    success: false,
    error: 'Too many failed attempts, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

export const createAccountLimiter = rateLimit({
  windowMs: 24 * 60 * 60 * 1000, // 24 hours
  max: 5, // Limit each IP to 5 create account requests per day
  message: {
    success: false,
    error: 'Too many accounts created from this IP, please try again after 24 hours'
  },
  standardHeaders: true,
  legacyHeaders: false
}); 