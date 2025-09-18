FROM node:20-alpine AS deps
WORKDIR /app
ENV HUSKY=0 NPM_CONFIG_IGNORE_SCRIPTS=true NPM_CONFIG_AUDIT=false NPM_CONFIG_FUND=false
COPY way-esports-backend/package*.json ./
RUN if [ -f package-lock.json ]; then \
      npm ci --omit=dev --ignore-scripts --no-audit --no-fund; \
    else \
      npm install --omit=dev --ignore-scripts --no-audit --no-fund; \
    fi

FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY --from=deps /app/node_modules ./node_modules
COPY way-esports-backend/ ./
EXPOSE 3000
CMD ["npm","start"]
