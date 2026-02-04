# 🐳 Docker Deployment Guide

## ❌ Проблема: Изменения в GitHub не применяются

**Причина:** У тебя Docker сборка на сервере, а я деплою в репозиторий.

## ✅ Решение: Обновить Docker файлы и пересобрать

### 1. Обновить Docker файлы на сервере

#### Backend Dockerfile
```dockerfile
FROM node:18-alpine

WORKDIR /app

# Копируем package.json и package-lock.json
COPY package*.json ./

# Устанавливаем зависимости включая новые
RUN npm install ioredis stripe

# Копируем весь код
COPY . .

# Создаем директорию для логов
RUN mkdir -p logs

# Запускаем миграции
RUN node scripts/add-referral-fields.js || true
RUN node scripts/seed-terms.js || true

# Экспортируем порт
EXPOSE 3001

# Запускаем сервер
CMD ["npm", "run", "dev"]
```

#### Frontend Dockerfile
```dockerfile
FROM node:18-alpine as builder

WORKDIR /app

# Копируем package.json
COPY package*.json ./

# Устанавливаем зависимости
RUN npm install

# Копируем исходники
COPY . .

# Собираем проект
RUN npm run build

# Production stage
FROM nginx:alpine

# Копируем сборку
COPY --from=builder /app/build /usr/share/nginx/html

# Копируем nginx конфиг
COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

### 2. Быстрое обновление на сервере

#### Скопировать новые файлы:
```bash
# На сервере
cd /path/to/your/project

# Создать бэкап
docker-compose down
docker commit way-esports-backend way-esports-backup
docker commit way-esports-frontend way-esports-frontend-backup

# Скопировать новые файлы с локальной машины
scp -r backend/* user@server:/path/to/project/backend/
scp -r way-esports-front/frontend/* user@server:/path/to/project/frontend/
```

#### Или обновить из GitHub:
```bash
# На сервере
git pull origin main
```

### 3. Пересобрать Docker контейнеры

```bash
# Остановить старые контейнеры
docker-compose down

# Пересобрать с новыми зависимостями
docker-compose build --no-cache

# Запустить
docker-compose up -d

# Проверить логи
docker-compose logs -f
```

### 4. Проверить миграции

```bash
# Войти в контейнер бэкенда
docker exec -it way-esports-backend sh

# Запустить миграции вручную
node scripts/add-referral-fields.js
node scripts/seed-terms.js

# Выйти
exit
```

### 5. Проверить работу

```bash
# Проверить health endpoint
curl http://localhost:3001/api/health

# Проверить фронтенд
curl http://localhost:3000
```

---

## 🚨 Срочные действия:

### На сервере прямо сейчас:

1. **Зайти в директорию проекта:**
```bash
cd /path/to/way-esports
```

2. **Обновить код из GitHub:**
```bash
git pull origin main
```

3. **Пересобрать Docker:**
```bash
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

4. **Проверить что всё работает:**
```bash
docker-compose logs
curl http://localhost:3001/api/health
```

### Если нет Git на сервере:

Скопируй эти файлы вручную:
- `backend/src/middleware/concurrency.ts`
- `backend/src/middleware/fraudDetection.ts` 
- `backend/src/services/cacheService.ts`
- `backend/src/services/loggingService.ts`
- `backend/src/routes/webhooks.ts`
- `backend/src/routes/analytics.ts`
- `backend/src/routes/terms.ts`
- `backend/src/models/TermsAndConditions.ts`
- `backend/src/models/UserAgreement.ts`
- `backend/scripts/add-referral-fields.js`
- `backend/scripts/seed-terms.js`
- `way-esports-front/frontend/src/components/Legal/TermsModal.tsx`
- `way-esports-front/frontend/src/components/Legal/TermsGuard.tsx`

---

## 🎯 После обновления проверь:

1. **API Health:** `http://your-server:3001/api/health`
2. **Новые эндпоинты:** `http://your-server:3001/api/terms/current`
3. **Фронтенд:** Terms модальное окно при входе
4. **База данных:** Новые поля в users коллекции

**Теперь всё должно работать!** 🚀
