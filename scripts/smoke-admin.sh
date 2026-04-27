#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${1:-https://wayesports.space}"
TOKEN="${2:-}"

if [[ -z "${TOKEN}" ]]; then
  echo "Usage: $0 <base_url> <admin_jwt>"
  exit 1
fi

check_admin() {
  local name="$1"
  local path="$2"
  local code
  code="$(curl -sS -o /dev/null -w "%{http_code}" -H "Authorization: Bearer ${TOKEN}" "${BASE_URL}${path}" || true)"
  if [[ "$code" == "200" ]]; then
    echo "[OK]   ${name} -> ${code} ${path}"
  else
    echo "[FAIL] ${name} -> ${code} ${path}"
    return 1
  fi
}

check_admin "Admin Stats" "/api/admin/stats"
check_admin "Ops Metrics" "/api/admin/ops/metrics"
check_admin "Ops Queue" "/api/admin/ops/queue"
check_admin "Ops Backups" "/api/admin/ops/backups"
check_admin "Ops Audit Timeline" "/api/admin/ops/audit-timeline?hours=24&bucketMinutes=60"
check_admin "Ops Top Errors" "/api/admin/ops/errors-top?hours=24&limit=5"

echo "Admin smoke passed."
