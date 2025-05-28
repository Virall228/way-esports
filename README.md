# WAY Esports Mini App

A comprehensive Telegram Mini App for esports tournament management with TON integration.

## Features

- 🎮 Tournament Management System
- 🏆 Automated Bracket Generation
- 💰 TON Payment Integration
- 👥 Team Registration
- 📊 Live Statistics
- 🏅 Achievement System
- 🔐 Secure Authentication
- 📱 Responsive Design

## Prerequisites

- Node.js (v14 or higher)
- MongoDB (v4.4 or higher)
- Telegram Bot Token (from [@BotFather](https://t.me/BotFather))
- TON Wallet (for payments)

## Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/WAY-Esports.git
cd WAY-Esports
```

2. Install dependencies for all components:
```bash
# Install bot dependencies
cd way-esports-bot
npm install

# Install frontend dependencies
cd ../way-esports/frontend
npm install

# Install backend dependencies
cd ../way-esports-backend
npm install
```

3. Create `.env` files:

For bot (`way-esports-bot/.env`):
```
BOT_TOKEN=your_telegram_bot_token
MONGODB_URI=your_mongodb_connection_string
PORT=3000
TON_NETWORK=mainnet
NODE_ENV=development
```

For backend (`way-esports-backend/.env`):
```
MONGODB_URI=your_mongodb_connection_string
PORT=3001
TON_ENDPOINT=https://toncenter.com/api/v2/jsonRPC
```

## Running the Application

1. Start the bot:
```bash
cd way-esports-bot
npm run dev
```

2. Start the frontend development server:
```bash
cd way-esports/frontend
npm run dev
```

3. Start the backend server:
```bash
cd way-esports-backend
npm run dev
```

## Setting up the Telegram Bot

1. Create a new bot with [@BotFather](https://t.me/BotFather)
2. Get your bot token
3. Enable inline mode for your bot
4. Set up the bot's menu button to open the Mini App
5. Configure webhook URL in the bot settings

## Project Structure

```
WAY-Esports/
├── way-esports-bot/       # Telegram bot
│   ├── models/           # Database models
│   ├── utils/           # Utility functions
│   └── public/          # Static files
├── way-esports/
│   ├── frontend/        # React frontend
│   └── backend/         # Express backend
└── way-esports-backend/ # Tournament backend
```

## Development

- Frontend is built with React and styled-components
- Backend uses Express.js and MongoDB
- Bot uses node-telegram-bot-api
- TON payments integrated using @tonclient

## Security Features

- Telegram WebApp authentication
- Request validation
- Error logging
- Secure payment processing

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

For support, please create an issue in the repository or contact us at support@wayesports.com 
