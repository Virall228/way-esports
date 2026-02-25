# WAY Esports Ecosystem Roadmap

## Scope
This document translates the "full-stack ecosystem" prompt into a production-safe implementation path.

## Target Stack (current chosen direction)
- Web: React + Vite (current production client)
- API: Node.js + Express
- DB: MongoDB (primary source of truth)
- Cache/queue: Redis
- Realtime: SSE (rank updates, admin streams), optional Socket.io later
- TMA/Bot: Telegram WebApp auth + bot/webhook integration

## Current Delivery (implemented)
- Backend intelligence primitives:
  - Points rating engine: `backend/src/services/eloEngine.ts`
  - Bracket engine (single/double): `backend/src/services/tournamentBracketEngine.ts`
  - Analytics normalization (0..100): `backend/src/services/analyticsScoringEngine.ts`
- Intelligence API:
  - `POST /api/intelligence/points/calculate` (primary)
  - `POST /api/intelligence/elo/calculate` (legacy alias)
  - `POST /api/intelligence/analytics/normalize`
  - `POST /api/intelligence/tournaments/bracket/generate`
  - `POST /api/intelligence/compare/win-probability`
  - Route file: `backend/src/routes/intelligence.ts`
- Server integration:
  - `backend/src/server.ts` mounts `/api/intelligence`
- Ops/runbook + smoke checks:
  - `docs/OPERATIONS_RUNBOOK.md`
  - `scripts/smoke-system.ps1`, `scripts/smoke-admin.ps1`

## Not completed yet
- No Telegram inline image generator service yet.
- No dedicated Socket.io channel yet (SSE is used now).
- No automated replay/event ingestion pipeline yet (manual/admin + API events only).

## Mongo-first scaling plan (no DB migration required)
1. Add compound indexes for high-traffic collections (`matches`, `support_messages`, `audit_logs`, `match_events`).
2. Split heavy admin queries into summary + detail endpoints with pagination.
3. Keep SSE channels isolated by domain (`ops`, `support`, `rank`, `tournaments`).
4. Introduce background workers for expensive analytics/scouting refresh jobs.
5. Add periodic archive/TTL strategy for old logs/events.

## Scaling and Security Baseline
- Existing API rate limiting remains active.
- Redis remains mandatory for queues/cache paths.
- Intelligence endpoints are stateless and horizontally scalable.

## Next build step
- Finish admin tournament operations module:
  - centralized participant approval queue
  - match-room lifecycle controls
  - payout + withdrawal audit flow in one panel
