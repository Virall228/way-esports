FROM node:20-alpine AS builder
WORKDIR /app

ENV HUSKY=0 \
    NPM_CONFIG_IGNORE_SCRIPTS=true \
    NPM_CONFIG_AUDIT=false \
    NPM_CONFIG_FUND=false

COPY package*.json ./
RUN npm pkg set scripts.prepare="" || true \
 && npm pkg set scripts.preinstall="" || true \
 && npm pkg set scripts.postinstall="" || true

RUN npm config set registry https://registry.npmjs.org/ \
    && npm config set fetch-retries 5 \
    && npm config set fetch-retry-maxtimeout 60000

RUN if [ -f package-lock.json ]; then \
      npm ci --ignore-scripts --no-audit --no-fund; \
    else \
      npm install --ignore-scripts --no-audit --no-fund; \
    fi

COPY . ./
RUN npm run build

FROM nginx:stable-alpine
COPY --from=builder /app/dist /usr/share/nginx/html
EXPOSE 80

HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=5 \
  CMD curl -fsS http://localhost/health || exit 1
