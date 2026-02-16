FROM node:20-alpine AS builder
WORKDIR /app
ENV HUSKY=0 NPM_CONFIG_IGNORE_SCRIPTS=true NPM_CONFIG_AUDIT=false NPM_CONFIG_FUND=false
# Build-time API URL for Vite
ARG VITE_API_URL
ENV VITE_API_URL=${VITE_API_URL}
ARG VITE_GOOGLE_CLIENT_ID
ENV VITE_GOOGLE_CLIENT_ID=${VITE_GOOGLE_CLIENT_ID}
ARG VITE_APPLE_CLIENT_ID
ENV VITE_APPLE_CLIENT_ID=${VITE_APPLE_CLIENT_ID}
ARG VITE_APPLE_REDIRECT_URI
ENV VITE_APPLE_REDIRECT_URI=${VITE_APPLE_REDIRECT_URI}
COPY package*.json ./
# Используем npm install вместо npm ci для большей гибкости при несинхронизированных lock файлах
# npm install автоматически обновит package-lock.json если нужно
RUN npm install --ignore-scripts --no-audit --no-fund
COPY . .
RUN npm run build

FROM nginx:stable-alpine
COPY --from=builder /app/dist /usr/share/nginx/html
# Подменяем дефолтный конфиг nginx конфигом со SPA fallback
COPY nginx.conf /etc/nginx/conf.d/default.conf
# Simple health endpoint
RUN printf 'ok' > /usr/share/nginx/html/health
EXPOSE 80
