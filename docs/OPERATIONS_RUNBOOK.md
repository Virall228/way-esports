# WAY Esports Operations Runbook

## 1) Startup Order
1. `mongo`
2. `redis`
3. `api`
4. `web`
5. `reverse-proxy`
6. `bot` (optional)

Command:
```bash
docker compose up -d --build
```

## 2) Critical Health Checks
- API: `GET /api/health`
- Web: `GET /`
- Ops stream: `GET /api/admin/ops/stream` (admin token required in frontend)
- Bot: `GET /health` on bot container

## 3) Incident Triage
### 502/Bad Gateway
1. Check `reverse-proxy` logs.
2. Check `api` health from proxy network.
3. Validate upstream hostnames (`api`, `web`) in nginx config.

### Login/Register errors
1. Check `/api/auth/*` logs.
2. Validate Mongo indexes and duplicate-key conflicts.
3. Check JWT and CORS env vars.

### Match rooms missing
1. Open Admin → Tournaments → `Prepare Missing Rooms`.
2. Review `Room Logs` in match row.
3. Check `Recent Match Operations` and `Ops` top errors.

## 4) Admin Ops Checklist
- Watch `Ops`:
  - Error rate
  - Event loop p95
  - Top 4xx/5xx endpoints
  - Error samples per endpoint
- Run backup after critical tournament changes.
- Export audit CSV daily.

## 5) Security Checklist
- Keep `JWT_SECRET`, `GEMINI_API_KEY`, `TELEGRAM_BOT_TOKEN` out of git.
- Rotate keys after leaks.
- Enable `PRIMARY_ADMIN_ONLY=true` for restricted admin mode.
- Use HTTPS only in production.
- Keep Redis private (no public port).

## 6) Release Smoke (minimum)
Use:
```bash
powershell -ExecutionPolicy Bypass -File scripts/smoke-system.ps1 -BaseUrl https://wayesports.org
```

Admin smoke (requires JWT admin token):
```bash
powershell -ExecutionPolicy Bypass -File scripts/smoke-admin.ps1 -BaseUrl https://wayesports.org -Token "<JWT>"
```

Unified release check (runs system smoke + optional admin smoke):
```bash
powershell -ExecutionPolicy Bypass -File scripts/release-check.ps1 -BaseUrl https://wayesports.org -AdminToken "<JWT>"
```

Linux/macOS equivalents:
```bash
bash scripts/smoke-system.sh https://wayesports.org
bash scripts/smoke-admin.sh https://wayesports.org "<JWT>"
bash scripts/release-check.sh https://wayesports.org "<JWT>"
```

Pass criteria:
- `/api/health` = 200
- `/api/tournaments` = 200
- `/api/rankings/leaderboard` = 200
- `/api/intelligence/readiness` = 200
