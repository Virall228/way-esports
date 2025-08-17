#!/bin/bash

# TineWeb Deployment Script
# Usage: ./deploy.sh [staging|production]

set -e

ENVIRONMENT=${1:-staging}
IMAGE_NAME="ghcr.io/${GITHUB_REPOSITORY:-tineweb/tineweb}"

echo "🚀 Starting deployment to $ENVIRONMENT..."

# Build and push Docker image
echo "📦 Building Docker image..."
docker build -t $IMAGE_NAME:latest .

echo "🔐 Logging into GitHub Container Registry..."
echo $GITHUB_TOKEN | docker login ghcr.io -u $GITHUB_ACTOR --password-stdin

echo "📤 Pushing image..."
docker push $IMAGE_NAME:latest

# Deploy based on environment
case $ENVIRONMENT in
  staging)
    echo "🧪 Deploying to staging..."
    # Add staging deployment commands
    ;;
  production)
    echo "🎯 Deploying to production..."
    # Add production deployment commands
    ;;
  *)
    echo "❌ Invalid environment. Use 'staging' or 'production'"
    exit 1
    ;;
esac

echo "✅ Deployment to $ENVIRONMENT completed successfully!"
