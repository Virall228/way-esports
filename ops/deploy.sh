#!/bin/bash

set -e

PROJECT_DIR="/opt/way-esports"
COMPOSE_FILE="$PROJECT_DIR/docker-compose.prod.yml"

echo "Starting deployment..."

cd "$PROJECT_DIR"

echo "Building images..."
docker compose -f "$COMPOSE_FILE" build --pull

echo "Starting services..."
docker compose -f "$COMPOSE_FILE" up -d --remove-orphans

echo "Checking status..."
docker compose -f "$COMPOSE_FILE" ps

echo "Deployment completed successfully."

# Optional: Show logs if there are errors
if ! docker compose -f "$COMPOSE_FILE" ps | grep -q "Up"; then
    echo "Some services failed to start. Showing logs..."
    docker compose -f "$COMPOSE_FILE" logs --tail=50
    exit 1
fi
