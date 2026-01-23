# 🚀 Деплой на облачный сервер (Backend + Frontend)

Этот гайд описывает деплой всего проекта (backend + frontend) на один облачный сервер через Docker Compose.

## 📋 Предварительные требования

1. **Облачный сервер** (VPS) с Ubuntu 20.04+ или Debian 11+
2. **Docker** и **Docker Compose** установлены
3. **Домен** настроен и указывает на IP сервера
4. **MongoDB** (можно использовать встроенный в docker-compose или внешний)

## 🔧 Установка на сервере

### 1. Подготовка сервера

```bash
# Обновление системы
sudo apt update && sudo apt upgrade -y

# Установка Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Установка Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Добавление пользователя в группу docker
sudo usermod -aG docker $USER
newgrp docker
```

### 2. Клонирование проекта

```bash
# Создайте директорию для проекта
mkdir -p /opt/way-esports
cd /opt/way-esports

# Клонируйте репозиторий
git clone <your-repo-url> .

# Или загрузите файлы через scp/sftp
```

### 3. Настройка переменных окружения

Создайте файл `.env` в корне проекта:

```bash
cd /opt/way-esports
nano .env
```

**Важно**: Для деплоя на одном сервере используйте относительный путь для API:

```env
# ============================================
# Общие настройки
# ============================================
NODE_ENV=production

# ============================================
# Backend настройки
# ============================================
PORT=3000
MONGODB_URI=mongodb://mongo:27017/way-esports
# Или внешний MongoDB:
# MONGODB_URI=mongodb+srv://user:password@cluster.mongodb.net/way-esports

JWT_SECRET=your-super-secret-jwt-key-min-32-chars-change-this
JWT_EXPIRES_IN=7d

TELEGRAM_BOT_TOKEN=your_telegram_bot_token_here
BOOTSTRAP_ADMIN_TELEGRAM_ID=your_telegram_id_here

# CORS - для одного домена можно указать конкретный домен
# Или * для Telegram Mini App
CORS_ORIGIN=*

# ============================================
# Frontend настройки
# ============================================
# ВАЖНО: Используйте относительный путь /api для работы через nginx proxy
VITE_API_URL=/api

# ============================================
# MongoDB (если используете встроенный)
# ============================================
MONGO_INITDB_DATABASE=way-esports

# ============================================
# Redis (опционально, для очередей)
# ============================================
REDIS_URL=redis://redis:6379

# ============================================
# Email (опционально)
# ============================================
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_email_password
EMAIL_SECURE=false
```

### 4. Настройка домена

#### Вариант A: Один домен (рекомендуется)

Если у вас один домен (например, `yourdomain.com`):
- Frontend: `https://yourdomain.com`
- Backend API: `https://yourdomain.com/api`

В этом случае `VITE_API_URL=/api` (относительный путь).

#### Вариант B: Поддомены

Если используете поддомены:
- Frontend: `https://app.yourdomain.com`
- Backend API: `https://api.yourdomain.com`

В этом случае `VITE_API_URL=https://api.yourdomain.com`.

### 5. Настройка Nginx для HTTPS (опционально, но рекомендуется)

Установите Certbot для SSL сертификатов:

```bash
sudo apt install certbot python3-certbot-nginx -y
```

Создайте конфигурацию nginx для вашего домена:

```bash
sudo nano /etc/nginx/sites-available/way-esports
```

```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    # Редирект на HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;

    # SSL настройки
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    # Проксирование на Docker Compose
    location / {
        proxy_pass http://localhost:80;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Активируйте конфигурацию:

```bash
sudo ln -s /etc/nginx/sites-available/way-esports /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

Получите SSL сертификат:

```bash
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

## 🚀 Запуск приложения

### 1. Сборка и запуск

```bash
cd /opt/way-esports

# Сборка и запуск всех сервисов
docker-compose up -d --build

# Просмотр логов
docker-compose logs -f

# Проверка статуса
docker-compose ps
```

### 2. Проверка работоспособности

```bash
# Health check
curl http://localhost/api/health

# Или через домен
curl https://yourdomain.com/api/health
```

Должен вернуться ответ:
```json
{"status":"ok","mongo":"connected","timestamp":"..."}
```

## 🔄 Обновление приложения

```bash
cd /opt/way-esports

# Остановка
docker-compose down

# Обновление кода
git pull

# Пересборка и запуск
docker-compose up -d --build
```

## 📊 Мониторинг и логи

```bash
# Просмотр всех логов
docker-compose logs -f

# Логи конкретного сервиса
docker-compose logs -f api
docker-compose logs -f web
docker-compose logs -f reverse-proxy

# Статистика использования ресурсов
docker stats
```

## 🔧 Полезные команды

```bash
# Перезапуск сервиса
docker-compose restart api

# Остановка всех сервисов
docker-compose down

# Остановка с удалением volumes (ОСТОРОЖНО: удалит данные!)
docker-compose down -v

# Просмотр конфигурации
docker-compose config

# Выполнение команды в контейнере
docker-compose exec api sh
docker-compose exec mongo mongosh
```

## 🐛 Решение проблем

### Проблема: Порт 80 уже занят

```bash
# Проверьте, что использует порт 80
sudo lsof -i :80

# Остановите nginx/apache если они запущены
sudo systemctl stop nginx
# или
sudo systemctl stop apache2
```

### Проблема: MongoDB не подключается

```bash
# Проверьте логи MongoDB
docker-compose logs mongo

# Проверьте подключение
docker-compose exec mongo mongosh
```

### Проблема: Frontend не может подключиться к API

1. Проверьте `VITE_API_URL` в `.env` - должен быть `/api` для относительного пути
2. Проверьте nginx конфигурацию - путь `/api/` должен проксироваться на backend
3. Проверьте логи reverse-proxy: `docker-compose logs reverse-proxy`

### Проблема: CORS ошибки

Убедитесь, что в `.env` файле:
```env
CORS_ORIGIN=*
# или
CORS_ORIGIN=https://yourdomain.com
```

## 🔒 Безопасность

### Рекомендации:

1. **Используйте HTTPS** - настройте SSL сертификаты
2. **Измените JWT_SECRET** - используйте длинный случайный ключ
3. **Ограничьте доступ к MongoDB** - не открывайте порт 27017 наружу
4. **Настройте firewall**:
   ```bash
   sudo ufw allow 22/tcp
   sudo ufw allow 80/tcp
   sudo ufw allow 443/tcp
   sudo ufw enable
   ```
5. **Регулярно обновляйте** зависимости и систему
6. **Делайте бэкапы** базы данных

### Бэкап MongoDB:

```bash
# Создание бэкапа
docker-compose exec mongo mongodump --out /data/backup

# Восстановление
docker-compose exec mongo mongorestore /data/backup
```

## 📝 Настройка Telegram Mini App

1. Откройте [@BotFather](https://t.me/botfather)
2. Отправьте `/newapp` и выберите вашего бота
3. Укажите URL: `https://yourdomain.com`
4. Загрузите иконку приложения

## ✅ Чеклист деплоя

- [ ] Docker и Docker Compose установлены
- [ ] Проект склонирован на сервер
- [ ] `.env` файл создан и настроен
- [ ] `VITE_API_URL=/api` (относительный путь)
- [ ] Домен настроен и указывает на сервер
- [ ] Nginx настроен (если используете внешний)
- [ ] SSL сертификаты получены (для HTTPS)
- [ ] Docker Compose запущен
- [ ] Health check работает: `curl https://yourdomain.com/api/health`
- [ ] Frontend доступен: `https://yourdomain.com`
- [ ] Telegram Mini App настроен в BotFather
- [ ] Аутентификация работает в Telegram

## 🎉 Готово!

После выполнения всех шагов ваше приложение будет доступно по адресу `https://yourdomain.com` и готово к работе в Telegram Mini App!

---

**Примечание**: Если у вас возникают проблемы, проверьте логи:
```bash
docker-compose logs -f
```

