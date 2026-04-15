#!/usr/bin/env sh
set -eu

BASE_URL="${BASE_URL:-https://wayesports.org}"
TOKEN="${HALL_OF_FAME_CRON_TOKEN:-}"

if [ -z "$TOKEN" ]; then
  echo "HALL_OF_FAME_CRON_TOKEN is required"
  exit 1
fi

curl -fsS -X POST "$BASE_URL/api/intelligence/hall-of-fame/cron" \
  -H "x-cron-token: $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{}'

echo "Hall of Fame cron update finished"
