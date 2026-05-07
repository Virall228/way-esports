import express from 'express';
import mongoose from 'mongoose';
import Match from '../models/Match';
import Team from '../models/Team';
import User from '../models/User';
import { authenticateJWT } from '../middleware/auth';
import { getSupportedGameQuery } from '../config/games';

const router = express.Router();

type TournamentHistoryBucket = {
  tournamentId: string;
  tournamentName: string;
  game: string;
  status: string;
  startDate: Date | null;
  endDate: Date | null;
  image: string | null;
  matches: number;
  wins: number;
  losses: number;
  winRate: number;
  lastMatchAt: Date | null;
};

const parsePositiveInt = (value: any, fallback: number) => {
  const n = Number(value);
  if (!Number.isFinite(n) || n <= 0) return fallback;
  return Math.floor(n);
};

const getSortOrder = (sort: string): any => (
  sort === 'oldest'
    ? { endTime: 1 as const, startTime: 1 as const, createdAt: 1 as const }
    : { endTime: -1 as const, startTime: -1 as const, createdAt: -1 as const }
);

const recalcTotals = (rows: TournamentHistoryBucket[]) => {
  const totals = rows.reduce(
    (acc, row) => {
      acc.tournaments += 1;
      acc.matches += row.matches;
      acc.wins += row.wins;
      acc.losses += row.losses;
      return acc;
    },
    { tournaments: 0, matches: 0, wins: 0, losses: 0, winRate: 0 }
  );
  totals.winRate = totals.matches > 0 ? Math.round((totals.wins / totals.matches) * 1000) / 10 : 0;
  return totals;
};

const paginate = <T>(rows: T[], page: number, limit: number) => {
  const total = rows.length;
  const totalPages = total > 0 ? Math.ceil(total / limit) : 0;
  const offset = (page - 1) * limit;
  const items = rows.slice(offset, offset + limit);
  return { items, pagination: { page, limit, total, totalPages } };
};

const getTeamIdsForUser = async (userId: string) => {
  const teams = await Team.find({
    $or: [{ members: userId }, { captain: userId }]
  })
    .select('_id')
    .lean();
  return teams.map((t: any) => t._id?.toString?.()).filter(Boolean);
};

const buildTournamentMatchQuery = (teamIds: string[], options: { game?: string; from?: Date | null; to?: Date | null }) => {
  const query: any = {
    status: 'completed',
    tournament: { $exists: true, $ne: null },
    $or: [{ team1: { $in: teamIds } }, { team2: { $in: teamIds } }]
  };
  const gameQuery = getSupportedGameQuery(options.game);
  if (gameQuery) query.game = gameQuery;
  if (options.from || options.to) {
    query.startTime = {};
    if (options.from) query.startTime.$gte = options.from;
    if (options.to) query.startTime.$lte = options.to;
  }
  return query;
};

const loadHistoryRows = async (teamIds: string[], opts: { game?: string; status?: string; sort?: string; from?: Date | null; to?: Date | null }) => {
  if (!teamIds.length) return { rows: [] as TournamentHistoryBucket[], totals: { tournaments: 0, matches: 0, wins: 0, losses: 0, winRate: 0 } };

  const matches = await Match.find(buildTournamentMatchQuery(teamIds, { game: opts.game, from: opts.from, to: opts.to }))
    .select('tournament team1 team2 winner game startTime endTime createdAt')
    .populate('tournament', 'name game status startDate endDate image coverImage')
    .sort(getSortOrder(String(opts.sort || 'recent')))
    .lean();

  let { rows, totals } = mapHistory(matches, new Set(teamIds));
  if (opts.status) {
    rows = rows.filter((row) => String(row.status).toLowerCase() === String(opts.status).toLowerCase());
    totals = recalcTotals(rows);
  }
  return { rows, totals };
};

const loadDetailedHistoryRows = async (teamIds: string[], opts: { game?: string; sort?: string; from?: Date | null; to?: Date | null }) => {
  if (!teamIds.length) return [] as any[];
  const allMatches = await Match.find(buildTournamentMatchQuery(teamIds, { game: opts.game, from: opts.from, to: opts.to }))
    .select('tournament team1 team2 winner game score round map startTime endTime createdAt')
    .populate('team1', 'name tag')
    .populate('team2', 'name tag')
    .populate('tournament', 'name game')
    .sort(getSortOrder(String(opts.sort || 'recent')))
    .lean();
  return mapDetailedMatches(allMatches, new Set(teamIds));
};

const buildHistoryCsv = (rows: TournamentHistoryBucket[]) => {
  const header = ['tournamentId', 'tournamentName', 'game', 'matches', 'wins', 'losses', 'winRate', 'lastMatchAt'];
  const body = rows.map((row) => ([
    toCsvCell(row.tournamentId),
    toCsvCell(row.tournamentName),
    toCsvCell(row.game),
    row.matches,
    row.wins,
    row.losses,
    row.winRate,
    toCsvCell(row.lastMatchAt ? new Date(row.lastMatchAt).toISOString() : '')
  ].join(',')));
  return [header.join(','), ...body].join('\n');
};

const toDate = (value: any) => {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const toCsvCell = (value: any) => {
  const text = String(value ?? '');
  return `"${text.replace(/"/g, '""')}"`;
};

const getRequesterId = (req: any) => req?.user?._id?.toString?.() || req?.user?.id || '';

const isAdminRole = (req: any) => {
  const role = String(req?.user?.role || '');
  return role === 'admin' || role === 'developer';
};

const hasActiveSubscription = (user: any) => {
  if (!user?.isSubscribed) return false;
  if (!user?.subscriptionExpiresAt) return true;
  const expires = new Date(user.subscriptionExpiresAt).getTime();
  return Number.isFinite(expires) && expires > Date.now();
};

const assertPlayerPremiumAccess = async (req: any, targetUserId: string) => {
  const requesterId = getRequesterId(req);
  if (!requesterId) return { ok: false, status: 401, error: 'Authentication required' };
  if (isAdminRole(req)) return { ok: true };
  if (requesterId !== targetUserId) return { ok: false, status: 403, error: 'Forbidden' };

  const requester = await User.findById(requesterId).select('isSubscribed subscriptionExpiresAt').lean();
  if (!hasActiveSubscription(requester)) {
    return { ok: false, status: 402, error: 'Active subscription required for this feature' };
  }
  return { ok: true };
};

const assertTeamPremiumAccess = async (req: any, teamId: string) => {
  const requesterId = getRequesterId(req);
  if (!requesterId) return { ok: false, status: 401, error: 'Authentication required' };
  if (isAdminRole(req)) return { ok: true };

  const team = await Team.findById(teamId).select('captain members').lean();
  if (!team) return { ok: false, status: 404, error: 'Team not found' };
  const captainId = team?.captain?.toString?.() || '';
  const memberIds = Array.isArray(team?.members) ? team.members.map((m: any) => m.toString()) : [];
  if (captainId !== requesterId && !memberIds.includes(requesterId)) {
    return { ok: false, status: 403, error: 'Forbidden' };
  }

  const requester = await User.findById(requesterId).select('isSubscribed subscriptionExpiresAt').lean();
  if (!hasActiveSubscription(requester)) {
    return { ok: false, status: 402, error: 'Active subscription required for this feature' };
  }
  return { ok: true };
};

const mapHistory = (matches: any[], trackedTeamIds: Set<string>) => {
  const byTournament = new Map<string, TournamentHistoryBucket>();

  for (const match of matches) {
    const tournament = match?.tournament;
    const tournamentId = tournament?._id?.toString?.() || '';
    if (!tournamentId) continue;

    const team1Id = match?.team1?._id?.toString?.() || match?.team1?.toString?.() || '';
    const team2Id = match?.team2?._id?.toString?.() || match?.team2?.toString?.() || '';
    const winnerId = match?.winner?._id?.toString?.() || match?.winner?.toString?.() || '';

    const trackedTeamId = trackedTeamIds.has(team1Id) ? team1Id : trackedTeamIds.has(team2Id) ? team2Id : '';
    if (!trackedTeamId) continue;

    const bucket = byTournament.get(tournamentId) || {
      tournamentId,
      tournamentName: tournament?.name || 'Tournament',
      game: tournament?.game || match?.game || 'Unknown',
      status: tournament?.status || 'unknown',
      startDate: tournament?.startDate || null,
      endDate: tournament?.endDate || null,
      image: tournament?.coverImage || tournament?.image || null,
      matches: 0,
      wins: 0,
      losses: 0,
      winRate: 0,
      lastMatchAt: null
    };

    bucket.matches += 1;
    if (winnerId && winnerId === trackedTeamId) {
      bucket.wins += 1;
    } else {
      bucket.losses += 1;
    }

    const matchDate = match?.endTime || match?.startTime || match?.createdAt || null;
    if (matchDate) {
      if (!bucket.lastMatchAt || new Date(matchDate) > new Date(bucket.lastMatchAt)) {
        bucket.lastMatchAt = new Date(matchDate);
      }
    }

    byTournament.set(tournamentId, bucket);
  }

  const rows = Array.from(byTournament.values())
    .map((row) => ({
      ...row,
      winRate: row.matches > 0 ? Math.round((row.wins / row.matches) * 1000) / 10 : 0
    }))
    .sort((a, b) => {
      const left = a.lastMatchAt ? new Date(a.lastMatchAt).getTime() : 0;
      const right = b.lastMatchAt ? new Date(b.lastMatchAt).getTime() : 0;
      return right - left;
    });

  const totals = rows.reduce(
    (acc, row) => {
      acc.tournaments += 1;
      acc.matches += row.matches;
      acc.wins += row.wins;
      acc.losses += row.losses;
      return acc;
    },
    { tournaments: 0, matches: 0, wins: 0, losses: 0 }
  );

  const winRate = totals.matches > 0 ? Math.round((totals.wins / totals.matches) * 1000) / 10 : 0;

  return { rows, totals: { ...totals, winRate } };
};

const mapDetailedMatches = (matches: any[], trackedTeamIds: Set<string>) => {
  return matches.map((match: any) => {
    const team1Id = match?.team1?._id?.toString?.() || match?.team1?.toString?.() || '';
    const team2Id = match?.team2?._id?.toString?.() || match?.team2?.toString?.() || '';
    const isTeam1 = trackedTeamIds.has(team1Id);
    const trackedTeam = isTeam1 ? match?.team1 : match?.team2;
    const opponentTeam = isTeam1 ? match?.team2 : match?.team1;
    const winnerId = match?.winner?._id?.toString?.() || match?.winner?.toString?.() || '';
    const trackedTeamId = trackedTeam?._id?.toString?.() || trackedTeam?.toString?.() || '';
    const result = winnerId && trackedTeamId && winnerId === trackedTeamId ? 'win' : 'loss';
    const scoreTeam = isTeam1 ? Number(match?.score?.team1 || 0) : Number(match?.score?.team2 || 0);
    const scoreOpponent = isTeam1 ? Number(match?.score?.team2 || 0) : Number(match?.score?.team1 || 0);

    return {
      matchId: String(match?._id || ''),
      tournamentId: match?.tournament?._id?.toString?.() || '',
      tournamentName: match?.tournament?.name || 'Tournament',
      game: match?.game || match?.tournament?.game || 'Unknown',
      result,
      score: `${scoreTeam}-${scoreOpponent}`,
      myScore: scoreTeam,
      opponentScore: scoreOpponent,
      opponentTeam: {
        id: opponentTeam?._id?.toString?.() || '',
        name: opponentTeam?.name || 'Team',
        tag: opponentTeam?.tag || ''
      },
      round: match?.round || '',
      map: match?.map || '',
      playedAt: match?.endTime || match?.startTime || match?.createdAt || null
    };
  });
};

router.get('/player/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ success: false, error: 'Invalid user id' });
    }

    const page = parsePositiveInt(req.query.page, 1);
    const limit = Math.min(parsePositiveInt(req.query.limit, 20), 100);
    const game = String(req.query.game || '').trim();
    const status = String(req.query.status || '').trim();
    const sort = String(req.query.sort || 'recent').trim();
    const from = toDate(req.query.from);
    const to = toDate(req.query.to);

    const teamIds = await getTeamIdsForUser(userId);
    if (!teamIds.length) {
      return res.json({
        success: true,
        data: {
          summary: { tournaments: 0, matches: 0, wins: 0, losses: 0, winRate: 0 },
          items: [],
          pagination: { page, limit, total: 0, totalPages: 0 }
        }
      });
    }

    const { rows, totals } = await loadHistoryRows(teamIds, { game, status, sort, from, to });
    const { items, pagination } = paginate(rows, page, limit);

    return res.json({
      success: true,
      data: {
        summary: totals,
        items,
        pagination
      }
    });
  } catch (error) {
    console.error('Failed to fetch player tournament history:', error);
    return res.status(500).json({ success: false, error: 'Failed to fetch player history' });
  }
});

router.get('/team/:teamId', async (req, res) => {
  try {
    const { teamId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(teamId)) {
      return res.status(400).json({ success: false, error: 'Invalid team id' });
    }

    const page = parsePositiveInt(req.query.page, 1);
    const limit = Math.min(parsePositiveInt(req.query.limit, 20), 100);
    const game = String(req.query.game || '').trim();
    const status = String(req.query.status || '').trim();
    const sort = String(req.query.sort || 'recent').trim();
    const from = toDate(req.query.from);
    const to = toDate(req.query.to);

    const { rows, totals } = await loadHistoryRows([teamId], { game, status, sort, from, to });
    const { items, pagination } = paginate(rows, page, limit);

    return res.json({
      success: true,
      data: {
        summary: totals,
        items,
        pagination
      }
    });
  } catch (error) {
    console.error('Failed to fetch team tournament history:', error);
    return res.status(500).json({ success: false, error: 'Failed to fetch team history' });
  }
});

router.get('/player/:userId/matches', authenticateJWT, async (req, res) => {
  try {
    const { userId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ success: false, error: 'Invalid user id' });
    }

    const access = await assertPlayerPremiumAccess(req, userId);
    if (!access.ok) {
      return res.status(access.status || 403).json({ success: false, error: access.error || 'Forbidden' });
    }

    const page = parsePositiveInt(req.query.page, 1);
    const limit = Math.min(parsePositiveInt(req.query.limit, 15), 100);
    const game = String(req.query.game || '').trim();
    const sort = String(req.query.sort || 'recent').trim();
    const from = toDate(req.query.from);
    const to = toDate(req.query.to);

    const teamIds = await getTeamIdsForUser(userId);
    if (!teamIds.length) {
      return res.json({
        success: true,
        data: { items: [], pagination: { page, limit, total: 0, totalPages: 0 } }
      });
    }

    const details = await loadDetailedHistoryRows(teamIds, { game, sort, from, to });
    const { items, pagination } = paginate(details, page, limit);

    return res.json({
      success: true,
      data: {
        items,
        pagination
      }
    });
  } catch (error) {
    console.error('Failed to fetch player detailed history:', error);
    return res.status(500).json({ success: false, error: 'Failed to fetch player matches history' });
  }
});

router.get('/team/:teamId/matches', authenticateJWT, async (req, res) => {
  try {
    const { teamId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(teamId)) {
      return res.status(400).json({ success: false, error: 'Invalid team id' });
    }

    const access = await assertTeamPremiumAccess(req, teamId);
    if (!access.ok) {
      return res.status(access.status || 403).json({ success: false, error: access.error || 'Forbidden' });
    }

    const page = parsePositiveInt(req.query.page, 1);
    const limit = Math.min(parsePositiveInt(req.query.limit, 15), 100);
    const game = String(req.query.game || '').trim();
    const sort = String(req.query.sort || 'recent').trim();
    const from = toDate(req.query.from);
    const to = toDate(req.query.to);

    const details = await loadDetailedHistoryRows([teamId], { game, sort, from, to });
    const { items, pagination } = paginate(details, page, limit);

    return res.json({
      success: true,
      data: {
        items,
        pagination
      }
    });
  } catch (error) {
    console.error('Failed to fetch team detailed history:', error);
    return res.status(500).json({ success: false, error: 'Failed to fetch team matches history' });
  }
});

router.get('/player/:userId/export.csv', authenticateJWT, async (req, res) => {
  try {
    const { userId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ success: false, error: 'Invalid user id' });
    }

    const access = await assertPlayerPremiumAccess(req, userId);
    if (!access.ok) {
      return res.status(access.status || 403).json({ success: false, error: access.error || 'Forbidden' });
    }

    const teamIds = await getTeamIdsForUser(userId);
    if (!teamIds.length) {
      return res.status(200).send('tournamentId,tournamentName,game,matches,wins,losses,winRate,lastMatchAt');
    }

    const { rows } = await loadHistoryRows(teamIds, { sort: 'recent' });

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="player-${userId}-tournament-history.csv"`);
    return res.status(200).send(buildHistoryCsv(rows));
  } catch (error) {
    console.error('Failed to export player history CSV:', error);
    return res.status(500).json({ success: false, error: 'Failed to export player history' });
  }
});

router.get('/team/:teamId/export.csv', authenticateJWT, async (req, res) => {
  try {
    const { teamId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(teamId)) {
      return res.status(400).json({ success: false, error: 'Invalid team id' });
    }

    const access = await assertTeamPremiumAccess(req, teamId);
    if (!access.ok) {
      return res.status(access.status || 403).json({ success: false, error: access.error || 'Forbidden' });
    }

    const { rows } = await loadHistoryRows([teamId], { sort: 'recent' });

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="team-${teamId}-tournament-history.csv"`);
    return res.status(200).send(buildHistoryCsv(rows));
  } catch (error) {
    console.error('Failed to export team history CSV:', error);
    return res.status(500).json({ success: false, error: 'Failed to export team history' });
  }
});

export const historyTestUtils = {
  parsePositiveInt,
  toDate,
  getSortOrder,
  recalcTotals,
  paginate,
  mapHistory,
  mapDetailedMatches,
  buildHistoryCsv
};

export default router;
