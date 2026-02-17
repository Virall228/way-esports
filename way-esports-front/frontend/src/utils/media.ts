import { getFullUrl } from '../config/api';

const ABSOLUTE_URL_RE = /^https?:\/\//i;
const DATA_URL_RE = /^data:image\//i;

export const resolveMediaUrl = (value?: string | null): string => {
  if (!value) return '';

  const trimmed = value.trim();
  if (!trimmed) return '';
  if (ABSOLUTE_URL_RE.test(trimmed) || DATA_URL_RE.test(trimmed)) return trimmed;

  const normalized = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;

  if (normalized.startsWith('/api/uploads/')) {
    return getFullUrl(normalized);
  }

  if (normalized.startsWith('/uploads/')) {
    return getFullUrl(`/api${normalized}`);
  }

  return normalized;
};

export const resolveTeamLogoUrl = (value?: string | null): string => resolveMediaUrl(value);
