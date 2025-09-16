FROM node:20-alpine AS builder
WORKDIR /app
ENV HUSKY=0 NPM_CONFIG_IGNORE_SCRIPTS=true NPM_CONFIG_AUDIT=false NPM_CONFIG_FUND=false
COPY package*.json ./
RUN if [ -f package-lock.json ]; then npm ci --ignore-scripts --no-audit --no-fund; else npm install --ignore-scripts --no-audit --no-fund; fi
COPY . .
RUN npm run build

FROM nginx:stable-alpine
COPY --from=builder /app/dist /usr/share/nginx/html
EXPOSE 80
