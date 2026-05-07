import express from 'express';
import News from '../models/News';
import Team from '../models/Team';
import Tournament from '../models/Tournament';
import User from '../models/User';
import { getPublicPromotionProfile, listPublicPromotionSitemapEntries } from '../services/playerPromotionService';
import { GAME_HUBS } from '../config/games';

const router = express.Router();
const SITE_NAME = 'WAY Esports';
const DEFAULT_IMAGE = '/images/way-twitter-banner-bg.jpg';
const DEFAULT_IMAGE_ALT = 'WAY Esports platform banner';

const escapeXml = (value: string): string => (
  String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
);

const getBaseUrl = (req: express.Request): string => {
  const configured = String(process.env.PUBLIC_WEB_URL || process.env.APP_URL || process.env.CORS_ORIGIN || 'https://wayesports.space').trim();
  if (configured) {
    return configured.replace(/\/+$/, '');
  }

  const protocol = String(req.protocol || 'https');
  const host = String(req.get('host') || req.headers.host || '').trim();
  return `${protocol}://${host}`.replace(/\/+$/, '');
};

const buildUrlset = (urls: Array<{ loc: string; lastmod?: string; changefreq?: string; priority?: string }>) => {
  const body = urls
    .map((item) => (
      `<url><loc>${escapeXml(item.loc)}</loc>${item.lastmod ? `<lastmod>${escapeXml(item.lastmod)}</lastmod>` : ''}${item.changefreq ? `<changefreq>${escapeXml(item.changefreq)}</changefreq>` : ''}${item.priority ? `<priority>${escapeXml(item.priority)}</priority>` : ''}</url>`
    ))
    .join('');

  return `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${body}</urlset>`;
};

const buildSitemapIndex = (urls: Array<{ loc: string; lastmod?: string }>) => {
  const body = urls
    .map((item) => (
      `<sitemap><loc>${escapeXml(item.loc)}</loc>${item.lastmod ? `<lastmod>${escapeXml(item.lastmod)}</lastmod>` : ''}</sitemap>`
    ))
    .join('');

  return `<?xml version="1.0" encoding="UTF-8"?><sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${body}</sitemapindex>`;
};

const escapeHtml = (value: string): string => (
  String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
);

const stripHtml = (value: string): string => (
  String(value || '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
);

const renderSeoHtml = (params: {
  title: string;
  description: string;
  canonicalUrl: string;
  image?: string;
  robots?: string;
  type?: string;
  jsonLd?: Record<string, unknown> | Array<Record<string, unknown>> | null;
  bodyTitle: string;
  bodyDescription: string;
  links?: Array<{ href: string; label: string }>;
}) => {
  const robots = params.robots || 'index, follow';
  const type = params.type || 'website';
  const image = absolutize(params.image || DEFAULT_IMAGE, params.canonicalUrl);
  const bodyLinks = (params.links || [])
    .slice(0, 12)
    .map((item) => `<li><a href="${escapeHtml(item.href)}">${escapeHtml(item.label)}</a></li>`)
    .join('');
  const siteUrl = (() => {
    try {
      const url = new URL(params.canonicalUrl);
      return `${url.protocol}//${url.host}`;
    } catch {
      return params.canonicalUrl;
    }
  })();
  const siteJsonLd = [
    {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: SITE_NAME,
      url: siteUrl,
      logo: absolutize('/images/way-main-logo-metal-v2.jpg', params.canonicalUrl),
      image,
      sameAs: [
        'https://t.me/wayesports',
        'https://discord.gg/wayesports',
        'https://www.twitch.tv/WAY_Esports'
      ]
    },
    {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: SITE_NAME,
      url: siteUrl,
      inLanguage: ['en', 'ru']
    }
  ];
  const jsonLdPayload = params.jsonLd
    ? Array.isArray(params.jsonLd)
      ? [...siteJsonLd, ...params.jsonLd]
      : [...siteJsonLd, params.jsonLd]
    : siteJsonLd;

  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeHtml(params.title)}</title>
    <meta name="description" content="${escapeHtml(params.description)}" />
    <meta name="robots" content="${escapeHtml(robots)}" />
    <meta name="author" content="${SITE_NAME}" />
    <meta name="application-name" content="${SITE_NAME}" />
    <meta name="theme-color" content="#050607" />
    <link rel="canonical" href="${escapeHtml(params.canonicalUrl)}" />
    <meta property="og:site_name" content="${SITE_NAME}" />
    <meta property="og:locale" content="en_US" />
    <meta property="og:title" content="${escapeHtml(params.title)}" />
    <meta property="og:description" content="${escapeHtml(params.description)}" />
    <meta property="og:type" content="${escapeHtml(type)}" />
    <meta property="og:url" content="${escapeHtml(params.canonicalUrl)}" />
    <meta property="og:image" content="${escapeHtml(image)}" />
    <meta property="og:image:secure_url" content="${escapeHtml(image)}" />
    <meta property="og:image:type" content="${escapeHtml(image.endsWith('.png') ? 'image/png' : 'image/jpeg')}" />
    <meta property="og:image:alt" content="${DEFAULT_IMAGE_ALT}" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${escapeHtml(params.title)}" />
    <meta name="twitter:description" content="${escapeHtml(params.description)}" />
    <meta name="twitter:image" content="${escapeHtml(image)}" />
    <meta name="twitter:image:alt" content="${DEFAULT_IMAGE_ALT}" />
    <script type="application/ld+json">${escapeHtml(JSON.stringify(jsonLdPayload))}</script>
    <style>
      body { font-family: Arial, sans-serif; line-height: 1.6; margin: 0; padding: 40px 20px; background: #0b0b0b; color: #f3f3f3; }
      main { max-width: 860px; margin: 0 auto; }
      h1 { margin: 0 0 12px; color: #ff6b00; font-size: 2rem; }
      p { color: #d2d2d2; }
      a { color: #ff9d4d; text-decoration: none; }
      ul { padding-left: 18px; }
    </style>
  </head>
  <body>
    <main>
      <h1>${escapeHtml(params.bodyTitle)}</h1>
      <p>${escapeHtml(params.bodyDescription)}</p>
      ${bodyLinks ? `<ul>${bodyLinks}</ul>` : ''}
    </main>
  </body>
</html>`;
};

const absolutize = (value: string, canonicalUrl: string) => {
  if (!value) return '';
  if (/^https?:\/\//i.test(value)) return value;
  try {
    const url = new URL(canonicalUrl);
    return new URL(value, `${url.protocol}//${url.host}`).toString();
  } catch {
    return value;
  }
};

const firstPathSegment = (path: string) => String(path.split('/').filter(Boolean)[0] || '');
const toSlug = (value: string): string => (
  String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
);

const formatLabel = (value: string): string => (
  String(value || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
);

const parseCategorySlug = (value: string): string => (
  String(value || '')
    .trim()
    .toLowerCase()
    .replace(/-/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
);

router.get('/sitemap-index.xml', async (req, res) => {
  try {
    const baseUrl = getBaseUrl(req);
    const now = new Date().toISOString();
    const xml = buildSitemapIndex([
      { loc: `${baseUrl}/api/seo/sitemaps/core.xml`, lastmod: now },
      { loc: `${baseUrl}/api/seo/sitemaps/games.xml`, lastmod: now },
      { loc: `${baseUrl}/api/seo/sitemaps/news.xml`, lastmod: now },
      { loc: `${baseUrl}/api/seo/sitemaps/news-categories.xml`, lastmod: now },
      { loc: `${baseUrl}/api/seo/sitemaps/tournaments.xml`, lastmod: now },
      { loc: `${baseUrl}/api/seo/sitemaps/teams.xml`, lastmod: now },
      { loc: `${baseUrl}/api/seo/sitemaps/profiles.xml`, lastmod: now },
      { loc: `${baseUrl}/api/player-promotion/public/sitemap.xml`, lastmod: now }
    ]);

    res.setHeader('Content-Type', 'application/xml; charset=utf-8');
    return res.send(xml);
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message || 'Failed to build sitemap index' });
  }
});

router.get('/sitemaps/core.xml', async (req, res) => {
  const baseUrl = getBaseUrl(req);
  const xml = buildUrlset([
    { loc: `${baseUrl}/`, changefreq: 'daily', priority: '1.0' },
    { loc: `${baseUrl}/tournaments`, changefreq: 'hourly', priority: '0.9' },
    { loc: `${baseUrl}/teams`, changefreq: 'daily', priority: '0.9' },
    { loc: `${baseUrl}/rankings`, changefreq: 'hourly', priority: '0.8' },
    { loc: `${baseUrl}/matches`, changefreq: 'hourly', priority: '0.8' },
    { loc: `${baseUrl}/news`, changefreq: 'daily', priority: '0.8' }
  ]);

  res.setHeader('Content-Type', 'application/xml; charset=utf-8');
  return res.send(xml);
});

router.get('/sitemaps/games.xml', async (req, res) => {
  const baseUrl = getBaseUrl(req);
  const xml = buildUrlset(
    GAME_HUBS.map((item) => ({
      loc: `${baseUrl}/games/${item.slug}`,
      changefreq: 'daily',
      priority: '0.8'
    }))
  );

  res.setHeader('Content-Type', 'application/xml; charset=utf-8');
  return res.send(xml);
});

router.get('/sitemaps/news.xml', async (req, res) => {
  try {
    const baseUrl = getBaseUrl(req);
    const items = await News.find({ status: 'published' })
      .sort({ publishDate: -1, updatedAt: -1 })
      .select('_id updatedAt publishDate')
      .lean();

    const xml = buildUrlset(
      items.map((item: any) => ({
        loc: `${baseUrl}/news/${String(item?._id || '')}`,
        lastmod: new Date(item?.updatedAt || item?.publishDate || Date.now()).toISOString(),
        changefreq: 'weekly',
        priority: '0.7'
      }))
    );

    res.setHeader('Content-Type', 'application/xml; charset=utf-8');
    return res.send(xml);
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message || 'Failed to build news sitemap' });
  }
});

router.get('/sitemaps/news-categories.xml', async (req, res) => {
  try {
    const baseUrl = getBaseUrl(req);
    const categories = await News.distinct('category', {
      status: 'published',
      category: { $exists: true, $nin: ['', null] }
    });

    const xml = buildUrlset(
      categories
        .map((item) => String(item || '').trim().toLowerCase())
        .filter(Boolean)
        .map((item) => ({
          loc: `${baseUrl}/news/category/${toSlug(item)}`,
          changefreq: 'weekly',
          priority: '0.6'
        }))
    );

    res.setHeader('Content-Type', 'application/xml; charset=utf-8');
    return res.send(xml);
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message || 'Failed to build news categories sitemap' });
  }
});

router.get('/sitemaps/tournaments.xml', async (req, res) => {
  try {
    const baseUrl = getBaseUrl(req);
    const items = await Tournament.find({})
      .sort({ startDate: -1, updatedAt: -1 })
      .select('_id updatedAt startDate')
      .lean();

    const xml = buildUrlset(
      items.map((item: any) => ({
        loc: `${baseUrl}/tournaments/${String(item?._id || '')}`,
        lastmod: new Date(item?.updatedAt || item?.startDate || Date.now()).toISOString(),
        changefreq: 'daily',
        priority: '0.8'
      }))
    );

    res.setHeader('Content-Type', 'application/xml; charset=utf-8');
    return res.send(xml);
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message || 'Failed to build tournaments sitemap' });
  }
});

router.get('/sitemaps/teams.xml', async (req, res) => {
  try {
    const baseUrl = getBaseUrl(req);
    const items = await Team.find({ isPrivate: { $ne: true } })
      .sort({ updatedAt: -1, createdAt: -1 })
      .select('_id updatedAt')
      .lean();

    const xml = buildUrlset(
      items.map((item: any) => ({
        loc: `${baseUrl}/teams/${String(item?._id || '')}`,
        lastmod: new Date(item?.updatedAt || Date.now()).toISOString(),
        changefreq: 'daily',
        priority: '0.7'
      }))
    );

    res.setHeader('Content-Type', 'application/xml; charset=utf-8');
    return res.send(xml);
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message || 'Failed to build teams sitemap' });
  }
});

router.get('/sitemaps/profiles.xml', async (req, res) => {
  try {
    const baseUrl = getBaseUrl(req);
    const items = await User.find({ isBanned: { $ne: true }, username: { $exists: true, $ne: '' } })
      .sort({ updatedAt: -1, createdAt: -1 })
      .select('username updatedAt')
      .lean();

    const xml = buildUrlset(
      items.map((item: any) => ({
        loc: `${baseUrl}/profile/${encodeURIComponent(String(item?.username || ''))}`,
        lastmod: new Date(item?.updatedAt || Date.now()).toISOString(),
        changefreq: 'weekly',
        priority: '0.6'
      }))
    );

    res.setHeader('Content-Type', 'application/xml; charset=utf-8');
    return res.send(xml);
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message || 'Failed to build profiles sitemap' });
  }
});

router.get('/seo-index', async (req, res) => {
  try {
    const baseUrl = getBaseUrl(req);
    const [news, tournaments, teams, profiles, scouts, categories] = await Promise.all([
      News.find({ status: 'published' }).sort({ publishDate: -1 }).limit(100).select('_id title summary updatedAt').lean(),
      Tournament.find({}).sort({ updatedAt: -1 }).limit(100).select('_id name game updatedAt').lean(),
      Team.find({ isPrivate: { $ne: true } }).sort({ updatedAt: -1 }).limit(100).select('_id name game updatedAt').lean(),
      User.find({ isBanned: { $ne: true }, username: { $exists: true, $ne: '' } }).sort({ updatedAt: -1 }).limit(100).select('username updatedAt').lean(),
      listPublicPromotionSitemapEntries(),
      News.distinct('category', { status: 'published', category: { $exists: true, $nin: ['', null] } })
    ]);

    return res.json({
      success: true,
      data: {
        games: GAME_HUBS.map((item) => ({ url: `${baseUrl}/games/${item.slug}`, title: `${item.label} Hub` })),
        news: news.map((item: any) => ({ url: `${baseUrl}/news/${item._id}`, title: item.title, updatedAt: item.updatedAt })),
        newsCategories: categories.map((item: any) => ({ url: `${baseUrl}/news/category/${toSlug(String(item || ''))}`, title: formatLabel(String(item || '')) })),
        tournaments: tournaments.map((item: any) => ({ url: `${baseUrl}/tournaments/${item._id}`, title: item.name, game: item.game, updatedAt: item.updatedAt })),
        teams: teams.map((item: any) => ({ url: `${baseUrl}/teams/${item._id}`, title: item.name, game: item.game, updatedAt: item.updatedAt })),
        profiles: profiles.map((item: any) => ({ url: `${baseUrl}/profile/${encodeURIComponent(item.username)}`, username: item.username, updatedAt: item.updatedAt })),
        scouts: scouts.map((item: any) => ({ url: `${baseUrl}/scouts/${item.slug}`, slug: item.slug, updatedAt: item.updatedAt }))
      }
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message || 'Failed to build SEO index' });
  }
});

router.get('/render', async (req, res) => {
  try {
    const baseUrl = getBaseUrl(req);
    const requestedPath = `/${String(req.query.path || '/').replace(/^\/+/, '')}`.replace(/\/{2,}/g, '/');
    const pathWithoutQuery = requestedPath.split('?')[0] || '/';
    const canonicalUrl = `${baseUrl}${pathWithoutQuery === '/' ? '' : pathWithoutQuery}`;
    const segment = firstPathSegment(pathWithoutQuery);
    const parts = pathWithoutQuery.split('/').filter(Boolean);

    if (pathWithoutQuery === '/') {
      const [news, tournaments, teams] = await Promise.all([
        News.find({ status: 'published' }).sort({ publishDate: -1 }).limit(5).select('_id title').lean(),
        Tournament.find({}).sort({ startDate: -1, updatedAt: -1 }).limit(5).select('_id name').lean(),
        Team.find({ isPrivate: { $ne: true } }).sort({ updatedAt: -1 }).limit(5).select('_id name').lean()
      ]);

      const html = renderSeoHtml({
        title: 'WAY Esports | Tournaments, Teams, Rankings and Player Discovery',
        description: 'WAY Esports platform for tournaments, teams, player profiles, rankings, matches and scout discovery.',
        canonicalUrl,
        type: 'website',
        bodyTitle: 'WAY Esports',
        bodyDescription: 'Competitive esports platform with tournaments, teams, public profiles, rankings, matches and scouting.',
        links: [
          ...GAME_HUBS.slice(0, 4).map((item) => ({ href: `${baseUrl}/games/${item.slug}`, label: `${item.label} hub` })),
          ...news.map((item: any) => ({ href: `${baseUrl}/news/${item._id}`, label: item.title })),
          ...tournaments.map((item: any) => ({ href: `${baseUrl}/tournaments/${item._id}`, label: item.name })),
          ...teams.map((item: any) => ({ href: `${baseUrl}/teams/${item._id}`, label: item.name }))
        ],
        jsonLd: {
          '@context': 'https://schema.org',
          '@type': 'WebSite',
          name: 'WAY Esports',
          url: baseUrl
        }
      });

      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      return res.send(html);
    }

    if (segment === 'games' && parts[1]) {
      const gameHub = GAME_HUBS.find((item) => item.slug === parts[1]);
      if (gameHub) {
        const [tournaments, news, teams] = await Promise.all([
          Tournament.find({ game: gameHub.label }).sort({ startDate: -1, updatedAt: -1 }).limit(6).select('_id name').lean(),
          News.find({ status: 'published', game: gameHub.label }).sort({ publishDate: -1 }).limit(6).select('_id title').lean(),
          Team.find({ isPrivate: { $ne: true }, game: gameHub.label }).sort({ updatedAt: -1 }).limit(6).select('_id name tag').lean()
        ]);

        const html = renderSeoHtml({
          title: `${gameHub.label} Tournaments, Teams and News | WAY Esports`,
          description: gameHub.description,
          canonicalUrl,
          type: 'website',
          bodyTitle: `${gameHub.label} Hub`,
          bodyDescription: gameHub.description,
          links: [
            ...tournaments.map((item: any) => ({ href: `${baseUrl}/tournaments/${item._id}`, label: item.name })),
            ...teams.map((item: any) => ({ href: `${baseUrl}/teams/${item._id}`, label: `${item.name}${item.tag ? ` (${item.tag})` : ''}` })),
            ...news.map((item: any) => ({ href: `${baseUrl}/news/${item._id}`, label: item.title }))
          ],
          jsonLd: {
            '@context': 'https://schema.org',
            '@type': 'CollectionPage',
            name: `${gameHub.label} Hub`,
            description: gameHub.description
          }
        });

        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        return res.send(html);
      }
    }

    if (pathWithoutQuery === '/news') {
      const [items, categories] = await Promise.all([
        News.find({ status: 'published' }).sort({ publishDate: -1 }).limit(10).select('_id title').lean(),
        News.distinct('category', { status: 'published', category: { $exists: true, $nin: ['', null] } })
      ]);
      const html = renderSeoHtml({
        title: 'Esports News and Tournament Updates | WAY Esports',
        description: 'Latest WAY Esports news, tournament announcements, team updates and platform releases.',
        canonicalUrl,
        type: 'website',
        bodyTitle: 'WAY Esports News',
        bodyDescription: 'Latest esports news, tournament announcements and team updates from WAY Esports.',
        links: [
          ...categories.slice(0, 6).map((item: any) => ({
            href: `${baseUrl}/news/category/${toSlug(String(item || ''))}`,
            label: `${formatLabel(String(item || ''))} news`
          })),
          ...items.map((item: any) => ({ href: `${baseUrl}/news/${item._id}`, label: item.title }))
        ],
        jsonLd: {
          '@context': 'https://schema.org',
          '@type': 'CollectionPage',
          name: 'WAY Esports News'
        }
      });
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      return res.send(html);
    }

    if (segment === 'news' && parts[1] === 'category' && parts[2]) {
      const category = parseCategorySlug(parts[2]);
      const label = formatLabel(category);
      const items = await News.find({ status: 'published', category })
        .sort({ publishDate: -1, updatedAt: -1 })
        .limit(10)
        .select('_id title')
        .lean();

      const html = renderSeoHtml({
        title: `${label} Esports News | WAY Esports`,
        description: `${label} news, tournament updates and platform coverage from WAY Esports.`,
        canonicalUrl,
        type: 'website',
        bodyTitle: `${label} News`,
        bodyDescription: `${label} stories, announcements and competitive updates published on WAY Esports.`,
        links: items.map((item: any) => ({ href: `${baseUrl}/news/${item._id}`, label: item.title })),
        jsonLd: {
          '@context': 'https://schema.org',
          '@type': 'CollectionPage',
          name: `${label} News`
        }
      });
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      return res.send(html);
    }

    if (segment === 'news' && parts[1]) {
      const item: any = await News.findById(parts[1])
        .populate('author', 'username')
        .lean();
      if (item && item.status === 'published') {
        const description = stripHtml(item.summary || item.content || '').slice(0, 160);
        const html = renderSeoHtml({
          title: `${item.title || 'News'} | WAY Esports`,
          description,
          canonicalUrl,
          image: item.coverImage || '',
          type: 'article',
          bodyTitle: item.title || 'WAY Esports News',
          bodyDescription: description,
          jsonLd: {
            '@context': 'https://schema.org',
            '@type': 'NewsArticle',
            headline: item.title || 'WAY Esports News',
            description,
            image: item.coverImage || undefined,
            datePublished: item.publishDate || item.createdAt || undefined,
            dateModified: item.updatedAt || item.publishDate || item.createdAt || undefined,
            author: item.author?.username || 'WAY Esports'
          }
        });
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        return res.send(html);
      }
    }

    if (pathWithoutQuery === '/tournaments') {
      const items = await Tournament.find({}).sort({ startDate: -1, updatedAt: -1 }).limit(12).select('_id name game').lean();
      const html = renderSeoHtml({
        title: 'Esports Tournaments | WAY Esports',
        description: 'Browse active, upcoming and completed esports tournaments on WAY Esports across mobile and PC titles.',
        canonicalUrl,
        type: 'website',
        bodyTitle: 'WAY Esports Tournaments',
        bodyDescription: 'Discover active, upcoming and completed esports tournaments on the platform.',
        links: items.map((item: any) => ({ href: `${baseUrl}/tournaments/${item._id}`, label: `${item.name} ${item.game ? `(${item.game})` : ''}` }))
      });
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      return res.send(html);
    }

    if (segment === 'tournaments' && parts[1]) {
      const item: any = await Tournament.findById(parts[1]).lean();
      if (item) {
        const description = stripHtml(item.description || `${item.name} tournament on WAY Esports`).slice(0, 160);
        const html = renderSeoHtml({
          title: `${item.name || 'Tournament'} | WAY Esports Tournament`,
          description,
          canonicalUrl,
          image: item.coverImage || item.image || '',
          type: 'article',
          bodyTitle: item.name || 'Tournament',
          bodyDescription: description,
          jsonLd: {
            '@context': 'https://schema.org',
            '@type': 'Event',
            name: item.name || 'Tournament',
            description,
            startDate: item.startDate || undefined,
            endDate: item.endDate || undefined
          }
        });
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        return res.send(html);
      }
    }

    if (pathWithoutQuery === '/teams') {
      const items = await Team.find({ isPrivate: { $ne: true } }).sort({ updatedAt: -1 }).limit(12).select('_id name tag game').lean();
      const html = renderSeoHtml({
        title: 'Esports Teams Directory | WAY Esports',
        description: 'Discover esports teams, rosters, performance stats and recruitment opportunities on WAY Esports.',
        canonicalUrl,
        type: 'website',
        bodyTitle: 'WAY Esports Teams',
        bodyDescription: 'Public team directory with rosters, stats and competitive results.',
        links: items.map((item: any) => ({ href: `${baseUrl}/teams/${item._id}`, label: `${item.name}${item.tag ? ` (${item.tag})` : ''}` }))
      });
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      return res.send(html);
    }

    if (segment === 'teams' && parts[1]) {
      const item: any = await Team.findOne({ _id: parts[1], isPrivate: { $ne: true } }).lean();
      if (item) {
        const description = stripHtml(item.description || `${item.name} competes in ${item.game || 'esports'} on WAY Esports.`).slice(0, 160);
        const html = renderSeoHtml({
          title: `${item.name || 'Team'}${item.tag ? ` (${item.tag})` : ''} | WAY Esports`,
          description,
          canonicalUrl,
          image: item.logo || '',
          type: 'profile',
          bodyTitle: item.name || 'Team',
          bodyDescription: description,
          jsonLd: {
            '@context': 'https://schema.org',
            '@type': 'SportsTeam',
            name: item.name || 'Team',
            sport: item.game || 'Esports',
            description
          }
        });
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        return res.send(html);
      }
    }

    if ((segment === 'profile' && parts[1]) || (segment === 'user' && parts[1])) {
      const identifier = parts[1];
      const query = /^[0-9a-fA-F]{24}$/.test(identifier) ? { _id: identifier } : { username: identifier };
      const item: any = await User.findOne({ ...query, isBanned: { $ne: true } })
        .select('username firstName lastName bio profileLogo photoUrl updatedAt')
        .lean();
      if (item) {
        const description = stripHtml(item.bio || `${item.username} public esports profile on WAY Esports.`).slice(0, 160);
        const html = renderSeoHtml({
          title: `${item.username || 'Player'} | WAY Esports Profile`,
          description,
          canonicalUrl,
          image: item.profileLogo || item.photoUrl || '',
          type: 'profile',
          bodyTitle: item.username || 'Player',
          bodyDescription: description,
          jsonLd: {
            '@context': 'https://schema.org',
            '@type': 'Person',
            name: item.username || 'Player',
            description
          }
        });
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        return res.send(html);
      }
    }

    if (segment === 'scouts' && parts[1]) {
      const item: any = await getPublicPromotionProfile(parts[1]);
      if (item) {
        const description = stripHtml(item.scoutPitch || item.headline || `${item.username} scouting profile on WAY Esports.`).slice(0, 160);
        const html = renderSeoHtml({
          title: `${item.username || 'Player'} | WAY Esports Scout Profile`,
          description,
          canonicalUrl,
          image: item.avatarUrl || '',
          type: 'profile',
          bodyTitle: item.username || 'Scout Profile',
          bodyDescription: description,
          jsonLd: item.structuredData || {
            '@context': 'https://schema.org',
            '@type': 'Person',
            name: item.username || 'Player',
            description
          }
        });
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        return res.send(html);
      }
    }

    if (pathWithoutQuery === '/rankings' || pathWithoutQuery === '/matches') {
      const descriptions: Record<string, string> = {
        '/rankings': 'Explore live team and player rankings, performance ladders and weekly competitive standings on WAY Esports.',
        '/matches': 'Track live, upcoming and recent esports matches across tournaments on WAY Esports.'
      };
      const titles: Record<string, string> = {
        '/rankings': 'Esports Team and Player Rankings | WAY Esports',
        '/matches': 'Live and Upcoming Esports Matches | WAY Esports'
      };
      const html = renderSeoHtml({
        title: titles[pathWithoutQuery],
        description: descriptions[pathWithoutQuery],
        canonicalUrl,
        type: 'website',
        bodyTitle: titles[pathWithoutQuery].replace(' | WAY Esports', ''),
        bodyDescription: descriptions[pathWithoutQuery]
      });
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      return res.send(html);
    }

    const html = renderSeoHtml({
      title: 'WAY Esports',
      description: 'Competitive esports platform with tournaments, teams, player profiles and public scouting.',
      canonicalUrl,
      type: 'website',
      robots: 'noindex, follow',
      bodyTitle: 'WAY Esports',
      bodyDescription: 'Public esports platform with tournaments, teams and player discovery.'
    });
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return res.send(html);
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message || 'Failed to render SEO snapshot' });
  }
});

export default router;
