#!/bin/sh

# Check for prod flag
if [ "$1" = "prod" ]; then
  COMPOSE_FILE="-f docker-compose.prod.yml"
  ENV_FILE=".env.prod"
  echo "Running in production mode"
else
  COMPOSE_FILE=""
  ENV_FILE=".env"
  echo "Running in development mode"
fi

# Обновление репозитория
git pull

# Проверка наличия ENV_FILE файла, если нет - создаем из .env.example
if [ ! -f "$ENV_FILE" ]; then
  if [ -f .env.example ]; then
    cp .env.example "$ENV_FILE"
    echo "$ENV_FILE файл создан из .env.example"
  else
    echo "Файл .env.example не найден. Пожалуйста, создайте $ENV_FILE вручную."
    exit 1
  fi
fi

# Сборка и запуск контейнеров без использования sudo
docker compose $COMPOSE_FILE build --no-cache --pull
docker compose $COMPOSE_FILE up -d

echo "Деплой завершен. Проверьте статус контейнеров командой: docker compose $COMPOSE_FILE ps"
