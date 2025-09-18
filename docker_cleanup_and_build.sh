#!/bin/sh

# Script to update repo, clean old Dockerfiles, and rebuild Docker images without cache

echo "Step 1: Pull latest changes from git repository"
git pull

echo "Step 2: Remove old Dockerfiles and old folders if they exist"
# Adjust paths below if needed
if [ -f ./Dockerfile ]; then
  echo "Removing old root Dockerfile"
  rm ./Dockerfile
fi

if [ -d ./way-esports ]; then
  echo "Removing old way-esports directory"
  rm -rf ./way-esports
fi

echo "Step 3: Prune dangling Docker images and unused data"
docker image prune -f
docker system prune -f

echo "Step 4: Build Docker images without cache and pull latest base images"
docker compose build --no-cache --pull

echo "Step 5: Start containers in detached mode"
docker compose up -d

echo "Done."
