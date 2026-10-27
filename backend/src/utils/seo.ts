export const DEFAULT_SITE_URL = 'https://wayesports.space';

// Canonicals must not inherit an arbitrary Host header or a comma-separated CORS list.
export const getPublicSiteUrl = (): string => {
  const configured = process.env.PUBLIC_WEB_URL || process.env.APP_URL;
  if (configured) {
    try {
      const url = new URL(configured);
      if (['https:', 'http:'].includes(url.protocol) && !url.username && !url.password) return url.origin;
    } catch { /* Use the production canonical origin. */ }
  }
  return DEFAULT_SITE_URL;
};

// Script contents are raw text in HTML: &quot; would make JSON-LD invalid.
export const serializeJsonLd = (value: unknown): string => JSON.stringify(value)
  .replace(/</g, '\\u003c').replace(/>/g, '\\u003e').replace(/&/g, '\\u0026')
  .replace(/\u2028/g, '\\u2028').replace(/\u2029/g, '\\u2029');

export const sitemapDate = (value: unknown): string | undefined => {
  if (!value) return undefined;
  const date = new Date(value as string);
  return Number.isNaN(date.getTime()) ? undefined : date.toISOString();
};

export const safePublicUrl = (value: string, base: string): string => {
  try {
    const url = new URL(value, base);
    return ['http:', 'https:'].includes(url.protocol) ? url.href : '';
  } catch { return ''; }
};
