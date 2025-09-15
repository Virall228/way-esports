# Развертывание WAY-Esports

## Автоматическое развертывание
При пуше в ветку `main` или ручном запуске workflow в GitHub Actions, развертывание происходит автоматически на сервере через self-hosted runner.

## Ручное развертывание
Если нужно развернуть вручную на сервере:

```bash
cd /opt/way-esports
docker compose -f docker-compose.prod.yml build --pull
docker compose -f docker-compose.prod.yml up -d --remove-orphans
docker compose -f docker-compose.prod.yml ps
```

## Просмотр логов
```bash
docker compose -f docker-compose.prod.yml logs -f [service_name]
# или для всех сервисов
docker compose -f docker-compose.prod.yml logs -f
```

## Перезапуск сервисов
```bash
docker compose -f docker-compose.prod.yml restart [service_name]
```

## Откат
Для отката к предыдущему коммиту:
1. Перейдите к предыдущему коммиту локально или на сервере
2. Пересоберите и перезапустите контейнеры

```bash
cd /opt/way-esports
git checkout <previous_commit>
docker compose -f docker-compose.prod.yml build --pull --no-cache
docker compose -f docker-compose.prod.yml up -d --remove-orphans
```

## Мониторинг
- Проверьте статус контейнеров: `docker compose -f docker-compose.prod.yml ps`
- Проверьте healthchecks: `docker compose -f docker-compose.prod.yml exec [service] curl http://localhost/health` (для backend)

## Переменные окружения
Создайте файл `.env.prod` в корне проекта на сервере с необходимыми переменными (см. `.env.prod.example`).

## Изменения в коде
- Frontend: React/Vite, сборка в nginx
- Backend: Node.js/Express/TypeScript, healthcheck на /health
- База данных: MongoDB с persistent volumes
- Кэш: Redis с persistent volumes
- Автообновление: Watchtower для автоматического обновления контейнеров
