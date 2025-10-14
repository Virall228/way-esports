FROM node:20-alpine AS deps
WORKDIR /app
ENV HUSKY=0 NPM_CONFIG_IGNORE_SCRIPTS=true NPM_CONFIG_AUDIT=false NPM_CONFIG_FUND=false
COPY package*.json ./
RUN if [ -f package-lock.json ]; then npm ci --ignore-scripts --no-audit --no-fund; else npm install --ignore-scripts --no-audit --no-fund; fi

FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY --from=deps /app/node_modules ./node_modules
COPY package*.json ./
COPY server.js ./
COPY routes/ ./routes/
COPY middleware/ ./middleware/
COPY models/ ./models/
COPY services/ ./services/
RUN npm prune --omit=dev
EXPOSE 3000
CMD ["node", "server.js"]
