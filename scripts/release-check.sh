#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${1:-https://wayesports.org}"
ADMIN_TOKEN="${2:-}"

echo "== System smoke =="
bash scripts/smoke-system.sh "${BASE_URL}"

if [[ -n "${ADMIN_TOKEN}" ]]; then
  echo "== Admin smoke =="
  bash scripts/smoke-admin.sh "${BASE_URL}" "${ADMIN_TOKEN}"
else
  echo "Admin smoke skipped (no token provided)."
fi

echo "Release check passed."
