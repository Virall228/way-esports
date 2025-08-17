# Multi-stage build for TineWeb
FROM node:18-alpine AS base

# Install dependencies for native modules
RUN apk add --no-cache libc6-compat

WORKDIR /app

# Copy package files
COPY way-esports/package*.json ./way-esports/
COPY way-esports-backend/package*.json ./way-esports-backend/
COPY way-esports/frontend/package*.json ./way-esports/frontend/

# Install dependencies
RUN cd way-esports/frontend && npm ci --only=production
RUN cd way-esports-backend && npm ci --only=production

# Build frontend
FROM base AS frontend-build
WORKDIR /app/way-esports/frontend
COPY way-esports/frontend/ .
RUN npm run build

# Build backend
FROM base AS backend-build
WORKDIR /app/way-esports-backend
COPY way-esports-backend/ .
RUN npm run build

# Production stage
FROM node:18-alpine AS production

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Create app user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 tine

WORKDIR /app

# Copy built frontend
COPY --from=frontend-build /app/way-esports/frontend/dist ./frontend/dist
COPY --from=frontend-build /app/way-esports/frontend/package.json ./frontend/

# Copy built backend
COPY --from=backend-build /app/way-esports-backend/dist ./backend/dist
COPY --from=backend-build /app/way-esports-backend/package.json ./backend/
COPY --from=backend-build /app/way-esports-backend/node_modules ./backend/node_modules

# Copy environment configuration
COPY way-esports-backend/.env.example ./backend/.env

# Set ownership
RUN chown -R tine:nodejs /app

USER tine

EXPOSE 3000 3001

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"

# Start application
CMD ["dumb-init", "node", "backend/dist/server.js"]
