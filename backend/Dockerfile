FROM node:20-alpine AS deps
WORKDIR /app
ENV HUSKY=0 NPM_CONFIG_IGNORE_SCRIPTS=true NPM_CONFIG_AUDIT=false NPM_CONFIG_FUND=false
COPY package*.json ./
RUN if [ -f package-lock.json ]; then npm ci --ignore-scripts --no-audit --no-fund; else npm install --ignore-scripts --no-audit --no-fund; fi
COPY . .
RUN npm run build

FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/package.json ./package.json
COPY --from=deps /app/dist ./dist
# ship OpenAPI docs alongside dist (Swagger UI needs this file)
COPY --from=deps /app/src/docs ./dist/src/docs
COPY --from=deps /app/docs ./docs
RUN npm prune --omit=dev
EXPOSE 3000
CMD ["node", "dist/src/server.js"]
