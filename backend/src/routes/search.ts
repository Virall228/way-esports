import express from 'express';
import Team from '../models/Team';
import Tournament from '../models/Tournament';
import News from '../models/News';
import User from '../models/User';

const router = express.Router();

const escapeRegExp = (value: string): string => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

router.get('/', async (req, res) => {
  try {
    const q = String((req.query as any)?.q || '').trim();
    const limitRaw = Number((req.query as any)?.limit || 10);
    const limit = Number.isFinite(limitRaw) ? Math.max(1, Math.min(25, limitRaw)) : 10;

    if (!q) {
      return res.json({ success: true, data: { players: [], teams: [], tournaments: [], news: [] } });
    }

    const regex = new RegExp(escapeRegExp(q), 'i');
    const isObjectId = /^[a-fA-F0-9]{24}$/.test(q);
    const numericTelegramId = /^\d{3,20}$/.test(q) ? Number(q) : null;

    const playerQuery: Record<string, unknown> = {
      $or: [
        { username: { $regex: regex } },
        { firstName: { $regex: regex } },
        { lastName: { $regex: regex } },
        { 'gameProfiles.username': { $regex: regex } },
        { 'gameProfiles.ingameId': { $regex: regex } }
      ]
    };

    if (isObjectId) {
      (playerQuery.$or as any[]).push({ _id: q });
    }
    if (numericTelegramId) {
      (playerQuery.$or as any[]).push({ telegramId: numericTelegramId });
    }

    const [players, teams, tournaments, news] = await Promise.all([
      User.find(playerQuery)
        .select('username firstName lastName profileLogo role stats gameProfiles telegramId')
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
      players: (players || []).map((player: any) => ({
        id: String(player._id),
        type: 'player',
        name: player.username || [player.firstName, player.lastName].filter(Boolean).join(' '),
        avatar: player.profileLogo || '',
        internalPlatformId: String(player._id),
        telegramId: Number(player?.telegramId || 0) || null,
        ingameIds: Array.isArray(player?.gameProfiles)
          ? player.gameProfiles
            .map((profile: any) => String(profile?.ingameId || '').trim())
            .filter(Boolean)
          : [],
        details: player.stats ? `W:${player.stats.wins ?? 0} L:${player.stats.losses ?? 0}` : '',
        relevance: 100
      })),
      teams: (teams || []).map((team: any) => ({
        id: String(team._id),
        type: 'team',
        name: team.name,
        avatar: team.logo || '',
        tag: team.tag || '',
        game: team.game,
        status: team.status,
        details: `${team.game || ''} • ${(team.members || []).length} members`,
        relevance: 100
      })),
      tournaments: (tournaments || []).map((tournament: any) => ({
        id: String(tournament._id),
        type: 'tournament',
        name: tournament.name,
        avatar: '',
        status: tournament.status,
        details: `Prize Pool: $${Number(tournament.prizePool || 0).toLocaleString()} • ${Number(tournament.currentParticipants || 0)}/${Number(tournament.maxTeams || 0)}`,
        relevance: 100
      })),
      news: (news || []).map((article: any) => ({
        id: String(article._id),
        type: 'news',
        name: article.title,
        avatar: '',
        details: article.summary || article.category || '',
        relevance: 80
      }))
    };

    return res.json({ success: true, data });
  } catch (error: any) {
    console.error('Error searching:', error);
    return res.status(500).json({ success: false, error: error?.message || 'Failed to search' });
  }
});

export default router;
