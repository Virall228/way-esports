# Frontend Dockerfile
FROM node:18-alpine AS build

WORKDIR /app

COPY package*.json ./

RUN npm i -g npm@10

# Fix potential npm ci failure by adding missing dependencies and updating apk
RUN apk add --no-cache python3 make g++ libc6-compat && npm ci --no-audit --no-fund

COPY . .

RUN npm run build

FROM nginx:alpine

COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80
