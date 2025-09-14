#!/bin/bash

set -e

echo "Pulling latest code..."
cd /path/to/your/project || exit 1
git pull origin main

echo "Building and restarting containers..."
docker-compose -f docker-compose.prod.yml down
docker-compose -f docker-compose.prod.yml up --build -d

echo "Checking container status..."
docker-compose -f docker-compose.prod.yml ps

echo "Deployment completed successfully."
