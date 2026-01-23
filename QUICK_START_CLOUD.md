# ⚡ Быстрый старт для деплоя на облачный сервер

## 🎯 Для тех, кто уже имеет сервер

### Шаг 1: Подготовка

```bash
# На вашем сервере
cd /opt  # или любая другая директория
git clone <your-repo-url> way-esports
cd way-esports
```

### Шаг 2: Настройка .env

```bash
# Создайте .env файл в корне проекта для Docker Compose
# Используйте backend/env.example как основу
nano .env
```

**Или создайте .env на основе backend/env.example:**
```bash
# Скопируйте пример из backend
cat backend/env.example > .env

# Добавьте переменные для Docker Compose (если нужно)
echo "VITE_API_URL=/api" >> .env
echo "MONGO_INITDB_DATABASE=way-esports" >> .env

# Отредактируйте .env
nano .env
```

**Ключевые настройки:**
```env
# ВАЖНО: Для одного сервера используйте относительный путь
VITE_API_URL=/api

# MongoDB (встроенный или внешний)
MONGODB_URI=mongodb://mongo:27017/way-esports

# Telegram Bot Token
TELEGRAM_BOT_TOKEN=ваш_токен_от_botfather

# JWT Secret (измените на случайный!)
JWT_SECRET=случайная_строка_минимум_32_символа

# CORS
CORS_ORIGIN=*
```

### Шаг 3: Запуск

```bash
# Запуск всех сервисов
docker-compose up -d --build

# Проверка статуса
docker-compose ps

# Просмотр логов
docker-compose logs -f
```

### Шаг 4: Проверка

```bash
# Health check
curl http://localhost/api/health

# Должен вернуть: {"status":"ok","mongo":"connected",...}
```

### Шаг 5: Настройка домена (если нужно)

Если у вас есть домен, настройте nginx на хосте:

```nginx
server {
    listen 80;
    server_name yourdomain.com;
    
    location / {
        proxy_pass http://localhost:80;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Затем получите SSL:
```bash
sudo certbot --nginx -d yourdomain.com
```

## 🔄 Обновление

```bash
cd /opt/way-esports
git pull
docker-compose up -d --build
```

## 📊 Полезные команды

```bash
# Логи
docker-compose logs -f api      # Backend логи
docker-compose logs -f web      # Frontend логи
docker-compose logs -f          # Все логи

# Перезапуск
docker-compose restart api

# Остановка
docker-compose down

# Статус
docker-compose ps
```

## ✅ Готово!

Ваше приложение доступно по адресу вашего сервера или домена!

**Для Telegram Mini App:**
1. Откройте @BotFather
2. `/newapp` → выберите бота
3. URL: `https://yourdomain.com` (или IP сервера)
4. Готово! 🎉

---

**Подробная документация:** см. `DEPLOY_CLOUD_SERVER.md`

