# WAY Esports Platform

A modern esports platform for WAY Esports organization featuring tournament management, match statistics, team profiles, and more.

## Project Structure

The project consists of three main components:

1. Frontend (React + TypeScript)
2. Backend (Node.js + Express)
3. Discord Bot (Node.js)

## Getting Started

### Frontend Setup

1. Navigate to the frontend directory:
```bash
cd way-esports/frontend
```

2. Install dependencies:
```bash
npm install
```

3. Start development server:
```bash
npm run dev
```

The frontend will be available at `http://localhost:3000`

## Backend Setup

1. Navigate to the backend directory:
```bash
cd way-esports-backend
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file with the following variables or use the external env file:
```env
PORT=4000
MONGODB_URI=your_mongodb_uri
JWT_SECRET=your_jwt_secret
```

4. For deployment, place the env file at `/opt/WAY-Esports/secrets/backend.env` on the server.

5. Start the server:
```bash
npm run dev
```

### Bot Setup

1. Navigate to the bot directory:
```bash
cd way-esports-bot
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file with your Discord bot token:
```env
DISCORD_TOKEN=your_bot_token
```

4. Start the bot:
```bash
npm run dev
```

## Features

### Frontend
- Modern, responsive design with WAY Esports branding
- Tournament system with registration and brackets
- HLTV-style match statistics
- Team and player profiles
- News section
- Wallet integration
- Live tournament updates

## Deployment Instructions

1. On the deployment server, create the secrets directory:
```bash
mkdir -p /opt/WAY-Esports/secrets
```

2. Create the backend environment file `/opt/WAY-Esports/secrets/backend.env` with the following content:
```env
PORT=4000
MONGODB_URI=your_mongodb_uri
JWT_SECRET=your_jwt_secret
```

3. Pull the latest Docker images and start the containers:
```bash
cd /opt/WAY-Esports/WAY-Esports
docker compose pull
docker compose up -d --build
docker compose ps
```

4. Verify the containers are running and the application is accessible.

Note: The `docker-compose.prod.yml` is configured to use the external env file for the backend service.

### Backend
- RESTful API for all frontend features
- User authentication and authorization
- Tournament management
- Match statistics tracking
- Team and player management

### Discord Bot
- Tournament notifications
- Match result updates
- Team management commands
- Player statistics lookup

## Technologies Used

### Frontend
- React 18
- TypeScript
- React Router v6
- Styled Components
- Vite

### Backend
- Node.js
- Express
- MongoDB
- JWT Authentication

### Bot
- Discord.js
- Node.js

## Contributing

1. Create a feature branch
2. Make your changes
3. Submit a pull request

## License

This project is private and confidential. All rights reserved. 