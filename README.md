# WAY Esports Tournament System

A tournament management system for Telegram Mini Apps with bracket generation and real-time updates.

## Features

- Tournament Creation and Management
- Automatic Bracket Generation
- Team Registration
- Match Score Updates
- Real-time Tournament Progress
- User Profiles and Stats
- Achievement System

## Setup

1. Install dependencies:
```bash
npm install
```

2. Configure environment:
- Copy `.env.example` to `.env`
- Update with your settings:
  ```
  BOT_TOKEN=your_telegram_bot_token
  MONGODB_URI=mongodb://localhost:27017/way_esports
  PORT=3000
  TON_NETWORK=mainnet
  ```

3. Start the server:
```bash
# Development
npm run dev

# Production
npm start
```

## Telegram Bot Setup

1. Create a bot with @BotFather
2. Set the menu button to open your Mini App
3. Configure webhook URL

## Tournament System

### Creating a Tournament
1. Click "Create Tournament"
2. Fill in tournament details:
   - Name
   - Description
   - Game
   - Maximum teams
   - Start/End dates
   - Prize pool (optional)

### Team Registration
1. Users can register teams
2. Teams are seeded automatically
3. Tournament starts when ready

### Bracket System
- Automatic bracket generation
- Support for any power of 2 number of teams
- Automatic handling of byes
- Winner progression
- Match score tracking

### User Profiles
- Stats tracking
- Tournament history
- Achievements
- Ranking system

## Support

For support, contact support@wayesports.com 