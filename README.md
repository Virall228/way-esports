# WAY Esports

A comprehensive esports platform built with React, Node.js, Express, and MongoDB.

## Quick Start

### Prerequisites

- Docker and Docker Compose installed on your server
- Git

### First Time Setup

1. Clone the repository:
```bash
git clone https://github.com/virall228/way-esports.git
cd way-esports
```

2. Copy the environment file and configure it:
```bash
cp .env.example .env
# Edit .env with your actual values (MongoDB URI, JWT secret, etc.)
```

3. Build and run the application:
```bash
docker compose up -d --build
```

The application will be available at:
- Frontend: http://localhost (port 80)
- Backend: http://localhost:3000

### Updating the Application

To update to the latest version:

```bash
git pull origin main
docker compose up -d --build
```

### Stopping the Application

```bash
docker compose down
```

### Viewing Logs

```bash
docker compose logs -f
```

## Environment Variables

Copy `.env.example` to `.env` and fill in the required values:

- `NODE_ENV`: Set to `production` for production deployment
- `PORT`: Backend port (default: 3000)
- `MONGODB_URI`: Your MongoDB connection string
- `JWT_SECRET`: Secret key for JWT tokens
- `TELEGRAM_BOT_TOKEN`: Telegram bot token (if using Telegram integration)
- Other variables as needed

## Architecture

- **Frontend**: React application served by Nginx
- **Backend**: Node.js/Express API server
- **Database**: MongoDB

## Development

For development setup, see individual service READMEs in `way-esports-frontend/` and `way-esports-backend/`.
