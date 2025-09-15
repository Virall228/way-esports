# Backend Dockerfile
FROM node:18-alpine AS build

WORKDIR /app

RUN apk add --no-cache git python3 make g++

COPY package*.json ./

ENV HUSKY=0 NPM_CONFIG_IGNORE_SCRIPTS=true NPM_CONFIG_AUDIT=false NPM_CONFIG_FUND=false
RUN npm i -g npm@10
RUN if [ -f package-lock.json ]; then \
      npm ci --ignore-scripts --no-audit --no-fund; \
    else \
      npm install --ignore-scripts --no-audit --no-fund; \
    fi

# Clean up build dependencies
RUN apk del python3 make g++

COPY . .

RUN npm i -g npm@10
RUN npx tsc

FROM node:18-alpine AS runtime

WORKDIR /app

ENV NODE_ENV=production

COPY package*.json ./

ENV HUSKY=0 NPM_CONFIG_IGNORE_SCRIPTS=true NPM_CONFIG_AUDIT=false NPM_CONFIG_FUND=false
RUN if [ -f package-lock.json ]; then \
      npm ci --omit=dev --ignore-scripts --no-audit --no-fund; \
    else \
      npm install --omit=dev --ignore-scripts --no-audit --no-fund; \
    fi

COPY --from=build /app/dist ./dist

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=5 \
  CMD curl -fsS http://localhost:3000/health || exit 1

CMD ["node", "dist/index.js"]
