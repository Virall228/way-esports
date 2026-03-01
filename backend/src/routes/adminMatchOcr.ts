import express from 'express';
import mongoose from 'mongoose';
import Tournament from '../models/Tournament';
import TournamentRegistration from '../models/TournamentRegistration';
import MatchStats from '../models/MatchStats';
import { authenticateJWT, isAdmin } from '../middleware/auth';
import { uploadMemoryImage } from '../middleware/upload';
import { parseMatchScreenshotWithGemini } from '../services/geminiMatchOcrService';
import {
  mapParsedRowsToTournamentPlayers,
  TournamentPlayerIdentity,
  updateUserStatsFromMatchRows
} from '../services/matchStatsMatchingService';

const router = express.Router();

const resolveIdentityForTournamentGame = (user: any, game: string) => {
  const profiles = Array.isArray(user?.gameProfiles) ? user.gameProfiles : [];
  const normalizedGame = String(game || '').trim().toLowerCase();
  const byGame = profiles.find((profile: any) => String(profile?.game || '').trim().toLowerCase() === normalizedGame);
  const fallback = profiles[0];
  const selected = byGame || fallback || {};
  const nickname = String(selected?.username || user?.username || user?.firstName || '').trim();
  const ingameId = String(selected?.ingameId || '').trim();
  return { nickname, ingameId };
};

const buildTournamentPlayerIdentities = async (tournamentId: string): Promise<TournamentPlayerIdentity[]> => {
  const rows: any[] = await TournamentRegistration.find({
    tournamentId,
    status: { $in: ['active', 'pending'] }
  })
    .populate('userId', 'username firstName lastName profileLogo gameProfiles')
    .select('userId ingameNickname ingameId game')
    .lean();

  const unique = new Map<string, TournamentPlayerIdentity>();
  for (const row of rows) {
    const user = row?.userId || {};
    const userId = user?._id?.toString?.();
    if (!userId) continue;
    const identityFromUser = resolveIdentityForTournamentGame(user, row?.game || '');
    const ingameNickname = String(row?.ingameNickname || identityFromUser.nickname || '').trim();
    const ingameId = String(row?.ingameId || identityFromUser.ingameId || '').trim();
    const displayName = String(user?.username || [user?.firstName, user?.lastName].filter(Boolean).join(' ') || '').trim();
    unique.set(userId, {
      userId,
      displayName,
      ingameNickname,
      ingameId,
      avatar: String(user?.profileLogo || '')
    });
  }
  return Array.from(unique.values());
};

router.use(authenticateJWT, isAdmin);

router.get('/tournaments/:id/player-identities', async (req, res) => {
  try {
    const tournamentId = String(req.params.id || '').trim();
    if (!mongoose.Types.ObjectId.isValid(tournamentId)) {
      return res.status(400).json({ success: false, error: 'Invalid tournamentId' });
    }

    const players = await buildTournamentPlayerIdentities(tournamentId);
    return res.json({ success: true, data: players });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message || 'Failed to load player identities' });
  }
});

router.post('/parse-match-screenshot', uploadMemoryImage.single('image'), async (req: any, res) => {
  try {
    const tournamentId = String(req.body?.tournamentId || '').trim();
    const matchId = String(req.body?.matchId || '').trim();

    if (!mongoose.Types.ObjectId.isValid(tournamentId)) {
      return res.status(400).json({ success: false, error: 'Valid tournamentId is required' });
    }

    if (!req.file?.buffer) {
      return res.status(400).json({ success: false, error: 'Screenshot image file is required (field: image)' });
    }

    const tournament: any = await Tournament.findById(tournamentId).select('_id game').lean();
    if (!tournament) {
      return res.status(404).json({ success: false, error: 'Tournament not found' });
    }

    const parsedRows = await parseMatchScreenshotWithGemini(req.file.buffer, req.file.mimetype || 'image/jpeg');
    const players = await buildTournamentPlayerIdentities(tournamentId);
    const suggestions = mapParsedRowsToTournamentPlayers(parsedRows, players);

    return res.json({
      success: true,
      data: {
        tournamentId,
        matchId: mongoose.Types.ObjectId.isValid(matchId) ? matchId : null,
        gameType: String(tournament?.game || 'Unknown'),
        parsedRows,
        suggestions,
        candidates: players
      }
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message || 'Failed to parse screenshot' });
  }
});

router.post('/match-stats/confirm', async (req: any, res) => {
  try {
    const tournamentId = String(req.body?.tournamentId || '').trim();
    const matchId = String(req.body?.matchId || '').trim();
    const gameType = String(req.body?.gameType || '').trim() || 'Unknown';
    const resultsRaw: any[] = Array.isArray(req.body?.results) ? req.body.results : [];

    if (!mongoose.Types.ObjectId.isValid(tournamentId)) {
      return res.status(400).json({ success: false, error: 'Valid tournamentId is required' });
    }
    if (!resultsRaw.length) {
      return res.status(400).json({ success: false, error: 'results array is required' });
    }

    const normalizedResults = resultsRaw.map((row: any) => ({
      userId: mongoose.Types.ObjectId.isValid(String(row?.userId || '')) ? new mongoose.Types.ObjectId(String(row.userId)) : undefined,
      ingameNickname: String(row?.ingameNickname || row?.nickname || '').trim(),
      ingameId: String(row?.ingameId || '').trim(),
      stats: {
        kills: Math.max(0, Number(row?.stats?.kills ?? row?.kills ?? 0)),
        deaths: Math.max(0, Number(row?.stats?.deaths ?? row?.deaths ?? 0)),
        assists: Math.max(0, Number(row?.stats?.assists ?? row?.assists ?? 0)),
        damage: Math.max(0, Number(row?.stats?.damage ?? row?.damage ?? 0)),
        isMvp: Boolean(row?.stats?.isMvp ?? row?.mvp_status ?? row?.isMvp)
      }
    })).filter((row: any) => row.ingameNickname && row.ingameId);

    if (!normalizedResults.length) {
      return res.status(400).json({ success: false, error: 'No valid result rows to save' });
    }

    const doc = await MatchStats.create({
      matchId: mongoose.Types.ObjectId.isValid(matchId) ? new mongoose.Types.ObjectId(matchId) : undefined,
      tournamentId: new mongoose.Types.ObjectId(tournamentId),
      gameType,
      results: normalizedResults,
      createdBy: req.user?._id || req.user?.id
    });

    await updateUserStatsFromMatchRows(
      normalizedResults.map((row: any) => ({
        userId: row?.userId?.toString?.() || null,
        parsed: {
          nickname: row.ingameNickname,
          kills: row.stats.kills,
          deaths: row.stats.deaths,
          assists: row.stats.assists,
          mvp_status: row.stats.isMvp,
          damage: row.stats.damage
        }
      }))
    );

    return res.status(201).json({
      success: true,
      data: {
        id: String(doc._id),
        tournamentId,
        matchId: mongoose.Types.ObjectId.isValid(matchId) ? matchId : null
      }
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message || 'Failed to save match stats' });
  }
});

export default router;
