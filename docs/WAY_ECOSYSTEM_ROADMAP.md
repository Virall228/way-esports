# WAY Esports Ecosystem Roadmap

## Scope
This document translates the "full-stack ecosystem" prompt into a production-safe implementation path.

## Target Stack
- Web: Next.js 14 + Tailwind + Framer Motion
- API: Node.js services (gradual migration from current Express app)
- DB: PostgreSQL + Prisma
- Cache/queue: Redis
- Realtime: Socket.io
- TMA/Bot: Telegram WebApp auth + inline cards

## Current Delivery (implemented in this iteration)
- Backend intelligence primitives:
  - Elo engine: `backend/src/services/eloEngine.ts`
  - Bracket engine (single/double): `backend/src/services/tournamentBracketEngine.ts`
  - Analytics normalization (0..100): `backend/src/services/analyticsScoringEngine.ts`
- Intelligence API:
  - `POST /api/intelligence/elo/calculate`
  - `POST /api/intelligence/analytics/normalize`
  - `POST /api/intelligence/tournaments/bracket/generate`
  - `POST /api/intelligence/compare/win-probability`
  - Route file: `backend/src/routes/intelligence.ts`
- Server integration:
  - `backend/src/server.ts` mounts `/api/intelligence`
- PostgreSQL schema baseline:
  - `db/postgres/schema.sql`

## Not completed in this iteration
- No full migration from MongoDB to PostgreSQL/Prisma yet.
- No Next.js 14 frontend migration yet (current frontend kept stable).
- No Telegram inline image generator service yet.
- No socket-based rank stream yet.

## Migration Plan (no downtime)
1. **Dual-data phase**
   - Keep Mongo as source of truth, introduce PostgreSQL mirror tables.
   - Add ETL jobs for `users`, `teams`, `matches`, `analytics`.
2. **Dual-write phase**
   - Write new match analytics and ranking events to both stores.
3. **Read switch**
   - Switch ranking/analytics read paths to PostgreSQL.
4. **Prisma adoption**
   - Add Prisma models + typed repositories for read/write services.
5. **Decommission**
   - Remove Mongo ranking/analytics dependencies after parity checks.

## Scaling and Security Baseline
- Existing API rate limiting remains active.
- Redis remains mandatory for queues/cache paths.
- Intelligence endpoints are stateless and horizontally scalable.

## Next build step
- Add Prisma project in `db/prisma/` and implement first repository for `users` + `analytics`.

