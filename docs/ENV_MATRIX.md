# Environment Matrix (Prod)

## Core
- `NODE_ENV=production`
- `MONGODB_URI`
- `JWT_SECRET`
- `CORS_ORIGIN`
- `REDIS_URL`

## Frontend
- `VITE_API_URL=/api`
- `VITE_GOOGLE_CLIENT_ID` (optional)
- `VITE_APPLE_CLIENT_ID` (optional)
- `VITE_APPLE_REDIRECT_URI` (optional)

## AI
- `AI_SCOUT_PROVIDER=gemini|openai|none`
- `SUPPORT_AI_PROVIDER=gemini|openai|none`
- `GEMINI_API_KEY` (if gemini enabled)
- `OPENAI_API_KEY` (if openai enabled)
- `OPENAI_SCOUT_MODEL` (optional)
- `OPENAI_SUPPORT_MODEL` (optional)

## Telegram Bot
- `TELEGRAM_BOT_TOKEN`
- `TELEGRAM_BOT_USERNAME`
- `API_BASE_URL=https://wayesports.duckdns.org`
- `WEBAPP_URL=https://wayesports.duckdns.org`
- `BOT_USE_WEBHOOK=true|false`
- `BOT_WEBHOOK_PUBLIC_URL=https://wayesports.duckdns.org` (required when webhook=true)
- `BOT_WEBHOOK_PATH=/telegram/webhook`
- `BOT_WEBHOOK_SECRET` (recommended)
- `BOT_POLL_TIMEOUT_SEC=30`

## Admin Safety
- `BOOTSTRAP_ADMIN_TELEGRAM_ID`
- `BOOTSTRAP_ADMIN_EMAIL`
- `PRIMARY_ADMIN_ONLY=true|false`

## Billing
- `SUBSCRIPTION_USDT_TRC20_ADDRESS`
- `VITE_SUBSCRIPTION_USDT_TRC20_ADDRESS`
- `STRIPE_SECRET_KEY` (optional)
- `STRIPE_WEBHOOK_SECRET` (optional)

## Readiness / Jobs
- `HALL_OF_FAME_CRON_TOKEN`
- `MONITORING_INTERVAL_MS`
- `ALERT_ERROR_RATE_PERCENT`
- `ALERT_EVENT_LOOP_LAG_MS`

## Webhook Routing
`nginx/reverse-proxy.conf` routes:
- `POST /telegram/webhook` -> `bot:8080`
- `GET /telegram/health` -> `bot:8080/health`

## Fast Verification
```bash
curl -i https://wayesports.duckdns.org/api/health
curl -i https://wayesports.duckdns.org/api/intelligence/readiness
curl -i https://wayesports.duckdns.org/telegram/health
```
