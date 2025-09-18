# WAY-Esports

## Ручной деплой одной командой

1. Клонируйте репозиторий:
   ```bash
   git clone <REPO_URL>
   cd <REPO_NAME>
   ```

2. Скопируйте пример файла окружения:
   ```bash
   cp .env.example .env
   ```

3. Сделайте скрипт запуска исполняемым:
   ```bash
   chmod +x run.sh
   ```

4. Запустите деплой:
   ```bash
   ./run.sh
   ```

5. После успешного запуска:
   - Фронтенд будет доступен по адресу: `http://<IP>:8080`
   - Бэкенд будет доступен по адресу: `http://<IP>:3000`

## Отключение husky и CI/CD

- Удалены все хуки husky и скрипты, связанные с ним.
- Удалены файлы CI/CD из `.github/workflows/`.
- Добавлены `.npmrc` в `frontend` и `backend` для игнорирования скриптов и аудита при установке пакетов.

## Структура Docker

- Dockerfile для `frontend` и `backend` находятся внутри соответствующих папок.
- Используются образы `node:20-alpine` и `nginx:stable-alpine` для фронтенда.
- Используется multi-stage сборка для оптимизации образов.

## Запуск через Docker Compose

- Используется корневой `docker-compose.yml` для запуска сервисов.

This project is configured for manual deployment using Docker and Docker Compose.

## Deployment Instructions

1. Clone the repository:
   ```
   git clone <REPO_URL>
   cd <REPO_NAME>
   ```

2. Copy the example environment variables file:
   ```
   cp .env.example .env
   ```

3. Make the deploy script executable:
   ```
   chmod +x deploy.sh
   ```

4. Run the deployment script:
   ```
   ./deploy.sh
   ```

## Access

- Frontend will be available at: `http://<IP>:8080`
- Backend will be available at: `http://<IP>:3000`

## Notes

- This setup removes automatic deployment and husky hooks.
- All builds are done inside Docker containers with scripts ignored to avoid husky install errors.
