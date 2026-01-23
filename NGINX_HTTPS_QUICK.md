# ⚡ Быстрая настройка Nginx + HTTPS для wayesports.duckdns.org

## 📋 Готовые файлы

1. **Конфигурация Nginx**: `nginx/wayesports.duckdns.org.conf`
2. **Полная инструкция**: `SETUP_NGINX_HTTPS.md`
3. **Автоматический скрипт**: `setup-nginx-https.sh`

## 🚀 Быстрый старт (копируйте команды по порядку)

### 1. Установка Nginx и Certbot

```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y nginx certbot python3-certbot-nginx
```

### 2. Подготовка директорий

```bash
sudo mkdir -p /var/www/certbot
sudo chmod -R 755 /var/www/certbot
```

### 3. Копирование и активация конфигурации

```bash
# Перейдите в директорию проекта
cd /opt/way-esports  # или путь к вашему проекту

# Копирование конфигурации
sudo cp nginx/wayesports.duckdns.org.conf /etc/nginx/sites-available/wayesports.duckdns.org

# Активация
sudo ln -s /etc/nginx/sites-available/wayesports.duckdns.org /etc/nginx/sites-enabled/

# Удаление дефолтной конфигурации
sudo rm -f /etc/nginx/sites-enabled/default

# Проверка синтаксиса
sudo nginx -t

# Перезагрузка
sudo systemctl reload nginx
```

### 4. Получение SSL сертификата

```bash
# Замените your-email@example.com на ваш реальный email!
sudo certbot --nginx -d wayesports.duckdns.org --non-interactive --agree-tos --email your-email@example.com --redirect
```

### 5. Проверка автообновления

```bash
# Включение автоматического обновления
sudo systemctl enable certbot.timer
sudo systemctl start certbot.timer

# Проверка статуса
sudo systemctl status certbot.timer

# Тестовый запуск (dry-run)
sudo certbot renew --dry-run
```

### 6. Проверка работы

```bash
# Проверка HTTP редиректа
curl -I http://wayesports.duckdns.org

# Проверка HTTPS
curl -I https://wayesports.duckdns.org

# Проверка API
curl https://wayesports.duckdns.org/api/health
```

## 📁 Путь к конфигурации Nginx

**Файл конфигурации**: `/etc/nginx/sites-available/wayesports.duckdns.org`

## 🔧 Полезные команды

```bash
# Перезагрузка Nginx
sudo systemctl reload nginx

# Просмотр логов
sudo tail -f /var/log/nginx/wayesports-access.log
sudo tail -f /var/log/nginx/wayesports-error.log

# Проверка SSL сертификата
sudo certbot certificates

# Ручное обновление сертификата
sudo certbot renew
```

## ✅ Что настроено

- ✅ HTTP → HTTPS редирект
- ✅ SSL сертификат Let's Encrypt
- ✅ Автоматическое обновление сертификата
- ✅ Правильные заголовки для Telegram Mini App
- ✅ Проксирование на Docker (localhost:80)
- ✅ Безопасные заголовки (HSTS, X-Frame-Options и т.д.)

## 🎯 Настройка Telegram Mini App

1. Откройте [@BotFather](https://t.me/botfather)
2. `/newapp` → выберите бота
3. URL: `https://wayesports.duckdns.org`
4. Готово! 🎉

---

**Подробная инструкция**: см. `SETUP_NGINX_HTTPS.md`

