# Multi-stage build for WAY Esports
FROM node:18-slim AS base

# Install dependencies for native modules
RUN apt-get update && apt-get install -y libc6 && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy package files
COPY way-esports/package*.json ./way-esports/
COPY way-esports-backend/package*.json ./way-esports-backend/
COPY way-esports/frontend/package*.json ./way-esports/frontend/

# Build frontend
FROM base AS frontend-build
WORKDIR /app/way-esports/frontend
COPY way-esports/frontend/ .
RUN npm ci --no-audit --no-fund
RUN npm install vite
RUN npm run build

# Build backend
FROM base AS backend-build
WORKDIR /app/way-esports-backend
COPY way-esports-backend/ .
RUN npm ci --no-audit --no-fund
RUN npm run build
RUN npm prune --omit=dev

# Production stage
FROM node:18-slim AS production

# Install dumb-init for proper signal handling
RUN apt-get update && apt-get install -y dumb-init && rm -rf /var/lib/apt/lists/*

# Create app user
RUN groupadd --system --gid 1001 nodejs
RUN useradd --system --uid 1001 tine

WORKDIR /app

# Copy built frontend
COPY --from=frontend-build /app/way-esports/frontend/dist ./frontend/dist
COPY --from=frontend-build /app/way-esports/frontend/package.json ./frontend/

# Copy built backend
COPY --from=backend-build /app/way-esports-backend/dist ./backend/dist
COPY --from=backend-build /app/way-esports-backend/package.json ./backend/
COPY --from=backend-build /app/way-esports-backend/node_modules ./backend/node_modules

# Create empty .env file (don't copy non-existent .env.example)
RUN touch ./backend/.env

# Set ownership
RUN chown -R tine:nodejs /app

USER tine

EXPOSE 3000 3001

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"

# Start application
CMD ["dumb-init", "node", "backend/dist/server.js"]





# Health check


HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \


  CMD node -e "require('http').get('http://localhost:3000/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"



# Start application


CMD ["dumb-init", "node", "backend/dist/server.js"]








# Start application

CMD ["dumb-init", "node", "backend/dist/server.js"]



