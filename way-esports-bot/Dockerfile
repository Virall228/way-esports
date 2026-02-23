FROM node:20-alpine

WORKDIR /app

COPY package.json ./
RUN npm install --omit=dev --ignore-scripts --no-audit --no-fund

COPY src ./src

EXPOSE 8080

CMD ["npm", "start"]
