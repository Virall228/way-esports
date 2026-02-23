-- WAY ESPORTS PostgreSQL baseline schema
-- aligned with architectural prompt and designed for Prisma mapping

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY,
  telegram_id BIGINT UNIQUE,
  username VARCHAR(64) NOT NULL,
  rank_points INTEGER NOT NULL DEFAULT 1000,
  win_streak INTEGER NOT NULL DEFAULT 0,
  current_rank_role VARCHAR(32) NOT NULL DEFAULT 'Rookie',
  last_active TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_rank_points ON users(rank_points DESC);
CREATE INDEX IF NOT EXISTS idx_users_last_active ON users(last_active DESC);

CREATE TABLE IF NOT EXISTS teams (
  id UUID PRIMARY KEY,
  name VARCHAR(120) NOT NULL UNIQUE,
  leader_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  team_points INTEGER NOT NULL DEFAULT 0,
  streak_days_record INTEGER NOT NULL DEFAULT 0,
  rank_color VARCHAR(16) NOT NULL DEFAULT '#FF6B00',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_teams_points ON teams(team_points DESC);

CREATE TABLE IF NOT EXISTS matches (
  id UUID PRIMARY KEY,
  match_type VARCHAR(16) NOT NULL CHECK (match_type IN ('1v1', '5v5')),
  outcome JSONB NOT NULL,
  stats_json JSONB NOT NULL,
  started_at TIMESTAMPTZ,
  finished_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS match_participants (
  id BIGSERIAL PRIMARY KEY,
  match_id UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  team_id UUID REFERENCES teams(id) ON DELETE SET NULL,
  side VARCHAR(8) NOT NULL CHECK (side IN ('left', 'right')),
  result VARCHAR(8) NOT NULL CHECK (result IN ('win', 'loss', 'draw')),
  UNIQUE(match_id, user_id),
  UNIQUE(match_id, team_id, side)
);

CREATE TABLE IF NOT EXISTS analytics (
  id BIGSERIAL PRIMARY KEY,
  player_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  match_id UUID REFERENCES matches(id) ON DELETE SET NULL,
  aim_score SMALLINT NOT NULL CHECK (aim_score BETWEEN 0 AND 100),
  tactical_score SMALLINT NOT NULL CHECK (tactical_score BETWEEN 0 AND 100),
  survival_score SMALLINT NOT NULL CHECK (survival_score BETWEEN 0 AND 100),
  utility_score SMALLINT NOT NULL CHECK (utility_score BETWEEN 0 AND 100),
  clutch_score SMALLINT NOT NULL CHECK (clutch_score BETWEEN 0 AND 100),
  overall_score SMALLINT NOT NULL CHECK (overall_score BETWEEN 0 AND 100),
  ai_style_match JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_analytics_player_created ON analytics(player_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_analytics_overall ON analytics(overall_score DESC);

CREATE TABLE IF NOT EXISTS hall_of_fame (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  consecutive_days_rank1 INTEGER NOT NULL DEFAULT 0,
  first_rank1_at TIMESTAMPTZ,
  last_rank1_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id)
);

