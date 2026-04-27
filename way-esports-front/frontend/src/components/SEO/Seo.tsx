import React from 'react';

const SITE_NAME = 'WAY Esports';
const SITE_URL = 'https://wayesports.space';
const DEFAULT_SEO_IMAGE = '/images/way-twitter-banner-bg.jpg';
const DEFAULT_IMAGE_ALT = 'WAY Esports competitive platform banner';

type SeoProps = {
  title: string;
  description: string;
  canonicalPath?: string;
  image?: string;
  type?: 'website' | 'article' | 'profile';
  noindex?: boolean;
  keywords?: string[];
  jsonLd?: Record<string, unknown> | Array<Record<string, unknown>> | null;
};

const upsertMetaTag = (selector: string, attributes: Record<string, string>) => {
  let tag = document.head.querySelector(selector) as HTMLMetaElement | null;
  if (!tag) {
    tag = document.createElement('meta');
    document.head.appendChild(tag);
  }

  Object.entries(attributes).forEach(([key, value]) => {
    tag?.setAttribute(key, value);
  });
};

const upsertLinkTag = (selector: string, attributes: Record<string, string>) => {
  let tag = document.head.querySelector(selector) as HTMLLinkElement | null;
  if (!tag) {
    tag = document.createElement('link');
    document.head.appendChild(tag);
  }

  Object.entries(attributes).forEach(([key, value]) => {
    tag?.setAttribute(key, value);
  });
};

const upsertScriptTag = (id: string, payload: string) => {
  let tag = document.head.querySelector(`script[data-seo-id="${id}"]`) as HTMLScriptElement | null;
  if (!tag) {
    tag = document.createElement('script');
    tag.type = 'application/ld+json';
    tag.setAttribute('data-seo-id', id);
    document.head.appendChild(tag);
  }
  tag.textContent = payload;
};

const removeTag = (selector: string) => {
  document.head.querySelector(selector)?.remove();
};

const absolutizeUrl = (pathOrUrl?: string): string => {
  if (!pathOrUrl) return '';
  if (/^https?:\/\//i.test(pathOrUrl)) return pathOrUrl;
  if (typeof window === 'undefined') return pathOrUrl;
  return new URL(pathOrUrl, window.location.origin).toString();
};

const Seo: React.FC<SeoProps> = ({
  title,
  description,
  canonicalPath,
  image,
  type = 'website',
  noindex = false,
  keywords,
  jsonLd
}) => {
  React.useEffect(() => {
    if (typeof document === 'undefined') return;

    const canonicalUrl = absolutizeUrl(canonicalPath || window.location.pathname + window.location.search);
    const imageUrl = absolutizeUrl(image || DEFAULT_SEO_IMAGE);
    const robotsContent = noindex ? 'noindex, nofollow' : 'index, follow';

    document.title = title;

    upsertMetaTag('meta[name="description"]', {
      name: 'description',
      content: description
    });
    upsertMetaTag('meta[name="robots"]', {
      name: 'robots',
      content: robotsContent
    });
    upsertMetaTag('meta[name="author"]', {
      name: 'author',
      content: SITE_NAME
    });
    upsertMetaTag('meta[name="application-name"]', {
      name: 'application-name',
      content: SITE_NAME
    });
    upsertMetaTag('meta[name="apple-mobile-web-app-title"]', {
      name: 'apple-mobile-web-app-title',
      content: SITE_NAME
    });
    upsertMetaTag('meta[name="theme-color"]', {
      name: 'theme-color',
      content: '#050607'
    });
    upsertMetaTag('meta[property="og:site_name"]', {
      property: 'og:site_name',
      content: SITE_NAME
    });
    upsertMetaTag('meta[property="og:locale"]', {
      property: 'og:locale',
      content: 'en_US'
    });
    upsertMetaTag('meta[property="og:title"]', {
      property: 'og:title',
      content: title
    });
    upsertMetaTag('meta[property="og:description"]', {
      property: 'og:description',
      content: description
    });
    upsertMetaTag('meta[property="og:type"]', {
      property: 'og:type',
      content: type
    });
    upsertMetaTag('meta[property="og:url"]', {
      property: 'og:url',
      content: canonicalUrl
    });
    upsertMetaTag('meta[property="og:image"]', {
      property: 'og:image',
      content: imageUrl
    });
    upsertMetaTag('meta[property="og:image:secure_url"]', {
      property: 'og:image:secure_url',
      content: imageUrl
    });
    upsertMetaTag('meta[property="og:image:type"]', {
      property: 'og:image:type',
      content: imageUrl.endsWith('.png') ? 'image/png' : 'image/jpeg'
    });
    upsertMetaTag('meta[property="og:image:alt"]', {
      property: 'og:image:alt',
      content: DEFAULT_IMAGE_ALT
    });
    upsertMetaTag('meta[name="twitter:card"]', {
      name: 'twitter:card',
      content: 'summary_large_image'
    });
    upsertMetaTag('meta[name="twitter:title"]', {
      name: 'twitter:title',
      content: title
    });
    upsertMetaTag('meta[name="twitter:description"]', {
      name: 'twitter:description',
      content: description
    });
    upsertMetaTag('meta[name="twitter:image"]', {
      name: 'twitter:image',
      content: imageUrl
    });
    upsertMetaTag('meta[name="twitter:image:alt"]', {
      name: 'twitter:image:alt',
      content: DEFAULT_IMAGE_ALT
    });

    if (keywords?.length) {
      upsertMetaTag('meta[name="keywords"]', {
        name: 'keywords',
        content: keywords.join(', ')
      });
    } else {
      removeTag('meta[name="keywords"]');
    }

    upsertLinkTag('link[rel="canonical"]', {
      rel: 'canonical',
      href: canonicalUrl
    });

    if (jsonLd) {
      const siteGraph = [
        {
          '@context': 'https://schema.org',
          '@type': 'Organization',
          name: SITE_NAME,
          url: SITE_URL,
          logo: absolutizeUrl('/images/way-main-logo-metal-v2.jpg'),
          image: imageUrl,
          sameAs: [
            'https://t.me/wayesports',
            'https://www.twitch.tv/WAY_Esports',
            'https://discord.gg/wayesports'
          ]
        },
        {
          '@context': 'https://schema.org',
          '@type': 'WebSite',
          name: SITE_NAME,
          url: SITE_URL,
          inLanguage: ['en', 'ru']
        }
      ];
      const payload = Array.isArray(jsonLd) ? [...siteGraph, ...jsonLd] : [...siteGraph, jsonLd];
      upsertScriptTag('primary', JSON.stringify(payload));
    } else {
      upsertScriptTag('primary', JSON.stringify([
        {
          '@context': 'https://schema.org',
          '@type': 'Organization',
          name: SITE_NAME,
          url: SITE_URL,
          logo: absolutizeUrl('/images/way-main-logo-metal-v2.jpg'),
          image: imageUrl,
          sameAs: [
            'https://t.me/wayesports',
            'https://www.twitch.tv/WAY_Esports',
            'https://discord.gg/wayesports'
          ]
        },
        {
          '@context': 'https://schema.org',
          '@type': 'WebSite',
          name: SITE_NAME,
          url: SITE_URL,
          inLanguage: ['en', 'ru']
        }
      ]));
    }
  }, [canonicalPath, description, image, jsonLd, keywords, noindex, title, type]);

  return null;
};

export default Seo;
