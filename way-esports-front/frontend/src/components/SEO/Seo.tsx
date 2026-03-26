import React from 'react';

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
    const imageUrl = absolutizeUrl(image);
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
    upsertMetaTag('meta[name="twitter:card"]', {
      name: 'twitter:card',
      content: imageUrl ? 'summary_large_image' : 'summary'
    });
    upsertMetaTag('meta[name="twitter:title"]', {
      name: 'twitter:title',
      content: title
    });
    upsertMetaTag('meta[name="twitter:description"]', {
      name: 'twitter:description',
      content: description
    });

    if (imageUrl) {
      upsertMetaTag('meta[property="og:image"]', {
        property: 'og:image',
        content: imageUrl
      });
      upsertMetaTag('meta[name="twitter:image"]', {
        name: 'twitter:image',
        content: imageUrl
      });
    } else {
      removeTag('meta[property="og:image"]');
      removeTag('meta[name="twitter:image"]');
    }

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
      upsertScriptTag('primary', JSON.stringify(jsonLd));
    } else {
      removeTag('script[data-seo-id="primary"]');
    }
  }, [canonicalPath, description, image, jsonLd, keywords, noindex, title, type]);

  return null;
};

export default Seo;
