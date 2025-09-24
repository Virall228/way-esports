#!/bin/sh

echo "Step 1: Pull latest changes from git repository"
git pull

echo "Step 2: Remove old Dockerfiles and old folders if they exist"
if [ -f ./Dockerfile ]; then
  echo "Removing old root Dockerfile"
  rm ./Dockerfile
fi

if [ -d ./way-esports ]; then
  echo "Removing old way-esports directory"
  rm -rf ./way-esports
fi

if [ -d ./way-esports-backend ]; then
  echo "Removing old way-esports-backend directory"
  rm -rf ./way-esports-backend
fi

if [ -d ./way-esports-fronted ]; then
  echo "Removing old way-esports-fronted directory"
  rm -rf ./way-esports-fronted
fi

if [ -d ./way-esports-frontend ]; then
  echo "Removing old way-esports-frontend directory"
  rm -rf ./way-esports-frontend
fi

echo "Step 3: Prune dangling Docker images and unused data"
docker image prune -f
docker system prune -f

echo "Step 4: Build Docker images without cache and pull latest base images"
docker compose build --no-cache --pull

echo "Step 5: Start containers in detached mode"
docker compose up -d

echo "Done."
