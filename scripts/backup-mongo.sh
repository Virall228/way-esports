#!/usr/bin/env bash
set -euo pipefail

# Usage:
#   MONGO_URI="mongodb://..." ./scripts/backup-mongo.sh

MONGO_URI="${MONGO_URI:-${MONGODB_URI:-}}"
if [[ -z "${MONGO_URI}" ]]; then
  echo "MONGO_URI or MONGODB_URI is required"
  exit 1
fi

BACKUP_DIR="${BACKUP_DIR:-./backups/mongodump}"
RETENTION_DAYS="${RETENTION_DAYS:-7}"
STAMP="$(date -u +%Y%m%d_%H%M%S)"
DEST="${BACKUP_DIR}/snapshot_${STAMP}"

mkdir -p "${DEST}"

if ! command -v mongodump >/dev/null 2>&1; then
  echo "mongodump not found. Install MongoDB Database Tools first."
  exit 1
fi

echo "[backup] writing dump to ${DEST}"
mongodump --uri="${MONGO_URI}" --out="${DEST}"

find "${BACKUP_DIR}" -maxdepth 1 -type d -name "snapshot_*" -mtime +"${RETENTION_DAYS}" -print -exec rm -rf {} \;

echo "[backup] done"

