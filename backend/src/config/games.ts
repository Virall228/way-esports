export const SUPPORTED_GAMES = [
  'Critical Ops',
  'CS2',
  'PUBG Mobile',
  'Valorant Mobile',
  'Dota 2',
  'Standoff 2',
  'Mobile Legends: Bang Bang'
] as const;

export type SupportedGame = typeof SUPPORTED_GAMES[number];

type GameConfig = {
  label: SupportedGame;
  slug: string;
  aliases?: string[];
  queryAliases?: string[];
};

const GAME_CONFIGS: readonly GameConfig[] = [
  {
    label: 'Critical Ops',
    slug: 'critical-ops',
    aliases: ['criticalops']
  },
  {
    label: 'CS2',
    slug: 'cs2',
    aliases: ['counter-strike-2', 'counter strike 2']
  },
  {
    label: 'PUBG Mobile',
    slug: 'pubg-mobile',
    aliases: ['pubgmobile']
  },
  {
    label: 'Valorant Mobile',
    slug: 'valorant-mobile',
    aliases: ['valorantmobile', 'valorant'],
    queryAliases: ['Valorant']
  },
  {
    label: 'Dota 2',
    slug: 'dota-2',
    aliases: ['dota2']
  },
  {
    label: 'Standoff 2',
    slug: 'standoff-2',
    aliases: ['standoff2']
  },
  {
    label: 'Mobile Legends: Bang Bang',
    slug: 'mobile-legends-bang-bang',
    aliases: [
      'mobilelegendsbangbang',
      'mobile legends bang bang',
      'mobile-legends-bang-bang',
      'mobilelegends',
      'mobile legends',
      'mlbb'
    ],
    queryAliases: ['Mobile Legends Bang Bang', 'MLBB']
  }
] as const;

export const GAME_HUBS = GAME_CONFIGS.map(({ slug, label }) => ({
  slug,
  label,
  description:
    label === 'Critical Ops'
      ? 'Critical Ops tournaments, teams, news and public discovery pages on WAY Esports.'
      : label === 'CS2'
        ? 'CS2 tournament pages, teams, rankings-ready routes and esports news on WAY Esports.'
        : label === 'PUBG Mobile'
          ? 'PUBG Mobile events, teams and long-tail content hubs for search and social traffic.'
          : label === 'Valorant Mobile'
            ? 'Valorant Mobile tournaments, team profiles and performance discovery on WAY Esports.'
            : label === 'Dota 2'
              ? 'Dota 2 event pages, teams, player discovery and related news on WAY Esports.'
              : label === 'Standoff 2'
                ? 'Standoff 2 tournament pages, teams and searchable public coverage on WAY Esports.'
                : 'Mobile Legends: Bang Bang tournaments, teams, rankings, match history and discovery on WAY Esports.'
})) as Array<{ slug: string; label: SupportedGame; description: string }>;

const normalizeGameKey = (value: string): string => (
  String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '')
);

const GAME_LOOKUP = new Map<string, SupportedGame>();

for (const config of GAME_CONFIGS) {
  const keys = [config.label, config.slug, ...(config.aliases || []), ...(config.queryAliases || [])];
  for (const key of keys) {
    const normalized = normalizeGameKey(key);
    if (normalized) {
      GAME_LOOKUP.set(normalized, config.label);
    }
  }
}

export const getSupportedGame = (value?: string | null): SupportedGame | null => {
  const normalized = normalizeGameKey(String(value || ''));
  return GAME_LOOKUP.get(normalized) || null;
};

export const normalizeSupportedGame = (
  value?: string | null,
  fallback: SupportedGame = 'CS2'
): SupportedGame => {
  return getSupportedGame(value) || fallback;
};

export const getSupportedGameQuery = (value?: string | null): string | { $in: string[] } | undefined => {
  const trimmed = String(value || '').trim();
  if (!trimmed) return undefined;

  const game = getSupportedGame(trimmed);
  if (!game) {
    return trimmed;
  }

  const config = GAME_CONFIGS.find((item) => item.label === game);
  const variants = [game, ...(config?.queryAliases || [])];
  return variants.length > 1 ? { $in: variants } : game;
};
