#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${1:-https://wayesports.duckdns.org}"

check() {
  local name="$1"
  local path="$2"
  local code
  code="$(curl -sS -o /dev/null -w "%{http_code}" "${BASE_URL}${path}" || true)"
  if [[ "$code" == "200" ]]; then
    echo "[OK]   ${name} -> ${code} ${path}"
  else
    echo "[FAIL] ${name} -> ${code} ${path}"
    return 1
  fi
}

check "API Health" "/api/health"
check "Tournaments" "/api/tournaments"
check "Rankings" "/api/rankings/leaderboard"
check "Intelligence Readiness" "/api/intelligence/readiness"
check "News" "/api/news"
check "Telegram Bot Health" "/telegram/health"

echo "System smoke passed."
