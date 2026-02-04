import express from 'express';
import Team from '../models/Team';
import Tournament from '../models/Tournament';
import News from '../models/News';
import User from '../models/User';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const q = String((req.query as any)?.q || '').trim();
    const limitRaw = Number((req.query as any)?.limit || 10);
    const limit = Number.isFinite(limitRaw) ? Math.max(1, Math.min(25, limitRaw)) : 10;

    if (!q) {
      return res.json({ success: true, data: { players: [], teams: [], tournaments: [], news: [] } });
    }

    const regex = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');

    const [players, teams, tournaments, news] = await Promise.all([
      User.find({ username: { $regex: regex } })
        .select('username firstName lastName profileLogo role stats')
        .limit(limit)
        .lean(),
      Team.find({ name: { $regex: regex } })
        .select('name tag logo game status members')
        .limit(limit)
        .lean(),
      Tournament.find({ name: { $regex: regex } })
        .select('name game status startDate prizePool maxTeams currentParticipants')
        .limit(limit)
        .lean(),
      News.find({ title: { $regex: regex }, status: 'published' })
        .select('title summary category publishDate')
        .limit(limit)
        .lean()
    ]);

    const data = {
      players: (players || []).map((p: any) => ({
        id: String(p._id),
        type: 'player',
        name: p.username || [p.firstName, p.lastName].filter(Boolean).join(' '),
        avatar: p.profileLogo || '👤',
        details: p.stats ? `W:${p.stats.wins ?? 0} L:${p.stats.losses ?? 0}` : '',
        relevance: 100
      })),
      teams: (teams || []).map((t: any) => ({
        id: String(t._id),
        type: 'team',
        name: t.name,
        avatar: t.logo || '👥',
        tag: t.tag || '',
        game: t.game,
        status: t.status,
        details: `${t.game || ''} • ${(t.members || []).length} members`,
        relevance: 100
      })),
      tournaments: (tournaments || []).map((t: any) => ({
        id: String(t._id),
        type: 'tournament',
        name: t.name,
        avatar: '🏆',
        status: t.status,
        details: `Prize Pool: $${Number(t.prizePool || 0).toLocaleString()} • ${Number(t.currentParticipants || 0)}/${Number(t.maxTeams || 0)}`,
        relevance: 100
      })),
      news: (news || []).map((n: any) => ({
        id: String(n._id),
        type: 'news',
        name: n.title,
        avatar: '📰',
        details: n.summary || n.category || '',
        relevance: 80
      }))
    };

    res.json({ success: true, data });
  } catch (error: any) {
    console.error('Error searching:', error);
    res.status(500).json({ success: false, error: error?.message || 'Failed to search' });
  }
});

export default router;
