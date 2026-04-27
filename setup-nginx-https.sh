#!/bin/bash

# Скрипт автоматической настройки Nginx и HTTPS для wayesports.space
# Запуск: sudo bash setup-nginx-https.sh

set -e

DOMAIN="wayesports.space"
EMAIL="your-email@example.com"  # ЗАМЕНИТЕ на ваш email!

echo "🚀 Настройка Nginx и HTTPS для $DOMAIN"
echo "=========================================="

# Шаг 1: Установка Nginx
echo ""
echo "📦 Шаг 1: Установка Nginx..."
sudo apt update
sudo apt install -y nginx

# Шаг 2: Установка Certbot
echo ""
echo "📦 Шаг 2: Установка Certbot..."
sudo apt install -y certbot python3-certbot-nginx

# Шаг 3: Создание директории для ACME challenge
echo ""
echo "📁 Шаг 3: Создание директорий..."
sudo mkdir -p /var/www/certbot
sudo chmod -R 755 /var/www/certbot

# Шаг 4: Копирование конфигурации
echo ""
echo "📋 Шаг 4: Копирование конфигурации Nginx..."
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
sudo cp "$PROJECT_DIR/nginx/wayesports.space.conf" "/etc/nginx/sites-available/$DOMAIN"

# Шаг 5: Активация конфигурации
echo ""
echo "🔗 Шаг 5: Активация конфигурации..."
sudo ln -sf "/etc/nginx/sites-available/$DOMAIN" "/etc/nginx/sites-enabled/"

# Удаление дефолтной конфигурации (если существует)
if [ -f /etc/nginx/sites-enabled/default ]; then
    echo "   Удаление дефолтной конфигурации..."
    sudo rm /etc/nginx/sites-enabled/default
fi

# Проверка синтаксиса
echo ""
echo "✅ Проверка синтаксиса Nginx..."
sudo nginx -t

# Перезагрузка Nginx
echo ""
echo "🔄 Перезагрузка Nginx..."
sudo systemctl reload nginx

# Шаг 6: Получение SSL сертификата
echo ""
echo "🔒 Шаг 6: Получение SSL сертификата..."
echo "   ВАЖНО: Убедитесь, что домен $DOMAIN указывает на IP сервера!"
read -p "   Продолжить получение сертификата? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    sudo certbot --nginx -d "$DOMAIN" --non-interactive --agree-tos --email "$EMAIL" --redirect
else
    echo "   Пропущено. Запустите вручную:"
    echo "   sudo certbot --nginx -d $DOMAIN"
fi

# Шаг 7: Проверка автообновления
echo ""
echo "🔄 Шаг 7: Проверка автоматического обновления сертификата..."
sudo systemctl enable certbot.timer
sudo systemctl start certbot.timer

# Тестовый запуск обновления
echo ""
echo "🧪 Тестовый запуск обновления сертификата (dry-run)..."
sudo certbot renew --dry-run

# Финальная проверка
echo ""
echo "✅ Финальная проверка..."
echo ""
echo "Статус Nginx:"
sudo systemctl status nginx --no-pager -l

echo ""
echo "Статус Certbot таймера:"
sudo systemctl status certbot.timer --no-pager -l

echo ""
echo "=========================================="
echo "🎉 Настройка завершена!"
echo ""
echo "Проверьте работу:"
echo "  - HTTP:  curl -I http://$DOMAIN"
echo "  - HTTPS: curl -I https://$DOMAIN"
echo "  - API:   curl https://$DOMAIN/api/health"
echo ""
echo "Настройте Telegram Mini App в BotFather:"
echo "  URL: https://$DOMAIN"
echo ""

