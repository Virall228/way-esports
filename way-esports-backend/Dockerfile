# Backend Dockerfile
FROM node:18-alpine AS build

WORKDIR /app

# Install build dependencies for native modules (bcryptjs, etc.)
RUN apk add --no-cache python3 make g++

COPY package*.json ./

RUN npm i -g npm@10
RUN npm ci --no-audit --no-fund

# Clean up build dependencies
RUN apk del python3 make g++

COPY . .

RUN npm i -g npm@10
RUN npx tsc

FROM node:18-alpine AS runtime

WORKDIR /app

ENV NODE_ENV=production

COPY package*.json ./

RUN npm ci --omit=dev --no-audit --no-fund

COPY --from=build /app/dist ./dist

EXPOSE 3000

CMD ["node", "dist/server.js"]
