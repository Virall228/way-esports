# Player Promotion Architecture

## Goal

Create a subscriber-only player growth and promotion module that:

- unlocks advanced history and scouting visibility for paid users
- generates structured recommendations from internal match and profile data
- exposes public scout pages and leaderboard entries for search traffic

## Backend

### Data model

`PlayerPromotionProfile`

- `user`: owner of the promotion profile
- `slug`: public SEO-safe route fragment
- `enabled`: whether the player is promoted in scout/public surfaces
- `visibility`: `private | scouts | public`
- `headline`, `scoutPitch`: public promo copy
- `targetGames`, `targetRoles`, `targetTeams`: scouting targets
- `focus`: `balanced | ranked | tournament | trial`
- `adminUnlocked`: manual admin override for publication access
- `seoTitle`, `seoDescription`, `seoKeywords`: public metadata
- cached snapshot fields: `lastLeaderboardScore`, `lastBestGame`, `lastBestRole`

### Computation layer

`playerPromotionService`

- reuses `User`, `UserStats`, `Team`, `Tournament`
- computes leaderboard score, best game and role, momentum, team fit and training recommendations
- builds SEO metadata and structured data for public player pages

### Routes

Private routes:

- `GET /api/player-promotion/me`
- `PATCH /api/player-promotion/me`
- `POST /api/player-promotion/me/refresh`

Public routes:

- `GET /api/player-promotion/public/leaderboard`
- `GET /api/player-promotion/public/search`
- `GET /api/player-promotion/public/seo-index`
- `GET /api/player-promotion/public/sitemap.xml`
- `GET /sitemap-player-promotion.xml`
- `GET /api/player-promotion/public/players/:identifier`

Admin routes:

- `GET /api/admin/player-promotion/profiles`
- `PATCH /api/admin/player-promotion/profiles/:id`
- `POST /api/admin/player-promotion/profiles/:id/refresh`
- `POST /api/admin/player-promotion/profiles/bulk-update`
- `POST /api/admin/player-promotion/profiles/bulk-refresh`

## Frontend

Private page:

- `/scout-hub`
  - subscription gate state
  - settings editor
  - computed scout dashboard
  - leaderboard preview

Public page:

- `/scouts/:identifier`
  - public scout profile for search and manual sharing
  - client-side SEO title/description injection
  - leaderboard score, momentum, role/game fit, recommendations and timeline

## Suggested next steps

1. Add SSR or prerendering for `/scouts/:identifier`
2. Add exact hero, agent or operator telemetry to replace archetype inference with character-level recommendations
3. Generate sitemap files from `seo-index`
