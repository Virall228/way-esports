# Frontend Dockerfile
FROM node:18-alpine AS build

WORKDIR /app

COPY package*.json ./

RUN npm i -g npm@10
RUN npm ci --no-audit --no-fund

COPY . .

RUN npm run build

FROM nginx:alpine

COPY --from=build /app/dist /usr/share/nginx/html
COPY ops/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=5 \
  CMD curl -fsS http://localhost/health || exit 1
