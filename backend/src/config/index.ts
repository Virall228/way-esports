export const config = {
  port: process.env.PORT || 3000,
  // Support both MONGO_URI and MONGODB_URI env names
  mongoUri: process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://localhost:27017/way-esports',
  jwtSecret: process.env.JWT_SECRET || 'your-secret-key',
  telegramBotToken: process.env.TELEGRAM_BOT_TOKEN || '',
  cors: {
    origin: process.env.CORS_ORIGIN || '*'
  },
  
  // Email configuration
  email: {
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.EMAIL_PORT || '587'),
    secure: process.env.EMAIL_SECURE === 'true',
    auth: {
      user: process.env.EMAIL_USER || '',
      pass: process.env.EMAIL_PASS || ''
    }
  },
  
  // Rate limiting
  rateLimit: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // limit each IP to 100 requests per windowMs
  },
  
  // Game settings
  games: {
    'valorant-mobile': {
      minPlayers: 2,
      maxPlayers: 10,
      registrationDeadline: 24 * 60 * 60 * 1000 // 24 hours before start
    },
    'cs2': {
      minPlayers: 2,
      maxPlayers: 10,
      registrationDeadline: 24 * 60 * 60 * 1000
    },
    'pubg-mobile': {
      minPlayers: 2,
      maxPlayers: 10,
      registrationDeadline: 24 * 60 * 60 * 1000
    }
  }
};

export default config;

















