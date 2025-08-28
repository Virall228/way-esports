# 🚀 Инструкция по деплою WAY Esports (без SSH)

## 📋 Что нужно сделать

### 1. В GitHub Secrets добавить:
- `GHCR_USERNAME` - ваш GitHub username
- `GHCR_TOKEN` - Personal Access Token

### 2. На сервере:
```bash
# Создать директорию
mkdir -p /opt/way-esports
cd /opt/way-esports

# Скопировать docker-compose.prod.yml
# Войти в GHCR
docker login ghcr.io -u YOUR_USERNAME -p YOUR_TOKEN

# Запустить
docker compose -f docker-compose.prod.yml up -d
```

## 🔑 Откуда взять переменные

### GHCR_USERNAME
Это ваш **GitHub username** (например: `Virall228`)

### GHCR_TOKEN (Personal Access Token)
1. **GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)**
2. **Generate new token (classic)**
3. **Выбрать права:**
   - ✅ `write:packages` - пушить образы
   - ✅ `read:packages` - читать образы
   - ✅ `delete:packages` - удалять образы (опционально)
4. **Скопировать токен** (он показывается только один раз!)

## 🐳 Как работает

1. **GitHub Actions** собирает Docker образ при push в main
2. **Пушит в GHCR** с тегом `:latest`
3. **Watchtower** каждые 60 сек проверяет обновления
4. **Автоматически** обновляет контейнер приложения

## ✅ Проверка работы

```bash
# Статус контейнеров
docker compose -f docker-compose.prod.yml ps

# Логи приложения
docker logs way-esports-app

# Логи Watchtower
docker logs way-esports-watchtower

# Проверка API
curl -I http://localhost:3001/health
curl -I http://localhost:3000
```

## 🔄 Откат

```bash
# На предыдущую версию
docker compose -f docker-compose.prod.yml down
docker pull ghcr.io/Virall228/WAY-Esports:prev
docker compose -f docker-compose.prod.yml up -d
```

## 🧹 Очистка

```bash
# Очистить неиспользуемые образы
docker system prune -f

# Очистить volumes (осторожно!)
docker volume prune -f
```
