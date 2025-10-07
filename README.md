# WAY-Esports

## Ручной деплой одной командой

Требования: Ubuntu 22.04+, Docker, Docker Compose v2.

1. Клонировать репозиторий:
   ```bash
   git clone <REPO_URL>
   cd <REPO_NAME>
   ```

2. Запустить одной командой:
   ```bash
   bash scripts/bootstrap.sh
   ```

Скрипт проверит Docker/Compose, создаст `.env` с дефолтами (если нет) и поднимет контейнеры.

Доступ по умолчанию после старта:
- Web: `http://<SERVER_IP>/`
- API: `http://<SERVER_IP>/api`

## Описание сервисов

- reverse-proxy: Nginx на порту 80, проксирует `/` → web, `/api` → api
- web: статический фронтенд (Vite build) на nginx
- api: Node.js backend (Express), `NODE_ENV=production`
- mongo: MongoDB 7 с volume `mongo_data`

## Переменные окружения (минимум)

- `MONGODB_URI` (по умолчанию `mongodb://mongo:27017/way-esports`)
- `JWT_SECRET` (будет сгенерирован, если отсутствует)
- `VITE_API_URL` (по умолчанию `http://localhost/api` для сборки web)

## Команды Makefile

- `make up` — сборка и запуск в фоне
- `make down` — остановка и удаление контейнеров
- `make logs` — просмотр логов
- `make restart` — пересборка и рестарт

## Обновление

```bash
git pull
make restart
```

## Резервное копирование

Том БД: `mongo_data`. Для бэкапа можно использовать `docker cp`/`mongodump`.
