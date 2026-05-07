import { GAME_CATALOG, type DiscoveryGameConfig, findGameConfig } from '../config/games';

const GAME_CONFIGS: DiscoveryGameConfig[] = [...GAME_CATALOG];

export const getDiscoveryGames = (): DiscoveryGameConfig[] => GAME_CONFIGS;

export const getGameDiscoveryConfigBySlug = (slug?: string | null): DiscoveryGameConfig | null => {
  return findGameConfig(slug) || null;
};

export const getGameDiscoveryConfigByName = (name?: string | null): DiscoveryGameConfig | null => {
  return findGameConfig(name) || null;
};

export const getGameHubPath = (name?: string | null): string | null => {
  const config = getGameDiscoveryConfigByName(name);
  return config ? `/games/${config.slug}` : null;
};

export const slugifyCategory = (value?: string | null): string => (
  String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
);

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
