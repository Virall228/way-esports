# WAY Esports Mini App

A Telegram Mini App for managing esports tournaments and matches.

## Features

- Tournament match management
- Real-time match updates
- Team registration
- TON payment integration
- Achievement system

## Prerequisites

- Node.js (v14 or higher)
- MongoDB (v4.4 or higher)
- Telegram Bot Token
- TON Wallet (for payments)

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd way-esports-bot
```

2. Install dependencies:
```bash
npm install
```

3. Configure environment variables:
- Copy `.env.example` to `.env`
- Fill in your configuration values:
  - BOT_TOKEN: Your Telegram bot token
  - MONGODB_URI: Your MongoDB connection string
  - PORT: Server port (default: 3000)
  - TON_NETWORK: TON network (mainnet/testnet)

4. Start the server:
```bash
# Development mode
npm run dev

# Production mode
npm start
```

## Setting up the Telegram Bot

1. Create a new bot with @BotFather
2. Set up the bot's menu button to open the Mini App
3. Configure webhook URL in the bot settings

## Development

- The frontend is in `public/index.html`
- Backend API routes are in `server.js`
- Database models are in `models/`

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

This project is licensed under the MIT License.

## Support

For support, please contact support@wayesports.com 