#!/bin/sh

# Check for prod flag
if [ "$1" = "prod" ]; then
  COMPOSE_FILE="-f docker-compose.prod.yml"
  echo "Running in production mode"
else
  COMPOSE_FILE="-f docker-compose.yml"
  echo "Running in development mode"
fi

echo "Step 1: Pull latest changes from git repository"
git pull

echo "Step 2: Remove old Dockerfiles if they exist (keeping current structure)"
if [ -f ./Dockerfile ]; then
  echo "Removing old root Dockerfile"
  rm ./Dockerfile
fi

echo "Step 3: Prune dangling Docker images and unused data"
docker image prune -f
docker system prune -f

echo "Step 4: Build Docker images without cache and pull latest base images"
docker compose build --no-cache --pull

echo "Step 5: Start containers in detached mode"
docker compose $COMPOSE_FILE up -d

echo "Done. Check status with: docker compose $COMPOSE_FILE ps"
