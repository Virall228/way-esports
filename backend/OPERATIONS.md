# Operations Checklist

## 1) Idempotency
- Send `X-Idempotency-Key` for write APIs:
  - `POST /api/teams/create`
  - `POST /api/teams/join`
  - `POST /api/auth/register`
  - `POST /api/auth/email/register`
  - `POST /api/auth/email/request-otp`
  - `POST /api/auth/email/verify-otp`
  - `POST /api/admin/users`
  - `POST /api/admin/users/:id/wallet/adjust`
  - `PATCH /api/admin/wallet/transactions/:userId/:transactionId`
  - `POST /api/tasks/bulk-register`

## 2) Queue
- Redis-backed queue endpoints (admin):
  - `POST /api/tasks/bulk-register`
  - `GET /api/tasks/stats`

## 3) Pagination
- Admin endpoints now support `?page=1&limit=25`:
  - `GET /api/admin/users`
  - `GET /api/admin/teams`
  - `GET /api/admin/contacts`
  - `GET /api/admin/wallet/transactions`
  - `GET /api/admin/audit`

## 4) Audit Log
- All admin write operations are logged in `AuditLog`.
- View logs:
  - `GET /api/admin/audit?page=1&limit=50`

## 5) Monitoring & Alerts
- Health:
  - `GET /api/health`
  - `GET /api/health/live`
  - `GET /api/health/ready`
- Metrics:
  - `GET /api/metrics`
  - Optional header: `X-Metrics-Key` when `METRICS_API_KEY` is set.
- Alert env vars:
  - `ALERT_ERROR_RATE_PERCENT` (default `5`)
  - `ALERT_EVENT_LOOP_LAG_MS` (default `300`)
  - `MONITORING_INTERVAL_MS` (default `60000`)

## 6) Load Test
- Run:
```bash
node scripts/load-test.js --url=http://localhost:3000/api/health --concurrency=50 --duration=30
```

## 7) Backups
- App-level JSON snapshots:
```bash
npm run backup:db
```
- Native Mongo dump:
```bash
MONGO_URI="mongodb://..." ./scripts/backup-mongo.sh
```

