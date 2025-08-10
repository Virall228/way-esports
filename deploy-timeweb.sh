#!/bin/bash

# WAY Esports - Timeweb Cloud Deployment Script
# Автоматический деплой всех компонентов

set -e

echo "🚀 WAY Esports - Timeweb Cloud Deployment"
echo "=========================================="

# Цвета для вывода
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Функция для вывода сообщений
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

warn() {
    echo -e "${YELLOW}[WARNING] $1${NC}"
}

error() {
    echo -e "${RED}[ERROR] $1${NC}"
    exit 1
}

# Проверка наличия Docker
check_docker() {
    log "Проверка Docker..."
    if ! command -v docker &> /dev/null; then
        error "Docker не установлен. Установите Docker и повторите попытку."
    fi
    
    if ! command -v docker-compose &> /dev/null; then
        error "Docker Compose не установлен. Установите Docker Compose и повторите попытку."
    fi
    
    log "Docker и Docker Compose найдены ✅"
}

# Проверка .env файла
check_env() {
    log "Проверка переменных окружения..."
    if [ ! -f ".env" ]; then
        warn ".env файл не найден. Создаю из шаблона..."
        cp .env.production .env
        warn "Отредактируйте .env файл и запустите скрипт снова."
        exit 1
    fi
    
    # Проверка обязательных переменных
    source .env
    
    if [ -z "$MONGODB_URI" ]; then
        error "MONGODB_URI не установлен в .env файле"
    fi
    
    if [ -z "$JWT_SECRET" ] || [ ${#JWT_SECRET} -lt 32 ]; then
        error "JWT_SECRET должен быть установлен и содержать минимум 32 символа"
    fi
    
    if [ -z "$BOT_TOKEN" ]; then
        error "BOT_TOKEN не установлен в .env файле"
    fi
    
    log "Переменные окружения проверены ✅"
}

# Остановка существующих контейнеров
stop_containers() {
    log "Остановка существующих контейнеров..."
    docker-compose -f docker-compose.prod.yml down --remove-orphans || true
    log "Контейнеры остановлены ✅"
}

# Очистка старых образов
cleanup_images() {
    log "Очистка старых Docker образов..."
    docker system prune -f || true
    log "Очистка завершена ✅"
}

# Сборка образов
build_images() {
    log "Сборка Docker образов..."
    
    log "Сборка Frontend..."
    docker-compose -f docker-compose.prod.yml build frontend
    
    log "Сборка Backend..."
    docker-compose -f docker-compose.prod.yml build backend
    
    log "Сборка Bot..."
    docker-compose -f docker-compose.prod.yml build bot
    
    log "Все образы собраны ✅"
}

# Запуск контейнеров
start_containers() {
    log "Запуск контейнеров..."
    docker-compose -f docker-compose.prod.yml up -d
    log "Контейнеры запущены ✅"
}

# Проверка здоровья сервисов
check_health() {
    log "Проверка здоровья сервисов..."
    
    # Ждем запуска сервисов
    sleep 30
    
    # Проверка Backend
    log "Проверка Backend..."
    for i in {1..10}; do
        if curl -f http://localhost:3001/health &>/dev/null; then
            log "Backend работает ✅"
            break
        fi
        if [ $i -eq 10 ]; then
            error "Backend не отвечает после 10 попыток"
        fi
        sleep 5
    done
    
    # Проверка Bot
    log "Проверка Bot..."
    for i in {1..10}; do
        if curl -f http://localhost:3002/health &>/dev/null; then
            log "Bot работает ✅"
            break
        fi
        if [ $i -eq 10 ]; then
            error "Bot не отвечает после 10 попыток"
        fi
        sleep 5
    done
    
    # Проверка Frontend
    log "Проверка Frontend..."
    for i in {1..10}; do
        if curl -f http://localhost/health &>/dev/null; then
            log "Frontend работает ✅"
            break
        fi
        if [ $i -eq 10 ]; then
            error "Frontend не отвечает после 10 попыток"
        fi
        sleep 5
    done
}

# Настройка Telegram webhook
setup_webhook() {
    log "Настройка Telegram webhook..."
    
    source .env
    
    if [ -n "$WEBHOOK_URL" ] && [ -n "$BOT_TOKEN" ]; then
        WEBHOOK_RESPONSE=$(curl -s -X POST "https://api.telegram.org/bot${BOT_TOKEN}/setWebhook" \
            -H "Content-Type: application/json" \
            -d "{\"url\": \"${WEBHOOK_URL}\"}")
        
        if echo "$WEBHOOK_RESPONSE" | grep -q '"ok":true'; then
            log "Webhook настроен успешно ✅"
        else
            warn "Ошибка настройки webhook: $WEBHOOK_RESPONSE"
        fi
    else
        warn "WEBHOOK_URL или BOT_TOKEN не установлены, пропускаем настройку webhook"
    fi
}

# Показать статус сервисов
show_status() {
    log "Статус сервисов:"
    echo ""
    docker-compose -f docker-compose.prod.yml ps
    echo ""
    
    log "Использование ресурсов:"
    docker stats --no-stream
    echo ""
    
    source .env
    log "Приложение доступно по адресам:"
    echo "🌐 Frontend: http://localhost"
    echo "🔧 Backend API: http://localhost:3001"
    echo "🤖 Bot: http://localhost:3002"
    if [ -n "$DOMAIN" ]; then
        echo "🌍 Production: https://$DOMAIN"
    fi
}

# Основная функция
main() {
    log "Начинаем деплой WAY Esports на Timeweb Cloud..."
    
    check_docker
    check_env
    stop_containers
    cleanup_images
    build_images
    start_containers
    check_health
    setup_webhook
    show_status
    
    log "🎉 Деплой завершен успешно!"
    log "Проверьте работу приложения по указанным адресам выше."
}

# Обработка аргументов командной строки
case "${1:-}" in
    "stop")
        log "Остановка всех сервисов..."
        docker-compose -f docker-compose.prod.yml down
        log "Все сервисы остановлены ✅"
        ;;
    "restart")
        log "Перезапуск всех сервисов..."
        docker-compose -f docker-compose.prod.yml restart
        log "Все сервисы перезапущены ✅"
        ;;
    "logs")
        log "Просмотр логов всех сервисов..."
        docker-compose -f docker-compose.prod.yml logs -f
        ;;
    "status")
        show_status
        ;;
    "update")
        log "Обновление приложения..."
        git pull
        main
        ;;
    "clean")
        log "Полная очистка..."
        docker-compose -f docker-compose.prod.yml down -v --remove-orphans
        docker system prune -a -f
        log "Очистка завершена ✅"
        ;;
    *)
        main
        ;;
esac