#!/usr/bin/env bash
set -euo pipefail

require() { command -v "$1" >/dev/null 2>&1 || { echo "[ERROR] $1 is required"; exit 1; }; }

require docker
if ! docker compose version >/dev/null 2>&1; then
  echo "[ERROR] Docker Compose v2 is required (docker compose)."
  exit 1
fi

if [ ! -f .env ]; then
  if [ -f .env.example ]; then
    cp .env.example .env
    echo "[INFO] .env created from .env.example"
  else
    cat > .env <<'EOF'
NODE_ENV=production
PORT=3000
MONGODB_URI=mongodb://mongo:27017/way-esports
MONGO_INITDB_DATABASE=way-esports
JWT_SECRET=$(openssl rand -hex 32 2>/dev/null || echo change-me)
VITE_API_URL=http://localhost/api
WEB_URL=http://localhost/
API_URL=http://localhost/api
EOF
    echo "[INFO] .env created with defaults"
  fi
fi

make up

