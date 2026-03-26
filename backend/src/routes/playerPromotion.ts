import express from 'express';
import { authenticateJWT } from '../middleware/auth';
import {
  buildPromotionSnapshot,
  getPublicPromotionLeaderboard,
  getPublicPromotionProfile,
  listPublicPromotionSitemapEntries,
  searchPublicPromotionProfiles,
  updatePlayerPromotionSettings
} from '../services/playerPromotionService';

const router = express.Router();

const escapeXml = (value: string): string => (
  String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
);

const getBaseUrl = (req: any): string => {
  const configured =
    String(process.env.PUBLIC_WEB_URL || process.env.APP_URL || process.env.CORS_ORIGIN || '').trim();
  if (configured) {
    return configured.replace(/\/+$/, '');
  }

  const protocol = String(req.protocol || 'https');
  const host = String(req.get?.('host') || req.headers?.host || '').trim();
  return `${protocol}://${host}`.replace(/\/+$/, '');
};

router.get('/me', authenticateJWT, async (req, res) => {
  try {
    const userId = String((req as any).user?._id || '');
    if (!userId) {
      return res.status(401).json({ success: false, error: 'User not authenticated' });
    }

    const data = await buildPromotionSnapshot(userId);
    return res.json({ success: true, data });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message || 'Failed to load promotion dashboard' });
  }
});

router.patch('/me', authenticateJWT, async (req, res) => {
  try {
    const userId = String((req as any).user?._id || '');
    if (!userId) {
      return res.status(401).json({ success: false, error: 'User not authenticated' });
    }

    const data = await updatePlayerPromotionSettings(userId, req.body || {});
    return res.json({ success: true, data });
  } catch (error: any) {
    const statusCode = Number(error?.statusCode || 500);
    return res.status(statusCode).json({
      success: false,
      error: error.message || 'Failed to update promotion settings'
    });
  }
});

router.post('/me/refresh', authenticateJWT, async (req, res) => {
  try {
    const userId = String((req as any).user?._id || '');
    if (!userId) {
      return res.status(401).json({ success: false, error: 'User not authenticated' });
    }

    const data = await buildPromotionSnapshot(userId);
    return res.json({ success: true, data });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message || 'Failed to refresh promotion data' });
  }
});

router.get('/public/leaderboard', async (req, res) => {
  try {
    const data = await getPublicPromotionLeaderboard({
      limit: Number(req.query.limit || 12),
      game: req.query.game ? String(req.query.game) : '',
      role: req.query.role ? String(req.query.role) : '',
      visibility: req.query.visibility ? String(req.query.visibility) as any : 'all'
    });
    return res.json({ success: true, data });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message || 'Failed to load leaderboard' });
  }
});

router.get('/public/search', async (req, res) => {
  try {
    const q = String(req.query.q || '').trim();
    const limit = Math.max(1, Math.min(20, Number(req.query.limit || 8)));
    const data = await searchPublicPromotionProfiles(q, limit);
    return res.json({ success: true, data });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message || 'Failed to search promoted players' });
  }
});

router.get('/public/seo-index', async (_req, res) => {
  try {
    const data = await getPublicPromotionLeaderboard({ limit: 50, visibility: 'public' });
    return res.json({
      success: true,
      data: data.map((item) => ({
        slug: item.slug,
        username: item.username,
        bestGame: item.bestGame,
        bestRole: item.bestRole,
        publicUrl: item.publicUrl
      }))
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message || 'Failed to build SEO index' });
  }
});

router.get('/public/sitemap.xml', async (req, res) => {
  try {
    const entries = await listPublicPromotionSitemapEntries();
    const baseUrl = getBaseUrl(req);
    const body = entries.map((entry) => (
      `<url><loc>${escapeXml(`${baseUrl}/scouts/${entry.slug}`)}</loc><lastmod>${escapeXml(entry.updatedAt)}</lastmod><changefreq>daily</changefreq><priority>0.8</priority></url>`
    )).join('');

    const xml = `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${body}</urlset>`;
    res.setHeader('Content-Type', 'application/xml; charset=utf-8');
    return res.send(xml);
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message || 'Failed to build sitemap' });
  }
});

router.get('/public/players/:identifier', async (req, res) => {
  try {
    const data = await getPublicPromotionProfile(String(req.params.identifier || '').trim());
    if (!data) {
      return res.status(404).json({ success: false, error: 'Promotion profile not found' });
    }
    return res.json({ success: true, data });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message || 'Failed to load public promotion profile' });
  }
});

export default router;
