# 🔒 Настройка Nginx и HTTPS для wayesports.duckdns.org

Полная инструкция по настройке Nginx reverse proxy с SSL сертификатом для Telegram Mini App.

## 📋 Предварительные требования

- Ubuntu/Debian сервер с IP: 5.129.234.223
- Домен: wayesports.duckdns.org (уже настроен на DuckDNS)
- Docker и Docker Compose установлены
- Проект запущен в Docker на порту 80 (внутренний reverse-proxy)

## 🚀 Полная последовательность команд

### Шаг 1: Установка Nginx

```bash
# Обновление пакетов
sudo apt update && sudo apt upgrade -y

# Установка Nginx
sudo apt install nginx -y

# Проверка статуса
sudo systemctl status nginx
```

### Шаг 2: Установка Certbot

```bash
# Установка Certbot и плагина для Nginx
sudo apt install certbot python3-certbot-nginx -y

# Проверка установки
certbot --version
```

### Шаг 3: Подготовка директории для ACME challenge

```bash
# Создание директории для верификации Let's Encrypt
sudo mkdir -p /var/www/certbot
sudo chmod -R 755 /var/www/certbot
```

### Шаг 4: Копирование конфигурации Nginx

```bash
# Переход в директорию проекта (предполагается, что проект в /opt/way-esports)
cd /opt/way-esports

# Копирование конфигурации Nginx
sudo cp nginx/wayesports.duckdns.org.conf /etc/nginx/sites-available/wayesports.duckdns.org

# Проверка синтаксиса конфигурации
sudo nginx -t
```

### Шаг 5: Активация конфигурации

```bash
# Создание символьной ссылки для активации сайта
sudo ln -s /etc/nginx/sites-available/wayesports.duckdns.org /etc/nginx/sites-enabled/

# Удаление дефолтной конфигурации (опционально)
sudo rm /etc/nginx/sites-enabled/default

# Проверка синтаксиса еще раз
sudo nginx -t

# Перезагрузка Nginx
sudo systemctl reload nginx
```

### Шаг 6: Получение SSL сертификата через Certbot

```bash
# Получение SSL сертификата для DuckDNS домена
sudo certbot --nginx -d wayesports.duckdns.org --non-interactive --agree-tos --email your-email@example.com

# Или интерактивный режим (рекомендуется для первого раза)
sudo certbot --nginx -d wayesports.duckdns.org
```

**Примечание:** Замените `your-email@example.com` на ваш реальный email для уведомлений о продлении сертификата.

### Шаг 7: Проверка автоматического обновления сертификата

```bash
# Проверка статуса таймера автоматического обновления
sudo systemctl status certbot.timer

# Проверка, что таймер активен
sudo systemctl is-active certbot.timer

# Тестовый запуск обновления (dry-run)
sudo certbot renew --dry-run
```

### Шаг 8: Проверка работы

```bash
# Проверка статуса Nginx
sudo systemctl status nginx

# Проверка доступности через HTTPS
curl -I https://wayesports.duckdns.org

# Проверка API health endpoint
curl https://wayesports.duckdns.org/api/health
```

## 🔧 Дополнительные команды

### Просмотр логов Nginx

```bash
# Логи доступа
sudo tail -f /var/log/nginx/wayesports-access.log

# Логи ошибок
sudo tail -f /var/log/nginx/wayesports-error.log

# Все логи Nginx
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

### Перезапуск сервисов

```bash
# Перезагрузка конфигурации Nginx (без остановки)
sudo nginx -s reload

# Полный перезапуск Nginx
sudo systemctl restart nginx

# Перезапуск Docker Compose
cd /opt/way-esports
docker-compose restart
```

### Проверка портов

```bash
# Проверка, что порты 80 и 443 открыты
sudo netstat -tlnp | grep -E ':(80|443)'

# Или с помощью ss
sudo ss -tlnp | grep -E ':(80|443)'
```

### Настройка Firewall (если используется UFW)

```bash
# Разрешить HTTP и HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Проверка статуса
sudo ufw status
```

## 🔒 Проверка SSL сертификата

```bash
# Проверка информации о сертификате
echo | openssl s_client -servername wayesports.duckdns.org -connect wayesports.duckdns.org:443 2>/dev/null | openssl x509 -noout -dates

# Проверка через certbot
sudo certbot certificates
```

## 🐛 Решение проблем

### Проблема: Nginx не запускается

```bash
# Проверка синтаксиса
sudo nginx -t

# Просмотр ошибок
sudo journalctl -u nginx -n 50
```

### Проблема: Certbot не может получить сертификат

```bash
# Проверка, что домен доступен
ping wayesports.duckdns.org

# Проверка DNS
nslookup wayesports.duckdns.org

# Проверка, что порт 80 открыт
sudo netstat -tlnp | grep :80
```

### Проблема: 502 Bad Gateway

```bash
# Проверка, что Docker контейнеры запущены
cd /opt/way-esports
docker-compose ps

# Проверка логов Docker
docker-compose logs reverse-proxy

# Проверка, что внутренний reverse-proxy доступен
curl http://localhost:80/api/health
```

## ✅ Финальная проверка

После выполнения всех команд проверьте:

1. ✅ HTTP редиректит на HTTPS: `curl -I http://wayesports.duckdns.org`
2. ✅ HTTPS работает: `curl -I https://wayesports.duckdns.org`
3. ✅ API доступен: `curl https://wayesports.duckdns.org/api/health`
4. ✅ SSL сертификат валиден: откройте `https://wayesports.duckdns.org` в браузере
5. ✅ Telegram Mini App открывается: настройте в BotFather с URL `https://wayesports.duckdns.org`

## 📝 Настройка Telegram Mini App

1. Откройте [@BotFather](https://t.me/botfather) в Telegram
2. Отправьте `/newapp` и выберите вашего бота
3. Укажите URL: `https://wayesports.duckdns.org`
4. Загрузите иконку приложения
5. Готово! 🎉

## 🔄 Автоматическое обновление сертификата

Certbot автоматически настроит обновление сертификата. Проверьте:

```bash
# Проверка таймера
sudo systemctl status certbot.timer

# Ручной запуск обновления (если нужно)
sudo certbot renew
```

Сертификат Let's Encrypt действителен 90 дней и автоматически обновляется за 30 дней до истечения.

---

**Готово!** Ваш сервер настроен для работы через HTTPS с Telegram Mini App! 🚀

