# Backend Dockerfile
FROM node:18-alpine AS build

WORKDIR /app

# Install build dependencies for native modules (bcryptjs, etc.)
RUN apk add --no-cache python3 make g++

COPY package*.json ./

ENV HUSKY=0
RUN npm i -g npm@10
RUN npm ci --no-audit --no-fund --ignore-scripts

# Clean up build dependencies
RUN apk del python3 make g++

COPY . .

RUN npm i -g npm@10
RUN npx tsc

FROM node:18-alpine AS runtime

WORKDIR /app

ENV NODE_ENV=production

COPY package*.json ./

ENV HUSKY=0
RUN npm ci --omit=dev --no-audit --no-fund --ignore-scripts

COPY --from=build /app/dist ./dist

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=5 \
  CMD curl -fsS http://localhost:3000/health || exit 1

CMD ["node", "dist/index.js"]
