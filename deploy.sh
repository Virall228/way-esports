#!/bin/sh

# Обновление репозитория
git pull

# Проверка наличия .env файла, если нет - создаем из .env.example
if [ ! -f .env ]; then
  if [ -f .env.example ]; then
    cp .env.example .env
    echo ".env файл создан из .env.example"
  else
    echo "Файл .env.example не найден. Пожалуйста, создайте .env вручную."
    exit 1
  fi
fi

# Сборка и запуск контейнеров без использования sudo
docker compose build --no-cache --pull
docker compose up -d

echo "Деплой завершен. Проверьте статус контейнеров командой: docker compose ps"
