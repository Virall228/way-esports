export type DiscoveryGameConfig = {
  slug: string;
  label: string;
  query: string;
  description: string;
  keywords: string[];
  aliases?: string[];
};

export const GAME_CATALOG = [
  {
    slug: 'critical-ops',
    label: 'Critical Ops',
    query: 'Critical Ops',
    description: 'Critical Ops tournaments, teams, news and public discovery pages on WAY Esports.',
    keywords: ['Critical Ops', 'Critical Ops tournaments', 'Critical Ops teams', 'mobile esports'],
    aliases: ['criticalops']
  },
  {
    slug: 'cs2',
    label: 'CS2',
    query: 'CS2',
    description: 'CS2 tournament pages, teams, rankings-ready routes and esports news on WAY Esports.',
    keywords: ['CS2', 'Counter-Strike 2', 'CS2 tournaments', 'CS2 teams'],
    aliases: ['counter-strike-2', 'counter strike 2']
  },
  {
    slug: 'pubg-mobile',
    label: 'PUBG Mobile',
    query: 'PUBG Mobile',
    description: 'PUBG Mobile events, teams and long-tail content hubs for search and social traffic.',
    keywords: ['PUBG Mobile', 'PUBG Mobile tournaments', 'PUBG Mobile teams', 'battle royale esports'],
    aliases: ['pubgmobile']
  },
  {
    slug: 'valorant-mobile',
    label: 'Valorant Mobile',
    query: 'Valorant Mobile',
    description: 'Valorant Mobile tournaments, team profiles and performance discovery on WAY Esports.',
    keywords: ['Valorant Mobile', 'Valorant tournaments', 'mobile tactical shooter', 'esports platform'],
    aliases: ['valorantmobile', 'valorant']
  },
  {
    slug: 'dota-2',
    label: 'Dota 2',
    query: 'Dota 2',
    description: 'Dota 2 event pages, teams, player discovery and related news on WAY Esports.',
    keywords: ['Dota 2', 'Dota 2 tournaments', 'Dota 2 teams', 'MOBA esports'],
    aliases: ['dota2']
  },
  {
    slug: 'standoff-2',
    label: 'Standoff 2',
    query: 'Standoff 2',
    description: 'Standoff 2 tournament pages, teams and searchable public coverage on WAY Esports.',
    keywords: ['Standoff 2', 'Standoff 2 tournaments', 'Standoff 2 teams', 'mobile FPS'],
    aliases: ['standoff2']
  },
  {
    slug: 'mobile-legends-bang-bang',
    label: 'Mobile Legends: Bang Bang',
    query: 'Mobile Legends: Bang Bang',
    description: 'Mobile Legends: Bang Bang tournaments, teams, rankings, match history and discovery on WAY Esports.',
    keywords: ['Mobile Legends: Bang Bang', 'MLBB', 'MLBB tournaments', 'MLBB teams', 'mobile MOBA'],
    aliases: [
      'mobilelegendsbangbang',
      'mobile legends bang bang',
      'mobile-legends-bang-bang',
      'mobilelegends',
      'mobile legends',
      'mlbb'
    ]
  }
] as const satisfies readonly DiscoveryGameConfig[];

export type SupportedGameLabel = typeof GAME_CATALOG[number]['label'];
export type SupportedGameSlug = typeof GAME_CATALOG[number]['slug'];

export const SUPPORTED_GAME_LABELS = GAME_CATALOG.map((item) => item.label) as SupportedGameLabel[];
export const SUPPORTED_GAME_OPTIONS = GAME_CATALOG.map((item) => ({
  value: item.label,
  label: item.label
})) as Array<{ value: SupportedGameLabel; label: SupportedGameLabel }>;
export const SUPPORTED_GAME_SLUG_OPTIONS = GAME_CATALOG.map((item) => ({
  value: item.slug,
  label: item.label
})) as Array<{ value: SupportedGameSlug; label: SupportedGameLabel }>;

export const normalizeGameKey = (value?: string | null): string => (
  String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '')
);

const GAME_LOOKUP = new Map<string, (typeof GAME_CATALOG)[number]>();

for (const game of GAME_CATALOG) {
  const keys = [game.label, game.slug, game.query, ...(game.aliases || [])];
  for (const key of keys) {
    const normalized = normalizeGameKey(key);
    if (normalized) {
      GAME_LOOKUP.set(normalized, game);
    }
  }
}

export const findGameConfig = (value?: string | null): (typeof GAME_CATALOG)[number] | null => {
  return GAME_LOOKUP.get(normalizeGameKey(value)) || null;
};

export const getGameLabel = (value?: string | null): SupportedGameLabel | null => {
  return findGameConfig(value)?.label || null;
};

export const getGameSlug = (value?: string | null): SupportedGameSlug | null => {
  return findGameConfig(value)?.slug || null;
};
