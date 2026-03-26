export type DiscoveryGameConfig = {
  slug: string;
  label: string;
  query: string;
  description: string;
  keywords: string[];
};

const GAME_CONFIGS: DiscoveryGameConfig[] = [
  {
    slug: 'critical-ops',
    label: 'Critical Ops',
    query: 'Critical Ops',
    description: 'Critical Ops tournaments, teams, news and public discovery pages on WAY Esports.',
    keywords: ['Critical Ops', 'Critical Ops tournaments', 'Critical Ops teams', 'mobile esports']
  },
  {
    slug: 'cs2',
    label: 'CS2',
    query: 'CS2',
    description: 'CS2 tournament pages, teams, rankings-ready routes and esports news on WAY Esports.',
    keywords: ['CS2', 'Counter-Strike 2', 'CS2 tournaments', 'CS2 teams']
  },
  {
    slug: 'pubg-mobile',
    label: 'PUBG Mobile',
    query: 'PUBG Mobile',
    description: 'PUBG Mobile events, teams and long-tail content hubs for search and social traffic.',
    keywords: ['PUBG Mobile', 'PUBG Mobile tournaments', 'PUBG Mobile teams', 'battle royale esports']
  },
  {
    slug: 'valorant-mobile',
    label: 'Valorant Mobile',
    query: 'Valorant Mobile',
    description: 'Valorant Mobile tournaments, team profiles and performance discovery on WAY Esports.',
    keywords: ['Valorant Mobile', 'Valorant tournaments', 'mobile tactical shooter', 'esports platform']
  },
  {
    slug: 'standoff-2',
    label: 'Standoff 2',
    query: 'Standoff 2',
    description: 'Standoff 2 tournament pages, teams and searchable public coverage on WAY Esports.',
    keywords: ['Standoff 2', 'Standoff 2 tournaments', 'Standoff 2 teams', 'mobile FPS']
  },
  {
    slug: 'dota-2',
    label: 'Dota 2',
    query: 'Dota 2',
    description: 'Dota 2 event pages, teams, player discovery and related news on WAY Esports.',
    keywords: ['Dota 2', 'Dota 2 tournaments', 'Dota 2 teams', 'MOBA esports']
  }
];

const toSlug = (value: string): string => (
  String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
);

export const getDiscoveryGames = (): DiscoveryGameConfig[] => GAME_CONFIGS;

export const getGameDiscoveryConfigBySlug = (slug?: string | null): DiscoveryGameConfig | null => {
  const normalized = toSlug(String(slug || ''));
  return GAME_CONFIGS.find((item) => item.slug === normalized) || null;
};

export const getGameDiscoveryConfigByName = (name?: string | null): DiscoveryGameConfig | null => {
  const normalized = toSlug(String(name || ''));
  return GAME_CONFIGS.find((item) => toSlug(item.label) === normalized || toSlug(item.query) === normalized) || null;
};

export const getGameHubPath = (name?: string | null): string | null => {
  const config = getGameDiscoveryConfigByName(name);
  return config ? `/games/${config.slug}` : null;
};

export const slugifyCategory = (value?: string | null): string => toSlug(String(value || ''));

export const parseCategorySlug = (slug?: string | null): string => (
  String(slug || '')
    .trim()
    .toLowerCase()
    .replace(/-/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
);

export const formatCategoryLabel = (value?: string | null): string => (
  String(value || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
);
