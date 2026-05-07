import express, { Request, Response } from 'express';
import mongoose from 'mongoose';
import Tournament, { ITournament } from '../models/Tournament';
import Match from '../models/Match';
import MatchEvent from '../models/MatchEvent';
import Team from '../models/Team';
import User from '../models/User';
import TournamentRegistration from '../models/TournamentRegistration';
import { authenticateJWT, isAdmin } from '../middleware/auth';
import { checkTournamentAccess, checkTournamentRegistration } from '../middleware/tournamentAccess';
import { detectReferralFraud } from '../middleware/fraudDetection';
import { logTournamentEvent } from '../services/loggingService';
import cacheService from '../services/cacheService';
import { body } from 'express-validator';
import { validateRequest } from '../middleware/validate';
import { idempotency } from '../middleware/idempotency';
import { buildPaginationMeta, parsePagination } from '../utils/pagination';
import { getSupportedGameQuery, normalizeSupportedGame } from '../config/games';

// Временные заглушки для новых middleware
const handleTournamentConcurrency = async (req: any, res: any, next: any) => next();
// Rate limit implementation (Simple memory store for now, replace with Redis for multi-instance)
const registrationRateLimit = new Map<string, number[]>();

const rateLimitRegistration = (limit: number, windowMs: number) => (req: any, res: any, next: any) => {
  const userId = req.user?._id?.toString() || req.ip;
  const now = Date.now();

  const timestamps = registrationRateLimit.get(userId) || [];
  const validTimestamps = timestamps.filter(t => now - t < windowMs);

  if (validTimestamps.length >= limit) {
    return res.status(429).json({ success: false, error: 'Too many registration attempts. Please try again later.' });
  }

  validTimestamps.push(now);
  registrationRateLimit.set(userId, validTimestamps);
  next();
};



const validateReferralCompletion = async (req: any, res: any, next: any) => {
  // Logic moved to successful registration block
  next();
};

const router = express.Router();
const MATCH_INTERVAL_MIN = 30;

const DAY_MS = 24 * 60 * 60 * 1000;

const inferTournamentCadence = (tournament: any): 'daily' | 'weekly' | 'custom' => {
  const explicit = String(tournament?.cadence || '').toLowerCase();
  if (explicit === 'daily' || explicit === 'weekly' || explicit === 'custom') {
    return explicit as 'daily' | 'weekly' | 'custom';
  }

  const start = tournament?.startDate ? new Date(tournament.startDate) : null;
  const end = tournament?.endDate ? new Date(tournament.endDate) : null;
  if (!start || !end || Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return 'custom';
  }

  const days = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / DAY_MS));
  if (days <= 1) return 'daily';
  if (days <= 7) return 'weekly';
  return 'custom';
};

const inferTournamentTeamMode = (tournament: any): '2v2' | '5v5' | 'custom' => {
  const explicitSize = Number(tournament?.teamSize || 0);
  if (explicitSize === 2) return '2v2';
  if (explicitSize === 5) return '5v5';
  const maxPlayers = Number(tournament?.maxPlayers || 0);
  if (maxPlayers === 2) return '2v2';
  if (maxPlayers === 5) return '5v5';
  return 'custom';
};

const normalizeTournamentImageUrl = (input: unknown): string => {
  if (typeof input !== 'string') return '';
  const trimmed = input.trim();
  if (!trimmed) return '';

  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }

  const normalized = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
  if (normalized.startsWith('/api/uploads/') || normalized.startsWith('/uploads/')) {
    return normalized;
  }

  throw new Error('Tournament image must be an uploaded image URL');
};

const generateBracketMatches = async (tournament: any) => {
  if (!tournament || tournament.type !== 'team') return [];
  if (Array.isArray(tournament.matches) && tournament.matches.length > 0) return tournament.matches;

  const participants = Array.isArray(tournament.registeredTeams)
    ? tournament.registeredTeams.map((id: any) => id?.toString?.() || String(id)).filter(Boolean)
    : [];

  if (participants.length < 2) return [];

  const shuffled = [...participants].sort(() => Math.random() - 0.5);
  const createdIds: any[] = [];
  const baseStart = tournament.startDate instanceof Date ? tournament.startDate : new Date();
  let slot = 0;

  for (let i = 0; i < shuffled.length - 1; i += 2) {
    const team1 = shuffled[i];
    const team2 = shuffled[i + 1];
    const startTime = new Date(baseStart.getTime() + slot * MATCH_INTERVAL_MIN * 60 * 1000);
    slot += 1;

    const match = await Match.create({
      tournament: tournament._id,
      team1,
      team2,
      startTime,
      status: 'scheduled',
      game: normalizeSupportedGame(tournament.game),
      round: 'Round 1',
      score: { team1: 0, team2: 0 }
    });

    createdIds.push(match._id);
  }

  if (!createdIds.length) return [];

  tournament.matches = createdIds;
  tournament.bracket = { matches: createdIds };
  await tournament.save();

  return createdIds;
};

const consumeTournamentEntry = async (user: any): Promise<boolean> => {
  if (!user || typeof user.hasActiveSubscription !== 'function' || typeof user.useFreeEntry !== 'function') {
    return false;
  }

  if (user.hasActiveSubscription()) {
    return false;
  }

  try {
    return await user.useFreeEntry();
  } catch (error) {
    console.error('Failed to consume tournament entry:', error);
    return false;
  }
};

const buildTeamParticipantRows = (team: any): Array<{ userId: string; role: 'owner' | 'member' }> => {
  const rows = new Map<string, 'owner' | 'member'>();
  const captainId = team?.captain?.toString?.();
  if (captainId) {
    rows.set(captainId, 'owner');
  }

  const addMember = (value: any) => {
    const userId = value?.toString?.();
    if (!userId) return;
    if (!rows.has(userId)) {
      rows.set(userId, 'member');
    }
  };

  if (Array.isArray(team?.members)) {
    team.members.forEach(addMember);
  }
  if (Array.isArray(team?.players)) {
    team.players.forEach(addMember);
  }

  return Array.from(rows.entries()).map(([userId, role]) => ({ userId, role }));
};

const normalizeIdentityValue = (value: unknown): string => String(value || '').trim();

const upsertUserGameIdentity = async (
  userId: string,
  game: string,
  ingameNickname: string,
  ingameId: string
) => {
  const user: any = await User.findById(userId);
  if (!user) return;
  const normalizedGame = normalizeIdentityValue(game);
  if (!normalizedGame) return;
  const profiles = Array.isArray(user.gameProfiles) ? user.gameProfiles : [];
  const existing = profiles.find((item: any) => normalizeIdentityValue(item?.game).toLowerCase() === normalizedGame.toLowerCase());
  if (existing) {
    existing.username = ingameNickname;
    existing.ingameId = ingameId;
  } else {
    profiles.push({
      game: normalizedGame,
      username: ingameNickname,
      ingameId
    });
    user.gameProfiles = profiles;
  }
  await user.save();
};

const resolveUserIdentityForGame = (user: any, game: string) => {
  const normalizedGame = normalizeIdentityValue(game).toLowerCase();
  const profiles = Array.isArray(user?.gameProfiles) ? user.gameProfiles : [];
  const byGame = profiles.find((profile: any) => normalizeIdentityValue(profile?.game).toLowerCase() === normalizedGame);
  const fallback = profiles[0];
  const selected = byGame || fallback || {};

  const ingameNickname = normalizeIdentityValue(selected?.username || user?.username || user?.firstName || '');
  const ingameId = normalizeIdentityValue(selected?.ingameId || '');
  return { ingameNickname, ingameId };
};

const buildTeamParticipantRowsWithIdentity = async (
  team: any,
  game: string
): Promise<Array<{ userId: string; role: 'owner' | 'member'; ingameNickname: string; ingameId: string }>> => {
  const rows = buildTeamParticipantRows(team);
  if (!rows.length) return [];

  const userDocs: any[] = await User.find({ _id: { $in: rows.map((row) => new mongoose.Types.ObjectId(row.userId)) } })
    .select('_id username firstName gameProfiles')
    .lean();
  const byUserId = new Map<string, any>(userDocs.map((doc: any) => [String(doc._id), doc]));

  return rows.map((row) => {
    const userDoc = byUserId.get(row.userId) || {};
    const identity = resolveUserIdentityForGame(userDoc, game);
    return {
      ...row,
      ingameNickname: identity.ingameNickname,
      ingameId: identity.ingameId
    };
  });
};

const handleTournamentRegistration = async (req: any, res: any) => {
  try {
    const user = req.tournamentUser || req.user;
    const { teamId } = req.body;
    const ingameNickname = normalizeIdentityValue(req.body?.ingameNickname);
    const ingameId = normalizeIdentityValue(req.body?.ingameId);
    const userId = user?._id?.toString?.() || user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Authentication required' });
    }
    const tournamentId = req.params.id;
    let teamForRegistration: any = null;
    const isAdminRole = (req.user as any)?.role === 'admin' || (req.user as any)?.role === 'developer';

    const existing: any = await Tournament.findById(tournamentId).lean();
    if (!existing) return res.status(404).json({ success: false, error: 'Tournament not found' });

    if (!ingameNickname || !ingameId) {
      return res.status(400).json({
        success: false,
        error: 'ingameNickname and ingameId are required'
      });
    }

    await upsertUserGameIdentity(userId, existing.game || '', ingameNickname, ingameId);

    if (existing.status !== 'upcoming' && existing.status !== 'open') {
      return res.status(400).json({ success: false, error: 'Tournament registration is closed' });
    }

    if (teamId) {
      const team: any = await Team.findById(teamId).select('captain members players tournamentId').lean();
      if (!team) {
        return res.status(404).json({ success: false, error: 'Team not found' });
      }

      if (!team.tournamentId) {
        return res.status(400).json({ success: false, error: 'Team is not linked to a tournament' });
      }

      teamForRegistration = team;

      if (team.tournamentId && team.tournamentId.toString() !== tournamentId) {
        return res.status(400).json({ success: false, error: 'Team is linked to a different tournament' });
      }

      const isMember = !!userId && (
        team.captain?.toString?.() === userId ||
        (Array.isArray(team.members) && team.members.some((m: any) => m.toString?.() === userId)) ||
        (Array.isArray(team.players) && team.players.some((p: any) => p.toString?.() === userId))
      );

      if (!isAdminRole && !isMember) {
        return res.status(403).json({ success: false, error: 'Not authorized to register this team' });
      }

      if (userId) {
        const existingRegistration: any = await TournamentRegistration.findOne({
          userId,
          tournamentId,
          status: { $in: ['active', 'pending'] }
        }).select('teamId').lean();

        if (existingRegistration?.teamId && existingRegistration.teamId.toString() !== teamId) {
          return res.status(409).json({ success: false, error: 'You are already participating in this tournament' });
        }
      }

      const isAlreadyRegistered = Array.isArray(existing.registeredTeams) &&
        existing.registeredTeams.some((value: any) => value.toString() === teamId);
      if (isAlreadyRegistered) {
        return res.status(400).json({ success: false, error: 'Your team is already registered for this tournament' });
      }

      const hasPendingRequest = Array.isArray(existing.registrationRequests) && existing.registrationRequests.some((entry: any) => (
        entry?.status === 'pending' && entry?.team?.toString?.() === teamId
      ));
      if (hasPendingRequest) {
        return res.status(409).json({ success: false, error: 'Team request already pending admin approval' });
      }
    }

    const needsAdminApproval = Boolean(teamId && existing.type === 'team' && !isAdminRole);
    if (needsAdminApproval) {
      const teamLimit = Number(existing.maxTeams || 0);
      const approvedCount = Array.isArray(existing.registeredTeams) ? existing.registeredTeams.length : 0;
      if (teamLimit > 0 && approvedCount >= teamLimit) {
        return res.status(400).json({ success: false, error: 'Tournament is full' });
      }

      const pendingRequestPayload = {
        team: new mongoose.Types.ObjectId(teamId),
        requestedBy: new mongoose.Types.ObjectId(userId),
        status: 'pending' as const,
        requestedAt: new Date()
      };

      const pendingTournament: any = await Tournament.findOneAndUpdate(
        {
          _id: tournamentId,
          registeredTeams: { $ne: teamId },
          registrationRequests: {
            $not: {
              $elemMatch: {
                team: new mongoose.Types.ObjectId(teamId),
                status: 'pending'
              }
            }
          }
        },
        {
          $push: {
            registrationRequests: pendingRequestPayload
          }
        },
        { new: true }
      ).lean();

      if (!pendingTournament) {
        return res.status(409).json({
          success: false,
          error: 'Team request already pending admin approval'
        });
      }

      if (userId) {
        const role = teamForRegistration?.captain?.toString?.() === userId ? 'owner' : 'member';
        await TournamentRegistration.findOneAndUpdate(
          { userId, tournamentId },
          {
            $set: {
              teamId,
              game: String(existing.game || ''),
              ingameNickname,
              ingameId,
              role,
              status: 'pending'
            }
          },
          { upsert: true, new: true, setDefaultsOnInsert: true }
        );
      }

      await cacheService.invalidateTournamentCaches();
      invalidateAdminOverviewCache(String(tournamentId || ''));

      return res.json({
        success: true,
        pendingApproval: true,
        message: 'Team registration request submitted. Waiting for admin approval.',
        data: {
          tournamentId,
          teamId,
          status: 'pending'
        }
      });
    }

    const conditions: any = {
      _id: tournamentId,
      registeredPlayers: { $ne: user._id }
    };

    const update: any = {
      $addToSet: { registeredPlayers: user._id }
    };

    if (teamId && existing.type === 'team') {
      conditions['$expr'] = { $lt: [{ $size: '$registeredTeams' }, '$maxTeams'] };
      conditions['registeredTeams'] = { $ne: teamId };
      update['$addToSet']['registeredTeams'] = teamId;
    } else if (existing.type === 'solo') {
      conditions['$expr'] = {
        $lt: [
          { $size: '$registeredPlayers' },
          { $ifNull: ['$maxParticipants', '$maxTeams'] }
        ]
      };
    } else {
      conditions['$expr'] = { $lt: [{ $size: '$registeredTeams' }, '$maxTeams'] };
    }

    const updatedTournament: any = await Tournament.findOneAndUpdate(
      conditions,
      update,
      { new: true }
    ).lean();

    if (!updatedTournament) {
      const current = await Tournament.findById(tournamentId).lean();
      if (!current) return res.status(404).json({ success: false, error: 'Tournament not found' });

      const isPlayerRegistered = Array.isArray(current.registeredPlayers) &&
        current.registeredPlayers.some((value: any) => value.toString() === user._id?.toString?.());
      if (isPlayerRegistered) {
        return res.status(400).json({ success: false, error: 'You are already registered for this tournament' });
      }

      const isTeamRegistered = teamId && Array.isArray(current.registeredTeams) &&
        current.registeredTeams.some((value: any) => value.toString() === teamId);
      if (isTeamRegistered) {
        return res.status(400).json({ success: false, error: 'Your team is already registered for this tournament' });
      }

      const teamLimit = current.maxTeams;
      const soloLimit = current.maxParticipants ?? current.maxTeams;
      const isTeamFull = typeof teamLimit === 'number' && teamLimit > 0 &&
        (current.registeredTeams?.length || 0) >= teamLimit;
      const isSoloFull = typeof soloLimit === 'number' && soloLimit > 0 &&
        (current.registeredPlayers?.length || 0) >= soloLimit;
      const isFull = (current.type === 'team' && isTeamFull) ||
        (current.type === 'solo' && isSoloFull);

      if (isFull) {
        return res.status(400).json({ success: false, error: 'Tournament is full' });
      }

      return res.status(400).json({ success: false, error: 'Registration failed or already registered' });
    }

    if (teamId && teamForRegistration) {
      const participantRows = await buildTeamParticipantRowsWithIdentity(teamForRegistration, String(existing.game || ''));
      const missingIdentity = participantRows.filter((row) => !row.ingameNickname || !row.ingameId);
      if (missingIdentity.length) {
        return res.status(400).json({
          success: false,
          error: 'Every team member must have ingameNickname and ingameId linked in profile before registration',
          missingUserIds: missingIdentity.map((row) => row.userId)
        });
      }
      const participantIds = participantRows.map((row) => row.userId);

      if (participantIds.length) {
        await Tournament.findByIdAndUpdate(tournamentId, {
          $addToSet: { registeredPlayers: { $each: participantIds } }
        });

        await Promise.all(
          participantRows.map((row) => TournamentRegistration.findOneAndUpdate(
            { userId: row.userId, tournamentId },
            {
              $set: {
                teamId,
                game: String(existing.game || ''),
                ingameNickname: row.ingameNickname,
                ingameId: row.ingameId,
                role: row.role,
                status: 'active'
              }
            },
            { upsert: true, new: true, setDefaultsOnInsert: true }
          ))
        );

        await User.updateMany(
          { _id: { $in: participantIds.map((value) => new mongoose.Types.ObjectId(value)) } },
          { $addToSet: { participatingTournaments: tournamentId } }
        );
      }
    } else if (userId) {
      await User.findByIdAndUpdate(userId, {
        $addToSet: { participatingTournaments: tournamentId }
      });
    }

    const freshTournament: any = await Tournament.findById(tournamentId)
      .populate('registeredTeams', 'name tag logo members')
      .populate('registeredPlayers', 'username firstName lastName')
      .lean();

    const transformed = {
      id: String(freshTournament._id),
      name: freshTournament.name,
      title: freshTournament.name,
      game: freshTournament.game,
      status: freshTournament.status === 'ongoing' ? 'in_progress' : freshTournament.status,
      startDate: freshTournament.startDate?.toISOString(),
      endDate: freshTournament.endDate?.toISOString(),
      prizePool: freshTournament.prizePool || 0,
      maxTeams: freshTournament.maxTeams || 0,
      maxParticipants: freshTournament.maxParticipants ?? freshTournament.maxTeams ?? 0,
      registeredTeams: (freshTournament.registeredTeams || []).map((team: any) => ({
        id: team._id?.toString() || team.toString(),
        name: team.name || '',
        tag: team.tag || '',
        logo: team.logo || '',
        players: team.members?.map((m: any) => m.toString()) || []
      })),
      registeredPlayers: (freshTournament.registeredPlayers || []).map((player: any) => ({
        id: player._id?.toString() || player.toString(),
        username: player.username || '',
        firstName: player.firstName || '',
        lastName: player.lastName || ''
      })),
      participants: freshTournament.registeredPlayers?.length || 0,
      currentParticipants: freshTournament.registeredPlayers?.length || 0
    };

    const usedFreeEntry = await consumeTournamentEntry(user);

    res.json({
      success: true,
      message: usedFreeEntry
        ? 'Successfully registered using free entry'
        : 'Successfully registered for tournament',
      usedFreeEntry,
      data: transformed
    });

    logTournamentEvent('registration_completed', {
      tournamentId: freshTournament._id,
      userId: user._id,
      usedFreeEntry,
      currentParticipants: freshTournament.registeredPlayers?.length || 0
    });

    await cacheService.invalidateTournamentCaches();
    invalidateAdminOverviewCache();
    await cacheService.invalidateUserCaches(user._id.toString());
  } catch (error) {
    console.error('Error registering for tournament:', error);
    logTournamentEvent('registration_failed', {
      tournamentId: req.params.id,
      userId: (req.user as any)?._id,
      error: (error as Error).message
    });
    res.status(500).json({
      success: false,
      error: 'Failed to register for tournament'
    });
  }
};

// Get all tournaments
router.get('/', async (req, res) => {
  try {
    const { game, status, search, cadence, teamMode } = req.query as { game?: string; status?: string; search?: string; cadence?: string; teamMode?: string };
    const { page, limit, skip } = parsePagination(req.query as Record<string, unknown>, {
      defaultLimit: 20,
      maxLimit: 100
    });
    const query: any = {};
    const cadenceFilter = ['daily', 'weekly'].includes(String(cadence || '').toLowerCase())
      ? String(cadence).toLowerCase() as 'daily' | 'weekly'
      : 'all';
    const teamModeFilter = ['2v2', '5v5'].includes(String(teamMode || '').toLowerCase())
      ? String(teamMode).toLowerCase() as '2v2' | '5v5'
      : 'all';

    if (game) {
      const gameQuery = getSupportedGameQuery(game);
      if (gameQuery) query.game = gameQuery;
    }
    if (status) query.status = status;
    if (search) {
      query.name = { $regex: search.trim(), $options: 'i' };
    }

    const selectFields = 'name game cadence teamSize image coverImage status type startDate endDate prizePool participants currentParticipants maxParticipants maxTeams maxPlayers registrationRequests';
    const canUseCache = !search && cadenceFilter === 'all' && teamModeFilter === 'all';
    const listKey = `tournaments:list:${game || 'all'}:${status || 'all'}:${cadenceFilter}:${teamModeFilter}:${page}:${limit}`;
    let tournaments: any[] = [];
    let total = 0;

    if (cadenceFilter === 'all' && teamModeFilter === 'all') {
      total = await Tournament.countDocuments(query);
      tournaments = canUseCache
        ? ((await cacheService.getOrSet(
            listKey,
            async () =>
              Tournament.find(query)
                .select(selectFields)
                .sort({ startDate: 1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            { key: listKey, ttl: 20 }
          )) || [])
        : await Tournament.find(query)
            .select(selectFields)
            .sort({ startDate: 1 })
            .skip(skip)
            .limit(limit)
            .lean();
    } else {
      const allRows: any[] = await Tournament.find(query)
        .select(selectFields)
        .sort({ startDate: 1 })
        .lean();
      const filteredRows = allRows.filter((row) => {
        const cadenceMatches = cadenceFilter === 'all' || inferTournamentCadence(row) === cadenceFilter;
        const teamModeMatches = teamModeFilter === 'all' || inferTournamentTeamMode(row) === teamModeFilter;
        return cadenceMatches && teamModeMatches;
      });
      total = filteredRows.length;
      tournaments = filteredRows.slice(skip, skip + limit);
    }

    // Transform for frontend compatibility
    const transformed = tournaments.map((t: any) => ({
      id: String(t._id),
      name: t.name,
      title: t.name,
      game: t.game,
      cadence: inferTournamentCadence(t),
      teamMode: inferTournamentTeamMode(t),
      teamSize: Number(t.teamSize || t.maxPlayers || 0) || undefined,
      image: t.image || t.coverImage || '',
      coverImage: t.coverImage || t.image || '',
      status: t.status,
      type: t.type || 'team',
      startDate: t.startDate,
      endDate: t.endDate,
      date: t.startDate ? new Date(t.startDate).toLocaleDateString() : 'TBD',
      prizePool: Number(t.prizePool || 0),
      participants: Number(t.participants ?? t.currentParticipants ?? 0),
      maxParticipants: Number(t.maxParticipants ?? t.maxTeams ?? 0),
      skillLevel: t.skillLevel || 'All Levels',
      pendingRequestsCount: Array.isArray(t.registrationRequests)
        ? t.registrationRequests.filter((entry: any) => entry?.status === 'pending').length
        : 0
    }));

    res.json({
      tournaments: transformed,
      pagination: buildPaginationMeta(page, limit, total)
    });
  } catch (error) {
    console.error('Error fetching tournaments:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch tournaments'
    });
  }
});

// Admin: export tournaments as CSV with same filters as list
router.get('/admin/export.csv', authenticateJWT, isAdmin, async (req: any, res: any) => {
  try {
    const game = typeof req.query?.game === 'string' ? req.query.game.trim() : '';
    const status = typeof req.query?.status === 'string' ? req.query.status.trim() : '';
    const search = typeof req.query?.search === 'string' ? req.query.search.trim() : '';
    const cadence = typeof req.query?.cadence === 'string' ? req.query.cadence.trim().toLowerCase() : '';
    const teamMode = typeof req.query?.teamMode === 'string' ? req.query.teamMode.trim().toLowerCase() : '';

    const query: any = {};
    if (game && game !== 'all') {
      const gameQuery = getSupportedGameQuery(game);
      if (gameQuery) query.game = gameQuery;
    }
    if (status && status !== 'all') query.status = status;
    if (search) query.name = { $regex: search, $options: 'i' };

    const rowsRaw: any[] = await Tournament.find(query)
      .select('name game cadence teamSize maxPlayers status startDate endDate prizePool maxTeams maxParticipants participants currentParticipants registeredPlayers registrationRequests')
      .sort({ startDate: 1 })
      .lean();
    const rows = rowsRaw.filter((row: any) => {
      const cadenceMatches = !cadence || cadence === 'all' || inferTournamentCadence(row) === cadence;
      const teamModeMatches = !teamMode || teamMode === 'all' || inferTournamentTeamMode(row) === teamMode;
      return cadenceMatches && teamModeMatches;
    });

    const csvCell = (value: any) => `"${String(value ?? '').replace(/"/g, '""')}"`;
    const header = [
      'id',
      'name',
      'game',
      'cadence',
      'teamMode',
      'status',
      'startDate',
      'endDate',
      'prizePool',
      'participants',
      'maxTeams',
      'pendingRequests'
    ];

    const data = rows.map((t: any) => {
      const participants = Number(t?.participants ?? t?.currentParticipants ?? (Array.isArray(t?.registeredPlayers) ? t.registeredPlayers.length : 0) ?? 0);
      const maxTeams = Number(t?.maxTeams ?? t?.maxParticipants ?? 0);
      const pendingRequests = Array.isArray(t?.registrationRequests)
        ? t.registrationRequests.filter((entry: any) => String(entry?.status || '').toLowerCase() === 'pending').length
        : 0;
      return [
        String(t?._id || ''),
        String(t?.name || ''),
        String(t?.game || ''),
        inferTournamentCadence(t),
        inferTournamentTeamMode(t),
        String(t?.status || ''),
        t?.startDate ? new Date(t.startDate).toISOString() : '',
        t?.endDate ? new Date(t.endDate).toISOString() : '',
        Number(t?.prizePool || 0),
        participants,
        maxTeams,
        pendingRequests
      ];
    });

    const csv = [header, ...data].map((row) => row.map(csvCell).join(',')).join('\n');
    const fileName = `tournaments_${new Date().toISOString().slice(0, 10)}.csv`;
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename=\"${fileName}\"`);
    return res.status(200).send(csv);
  } catch (error) {
    console.error('Error exporting tournaments csv:', error);
    return res.status(500).json({ success: false, error: 'Failed to export tournaments' });
  }
});

// Tournament realtime stream (SSE): pushes update when tournament or match snapshot changes
router.get('/:id/stream', async (req, res) => {
  const tournamentId = String(req.params.id || '').trim();
  if (!tournamentId || !mongoose.Types.ObjectId.isValid(tournamentId)) {
    return res.status(400).json({ success: false, error: 'Invalid tournament id' });
  }

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders?.();

  let closed = false;
  let lastSignature = '';

  const buildSignature = async () => {
    const tournament: any = await Tournament.findById(tournamentId)
      .select('_id updatedAt status startDate endDate registeredTeams matches')
      .lean();

    if (!tournament) return null;

    const matches: any[] = await Match.find({ tournament: tournamentId })
      .select('_id updatedAt status score winner round')
      .lean();

    const statusCounts = matches.reduce((acc: Record<string, number>, row: any) => {
      const status = String(row?.status || 'unknown');
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {});

    const latestMatchUpdatedAt = matches.reduce((latest, row: any) => {
      const candidate = row?.updatedAt ? new Date(row.updatedAt).getTime() : 0;
      return Math.max(latest, candidate);
    }, 0);

    const signaturePayload = {
      tournamentUpdatedAt: tournament.updatedAt ? new Date(tournament.updatedAt).getTime() : 0,
      latestMatchUpdatedAt,
      status: String(tournament.status || ''),
      registeredTeamsCount: Array.isArray(tournament.registeredTeams) ? tournament.registeredTeams.length : 0,
      matchesCount: Array.isArray(tournament.matches) ? tournament.matches.length : matches.length,
      statusCounts
    };

    return {
      signature: JSON.stringify(signaturePayload),
      payload: {
        timestamp: new Date().toISOString(),
        tournamentId,
        ...signaturePayload
      }
    };
  };

  const emitIfChanged = async () => {
    try {
      if (closed) return;
      const built = await buildSignature();
      if (!built) {
        res.write(`event: tournament_not_found\n`);
        res.write(`data: ${JSON.stringify({ tournamentId })}\n\n`);
        return;
      }

      if (built.signature !== lastSignature) {
        lastSignature = built.signature;
        res.write(`event: tournament_update\n`);
        res.write(`data: ${JSON.stringify(built.payload)}\n\n`);
      }
    } catch (error: any) {
      res.write(`event: tournament_error\n`);
      res.write(`data: ${JSON.stringify({ error: error?.message || 'stream_error' })}\n\n`);
    }
  };

  const heartbeat = setInterval(() => {
    if (closed) return;
    res.write(': keep-alive\n\n');
  }, 15000);

  const poller = setInterval(() => {
    emitIfChanged().catch(() => {});
  }, 5000);

  emitIfChanged().catch(() => {});

  req.on('close', () => {
    closed = true;
    clearInterval(heartbeat);
    clearInterval(poller);
    res.end();
  });
});

// Get tournament by ID
router.get('/:id', async (req, res) => {
  try {
    const tournamentId = String(req.params.id || '').trim();
    const cacheKey = `tournament:detail:${tournamentId}`;
    const transformed: any = await cacheService.getOrSet(
      cacheKey,
      async () => {
        const tournament: any = await Tournament.findById(tournamentId)
          .populate('registeredTeams', 'name tag logo members captain')
          .populate('matches', 'team1 team2 status startTime endTime score winner')
          .populate('createdBy', 'username firstName lastName')
          .lean();

        if (!tournament) return null;

        return {
          id: String(tournament._id),
          name: tournament.name,
          title: tournament.name,
          game: tournament.game,
          cadence: inferTournamentCadence(tournament),
          teamMode: inferTournamentTeamMode(tournament),
          teamSize: Number(tournament.teamSize || tournament.maxPlayers || 0) || undefined,
          image: tournament.image || tournament.coverImage || '',
          coverImage: tournament.coverImage || tournament.image || '',
          status: tournament.status === 'ongoing' ? 'in_progress' : tournament.status,
          startDate: tournament.startDate?.toISOString() || new Date().toISOString(),
          endDate: tournament.endDate?.toISOString() || new Date().toISOString(),
          prizePool: tournament.prizePool || 0,
          maxTeams: tournament.maxTeams || 0,
          maxParticipants: tournament.maxParticipants ?? tournament.maxTeams ?? 0,
          registeredTeams: (tournament.registeredTeams || []).map((team: any) => ({
            id: team._id?.toString() || team.toString(),
            name: team.name || '',
            tag: team.tag || '',
            logo: team.logo || '',
            players: team.members?.map((m: any) => m.toString()) || [],
            captain: team.captain?.toString() || ''
          })),
          participants: tournament.registeredTeams?.length || 0,
          currentParticipants: tournament.registeredTeams?.length || 0,
          pendingRequestsCount: Array.isArray(tournament.registrationRequests)
            ? tournament.registrationRequests.filter((entry: any) => entry?.status === 'pending').length
            : 0,
          format: tournament.format || 'single_elimination',
          type: tournament.type || 'team',
          description: tournament.description || '',
          rules: tournament.rules || '',
          matches: (tournament.matches || []).map((m: any) => ({
            id: m._id?.toString() || m.toString(),
            team1: m.team1?.toString() || m.team1,
            team2: m.team2?.toString() || m.team2,
            status: m.status || 'upcoming',
            startTime: m.startTime?.toISOString(),
            endTime: m.endTime?.toISOString(),
            score: m.score || {},
            winner: m.winner?.toString() || m.winner
          })),
          bracket: tournament.bracket || { matches: [] },
          createdBy: tournament.createdBy ? {
            id: tournament.createdBy._id?.toString() || '',
            username: tournament.createdBy.username || '',
            firstName: tournament.createdBy.firstName || '',
            lastName: tournament.createdBy.lastName || ''
          } : null,
          createdAt: tournament.createdAt?.toISOString(),
          updatedAt: tournament.updatedAt?.toISOString()
        };
      },
      { key: cacheKey, ttl: 20 }
    );

    if (!transformed) {
      return res.status(404).json({
        success: false,
        error: 'Tournament not found'
      });
    }

    res.json({
      success: true,
      data: transformed
    });
  } catch (error) {
    console.error('Error fetching tournament:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch tournament'
    });
  }
});

// Create tournament (admin only)
router.post('/',
  authenticateJWT,
  isAdmin,
  body('name').notEmpty().withMessage('Tournament name is required'),
  body('game').notEmpty().withMessage('Game is required'),
  body('prizePool').isNumeric().withMessage('Prize pool must be a number'),
  body('startDate').isISO8601().withMessage('Invalid start date'),
  body('endDate').isISO8601().withMessage('Invalid end date'),
  validateRequest,
  async (req: any, res: any) => {
    try {
      let normalizedImage: string | undefined;
      if (typeof req.body.image !== 'undefined') {
        try {
          normalizedImage = normalizeTournamentImageUrl(req.body.image);
        } catch (error: any) {
          return res.status(400).json({ success: false, error: error?.message || 'Invalid tournament image' });
        }
      }

      // Parse and validate dates
      const startDate = req.body.startDate ? new Date(req.body.startDate) : new Date();
      const endDate = req.body.endDate ? new Date(req.body.endDate) : new Date(startDate.getTime() + 2 * 60 * 60 * 1000);

      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        return res.status(400).json({ success: false, error: 'Invalid date format' });
      }

      if (endDate <= startDate) {
        return res.status(400).json({ success: false, error: 'End date must be after start date' });
      }

      const tournamentData: Partial<ITournament> = {
        name: req.body.name,
        game: req.body.game,
        ...(typeof req.body.cadence === 'string' ? { cadence: req.body.cadence } : {}),
        ...(req.body.teamSize !== undefined ? { teamSize: Number(req.body.teamSize) as 2 | 5 } : {}),
        startDate: startDate,
        endDate: endDate,
        prizePool: Number(req.body.prizePool) || 0,
        maxTeams: Number(req.body.maxTeams ?? req.body.maxParticipants ?? 16),
        maxParticipants: req.body.maxParticipants !== undefined
          ? Number(req.body.maxParticipants)
          : (req.body.maxTeams !== undefined ? Number(req.body.maxTeams) : undefined),
        status: req.body.status || 'upcoming',
        format: req.body.format || 'single_elimination',
        type: req.body.type || 'team',
        ...(typeof normalizedImage !== 'undefined' ? {
          image: normalizedImage,
          coverImage: normalizedImage
        } : {}),
        description: req.body.description || 'TBD',
        rules: req.body.rules || 'TBD',
        isRegistrationOpen: req.body.isRegistrationOpen ?? true,
        skillLevel: req.body.skillLevel,
        registeredTeams: [],
        registeredPlayers: [],
        matches: [],
        bracket: {
          matches: []
        }
      };

      if (req.user?._id) {
        tournamentData.createdBy = req.user._id as any;
      }

      const tournament = new Tournament(tournamentData);
      await tournament.save();

      // Transform response for frontend
      const transformed: any = {
        id: String(tournament._id),
        name: tournament.name,
        title: tournament.name,
        game: tournament.game,
        cadence: inferTournamentCadence(tournament),
        teamMode: inferTournamentTeamMode(tournament),
        teamSize: Number((tournament as any).teamSize || tournament.maxPlayers || 0) || undefined,
        image: tournament.image || tournament.coverImage || '',
        coverImage: tournament.coverImage || tournament.image || '',
        status: tournament.status === 'ongoing' ? 'in_progress' : tournament.status,
        startDate: tournament.startDate?.toISOString() || new Date().toISOString(),
        endDate: tournament.endDate?.toISOString() || new Date().toISOString(),
        prizePool: tournament.prizePool || 0,
        maxTeams: tournament.maxTeams || 0,
        maxParticipants: tournament.maxParticipants ?? tournament.maxTeams ?? 0,
        registeredTeams: [],
        participants: 0,
        currentParticipants: 0,
        pendingRequestsCount: 0,
        format: tournament.format || 'single_elimination',
        type: tournament.type || 'team',
        description: tournament.description || '',
        rules: tournament.rules || ''
      };

      // Invalidate caches
      await cacheService.invalidateTournamentCaches();
      invalidateAdminOverviewCache(String(tournament?._id || ''));

      res.status(201).json({
        success: true,
        data: transformed
      });
    } catch (error: any) {
      console.error('Error creating tournament:', error);
      if (error.name === 'ValidationError') {
        return res.status(400).json({ success: false, error: error.message });
      }
      if (error.code === 11000) {
        return res.status(400).json({ success: false, error: 'Duplicate tournament' });
      }
      res.status(500).json({ success: false, error: 'Failed to create tournament' });
    }
  });

// Bulk create tournaments (admin/import use)
router.post('/batch', authenticateJWT, isAdmin, async (req, res) => {
  try {
    const items = Array.isArray(req.body) ? req.body : [];
    if (!items.length) {
      return res.status(400).json({ success: false, error: 'Request body must be a non-empty array' });
    }

    const payload = items.map((item) => {
      const doc: any = { ...item };
      if (req.user?._id && !doc.createdBy) {
        doc.createdBy = req.user._id;
      }
      return doc;
    });

    const result = await Tournament.insertMany(payload, { ordered: false });

    // Invalidate caches
    await cacheService.invalidateTournamentCaches();
    invalidateAdminOverviewCache();

    res.status(201).json({
      success: true,
      inserted: result.length,
      data: result
    });
  } catch (error: any) {
    console.error('Error bulk creating tournaments:', error);
    if (error.code === 11000) {
      return res.status(400).json({ success: false, error: 'Duplicate tournament in batch' });
    }
    if (error.name === 'ValidationError') {
      return res.status(400).json({ success: false, error: error.message });
    }
    res.status(500).json({ success: false, error: 'Failed to create tournaments' });
  }
});

// Register for tournament (also available as /join for frontend compatibility)
// Register for tournament (atomic implementation)
router.post('/:id/register',
  authenticateJWT,
  idempotency({ required: true }),
  detectReferralFraud,
  rateLimitRegistration(5, 60000), // 5 attempts per minute
  checkTournamentAccess,
  // checkTournamentRegistration, // Integrated into atomic update
  handleTournamentRegistration);

// Join tournament (alias for register, frontend compatibility)
router.post('/:id/join',
  authenticateJWT,
  idempotency({ required: true }),
  detectReferralFraud,
  rateLimitRegistration(5, 60000),
  checkTournamentAccess,
  handleTournamentRegistration);

// Admin: pending registration queue across all tournaments
router.get('/admin/requests/pending-overview', authenticateJWT, isAdmin, async (req: any, res: any) => {
  try {
    const { page, limit, skip } = parsePagination(req.query as Record<string, unknown>, {
      defaultLimit: 30,
      maxLimit: 100
    });
    const tournaments: any[] = await Tournament.find({
      registrationRequests: { $elemMatch: { status: 'pending' } }
    })
      .select('name game status startDate registrationRequests')
      .populate('registrationRequests.team', 'name tag')
      .populate('registrationRequests.requestedBy', 'username firstName lastName telegramId')
      .lean();

    const rows = tournaments.map((t: any) => {
      const pending = (Array.isArray(t.registrationRequests) ? t.registrationRequests : [])
        .filter((entry: any) => entry?.status === 'pending');
      const firstPending = pending
        .map((entry: any) => entry?.requestedAt ? new Date(entry.requestedAt).getTime() : Number.MAX_SAFE_INTEGER)
        .filter((value: number) => Number.isFinite(value))
        .sort((a: number, b: number) => a - b)[0];

      return {
        tournamentId: String(t?._id || ''),
        tournamentName: String(t?.name || ''),
        game: String(t?.game || ''),
        status: String(t?.status || 'upcoming'),
        startDate: t?.startDate?.toISOString?.() || null,
        pendingRequestsCount: pending.length,
        firstPendingAt: Number.isFinite(firstPending) ? new Date(firstPending).toISOString() : null
      };
    })
      .sort((a, b) => {
        if (b.pendingRequestsCount !== a.pendingRequestsCount) return b.pendingRequestsCount - a.pendingRequestsCount;
        const left = a.firstPendingAt ? new Date(a.firstPendingAt).getTime() : Number.MAX_SAFE_INTEGER;
        const right = b.firstPendingAt ? new Date(b.firstPendingAt).getTime() : Number.MAX_SAFE_INTEGER;
        return left - right;
      });

    const total = rows.length;
    const paged = rows.slice(skip, skip + limit);

    return res.json({
      success: true,
      data: paged,
      pagination: buildPaginationMeta(page, limit, total)
    });
  } catch (error) {
    console.error('Error fetching pending tournament overview:', error);
    return res.status(500).json({ success: false, error: 'Failed to fetch pending tournament overview' });
  }
});

// Admin: recent processed requests across tournaments (approved/rejected history)
router.get('/admin/requests/recent', authenticateJWT, isAdmin, async (req: any, res: any) => {
  try {
    const { page, limit, skip } = parsePagination(req.query as Record<string, unknown>, {
      defaultLimit: 60,
      maxLimit: 200
    });
    const statusFilterRaw = String(req.query?.status || 'all').trim().toLowerCase();
    const allowedStatuses = new Set(['all', 'approved', 'rejected']);
    const statusFilter = allowedStatuses.has(statusFilterRaw) ? statusFilterRaw : 'all';
    const searchFilter = String(req.query?.search || '').trim().toLowerCase();

    const tournaments: any[] = await Tournament.find({
      registrationRequests: { $elemMatch: { status: { $in: ['approved', 'rejected'] } } }
    })
      .select('name game status registrationRequests')
      .populate('registrationRequests.team', 'name tag logo')
      .populate('registrationRequests.requestedBy', 'username firstName lastName telegramId')
      .populate('registrationRequests.reviewedBy', 'username firstName lastName telegramId role')
      .lean();

    const rows = tournaments.flatMap((t: any) => {
      const requests = Array.isArray(t.registrationRequests) ? t.registrationRequests : [];
      return requests
        .filter((entry: any) => {
          const status = String(entry?.status || '').toLowerCase();
          if (status !== 'approved' && status !== 'rejected') return false;
          if (statusFilter === 'all') return true;
          return status === statusFilter;
        })
        .map((entry: any) => ({
          id: `${String(t?._id || '')}:${String(entry?.team?._id || entry?.team || '')}:${String(entry?.reviewedAt || entry?.requestedAt || '')}`,
          tournamentId: String(t?._id || ''),
          tournamentName: String(t?.name || ''),
          game: String(t?.game || ''),
          tournamentStatus: String(t?.status || 'upcoming'),
          teamId: entry?.team?._id?.toString?.() || String(entry?.team || ''),
          teamName: String(entry?.team?.name || ''),
          teamTag: String(entry?.team?.tag || ''),
          status: String(entry?.status || 'pending'),
          note: String(entry?.note || ''),
          requestedAt: entry?.requestedAt?.toISOString?.() || null,
          reviewedAt: entry?.reviewedAt?.toISOString?.() || null,
          requestedBy: entry?.requestedBy ? {
            id: String(entry.requestedBy._id || ''),
            username: String(entry.requestedBy.username || ''),
            firstName: String(entry.requestedBy.firstName || ''),
            lastName: String(entry.requestedBy.lastName || ''),
            telegramId: entry.requestedBy.telegramId || null
          } : null,
          reviewedBy: entry?.reviewedBy ? {
            id: String(entry.reviewedBy._id || ''),
            username: String(entry.reviewedBy.username || ''),
            firstName: String(entry.reviewedBy.firstName || ''),
            lastName: String(entry.reviewedBy.lastName || ''),
            telegramId: entry.reviewedBy.telegramId || null,
            role: String(entry.reviewedBy.role || 'admin')
          } : null
        }));
    })
      .filter((row: any) => {
        if (!searchFilter) return true;
        const haystack = [
          row.tournamentName,
          row.game,
          row.teamName,
          row.teamTag,
          row.status,
          row.note,
          row.requestedBy?.username,
          row.requestedBy?.firstName,
          row.reviewedBy?.username,
          row.reviewedBy?.firstName
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        return haystack.includes(searchFilter);
      })
      .sort((a: any, b: any) => {
        const left = a.reviewedAt ? new Date(a.reviewedAt).getTime() : 0;
        const right = b.reviewedAt ? new Date(b.reviewedAt).getTime() : 0;
        return right - left;
      });

    const total = rows.length;
    const paged = rows.slice(skip, skip + limit);
    return res.json({
      success: true,
      data: paged,
      pagination: buildPaginationMeta(page, limit, total)
    });
  } catch (error) {
    console.error('Error fetching recent tournament requests:', error);
    return res.status(500).json({ success: false, error: 'Failed to fetch recent tournament requests' });
  }
});

// Admin: export recent processed requests across tournaments as CSV
router.get('/admin/requests/recent/export.csv', authenticateJWT, isAdmin, async (req: any, res: any) => {
  try {
    const status = typeof req.query?.status === 'string' ? req.query.status.trim().toLowerCase() : 'all';
    const search = typeof req.query?.search === 'string' ? req.query.search.trim().toLowerCase() : '';
    const allowedStatuses = new Set(['all', 'approved', 'rejected']);
    if (!allowedStatuses.has(status)) {
      return res.status(400).json({ success: false, error: 'Invalid status filter' });
    }

    const tournaments: any[] = await Tournament.find(
      { registrationRequests: { $elemMatch: { status: { $in: ['approved', 'rejected'] } } } }
    )
      .select('name game status registrationRequests')
      .populate('registrationRequests.team', 'name tag')
      .populate('registrationRequests.requestedBy', 'username firstName lastName')
      .populate('registrationRequests.reviewedBy', 'username firstName lastName')
      .sort({ updatedAt: -1 })
      .lean();

    const rows = tournaments
      .flatMap((t: any) => {
        const requests = Array.isArray(t.registrationRequests) ? t.registrationRequests : [];
        return requests
          .filter((entry: any) => {
            const rowStatus = String(entry?.status || '').toLowerCase();
            if (rowStatus !== 'approved' && rowStatus !== 'rejected') return false;
            if (status !== 'all' && rowStatus !== status) return false;
            if (!search) return true;

            const teamName = String(entry?.team?.name || '').toLowerCase();
            const teamTag = String(entry?.team?.tag || '').toLowerCase();
            const requestedBy = String(entry?.requestedBy?.username || entry?.requestedBy?.firstName || '').toLowerCase();
            const reviewedBy = String(entry?.reviewedBy?.username || entry?.reviewedBy?.firstName || '').toLowerCase();
            const note = String(entry?.note || '').toLowerCase();
            const tournamentName = String(t?.name || '').toLowerCase();

            return (
              teamName.includes(search) ||
              teamTag.includes(search) ||
              requestedBy.includes(search) ||
              reviewedBy.includes(search) ||
              note.includes(search) ||
              tournamentName.includes(search)
            );
          })
          .map((entry: any) => ({
            reviewedAt: entry?.reviewedAt ? new Date(entry.reviewedAt).toISOString() : '',
            requestedAt: entry?.requestedAt ? new Date(entry.requestedAt).toISOString() : '',
            tournamentName: String(t?.name || ''),
            game: String(t?.game || ''),
            tournamentStatus: String(t?.status || ''),
            teamName: String(entry?.team?.name || ''),
            teamTag: String(entry?.team?.tag || ''),
            status: String(entry?.status || ''),
            note: String(entry?.note || ''),
            requestedBy: String(entry?.requestedBy?.username || entry?.requestedBy?.firstName || ''),
            reviewedBy: String(entry?.reviewedBy?.username || entry?.reviewedBy?.firstName || '')
          }));
      })
      .sort((a: any, b: any) => {
        const left = a?.reviewedAt ? new Date(a.reviewedAt).getTime() : 0;
        const right = b?.reviewedAt ? new Date(b.reviewedAt).getTime() : 0;
        return right - left;
      });

    const csvCell = (value: any) => `"${String(value ?? '').replace(/"/g, '""')}"`;
    const header = [
      'reviewedAt',
      'requestedAt',
      'tournamentName',
      'game',
      'tournamentStatus',
      'teamName',
      'teamTag',
      'status',
      'note',
      'requestedBy',
      'reviewedBy'
    ];
    const csv = [header, ...rows.map((row: any) => header.map((key: string) => (row as any)[key]))]
      .map((row) => row.map(csvCell).join(','))
      .join('\n');

    const fileName = `tournament_decisions_${new Date().toISOString().slice(0, 10)}.csv`;
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename=\"${fileName}\"`);
    return res.status(200).send(csv);
  } catch (error) {
    console.error('Error exporting recent tournament requests:', error);
    return res.status(500).json({ success: false, error: 'Failed to export recent tournament requests' });
  }
});

// Admin: list team registration requests for tournament
router.get('/:id/requests', authenticateJWT, isAdmin, async (req: any, res: any) => {
  try {
    const statusFilter = typeof req.query.status === 'string' ? req.query.status.trim() : 'pending';
    const searchFilter = String(req.query?.search || '').trim().toLowerCase();
    const { page, limit, skip } = parsePagination(req.query as Record<string, unknown>, {
      defaultLimit: 25,
      maxLimit: 200
    });
    const tournamentId = String(req.params.id || '');
    if (!mongoose.Types.ObjectId.isValid(tournamentId)) {
      return res.status(400).json({ success: false, error: 'Invalid tournament id' });
    }
    const tournamentExists = await Tournament.exists({ _id: new mongoose.Types.ObjectId(tournamentId) });
    if (!tournamentExists) {
      return res.status(404).json({ success: false, error: 'Tournament not found' });
    }
    const basePipeline: any[] = [
      { $match: { _id: new mongoose.Types.ObjectId(tournamentId) } },
      { $unwind: '$registrationRequests' },
      {
        $lookup: {
          from: 'teams',
          localField: 'registrationRequests.team',
          foreignField: '_id',
          as: 'teamDoc'
        }
      },
      { $unwind: { path: '$teamDoc', preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: 'users',
          localField: 'registrationRequests.requestedBy',
          foreignField: '_id',
          as: 'requestedByDoc'
        }
      },
      { $unwind: { path: '$requestedByDoc', preserveNullAndEmptyArrays: true } }
    ];

    if (statusFilter && statusFilter !== 'all') {
      basePipeline.push({ $match: { 'registrationRequests.status': statusFilter } });
    }
    if (searchFilter) {
      const regex = new RegExp(escapeRegex(searchFilter), 'i');
      basePipeline.push({
        $match: {
          $or: [
            { 'teamDoc.name': regex },
            { 'teamDoc.tag': regex },
            { 'requestedByDoc.username': regex },
            { 'requestedByDoc.firstName': regex },
            { 'requestedByDoc.lastName': regex },
            { 'registrationRequests.note': regex }
          ]
        }
      });
    }

    const [facetRow] = await Tournament.aggregate([
      ...basePipeline,
      { $sort: { 'registrationRequests.requestedAt': -1 } },
      {
        $facet: {
          data: [
            { $skip: skip },
            { $limit: limit },
            {
              $project: {
                _id: 0,
                id: {
                  $concat: [
                    { $ifNull: [{ $toString: '$teamDoc._id' }, ''] },
                    ':',
                    { $ifNull: [{ $toString: '$registrationRequests.requestedAt' }, ''] }
                  ]
                },
                teamId: { $ifNull: [{ $toString: '$teamDoc._id' }, ''] },
                teamName: { $ifNull: ['$teamDoc.name', ''] },
                teamTag: { $ifNull: ['$teamDoc.tag', '' ] },
                teamLogo: { $ifNull: ['$teamDoc.logo', '' ] },
                membersCount: { $size: { $ifNull: ['$teamDoc.members', []] } },
                stats: {
                  wins: { $toDouble: { $ifNull: ['$teamDoc.stats.wins', 0] } },
                  losses: { $toDouble: { $ifNull: ['$teamDoc.stats.losses', 0] } },
                  winRate: { $toDouble: { $ifNull: ['$teamDoc.stats.winRate', 0] } }
                },
                requestedBy: {
                  id: { $ifNull: [{ $toString: '$requestedByDoc._id' }, '' ] },
                  username: { $ifNull: ['$requestedByDoc.username', '' ] },
                  firstName: { $ifNull: ['$requestedByDoc.firstName', '' ] },
                  lastName: { $ifNull: ['$requestedByDoc.lastName', '' ] },
                  telegramId: '$requestedByDoc.telegramId'
                },
                status: { $ifNull: ['$registrationRequests.status', 'pending'] },
                requestedAt: '$registrationRequests.requestedAt',
                reviewedAt: '$registrationRequests.reviewedAt',
                note: { $ifNull: ['$registrationRequests.note', '' ] }
              }
            }
          ],
          total: [{ $count: 'value' }]
        }
      }
    ]);

    const data = Array.isArray(facetRow?.data) ? facetRow.data : [];
    const total = Number(facetRow?.total?.[0]?.value || 0);

    return res.json({
      success: true,
      data,
      pagination: buildPaginationMeta(page, limit, total)
    });
  } catch (error) {
    console.error('Error fetching tournament requests:', error);
    return res.status(500).json({ success: false, error: 'Failed to fetch tournament requests' });
  }
});

// Admin: export pending tournament requests as CSV (with optional search)
router.get('/:id/requests/export.csv', authenticateJWT, isAdmin, async (req: any, res: any) => {
  try {
    const tournamentId = String(req.params.id || '');
    const search = typeof req.query?.search === 'string' ? req.query.search.trim().toLowerCase() : '';
    if (!mongoose.Types.ObjectId.isValid(tournamentId)) {
      return res.status(400).json({ success: false, error: 'Invalid tournament id' });
    }
    const tournamentExists = await Tournament.exists({ _id: new mongoose.Types.ObjectId(tournamentId) });
    if (!tournamentExists) {
      return res.status(404).json({ success: false, error: 'Tournament not found' });
    }
    const pipeline: any[] = [
      { $match: { _id: new mongoose.Types.ObjectId(tournamentId) } },
      { $unwind: '$registrationRequests' },
      { $match: { 'registrationRequests.status': 'pending' } },
      {
        $lookup: {
          from: 'teams',
          localField: 'registrationRequests.team',
          foreignField: '_id',
          as: 'teamDoc'
        }
      },
      { $unwind: { path: '$teamDoc', preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: 'users',
          localField: 'registrationRequests.requestedBy',
          foreignField: '_id',
          as: 'requestedByDoc'
        }
      },
      { $unwind: { path: '$requestedByDoc', preserveNullAndEmptyArrays: true } }
    ];
    if (search) {
      const regex = new RegExp(escapeRegex(search), 'i');
      pipeline.push({
        $match: {
          $or: [
            { 'teamDoc.name': regex },
            { 'teamDoc.tag': regex },
            { 'requestedByDoc.username': regex },
            { 'requestedByDoc.firstName': regex }
          ]
        }
      });
    }
    pipeline.push({
      $project: {
        _id: 0,
        requestId: { $toString: '$registrationRequests._id' },
        teamId: { $ifNull: [{ $toString: '$teamDoc._id' }, '' ] },
        teamName: { $ifNull: ['$teamDoc.name', '' ] },
        teamTag: { $ifNull: ['$teamDoc.tag', '' ] },
        membersCount: { $size: { $ifNull: ['$teamDoc.members', []] } },
        wins: { $toDouble: { $ifNull: ['$teamDoc.stats.wins', 0] } },
        losses: { $toDouble: { $ifNull: ['$teamDoc.stats.losses', 0] } },
        winRate: { $toDouble: { $ifNull: ['$teamDoc.stats.winRate', 0] } },
        requestedBy: { $ifNull: ['$requestedByDoc.username', { $ifNull: ['$requestedByDoc.firstName', ''] }] },
        requestedAt: '$registrationRequests.requestedAt'
      }
    });
    const filtered = await Tournament.aggregate(pipeline);

    const csvCell = (value: any) => `"${String(value ?? '').replace(/"/g, '""')}"`;
    const header = ['requestId', 'teamId', 'teamName', 'teamTag', 'membersCount', 'wins', 'losses', 'winRate', 'requestedBy', 'requestedAt'];
    const rows = filtered.map((entry: any) => [
      String(entry?.requestId || ''),
      String(entry?.teamId || ''),
      String(entry?.teamName || ''),
      String(entry?.teamTag || ''),
      Number(entry?.membersCount || 0),
      Number(entry?.wins || 0),
      Number(entry?.losses || 0),
      Number(entry?.winRate || 0),
      String(entry?.requestedBy || ''),
      entry?.requestedAt ? new Date(entry.requestedAt).toISOString() : ''
    ]);

    const csv = [header, ...rows].map((row) => row.map(csvCell).join(',')).join('\n');
    const fileName = `tournament_requests_${tournamentId}_${new Date().toISOString().slice(0, 10)}.csv`;
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename=\"${fileName}\"`);
    return res.status(200).send(csv);
  } catch (error) {
    console.error('Error exporting tournament requests:', error);
    return res.status(500).json({ success: false, error: 'Failed to export tournament requests' });
  }
});

// Admin: list approved tournament participants with pagination/search
router.get('/:id/participants', authenticateJWT, isAdmin, async (req: any, res: any) => {
  try {
    const tournamentId = String(req.params.id || '');
    const { page, limit } = parsePagination(req.query, { defaultLimit: 12, maxLimit: 100 });
    const search = typeof req.query?.search === 'string' ? req.query.search.trim().toLowerCase() : '';

    const tournament: any = await Tournament.findById(tournamentId)
      .select('registeredTeams');
    if (!tournament) {
      return res.status(404).json({ success: false, error: 'Tournament not found' });
    }

    const registeredTeamIds = Array.isArray(tournament.registeredTeams)
      ? tournament.registeredTeams.map((id: any) => String(id)).filter(Boolean)
      : [];

    if (!registeredTeamIds.length) {
      return res.json({
        success: true,
        data: [],
        pagination: buildPaginationMeta(page, limit, 0),
        summary: { filteredTotal: 0 }
      });
    }

    const teamObjectIds = registeredTeamIds.map((id: string) => new mongoose.Types.ObjectId(id));
    const matchQuery: any = { _id: { $in: teamObjectIds } };
    if (search) {
      const regex = new RegExp(escapeRegex(search), 'i');
      matchQuery.$or = [{ name: regex }, { tag: regex }];
    }
    const [facetRow] = await Team.aggregate([
      { $match: matchQuery },
      {
        $addFields: {
          _allMembers: {
            $setUnion: [
              { $ifNull: ['$members', []] },
              { $ifNull: ['$players', []] },
              {
                $cond: [
                  { $ifNull: ['$captain', false] },
                  ['$captain'],
                  []
                ]
              }
            ]
          }
        }
      },
      {
        $project: {
          _id: 1,
          name: 1,
          tag: 1,
          logo: 1,
          membersCount: { $size: { $ifNull: ['$_allMembers', []] } },
          stats: {
            wins: { $toDouble: { $ifNull: ['$stats.wins', 0] } },
            losses: { $toDouble: { $ifNull: ['$stats.losses', 0] } },
            points: { $toDouble: { $ifNull: ['$stats.points', 0] } },
            rank: { $toDouble: { $ifNull: ['$stats.rank', 0] } },
            winRate: { $toDouble: { $ifNull: ['$stats.winRate', 0] } },
            totalMatches: { $toDouble: { $ifNull: ['$stats.totalMatches', 0] } }
          }
        }
      },
      { $sort: { 'stats.points': -1 } },
      {
        $facet: {
          data: [{ $skip: (page - 1) * limit }, { $limit: limit }],
          total: [{ $count: 'value' }]
        }
      }
    ]);
    const total = Number(facetRow?.total?.[0]?.value || 0);
    const data = (Array.isArray(facetRow?.data) ? facetRow.data : []).map((row: any) => ({
      id: String(row?._id || ''),
      name: String(row?.name || ''),
      tag: String(row?.tag || ''),
      logo: String(row?.logo || ''),
      membersCount: Number(row?.membersCount || 0),
      stats: {
        wins: Number(row?.stats?.wins || 0),
        losses: Number(row?.stats?.losses || 0),
        points: Number(row?.stats?.points || 0),
        rank: Number(row?.stats?.rank || 0),
        winRate: Number(row?.stats?.winRate || 0),
        totalMatches: Number(row?.stats?.totalMatches || 0)
      }
    }));

    return res.json({
      success: true,
      data,
      pagination: buildPaginationMeta(page, limit, total),
      summary: { filteredTotal: total }
    });
  } catch (error) {
    console.error('Error fetching tournament participants:', error);
    return res.status(500).json({ success: false, error: 'Failed to fetch tournament participants' });
  }
});

// Admin: export tournament participants as CSV
router.get('/:id/participants/export.csv', authenticateJWT, isAdmin, async (req: any, res: any) => {
  try {
    const tournamentId = String(req.params.id || '');
    const search = typeof req.query?.search === 'string' ? req.query.search.trim().toLowerCase() : '';

    const tournament: any = await Tournament.findById(tournamentId).select('registeredTeams');
    if (!tournament) {
      return res.status(404).json({ success: false, error: 'Tournament not found' });
    }

    const registeredTeamIds = Array.isArray(tournament.registeredTeams)
      ? tournament.registeredTeams.map((id: any) => String(id)).filter(Boolean)
      : [];

    if (!registeredTeamIds.length) {
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename=\"tournament_participants_${tournamentId}.csv\"`);
      return res.status(200).send('teamId,teamName,tag,membersCount,wins,losses,points,rank,winRate,totalMatches');
    }

    const teamObjectIds = registeredTeamIds.map((id: string) => new mongoose.Types.ObjectId(id));
    const matchQuery: any = { _id: { $in: teamObjectIds } };
    if (search) {
      const regex = new RegExp(escapeRegex(search), 'i');
      matchQuery.$or = [{ name: regex }, { tag: regex }];
    }
    const rows = await Team.aggregate([
      { $match: matchQuery },
      {
        $addFields: {
          _allMembers: {
            $setUnion: [
              { $ifNull: ['$members', []] },
              { $ifNull: ['$players', []] },
              {
                $cond: [
                  { $ifNull: ['$captain', false] },
                  ['$captain'],
                  []
                ]
              }
            ]
          }
        }
      },
      {
        $project: {
          teamId: { $toString: '$_id' },
          teamName: { $ifNull: ['$name', ''] },
          tag: { $ifNull: ['$tag', ''] },
          membersCount: { $size: { $ifNull: ['$_allMembers', []] } },
          wins: { $toDouble: { $ifNull: ['$stats.wins', 0] } },
          losses: { $toDouble: { $ifNull: ['$stats.losses', 0] } },
          points: { $toDouble: { $ifNull: ['$stats.points', 0] } },
          rank: { $toDouble: { $ifNull: ['$stats.rank', 0] } },
          winRate: { $toDouble: { $ifNull: ['$stats.winRate', 0] } },
          totalMatches: { $toDouble: { $ifNull: ['$stats.totalMatches', 0] } }
        }
      },
      { $sort: { points: -1 } }
    ]);

    const csvCell = (value: any) => `"${String(value ?? '').replace(/"/g, '""')}"`;
    const header = ['teamId', 'teamName', 'tag', 'membersCount', 'wins', 'losses', 'points', 'rank', 'winRate', 'totalMatches'];
    const csv = [header, ...rows.map((row: any) => header.map((key: string) => (row as any)[key]))]
      .map((row) => row.map(csvCell).join(','))
      .join('\n');

    const fileName = `tournament_participants_${tournamentId}_${new Date().toISOString().slice(0, 10)}.csv`;
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename=\"${fileName}\"`);
    return res.status(200).send(csv);
  } catch (error) {
    console.error('Error exporting tournament participants:', error);
    return res.status(500).json({ success: false, error: 'Failed to export participants' });
  }
});

// Admin: approve team registration request
router.post('/:id/requests/:teamId/approve', authenticateJWT, isAdmin, idempotency({ required: true }), async (req: any, res: any) => {
  try {
    const { id: tournamentId, teamId } = req.params;
    const reviewerId = req.user?._id?.toString?.() || req.user?.id;
    const note = typeof req.body?.note === 'string' ? req.body.note.trim().slice(0, 300) : '';

    const tournament: any = await Tournament.findById(tournamentId);
    if (!tournament) {
      return res.status(404).json({ success: false, error: 'Tournament not found' });
    }

    const requestEntry = Array.isArray(tournament.registrationRequests)
      ? tournament.registrationRequests.find((entry: any) =>
        entry?.status === 'pending' &&
        entry?.team?.toString?.() === teamId
      )
      : null;

    if (!requestEntry) {
      return res.status(404).json({ success: false, error: 'Pending request not found' });
    }

    const team: any = await Team.findById(teamId).select('captain members players tournamentId');
    if (!team) {
      return res.status(404).json({ success: false, error: 'Team not found' });
    }

    if (!team.tournamentId || team.tournamentId.toString() !== tournamentId) {
      return res.status(400).json({ success: false, error: 'Team is linked to a different tournament' });
    }

    const isAlreadyRegistered = Array.isArray(tournament.registeredTeams) &&
      tournament.registeredTeams.some((value: any) => value.toString() === teamId);

    const teamLimit = Number(tournament.maxTeams || 0);
    if (!isAlreadyRegistered && teamLimit > 0 && (tournament.registeredTeams?.length || 0) >= teamLimit) {
      return res.status(400).json({ success: false, error: 'Tournament is full' });
    }

    if (!isAlreadyRegistered) {
      tournament.registeredTeams.push(team._id);
    }

    const participantRows = buildTeamParticipantRows(team);
    const participantIds = participantRows.map((row) => row.userId);
    const existingPlayers = new Set((tournament.registeredPlayers || []).map((value: any) => value.toString()));
    participantIds.forEach((value) => {
      if (!existingPlayers.has(value)) {
        tournament.registeredPlayers.push(new mongoose.Types.ObjectId(value));
      }
    });

    requestEntry.status = 'approved';
    requestEntry.reviewedAt = new Date();
    requestEntry.reviewedBy = new mongoose.Types.ObjectId(reviewerId);
    requestEntry.note = note;

    await tournament.save();

    await Promise.all(
      participantRows.map((row) => TournamentRegistration.findOneAndUpdate(
        { userId: row.userId, tournamentId },
        {
          $set: {
            teamId,
            role: row.role,
            status: 'active'
          }
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      ))
    );

    if (participantIds.length) {
      await User.updateMany(
        { _id: { $in: participantIds.map((value) => new mongoose.Types.ObjectId(value)) } },
        { $addToSet: { participatingTournaments: tournament._id } }
      );
    }

    await cacheService.invalidateTournamentCaches();
    invalidateAdminOverviewCache(String(req.params.id || ''));

    return res.json({
      success: true,
      message: 'Team request approved',
      data: {
        tournamentId,
        teamId,
        participants: participantIds.length
      }
    });
  } catch (error) {
    console.error('Error approving tournament request:', error);
    return res.status(500).json({ success: false, error: 'Failed to approve tournament request' });
  }
});

// Admin: reject team registration request
router.post('/:id/requests/:teamId/reject', authenticateJWT, isAdmin, idempotency({ required: true }), async (req: any, res: any) => {
  try {
    const { id: tournamentId, teamId } = req.params;
    const reviewerId = req.user?._id?.toString?.() || req.user?.id;
    const note = typeof req.body?.note === 'string' ? req.body.note.trim().slice(0, 300) : '';

    const tournament: any = await Tournament.findById(tournamentId);
    if (!tournament) {
      return res.status(404).json({ success: false, error: 'Tournament not found' });
    }

    const requestEntry = Array.isArray(tournament.registrationRequests)
      ? tournament.registrationRequests.find((entry: any) =>
        entry?.status === 'pending' &&
        entry?.team?.toString?.() === teamId
      )
      : null;

    if (!requestEntry) {
      return res.status(404).json({ success: false, error: 'Pending request not found' });
    }

    requestEntry.status = 'rejected';
    requestEntry.reviewedAt = new Date();
    requestEntry.reviewedBy = new mongoose.Types.ObjectId(reviewerId);
    requestEntry.note = note;
    await tournament.save();

    await TournamentRegistration.updateMany(
      { tournamentId, teamId, status: 'pending' },
      { $set: { status: 'rejected' } }
    );

    await cacheService.invalidateTournamentCaches();
    invalidateAdminOverviewCache(String(req.params.id || ''));

    return res.json({
      success: true,
      message: 'Team request rejected',
      data: {
        tournamentId,
        teamId
      }
    });
  } catch (error) {
    console.error('Error rejecting tournament request:', error);
    return res.status(500).json({ success: false, error: 'Failed to reject tournament request' });
  }
});

// Admin: reopen processed request back to pending (optionally rollback participant if it was approved)
router.post('/:id/requests/:teamId/reopen', authenticateJWT, isAdmin, idempotency({ required: true }), async (req: any, res: any) => {
  try {
    const tournamentId = String(req.params.id || '');
    const teamId = String(req.params.teamId || '');
    const note = typeof req.body?.note === 'string' ? req.body.note.trim().slice(0, 300) : '';

    const [tournament, team]: any[] = await Promise.all([
      Tournament.findById(tournamentId),
      Team.findById(teamId).select('captain members players')
    ]);

    if (!tournament) {
      return res.status(404).json({ success: false, error: 'Tournament not found' });
    }
    if (!team) {
      return res.status(404).json({ success: false, error: 'Team not found' });
    }

    const requestEntry = Array.isArray(tournament.registrationRequests)
      ? tournament.registrationRequests.find((entry: any) => String(entry?.team || '') === teamId && entry?.status !== 'pending')
      : null;

    if (!requestEntry) {
      return res.status(404).json({ success: false, error: 'Processed request not found' });
    }

    const wasApproved = String(requestEntry.status || '') === 'approved';

    if (wasApproved) {
      const participantRows = buildTeamParticipantRows(team);
      const participantIds = participantRows.map((row) => row.userId);
      const participantIdSet = new Set(participantIds);

      tournament.registeredTeams = (tournament.registeredTeams || [])
        .filter((value: any) => String(value) !== teamId);
      tournament.registeredPlayers = (tournament.registeredPlayers || [])
        .filter((value: any) => !participantIdSet.has(String(value)));

      await TournamentRegistration.updateMany(
        { tournamentId, teamId, status: { $in: ['active', 'rejected'] } },
        { $set: { status: 'pending' } }
      );

      if (participantIds.length) {
        for (const userId of participantIds) {
          const stillActive = await TournamentRegistration.exists({
            tournamentId,
            userId,
            status: 'active'
          });
          if (!stillActive) {
            await User.updateOne(
              { _id: new mongoose.Types.ObjectId(userId) },
              { $pull: { participatingTournaments: tournament._id } }
            );
          }
        }
      }
    } else {
      await TournamentRegistration.updateMany(
        { tournamentId, teamId, status: 'rejected' },
        { $set: { status: 'pending' } }
      );
    }

    requestEntry.status = 'pending';
    requestEntry.reviewedAt = undefined;
    requestEntry.reviewedBy = undefined;
    requestEntry.note = note || '';

    await tournament.save();
    await cacheService.invalidateTournamentCaches();
    invalidateAdminOverviewCache(tournamentId);

    return res.json({
      success: true,
      message: 'Request reopened to pending',
      data: {
        tournamentId,
        teamId,
        rolledBackParticipant: wasApproved
      }
    });
  } catch (error) {
    console.error('Error reopening tournament request:', error);
    return res.status(500).json({ success: false, error: 'Failed to reopen request' });
  }
});

// Admin: bulk approve/reject tournament registration requests
router.post('/:id/requests/bulk', authenticateJWT, isAdmin, idempotency({ required: true }), async (req: any, res: any) => {
  try {
    const tournamentId = String(req.params.id || '');
    const reviewerId = req.user?._id?.toString?.() || req.user?.id;
    const action = String(req.body?.action || '').trim().toLowerCase();
    const note = typeof req.body?.note === 'string' ? req.body.note.trim().slice(0, 300) : '';
    const teamIds: string[] = Array.isArray(req.body?.teamIds)
      ? req.body.teamIds.map((value: any) => String(value || '').trim()).filter(Boolean)
      : [];
    const targetSet = teamIds.length ? new Set(teamIds) : null;

    if (action !== 'approve' && action !== 'reject') {
      return res.status(400).json({ success: false, error: 'action must be approve or reject' });
    }

    const tournament: any = await Tournament.findById(tournamentId);
    if (!tournament) {
      return res.status(404).json({ success: false, error: 'Tournament not found' });
    }

    const pendingEntries = Array.isArray(tournament.registrationRequests)
      ? tournament.registrationRequests.filter((entry: any) => {
        if (entry?.status !== 'pending') return false;
        if (!targetSet) return true;
        return targetSet.has(String(entry?.team || ''));
      })
      : [];

    if (!pendingEntries.length) {
      return res.json({
        success: true,
        message: 'No pending requests matched',
        data: { action, processed: 0, failed: 0, skipped: 0, errors: [] }
      });
    }

    const allTeamIds = pendingEntries.map((entry: any) => String(entry?.team || '')).filter(Boolean);
    const teamDocs: any[] = await Team.find({ _id: { $in: allTeamIds } }).select('captain members players tournamentId');
    const teamMap = new Map(teamDocs.map((team: any) => [String(team._id), team]));
    const registeredTeamsSet = new Set((tournament.registeredTeams || []).map((value: any) => String(value)));
    const registeredPlayersSet = new Set((tournament.registeredPlayers || []).map((value: any) => String(value)));
    const teamLimit = Number(tournament.maxTeams || 0);

    const errors: Array<{ teamId: string; reason: string }> = [];
    const bulkParticipantRows: Array<{ userId: string; role: 'owner' | 'member'; teamId: string }> = [];
    const approvedTeamIds: string[] = [];
    const rejectedTeamIds: string[] = [];
    let processed = 0;
    let failed = 0;
    let skipped = 0;

    for (const entry of pendingEntries) {
      const teamId = String(entry?.team || '');
      if (!teamId) {
        failed += 1;
        errors.push({ teamId: '', reason: 'Invalid teamId in request entry' });
        continue;
      }

      const team: any = teamMap.get(teamId);
      if (!team) {
        failed += 1;
        errors.push({ teamId, reason: 'Team not found' });
        continue;
      }

      if (action === 'approve') {
        if (!team.tournamentId || String(team.tournamentId) !== tournamentId) {
          failed += 1;
          errors.push({ teamId, reason: 'Team is linked to a different tournament' });
          continue;
        }

        const isAlreadyRegistered = registeredTeamsSet.has(teamId);
        if (!isAlreadyRegistered && teamLimit > 0 && registeredTeamsSet.size >= teamLimit) {
          failed += 1;
          errors.push({ teamId, reason: 'Tournament is full' });
          continue;
        }

        if (!isAlreadyRegistered) {
          tournament.registeredTeams.push(team._id);
          registeredTeamsSet.add(teamId);
        } else {
          skipped += 1;
        }

        const participantRows = buildTeamParticipantRows(team);
        participantRows.forEach((row) => {
          bulkParticipantRows.push({ ...row, teamId });
          if (!registeredPlayersSet.has(row.userId)) {
            tournament.registeredPlayers.push(new mongoose.Types.ObjectId(row.userId));
            registeredPlayersSet.add(row.userId);
          }
        });

        entry.status = 'approved';
        entry.reviewedAt = new Date();
        if (reviewerId) entry.reviewedBy = new mongoose.Types.ObjectId(reviewerId);
        if (note) entry.note = note;
        else if (!entry.note) entry.note = 'Approved by bulk action';
        approvedTeamIds.push(teamId);
      } else {
        entry.status = 'rejected';
        entry.reviewedAt = new Date();
        if (reviewerId) entry.reviewedBy = new mongoose.Types.ObjectId(reviewerId);
        if (note) entry.note = note;
        else if (!entry.note) entry.note = 'Rejected by bulk action';
        rejectedTeamIds.push(teamId);
      }

      processed += 1;
    }

    await tournament.save();

    if (approvedTeamIds.length) {
      await Promise.all(
        bulkParticipantRows.map((row) => TournamentRegistration.findOneAndUpdate(
          { userId: row.userId, tournamentId },
          {
            $set: {
              teamId: row.teamId,
              role: row.role,
              status: 'active'
            }
          },
          { upsert: true, new: true, setDefaultsOnInsert: true }
        ))
      );

      const participantIds = Array.from(new Set(bulkParticipantRows.map((row) => row.userId)));
      if (participantIds.length) {
        await User.updateMany(
          { _id: { $in: participantIds.map((value) => new mongoose.Types.ObjectId(value)) } },
          { $addToSet: { participatingTournaments: tournament._id } }
        );
      }
    }

    if (rejectedTeamIds.length) {
      await TournamentRegistration.updateMany(
        { tournamentId, teamId: { $in: rejectedTeamIds }, status: 'pending' },
        { $set: { status: 'rejected' } }
      );
    }

    await cacheService.invalidateTournamentCaches();
    invalidateAdminOverviewCache(tournamentId);

    return res.json({
      success: true,
      message: `Bulk ${action} completed`,
      data: {
        action,
        processed,
        failed,
        skipped,
        approved: approvedTeamIds.length,
        rejected: rejectedTeamIds.length,
        errors
      }
    });
  } catch (error) {
    console.error('Error bulk processing tournament requests:', error);
    return res.status(500).json({ success: false, error: 'Failed to process bulk requests' });
  }
});

// Admin: manually add an approved team as tournament participant
router.post('/:id/participants/:teamId/add', authenticateJWT, isAdmin, idempotency({ required: true }), async (req: any, res: any) => {
  try {
    const tournamentId = String(req.params.id || '');
    const teamId = String(req.params.teamId || '');
    const reviewerId = req.user?._id?.toString?.() || req.user?.id;

    const [tournament, team]: any[] = await Promise.all([
      Tournament.findById(tournamentId),
      Team.findById(teamId).select('captain members players tournamentId')
    ]);

    if (!tournament) return res.status(404).json({ success: false, error: 'Tournament not found' });
    if (!team) return res.status(404).json({ success: false, error: 'Team not found' });
    if (!team.tournamentId || String(team.tournamentId) !== tournamentId) {
      return res.status(400).json({ success: false, error: 'Team is linked to a different tournament' });
    }

    const isAlreadyRegistered = Array.isArray(tournament.registeredTeams) &&
      tournament.registeredTeams.some((value: any) => String(value) === teamId);
    const teamLimit = Number(tournament.maxTeams || 0);
    if (!isAlreadyRegistered && teamLimit > 0 && (tournament.registeredTeams?.length || 0) >= teamLimit) {
      return res.status(400).json({ success: false, error: 'Tournament is full' });
    }

    if (!isAlreadyRegistered) {
      tournament.registeredTeams.push(team._id);
    }

    const participantRows = buildTeamParticipantRows(team);
    const participantIds = participantRows.map((row) => row.userId);
    const existingPlayers = new Set((tournament.registeredPlayers || []).map((value: any) => String(value)));
    participantIds.forEach((value) => {
      if (!existingPlayers.has(value)) {
        tournament.registeredPlayers.push(new mongoose.Types.ObjectId(value));
      }
    });

    const requestEntry = Array.isArray(tournament.registrationRequests)
      ? tournament.registrationRequests.find((entry: any) => String(entry?.team || '') === teamId && entry?.status === 'pending')
      : null;
    if (requestEntry) {
      requestEntry.status = 'approved';
      requestEntry.reviewedAt = new Date();
      if (reviewerId) requestEntry.reviewedBy = new mongoose.Types.ObjectId(reviewerId);
      if (!requestEntry.note) requestEntry.note = 'Approved manually by admin';
    }

    await tournament.save();

    await Promise.all(
      participantRows.map((row) => TournamentRegistration.findOneAndUpdate(
        { userId: row.userId, tournamentId },
        {
          $set: {
            teamId,
            role: row.role,
            status: 'active'
          }
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      ))
    );

    if (participantIds.length) {
      await User.updateMany(
        { _id: { $in: participantIds.map((value) => new mongoose.Types.ObjectId(value)) } },
        { $addToSet: { participatingTournaments: tournament._id } }
      );
    }

    await cacheService.invalidateTournamentCaches();
    invalidateAdminOverviewCache(tournamentId);

    return res.json({
      success: true,
      message: isAlreadyRegistered ? 'Team already registered' : 'Team added as participant',
      data: {
        tournamentId,
        teamId,
        participants: participantIds.length,
        alreadyRegistered: isAlreadyRegistered
      }
    });
  } catch (error) {
    console.error('Error adding tournament participant:', error);
    return res.status(500).json({ success: false, error: 'Failed to add participant' });
  }
});

// Admin: manually remove a team from tournament participants
router.delete('/:id/participants/:teamId/remove', authenticateJWT, isAdmin, idempotency({ required: true }), async (req: any, res: any) => {
  try {
    const tournamentId = String(req.params.id || '');
    const teamId = String(req.params.teamId || '');

    const [tournament, team]: any[] = await Promise.all([
      Tournament.findById(tournamentId),
      Team.findById(teamId).select('captain members players')
    ]);

    if (!tournament) return res.status(404).json({ success: false, error: 'Tournament not found' });
    if (!team) return res.status(404).json({ success: false, error: 'Team not found' });

    const participantRows = buildTeamParticipantRows(team);
    const participantIds = participantRows.map((row) => row.userId);
    const participantIdSet = new Set(participantIds);

    tournament.registeredTeams = (tournament.registeredTeams || [])
      .filter((value: any) => String(value) !== teamId);
    tournament.registeredPlayers = (tournament.registeredPlayers || [])
      .filter((value: any) => !participantIdSet.has(String(value)));

    await tournament.save();

    await TournamentRegistration.updateMany(
      { tournamentId, teamId, status: { $in: ['active', 'pending'] } },
      { $set: { status: 'rejected' } }
    );

    if (participantIds.length) {
      for (const userId of participantIds) {
        const stillActive = await TournamentRegistration.exists({
          tournamentId,
          userId,
          status: 'active'
        });
        if (!stillActive) {
          await User.updateOne(
            { _id: new mongoose.Types.ObjectId(userId) },
            { $pull: { participatingTournaments: tournament._id } }
          );
        }
      }
    }

    await cacheService.invalidateTournamentCaches();
    invalidateAdminOverviewCache(tournamentId);

    return res.json({
      success: true,
      message: 'Team removed from tournament participants',
      data: {
        tournamentId,
        teamId,
        participants: participantIds.length
      }
    });
  } catch (error) {
    console.error('Error removing tournament participant:', error);
    return res.status(500).json({ success: false, error: 'Failed to remove participant' });
  }
});

// Admin: bulk remove teams from tournament participants
router.post('/:id/participants/bulk-remove', authenticateJWT, isAdmin, idempotency({ required: true }), async (req: any, res: any) => {
  try {
    const tournamentId = String(req.params.id || '');
    const rawTeamIds = Array.isArray(req.body?.teamIds) ? req.body.teamIds : [];
    const teamIds: string[] = Array.from(
      new Set<string>(
        rawTeamIds
          .map((value: any): string => String(value || '').trim())
          .filter((value: string) => Boolean(value))
      )
    );

    if (!teamIds.length) {
      return res.status(400).json({ success: false, error: 'teamIds array is required' });
    }

    const tournament: any = await Tournament.findById(tournamentId);
    if (!tournament) return res.status(404).json({ success: false, error: 'Tournament not found' });

    const registeredTeamSet = new Set((tournament.registeredTeams || []).map((value: any) => String(value)));
    const removableTeamIds = teamIds.filter((teamId) => registeredTeamSet.has(teamId));
    if (!removableTeamIds.length) {
      return res.json({
        success: true,
        message: 'No registered participants matched',
        data: { requested: teamIds.length, removed: 0, skipped: teamIds.length }
      });
    }

    const teams: any[] = await Team.find({ _id: { $in: removableTeamIds.map((id) => new mongoose.Types.ObjectId(id)) } })
      .select('captain members players');
    const teamById = new Map(teams.map((team) => [String(team._id), team]));

    const participantIdsToCheck = new Set<string>();
    for (const teamId of removableTeamIds) {
      const team = teamById.get(teamId);
      if (!team) continue;
      const rows = buildTeamParticipantRows(team);
      rows.forEach((row) => participantIdsToCheck.add(String(row.userId)));
    }

    const participantIdSet = new Set(Array.from(participantIdsToCheck));
    tournament.registeredTeams = (tournament.registeredTeams || [])
      .filter((value: any) => !removableTeamIds.includes(String(value)));
    tournament.registeredPlayers = (tournament.registeredPlayers || [])
      .filter((value: any) => !participantIdSet.has(String(value)));

    await tournament.save();

    await TournamentRegistration.updateMany(
      { tournamentId, teamId: { $in: removableTeamIds }, status: { $in: ['active', 'pending'] } },
      { $set: { status: 'rejected' } }
    );

    for (const userId of participantIdsToCheck) {
      const stillActive = await TournamentRegistration.exists({
        tournamentId,
        userId,
        status: 'active'
      });
      if (!stillActive) {
        await User.updateOne(
          { _id: new mongoose.Types.ObjectId(userId) },
          { $pull: { participatingTournaments: tournament._id } }
        );
      }
    }

    await cacheService.invalidateTournamentCaches();
    invalidateAdminOverviewCache(tournamentId);

    return res.json({
      success: true,
      message: 'Participants removed',
      data: {
        requested: teamIds.length,
        removed: removableTeamIds.length,
        skipped: Math.max(0, teamIds.length - removableTeamIds.length)
      }
    });
  } catch (error) {
    console.error('Error bulk removing tournament participants:', error);
    return res.status(500).json({ success: false, error: 'Failed to bulk remove participants' });
  }
});

// Admin: update participant team stats (wins/losses/points) inside tournament roster
router.patch('/:id/participants/:teamId/stats', authenticateJWT, isAdmin, idempotency({ required: true }), async (req: any, res: any) => {
  try {
    const tournamentId = String(req.params.id || '');
    const teamId = String(req.params.teamId || '');

    const winsRaw = req.body?.wins;
    const lossesRaw = req.body?.losses;
    const pointsRaw = req.body?.points;
    const rankRaw = req.body?.rank;

    const hasWins = winsRaw !== undefined;
    const hasLosses = lossesRaw !== undefined;
    const hasPoints = pointsRaw !== undefined;
    const hasRank = rankRaw !== undefined;

    if (!hasWins && !hasLosses && !hasPoints && !hasRank) {
      return res.status(400).json({ success: false, error: 'At least one stat field is required (wins, losses, points, rank)' });
    }

    const asInt = (value: any, field: string) => {
      const num = Number(value);
      if (!Number.isFinite(num) || num < 0) {
        throw new Error(`${field} must be a non-negative number`);
      }
      return Math.floor(num);
    };

    const tournament: any = await Tournament.findById(tournamentId);
    if (!tournament) return res.status(404).json({ success: false, error: 'Tournament not found' });

    const isParticipant = Array.isArray(tournament.registeredTeams) &&
      tournament.registeredTeams.some((value: any) => String(value) === teamId);
    if (!isParticipant) {
      return res.status(400).json({ success: false, error: 'Team is not a tournament participant' });
    }

    const team: any = await Team.findById(teamId);
    if (!team) return res.status(404).json({ success: false, error: 'Team not found' });

    const nextStats: any = { ...(team.stats || {}) };
    if (hasWins) nextStats.wins = asInt(winsRaw, 'wins');
    if (hasLosses) nextStats.losses = asInt(lossesRaw, 'losses');
    if (hasPoints) nextStats.points = asInt(pointsRaw, 'points');
    if (hasRank) nextStats.rank = asInt(rankRaw, 'rank');
    nextStats.matchesPlayed = Number(nextStats.wins || 0) + Number(nextStats.losses || 0);

    team.stats = nextStats;
    await team.save();

    await cacheService.invalidateTournamentCaches();
    invalidateAdminOverviewCache(tournamentId);

    return res.json({
      success: true,
      message: 'Participant stats updated',
      data: {
        tournamentId,
        teamId,
        stats: {
          wins: Number(nextStats.wins || 0),
          losses: Number(nextStats.losses || 0),
          points: Number(nextStats.points || 0),
          rank: Number(nextStats.rank || 0),
          matchesPlayed: Number(nextStats.matchesPlayed || 0)
        }
      }
    });
  } catch (error: any) {
    if (error?.message && /must be a non-negative number/i.test(error.message)) {
      return res.status(400).json({ success: false, error: error.message });
    }
    console.error('Error updating participant stats:', error);
    return res.status(500).json({ success: false, error: 'Failed to update participant stats' });
  }
});

// Admin: recalculate participant team stats based on tournament completed matches
router.post('/:id/participants/recalculate-stats', authenticateJWT, isAdmin, idempotency({ required: true }), async (req: any, res: any) => {
  try {
    const tournamentId = String(req.params.id || '');

    const tournament: any = await Tournament.findById(tournamentId).select('registeredTeams');
    if (!tournament) return res.status(404).json({ success: false, error: 'Tournament not found' });

    const registeredTeamIds = Array.isArray(tournament.registeredTeams)
      ? tournament.registeredTeams.map((id: mongoose.Types.ObjectId | string) => String(id))
      : [];

    if (!registeredTeamIds.length) {
      return res.json({
        success: true,
        message: 'No participant teams to recalculate',
        data: { tournamentId, updatedTeams: 0 }
      });
    }

    const completedMatches: any[] = await Match.find({
      tournament: new mongoose.Types.ObjectId(tournamentId),
      status: 'completed'
    }).select('team1 team2 winner score').lean();

    const statsMap = new Map<string, { wins: number; losses: number; points: number; matchesPlayed: number }>();
    registeredTeamIds.forEach((id: string) => {
      statsMap.set(id, { wins: 0, losses: 0, points: 0, matchesPlayed: 0 });
    });

    for (const match of completedMatches) {
      const team1Id = match?.team1 ? String(match.team1) : '';
      const team2Id = match?.team2 ? String(match.team2) : '';
      const winnerId = match?.winner ? String(match.winner) : '';

      if (team1Id && statsMap.has(team1Id)) {
        const row = statsMap.get(team1Id)!;
        row.matchesPlayed += 1;
      }
      if (team2Id && statsMap.has(team2Id)) {
        const row = statsMap.get(team2Id)!;
        row.matchesPlayed += 1;
      }

      if (winnerId && statsMap.has(winnerId)) {
        statsMap.get(winnerId)!.wins += 1;
      }

      if (team1Id && team1Id !== winnerId && statsMap.has(team1Id)) {
        statsMap.get(team1Id)!.losses += 1;
      }
      if (team2Id && team2Id !== winnerId && statsMap.has(team2Id)) {
        statsMap.get(team2Id)!.losses += 1;
      }
    }

    for (const [teamId, row] of statsMap.entries()) {
      // Basic tournament points formula: win = +3, loss = +1 participation point.
      const points = row.wins * 3 + row.losses;
      row.points = points;
      await Team.updateOne(
        { _id: new mongoose.Types.ObjectId(teamId) },
        {
          $set: {
            'stats.wins': row.wins,
            'stats.losses': row.losses,
            'stats.points': row.points,
            'stats.matchesPlayed': row.matchesPlayed
          }
        }
      );
    }

    await cacheService.invalidateTournamentCaches();
    invalidateAdminOverviewCache(tournamentId);

    return res.json({
      success: true,
      message: 'Participant stats recalculated from completed matches',
      data: {
        tournamentId,
        updatedTeams: statsMap.size,
        completedMatches: completedMatches.length
      }
    });
  } catch (error) {
    console.error('Error recalculating participant stats:', error);
    return res.status(500).json({ success: false, error: 'Failed to recalculate participant stats' });
  }
});

// Admin: tournament overview (participants, pending requests, matches, bracket)
const ADMIN_OVERVIEW_TTL_SEC = Math.max(3, Math.ceil(Math.max(3000, Number(process.env.ADMIN_OVERVIEW_CACHE_MS || 10000)) / 1000));
const MATCHES_ADMIN_TTL_SEC = Math.max(2, Math.ceil(Math.max(2000, Number(process.env.MATCHES_ADMIN_CACHE_MS || 5000)) / 1000));

function invalidateAdminOverviewCache(tournamentId?: string) {
  if (tournamentId) {
    const tournamentKey = String(tournamentId);
    void cacheService.invalidate(`tournament:admin-overview:${tournamentKey}`);
    void cacheService.invalidatePattern(`tournament:matches-admin:${tournamentKey}:*`);
    void cacheService.invalidatePattern(`tournament:matches-admin-ids:${tournamentKey}:*`);
    return;
  }
  void cacheService.invalidatePattern('tournament:admin-overview:*');
  void cacheService.invalidatePattern('tournament:matches-admin:*');
  void cacheService.invalidatePattern('tournament:matches-admin-ids:*');
}

router.get('/:id/admin-overview', authenticateJWT, isAdmin, async (req, res) => {
  try {
    const tournamentId = req.params.id;
    const cacheKey = `tournament:admin-overview:${tournamentId}`;
    const cached = await cacheService.getJson<any>(cacheKey);
    if (cached) {
      return res.json(cached);
    }

    const tournament: any = await Tournament.findById(tournamentId)
      .populate('registeredTeams', 'name tag logo stats members captain')
      .populate('registrationRequests.team', 'name tag logo stats members captain')
      .populate('registrationRequests.requestedBy', 'username firstName lastName')
      .lean();

    if (!tournament) {
      return res.status(404).json({ success: false, error: 'Tournament not found' });
    }

    const matches: any[] = await Match.find({ tournament: tournamentId })
      .populate('team1', 'name tag logo')
      .populate('team2', 'name tag logo')
      .populate('winner', 'name tag logo')
      .sort({ startTime: 1 })
      .lean();

    const matchIds = matches
      .map((match: any) => match?._id)
      .filter(Boolean)
      .map((id: any) => new mongoose.Types.ObjectId(id));

    const [eventsByTypeRows, participantsRows] = matchIds.length
      ? await Promise.all([
        MatchEvent.aggregate([
          { $match: { matchId: { $in: matchIds } } },
          {
            $group: {
              _id: {
                matchId: '$matchId',
                eventType: '$eventType'
              },
              count: { $sum: 1 }
            }
          }
        ]),
        MatchEvent.aggregate([
          { $match: { matchId: { $in: matchIds } } },
          {
            $group: {
              _id: '$matchId',
              players: { $addToSet: '$playerId' },
              teams: { $addToSet: '$teamId' },
              totalEvents: { $sum: 1 }
            }
          }
        ])
      ])
      : [[], []];

    const eventsByMatch = new Map<string, Record<string, number>>();
    for (const row of eventsByTypeRows as any[]) {
      const matchId = row?._id?.matchId ? String(row._id.matchId) : '';
      const eventType = row?._id?.eventType ? String(row._id.eventType) : '';
      if (!matchId || !eventType) continue;
      const next = eventsByMatch.get(matchId) || {};
      next[eventType] = Number(row?.count || 0);
      eventsByMatch.set(matchId, next);
    }

    const participantsByMatch = new Map<string, { players: number; teams: number; totalEvents: number }>();
    for (const row of participantsRows as any[]) {
      const matchId = row?._id ? String(row._id) : '';
      if (!matchId) continue;
      const players = Array.isArray(row?.players) ? row.players.filter(Boolean).length : 0;
      const teams = Array.isArray(row?.teams) ? row.teams.filter(Boolean).length : 0;
      participantsByMatch.set(matchId, {
        players,
        teams,
        totalEvents: Number(row?.totalEvents || 0)
      });
    }

    const teams = (tournament.registeredTeams || []).map((team: any) => ({
      id: team?._id?.toString?.() || '',
      name: team?.name || '',
      tag: team?.tag || '',
      logo: team?.logo || '',
      membersCount: Array.isArray(team?.members) ? team.members.length : 0,
      stats: {
        wins: Number(team?.stats?.wins || 0),
        losses: Number(team?.stats?.losses || 0),
        winRate: Number(team?.stats?.winRate || 0),
        totalMatches: Number(team?.stats?.totalMatches || 0)
      }
    }));

    const requests = (tournament.registrationRequests || []).map((entry: any) => ({
      teamId: entry?.team?._id?.toString?.() || entry?.team?.toString?.() || '',
      teamName: entry?.team?.name || '',
      teamTag: entry?.team?.tag || '',
      teamLogo: entry?.team?.logo || '',
      status: entry?.status || 'pending',
      requestedAt: entry?.requestedAt?.toISOString?.() || null,
      reviewedAt: entry?.reviewedAt?.toISOString?.() || null
    }));

    const bracket: Record<string, any[]> = {};
    matches.forEach((match: any) => {
      const round = (match.round || 'Round').toString();
      if (!bracket[round]) bracket[round] = [];
      bracket[round].push({
        id: match._id?.toString?.() || '',
        team1: match.team1 ? {
          id: match.team1._id?.toString?.() || '',
          name: match.team1.name || '',
          tag: match.team1.tag || '',
          logo: match.team1.logo || ''
        } : null,
        team2: match.team2 ? {
          id: match.team2._id?.toString?.() || '',
          name: match.team2.name || '',
          tag: match.team2.tag || '',
          logo: match.team2.logo || ''
        } : null,
        status: match.status || 'scheduled',
        score: {
          team1: Number(match.score?.team1 || 0),
          team2: Number(match.score?.team2 || 0)
        },
        winnerId: match.winner?._id?.toString?.() || match.winner?.toString?.() || null,
        startTime: match.startTime?.toISOString?.() || null,
        hasRoomCredentials: Boolean(match.roomCredentials?.roomId && match.roomCredentials?.password),
        roomVisibleAt: match.roomCredentials?.visibleAt?.toISOString?.() || null,
        roomExpiresAt: match.roomCredentials?.expiresAt?.toISOString?.() || null
      });
    });

    const matchStatusSummary = matches.reduce(
      (acc, match: any) => {
        const key = String(match?.status || 'scheduled').toLowerCase();
        if (key === 'live' || key === 'completed' || key === 'cancelled' || key === 'scheduled') {
          acc[key] += 1;
        } else {
          acc.scheduled += 1;
        }
        return acc;
      },
      { scheduled: 0, live: 0, completed: 0, cancelled: 0 }
    );

    const roomsPrepared = matches.filter((match: any) => Boolean(match?.roomCredentials?.roomId && match?.roomCredentials?.password)).length;
    const liveWithoutRoom = matches.filter(
      (match: any) => String(match?.status || '').toLowerCase() === 'live' && !(match?.roomCredentials?.roomId && match?.roomCredentials?.password)
    ).length;
    const completedWithoutWinner = matches.filter(
      (match: any) => String(match?.status || '').toLowerCase() === 'completed' && !match?.winner
    ).length;

    const pendingRequests = requests.filter((item: any) => String(item?.status || '').toLowerCase() === 'pending').length;

    const payload = {
      success: true,
      data: {
        tournament: {
          id: tournament._id?.toString?.() || '',
          name: tournament.name || '',
          game: tournament.game || '',
          status: tournament.status || 'upcoming',
          maxTeams: Number(tournament.maxTeams || 0),
          participants: teams.length
        },
        summary: {
          teamsApproved: teams.length,
          requestsPending: pendingRequests,
          matchesTotal: matches.length,
          roomsPrepared,
          liveWithoutRoom,
          completedWithoutWinner,
          byStatus: matchStatusSummary
        },
        teams,
        requests,
        matches: matches.map((match: any) => ({
          id: match._id?.toString?.() || '',
          status: match.status || 'scheduled',
          round: match.round || '',
          startTime: match.startTime?.toISOString?.() || null,
          team1: match.team1 ? {
            id: match.team1._id?.toString?.() || '',
            name: match.team1.name || '',
            tag: match.team1.tag || '',
            logo: match.team1.logo || ''
          } : null,
          team2: match.team2 ? {
            id: match.team2._id?.toString?.() || '',
            name: match.team2.name || '',
            tag: match.team2.tag || '',
            logo: match.team2.logo || ''
          } : null,
          score: {
            team1: Number(match.score?.team1 || 0),
            team2: Number(match.score?.team2 || 0)
          },
          winnerId: match.winner?._id?.toString?.() || match.winner?.toString?.() || null,
          hasRoomCredentials: Boolean(match.roomCredentials?.roomId && match.roomCredentials?.password),
          roomCredentials: match.roomCredentials?.roomId && match.roomCredentials?.password
            ? {
              roomId: match.roomCredentials.roomId,
              password: match.roomCredentials.password,
              generatedAt: match.roomCredentials.generatedAt?.toISOString?.() || null,
              visibleAt: match.roomCredentials.visibleAt?.toISOString?.() || null,
              expiresAt: match.roomCredentials.expiresAt?.toISOString?.() || null
            }
            : null,
          eventsSummary: (() => {
            const key = match._id?.toString?.() || '';
            const byType = eventsByMatch.get(key) || {};
            const participants = participantsByMatch.get(key) || { players: 0, teams: 0, totalEvents: 0 };
            return {
              totalEvents: Number(participants.totalEvents || 0),
              participants: {
                players: Number(participants.players || 0),
                teams: Number(participants.teams || 0)
              },
              byType: {
                kill: Number(byType.kill || 0),
                death: Number(byType.death || 0),
                assist: Number(byType.assist || 0),
                utility: Number(byType.utility || 0),
                clutch: Number(byType.clutch || 0),
                objective: Number(byType.objective || 0)
              }
            };
          })()
        })),
        bracket
      }
    };
    await cacheService.setJson(cacheKey, payload, ADMIN_OVERVIEW_TTL_SEC);
    return res.json(payload);
  } catch (error) {
    console.error('Error fetching admin tournament overview:', error);
    return res.status(500).json({ success: false, error: 'Failed to fetch admin tournament overview' });
  }
});

// Admin: paged tournament matches with filters/search
const applyRoomWinnerFilters = (baseQuery: any, room: string, winner: string) => {
  const next = { ...(baseQuery || {}) } as any;

  if (room === 'with_room') {
    next['roomCredentials.roomId'] = { $exists: true, $ne: '' };
    next['roomCredentials.password'] = { $exists: true, $ne: '' };
  } else if (room === 'without_room') {
    next.$or = [
      { 'roomCredentials.roomId': { $exists: false } },
      { 'roomCredentials.password': { $exists: false } },
      { 'roomCredentials.roomId': '' },
      { 'roomCredentials.password': '' }
    ];
  }

  if (winner === 'with_winner') {
    next.winner = { $exists: true, $ne: null };
  } else if (winner === 'without_winner') {
    next.$and = [...(Array.isArray(next.$and) ? next.$and : []), { $or: [{ winner: { $exists: false } }, { winner: null }] }];
  }

  return next;
};

const escapeRegex = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const buildMatchSearchPipeline = (baseQuery: any, search: string) => {
  const pipeline: any[] = [{ $match: baseQuery }];

  pipeline.push(
    { $lookup: { from: 'teams', localField: 'team1', foreignField: '_id', as: 'team1Doc' } },
    { $unwind: { path: '$team1Doc', preserveNullAndEmptyArrays: true } },
    { $lookup: { from: 'teams', localField: 'team2', foreignField: '_id', as: 'team2Doc' } },
    { $unwind: { path: '$team2Doc', preserveNullAndEmptyArrays: true } },
    { $lookup: { from: 'teams', localField: 'winner', foreignField: '_id', as: 'winnerDoc' } },
    { $unwind: { path: '$winnerDoc', preserveNullAndEmptyArrays: true } }
  );

  if (search) {
    const regex = new RegExp(escapeRegex(search), 'i');
    pipeline.push({
      $match: {
        $or: [{ round: regex }, { 'team1Doc.name': regex }, { 'team2Doc.name': regex }]
      }
    });
  }

  return pipeline;
};

router.get('/:id/matches/admin', authenticateJWT, isAdmin, async (req: any, res: any) => {
  try {
    const tournamentId = String(req.params.id || '');
    const { page, limit } = parsePagination(req.query, { defaultLimit: 12, maxLimit: 100 });
    const status = typeof req.query?.status === 'string' ? req.query.status.trim().toLowerCase() : 'all';
    const room = typeof req.query?.room === 'string' ? req.query.room.trim().toLowerCase() : 'all';
    const winner = typeof req.query?.winner === 'string' ? req.query.winner.trim().toLowerCase() : 'all';
    const search = typeof req.query?.search === 'string' ? req.query.search.trim().toLowerCase() : '';

    const tournament = await Tournament.findById(tournamentId).select('_id');
    if (!tournament) {
      return res.status(404).json({ success: false, error: 'Tournament not found' });
    }
    const cacheKey = `tournament:matches-admin:${tournamentId}:${JSON.stringify({ page, limit, status, room, winner, search })}`;
    const cached = await cacheService.getJson<any>(cacheKey);
    if (cached) {
      return res.json(cached);
    }

    const summaryQuery: any = { tournament: new mongoose.Types.ObjectId(tournamentId) };
    if (status && status !== 'all') {
      summaryQuery.status = status;
    }
    const dbQuery = applyRoomWinnerFilters(summaryQuery, room, winner);

    if (!search) {
      const skip = (page - 1) * limit;
      const [pageRows, total, totalAll, byStatusRows, roomsPreparedAll, roomsPreparedFiltered, liveWithoutRoom, completedWithoutWinner] = await Promise.all([
        Match.find(dbQuery)
          .populate('team1', 'name tag logo')
          .populate('team2', 'name tag logo')
          .populate('winner', 'name tag logo')
          .sort({ startTime: 1 })
          .skip(skip)
          .limit(limit)
          .lean(),
        Match.countDocuments(dbQuery),
        Match.countDocuments(summaryQuery),
        Match.aggregate([
          { $match: summaryQuery },
          { $group: { _id: '$status', count: { $sum: 1 } } }
        ]),
        Match.countDocuments({ ...summaryQuery, 'roomCredentials.roomId': { $exists: true, $ne: '' }, 'roomCredentials.password': { $exists: true, $ne: '' } }),
        Match.countDocuments({ ...dbQuery, 'roomCredentials.roomId': { $exists: true, $ne: '' }, 'roomCredentials.password': { $exists: true, $ne: '' } }),
        Match.countDocuments({
          ...summaryQuery,
          status: 'live',
          $or: [
            { 'roomCredentials.roomId': { $exists: false } },
            { 'roomCredentials.password': { $exists: false } },
            { 'roomCredentials.roomId': '' },
            { 'roomCredentials.password': '' }
          ]
        }),
        Match.countDocuments({ ...summaryQuery, status: 'completed', $or: [{ winner: { $exists: false } }, { winner: null }] })
      ]);

      const byStatus = { scheduled: 0, live: 0, completed: 0, cancelled: 0 } as Record<string, number>;
      (byStatusRows || []).forEach((row: any) => {
        const key = String(row?._id || '').toLowerCase();
        if (key) byStatus[key] = Number(row?.count || 0);
      });

      const matchIds = pageRows
        .map((match: any) => match?._id)
        .filter(Boolean)
        .map((id: any) => new mongoose.Types.ObjectId(id));

      const [eventsByTypeRows, participantsRows] = matchIds.length
        ? await Promise.all([
          MatchEvent.aggregate([
            { $match: { matchId: { $in: matchIds } } },
            { $group: { _id: { matchId: '$matchId', eventType: '$eventType' }, count: { $sum: 1 } } }
          ]),
          MatchEvent.aggregate([
            { $match: { matchId: { $in: matchIds } } },
            { $group: { _id: '$matchId', players: { $addToSet: '$playerId' }, teams: { $addToSet: '$teamId' }, totalEvents: { $sum: 1 } } }
          ])
        ])
        : [[], []];

      const eventsByMatch = new Map<string, Record<string, number>>();
      for (const row of eventsByTypeRows as any[]) {
        const matchId = row?._id?.matchId ? String(row._id.matchId) : '';
        const eventType = row?._id?.eventType ? String(row._id.eventType) : '';
        if (!matchId || !eventType) continue;
        const next = eventsByMatch.get(matchId) || {};
        next[eventType] = Number(row?.count || 0);
        eventsByMatch.set(matchId, next);
      }

      const participantsByMatch = new Map<string, { players: number; teams: number; totalEvents: number }>();
      for (const row of participantsRows as any[]) {
        const matchId = row?._id ? String(row._id) : '';
        if (!matchId) continue;
        participantsByMatch.set(matchId, {
          players: Array.isArray(row?.players) ? row.players.length : 0,
          teams: Array.isArray(row?.teams) ? row.teams.length : 0,
          totalEvents: Number(row?.totalEvents || 0)
        });
      }

      const data = pageRows.map((match: any) => {
        const key = String(match?._id || '');
        const byType = eventsByMatch.get(key) || {};
        const participantsMeta = participantsByMatch.get(key) || { players: 0, teams: 0, totalEvents: 0 };
        return {
          id: key,
          round: String(match?.round || ''),
          status: String(match?.status || 'scheduled'),
          startTime: match?.startTime || null,
          team1: match?.team1 ? { id: String(match.team1._id || ''), name: String(match.team1.name || ''), tag: String(match.team1.tag || ''), logo: String(match.team1.logo || '') } : null,
          team2: match?.team2 ? { id: String(match.team2._id || ''), name: String(match.team2.name || ''), tag: String(match.team2.tag || ''), logo: String(match.team2.logo || '') } : null,
          winnerId: match?.winner ? String(match.winner._id || '') : null,
          score: { team1: Number(match?.score?.team1 || 0), team2: Number(match?.score?.team2 || 0) },
          hasRoomCredentials: Boolean(match?.roomCredentials?.roomId && match?.roomCredentials?.password),
          roomCredentials: match?.roomCredentials?.roomId && match?.roomCredentials?.password
            ? {
                roomId: String(match.roomCredentials.roomId || ''),
                password: String(match.roomCredentials.password || ''),
                visibleAt: match.roomCredentials.visibleAt || null,
                expiresAt: match.roomCredentials.expiresAt || null
              }
            : null,
          eventsSummary: {
            totalEvents: Number(participantsMeta.totalEvents || 0),
            participants: { players: Number(participantsMeta.players || 0), teams: Number(participantsMeta.teams || 0) },
            byType
          }
        };
      });

      const payload = {
        success: true,
        data,
        pagination: buildPaginationMeta(page, limit, total),
        summary: { filteredTotal: total, totalAll, roomsPreparedFiltered, roomsPreparedAll, byStatus, liveWithoutRoom, completedWithoutWinner }
      };
      await cacheService.setJson(cacheKey, payload, MATCHES_ADMIN_TTL_SEC);
      return res.json(payload);
    }

    const skip = (page - 1) * limit;
    const searchPipeline = buildMatchSearchPipeline(dbQuery, search);
    const [countRow] = await Match.aggregate([...searchPipeline, { $count: 'total' }]);
    const total = Number(countRow?.total || 0);
    const [pageRows, totalAll, byStatusRows, roomsPreparedAll, liveWithoutRoom, completedWithoutWinner] = await Promise.all([
      Match.aggregate([
        ...searchPipeline,
        { $sort: { startTime: 1 } },
        { $skip: skip },
        { $limit: limit },
        {
          $project: {
            _id: 1,
            round: 1,
            status: 1,
            startTime: 1,
            score: 1,
            roomCredentials: 1,
            team1: { _id: '$team1Doc._id', name: '$team1Doc.name', tag: '$team1Doc.tag', logo: '$team1Doc.logo' },
            team2: { _id: '$team2Doc._id', name: '$team2Doc.name', tag: '$team2Doc.tag', logo: '$team2Doc.logo' },
            winner: { _id: '$winnerDoc._id', name: '$winnerDoc.name', tag: '$winnerDoc.tag', logo: '$winnerDoc.logo' }
          }
        }
      ]),
      Match.countDocuments(summaryQuery),
      Match.aggregate([
        { $match: summaryQuery },
        { $group: { _id: '$status', count: { $sum: 1 } } }
      ]),
      Match.countDocuments({ ...summaryQuery, 'roomCredentials.roomId': { $exists: true, $ne: '' }, 'roomCredentials.password': { $exists: true, $ne: '' } }),
      Match.countDocuments({
        ...summaryQuery,
        status: 'live',
        $or: [
          { 'roomCredentials.roomId': { $exists: false } },
          { 'roomCredentials.password': { $exists: false } },
          { 'roomCredentials.roomId': '' },
          { 'roomCredentials.password': '' }
        ]
      }),
      Match.countDocuments({ ...summaryQuery, status: 'completed', $or: [{ winner: { $exists: false } }, { winner: null }] })
    ]);
    const byStatus = { scheduled: 0, live: 0, completed: 0, cancelled: 0 } as Record<string, number>;
    (byStatusRows || []).forEach((row: any) => {
      const key = String(row?._id || '').toLowerCase();
      if (key) byStatus[key] = Number(row?.count || 0);
    });
    const roomsPreparedFiltered =
      room === 'without_room'
        ? 0
        : room === 'with_room'
          ? total
          : Number(
              (
                await Match.aggregate([
                  ...searchPipeline,
                  { $match: { 'roomCredentials.roomId': { $exists: true, $ne: '' }, 'roomCredentials.password': { $exists: true, $ne: '' } } },
                  { $count: 'total' }
                ])
              )?.[0]?.total || 0
            );

    const matchIds = pageRows
      .map((match: any) => match?._id)
      .filter(Boolean)
      .map((id: any) => new mongoose.Types.ObjectId(id));

    const [eventsByTypeRows, participantsRows] = matchIds.length
      ? await Promise.all([
        MatchEvent.aggregate([
          { $match: { matchId: { $in: matchIds } } },
          {
            $group: {
              _id: {
                matchId: '$matchId',
                eventType: '$eventType'
              },
              count: { $sum: 1 }
            }
          }
        ]),
        MatchEvent.aggregate([
          { $match: { matchId: { $in: matchIds } } },
          {
            $group: {
              _id: '$matchId',
              players: { $addToSet: '$playerId' },
              teams: { $addToSet: '$teamId' },
              totalEvents: { $sum: 1 }
            }
          }
        ])
      ])
      : [[], []];

    const eventsByMatch = new Map<string, Record<string, number>>();
    for (const row of eventsByTypeRows as any[]) {
      const matchId = row?._id?.matchId ? String(row._id.matchId) : '';
      const eventType = row?._id?.eventType ? String(row._id.eventType) : '';
      if (!matchId || !eventType) continue;
      const next = eventsByMatch.get(matchId) || {};
      next[eventType] = Number(row?.count || 0);
      eventsByMatch.set(matchId, next);
    }

    const participantsByMatch = new Map<string, { players: number; teams: number; totalEvents: number }>();
    for (const row of participantsRows as any[]) {
      const matchId = row?._id ? String(row._id) : '';
      if (!matchId) continue;
      participantsByMatch.set(matchId, {
        players: Array.isArray(row?.players) ? row.players.length : 0,
        teams: Array.isArray(row?.teams) ? row.teams.length : 0,
        totalEvents: Number(row?.totalEvents || 0)
      });
    }

    const data = pageRows.map((match: any) => {
      const key = String(match?._id || '');
      const byType = eventsByMatch.get(key) || {};
      const participantsMeta = participantsByMatch.get(key) || { players: 0, teams: 0, totalEvents: 0 };
      return {
        id: key,
        round: String(match?.round || ''),
        status: String(match?.status || 'scheduled'),
        startTime: match?.startTime || null,
        team1: match?.team1
          ? {
            id: String(match.team1._id || ''),
            name: String(match.team1.name || ''),
            tag: String(match.team1.tag || ''),
            logo: String(match.team1.logo || '')
          }
          : null,
        team2: match?.team2
          ? {
            id: String(match.team2._id || ''),
            name: String(match.team2.name || ''),
            tag: String(match.team2.tag || ''),
            logo: String(match.team2.logo || '')
          }
          : null,
        winnerId: match?.winner ? String(match.winner._id || '') : null,
        score: {
          team1: Number(match?.score?.team1 || 0),
          team2: Number(match?.score?.team2 || 0)
        },
        hasRoomCredentials: Boolean(match?.roomCredentials?.roomId && match?.roomCredentials?.password),
        roomCredentials: match?.roomCredentials?.roomId && match?.roomCredentials?.password
          ? {
            roomId: String(match.roomCredentials.roomId || ''),
            password: String(match.roomCredentials.password || ''),
            visibleAt: match.roomCredentials.visibleAt || null,
            expiresAt: match.roomCredentials.expiresAt || null
          }
          : null,
        eventsSummary: {
          totalEvents: Number(participantsMeta.totalEvents || 0),
          participants: {
            players: Number(participantsMeta.players || 0),
            teams: Number(participantsMeta.teams || 0)
          },
          byType
        }
      };
    });

    const payload = {
      success: true,
      data,
      pagination: buildPaginationMeta(page, limit, total),
      summary: {
        filteredTotal: total,
        totalAll,
        roomsPreparedFiltered,
        roomsPreparedAll,
        byStatus,
        liveWithoutRoom,
        completedWithoutWinner
      }
    };
    await cacheService.setJson(cacheKey, payload, MATCHES_ADMIN_TTL_SEC);
    return res.json(payload);
  } catch (error) {
    console.error('Error fetching paged tournament matches:', error);
    return res.status(500).json({ success: false, error: 'Failed to fetch tournament matches' });
  }
});

// Admin: resolve all filtered tournament match IDs for bulk operations
router.get('/:id/matches/admin/ids', authenticateJWT, isAdmin, async (req: any, res: any) => {
  try {
    const tournamentId = String(req.params.id || '');
    const status = typeof req.query?.status === 'string' ? req.query.status.trim().toLowerCase() : 'all';
    const room = typeof req.query?.room === 'string' ? req.query.room.trim().toLowerCase() : 'all';
    const winner = typeof req.query?.winner === 'string' ? req.query.winner.trim().toLowerCase() : 'all';
    const search = typeof req.query?.search === 'string' ? req.query.search.trim().toLowerCase() : '';

    const tournament = await Tournament.findById(tournamentId).select('_id');
    if (!tournament) {
      return res.status(404).json({ success: false, error: 'Tournament not found' });
    }
    const cacheKey = `tournament:matches-admin-ids:${tournamentId}:${JSON.stringify({ status, room, winner, search })}`;
    const cached = await cacheService.getJson<any>(cacheKey);
    if (cached) {
      return res.json(cached);
    }

    const summaryQuery: any = { tournament: new mongoose.Types.ObjectId(tournamentId) };
    if (status && status !== 'all') {
      summaryQuery.status = status;
    }
    const dbQuery = applyRoomWinnerFilters(summaryQuery, room, winner);

    if (!search) {
      const rows: any[] = await Match.find(dbQuery)
        .select('_id')
        .lean();
      const payload = {
        success: true,
        data: {
          matchIds: rows.map((m: any) => String(m?._id || '')).filter(Boolean),
          filteredTotal: rows.length,
          totalAll: await Match.countDocuments(summaryQuery)
        }
      };
      await cacheService.setJson(cacheKey, payload, MATCHES_ADMIN_TTL_SEC);
      return res.json(payload);
    }

    const filtered: any[] = await Match.aggregate([
      ...buildMatchSearchPipeline(dbQuery, search),
      { $project: { _id: 1 } }
    ]);

    const payload = {
      success: true,
      data: {
        matchIds: filtered.map((m: any) => String(m?._id || '')).filter(Boolean),
        filteredTotal: filtered.length,
        totalAll: await Match.countDocuments(summaryQuery)
      }
    };
    await cacheService.setJson(cacheKey, payload, MATCHES_ADMIN_TTL_SEC);
    return res.json(payload);
  } catch (error) {
    console.error('Error resolving tournament match ids:', error);
    return res.status(500).json({ success: false, error: 'Failed to resolve match ids' });
  }
});

// Admin: export filtered tournament matches as CSV
router.get('/:id/matches/admin/export.csv', authenticateJWT, isAdmin, async (req: any, res: any) => {
  try {
    const tournamentId = String(req.params.id || '');
    const status = typeof req.query?.status === 'string' ? req.query.status.trim().toLowerCase() : 'all';
    const room = typeof req.query?.room === 'string' ? req.query.room.trim().toLowerCase() : 'all';
    const winner = typeof req.query?.winner === 'string' ? req.query.winner.trim().toLowerCase() : 'all';
    const search = typeof req.query?.search === 'string' ? req.query.search.trim().toLowerCase() : '';

    const tournament = await Tournament.findById(tournamentId).select('_id');
    if (!tournament) {
      return res.status(404).json({ success: false, error: 'Tournament not found' });
    }

    const summaryQuery: any = { tournament: new mongoose.Types.ObjectId(tournamentId) };
    if (status && status !== 'all') summaryQuery.status = status;
    const dbQuery = applyRoomWinnerFilters(summaryQuery, room, winner);

    const filtered: any[] = search
      ? await Match.aggregate([
          ...buildMatchSearchPipeline(dbQuery, search),
          { $sort: { startTime: 1 } },
          {
            $project: {
              _id: 1,
              round: 1,
              status: 1,
              score: 1,
              roomCredentials: 1,
              team1: { name: '$team1Doc.name' },
              team2: { name: '$team2Doc.name' },
              winner: { name: '$winnerDoc.name' }
            }
          }
        ])
      : await Match.find(dbQuery)
          .populate('team1', 'name')
          .populate('team2', 'name')
          .populate('winner', 'name')
          .sort({ startTime: 1 })
          .select('_id round status winner score roomCredentials team1 team2')
          .lean();

    const csvCell = (value: any) => `"${String(value ?? '').replace(/"/g, '""')}"`;
    const header = [
      'matchId',
      'tournamentId',
      'round',
      'team1',
      'team2',
      'score',
      'status',
      'winner',
      'roomId',
      'roomPassword',
      'roomVisibleAt',
      'roomExpiresAt'
    ];

    const rows = filtered.map((match: any) => {
      const winnerName = String(match?.winner?.name || '');
      return [
        String(match?._id || ''),
        tournamentId,
        String(match?.round || ''),
        String(match?.team1?.name || ''),
        String(match?.team2?.name || ''),
        `${Number(match?.score?.team1 || 0)}:${Number(match?.score?.team2 || 0)}`,
        String(match?.status || ''),
        winnerName,
        String(match?.roomCredentials?.roomId || ''),
        String(match?.roomCredentials?.password || ''),
        match?.roomCredentials?.visibleAt ? new Date(match.roomCredentials.visibleAt).toISOString() : '',
        match?.roomCredentials?.expiresAt ? new Date(match.roomCredentials.expiresAt).toISOString() : ''
      ];
    });

    const csv = [header, ...rows].map((row) => row.map(csvCell).join(',')).join('\n');
    const fileName = `tournament_matches_${tournamentId}_${new Date().toISOString().slice(0, 10)}.csv`;

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename=\"${fileName}\"`);
    return res.status(200).send(csv);
  } catch (error) {
    console.error('Error exporting tournament matches csv:', error);
    return res.status(500).json({ success: false, error: 'Failed to export tournament matches' });
  }
});

// Start tournament manually (admin) and generate initial bracket
router.post('/:id/start', authenticateJWT, isAdmin, async (req, res) => {
  try {
    const tournament: any = await Tournament.findById(req.params.id);
    if (!tournament) {
      return res.status(404).json({ success: false, error: 'Tournament not found' });
    }

    if (tournament.status === 'completed') {
      return res.status(400).json({ success: false, error: 'Tournament already completed' });
    }

    if (tournament.type === 'team' && (!Array.isArray(tournament.registeredTeams) || tournament.registeredTeams.length < 2)) {
      return res.status(400).json({ success: false, error: 'At least 2 teams are required to start tournament' });
    }

    if (tournament.type === 'solo' && (!Array.isArray(tournament.registeredPlayers) || tournament.registeredPlayers.length < 2)) {
      return res.status(400).json({ success: false, error: 'At least 2 players are required to start tournament' });
    }

    tournament.status = 'ongoing';
    tournament.isRegistrationOpen = false;
    await tournament.save();

    const generated = await generateBracketMatches(tournament);

    await cacheService.invalidateTournamentCaches();
    invalidateAdminOverviewCache(String(req.params.id || ''));

    return res.json({
      success: true,
      message: 'Tournament started successfully',
      data: {
        id: tournament._id?.toString() || '',
        status: tournament.status,
        generatedMatches: generated.length
      }
    });
  } catch (error) {
    console.error('Error starting tournament:', error);
    return res.status(500).json({ success: false, error: 'Failed to start tournament' });
  }
});

// Update tournament (admin only)
router.put('/:id',
  authenticateJWT,
  isAdmin,
  body('name').optional().notEmpty().withMessage('Name cannot be empty'),
  body('prizePool').optional().isNumeric().withMessage('Prize pool must be a number'),
  validateRequest,
  async (req: any, res: any) => {
    try {
      const tournament = await Tournament.findById(req.params.id);

      if (!tournament) {
        return res.status(404).json({
          success: false,
          error: 'Tournament not found'
        });
      }

      const {
        name,
        game,
        status,
        startDate,
        endDate,
        prizePool,
        maxTeams,
        maxParticipants,
        teamSize,
        skillLevel,
        format,
        type,
        image,
        description,
        rules
      } = req.body;

      // Update tournament fields
      if (name) tournament.name = name;
      if (game) tournament.game = game;
      if (typeof req.body.cadence === 'string') (tournament as any).cadence = req.body.cadence;
      if (status) tournament.status = status;
      if (startDate) tournament.startDate = new Date(startDate);
      if (endDate) tournament.endDate = new Date(endDate);
      if (prizePool !== undefined) tournament.prizePool = prizePool;
      if (maxTeams !== undefined) tournament.maxTeams = Number(maxTeams);
      if (maxParticipants !== undefined) tournament.maxParticipants = Number(maxParticipants);
      if (teamSize !== undefined) (tournament as any).teamSize = Number(teamSize) as 2 | 5;
      if (skillLevel) tournament.skillLevel = skillLevel;
      if (format) tournament.format = format;
      if (type) tournament.type = type;
      if (typeof image !== 'undefined') {
        tournament.image = normalizeTournamentImageUrl(image);
        tournament.coverImage = tournament.image;
      }
      if (description !== undefined) tournament.description = description;
      if (rules !== undefined) tournament.rules = rules;

      await tournament.save();

      // Reload for response
      const populatedTournament: any = await Tournament.findById(req.params.id)
        .populate('registeredTeams', 'name tag logo members')
        .lean();

      const transformed: any = {
        id: String(populatedTournament._id),
        name: populatedTournament.name,
        title: populatedTournament.name,
        game: populatedTournament.game,
        cadence: inferTournamentCadence(populatedTournament),
        teamMode: inferTournamentTeamMode(populatedTournament),
        teamSize: Number(populatedTournament.teamSize || populatedTournament.maxPlayers || 0) || undefined,
        image: populatedTournament.image || populatedTournament.coverImage || '',
        coverImage: populatedTournament.coverImage || populatedTournament.image || '',
        status: populatedTournament.status === 'ongoing' ? 'in_progress' : populatedTournament.status,
        startDate: populatedTournament.startDate?.toISOString() || new Date().toISOString(),
        endDate: populatedTournament.endDate?.toISOString() || new Date().toISOString(),
        prizePool: populatedTournament.prizePool || 0,
        maxTeams: populatedTournament.maxTeams || 0,
        maxParticipants: populatedTournament.maxParticipants ?? populatedTournament.maxTeams ?? 0,
        registeredTeams: (populatedTournament.registeredTeams || []).map((team: any) => ({
          id: team._id?.toString() || team.toString(),
          name: team.name || '',
          tag: team.tag || '',
          logo: team.logo || '',
          players: team.members?.map((m: any) => m.toString()) || []
        })),
        participants: populatedTournament.registeredTeams?.length || 0,
        currentParticipants: populatedTournament.registeredTeams?.length || 0,
        pendingRequestsCount: Array.isArray(populatedTournament.registrationRequests)
          ? populatedTournament.registrationRequests.filter((entry: any) => entry?.status === 'pending').length
          : 0,
        format: populatedTournament.format || 'single_elimination',
        type: populatedTournament.type || 'team',
        description: populatedTournament.description || '',
        rules: populatedTournament.rules || '',
        createdAt: populatedTournament.createdAt?.toISOString(),
        updatedAt: populatedTournament.updatedAt?.toISOString()
      };

      // Invalidate caches
      await cacheService.invalidateTournamentCaches();
      invalidateAdminOverviewCache(String(populatedTournament?._id || req.params.id || ''));

      res.json({
        success: true,
        data: transformed
      });
    } catch (error: any) {
      console.error('Error updating tournament:', error);
      if (error?.message === 'Tournament image must be an uploaded image URL') {
        return res.status(400).json({
          success: false,
          error: error.message
        });
      }
      res.status(500).json({
        success: false,
        error: 'Failed to update tournament'
      });
    }
  });


// Delete tournament (admin only)
router.delete('/:id', authenticateJWT, isAdmin, async (req, res) => {
  try {
    const tournament = await Tournament.findById(req.params.id);

    if (!tournament) {
      return res.status(404).json({
        success: false,
        error: 'Tournament not found'
      });
    }

    // Admin can delete any tournament - no need to check ownership

    await Tournament.findByIdAndDelete(req.params.id);

    // Invalidate caches
    await cacheService.invalidateTournamentCaches();
    invalidateAdminOverviewCache(String(req.params.id || ''));

    res.json({
      success: true,
      message: 'Tournament deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting tournament:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete tournament'
    });
  }
});

// Get tournament schedule (upcoming matches)
router.get('/:id/schedule', async (req, res) => {
  try {
    const tournamentId = req.params.id;
    const cacheKey = `tournament:schedule:${tournamentId}`;
    const transformed = (await cacheService.getOrSet(
      cacheKey,
      async () => {
        const matches = await Match.find({ tournament: tournamentId, status: 'scheduled' })
          .populate('team1', 'name tag logo')
          .populate('team2', 'name tag logo')
          .sort({ startTime: 1 })
          .lean();

        return matches.map((m: any) => ({
          id: String(m._id),
          tournamentId,
          game: m.game,
          team1: m.team1 ? {
            id: m.team1._id?.toString() || m.team1.toString(),
            name: m.team1.name || '',
            tag: m.team1.tag || '',
            logo: m.team1.logo || ''
          } : m.team1,
          team2: m.team2 ? {
            id: m.team2._id?.toString() || m.team2.toString(),
            name: m.team2.name || '',
            tag: m.team2.tag || '',
            logo: m.team2.logo || ''
          } : m.team2,
          status: 'upcoming',
          startTime: m.startTime?.toISOString() || new Date().toISOString(),
          round: m.round || '',
          map: m.map || '',
          score: m.score || {}
        }));
      },
      { key: cacheKey, ttl: 15 }
    )) || [];

    res.json({ success: true, data: transformed });
  } catch (error) {
    console.error('Error fetching tournament schedule:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch schedule' });
  }
});

// Get tournament live matches
router.get('/:id/live', async (req, res) => {
  try {
    const tournamentId = req.params.id;
    const cacheKey = `tournament:live:${tournamentId}`;
    const transformed = (await cacheService.getOrSet(
      cacheKey,
      async () => {
        const matches = await Match.find({ tournament: tournamentId, status: 'live' })
          .populate('team1', 'name tag logo')
          .populate('team2', 'name tag logo')
          .populate('winner', 'name tag logo')
          .sort({ startTime: 1 })
          .lean();

        return matches.map((m: any) => ({
          id: String(m._id),
          tournamentId,
          game: m.game,
          team1: m.team1 ? {
            id: m.team1._id?.toString() || m.team1.toString(),
            name: m.team1.name || '',
            tag: m.team1.tag || '',
            logo: m.team1.logo || ''
          } : m.team1,
          team2: m.team2 ? {
            id: m.team2._id?.toString() || m.team2.toString(),
            name: m.team2.name || '',
            tag: m.team2.tag || '',
            logo: m.team2.logo || ''
          } : m.team2,
          status: 'live',
          startTime: m.startTime?.toISOString() || new Date().toISOString(),
          round: m.round || '',
          map: m.map || '',
          score: m.score || {},
          winner: m.winner ? {
            id: m.winner._id?.toString() || m.winner.toString(),
            name: m.winner.name || '',
            tag: m.winner.tag || '',
            logo: m.winner.logo || ''
          } : m.winner
        }));
      },
      { key: cacheKey, ttl: 10 }
    )) || [];

    res.json({ success: true, data: transformed });
  } catch (error) {
    console.error('Error fetching tournament live matches:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch live matches' });
  }
});

/**
 * Reschedule tournament (admin only)
 */
router.put('/:id/reschedule', authenticateJWT, isAdmin, async (req, res) => {
  try {
    const { startDate, endDate } = req.body;
    const tournamentId = req.params.id;

    if (!startDate) {
      return res.status(400).json({ success: false, error: 'New start date is required' });
    }

    const newStart = new Date(startDate);
    const newEnd = endDate ? new Date(endDate) : new Date(newStart.getTime() + 2 * 60 * 60 * 1000);

    if (isNaN(newStart.getTime()) || isNaN(newEnd.getTime())) {
      return res.status(400).json({ success: false, error: 'Invalid date format' });
    }

    const tournament = await Tournament.findById(tournamentId);
    if (!tournament) {
      return res.status(404).json({ success: false, error: 'Tournament not found' });
    }

    if (tournament.status !== 'upcoming') {
      return res.status(400).json({
        success: false,
        error: 'Only upcoming tournaments can be rescheduled'
      });
    }

    tournament.startDate = newStart;
    tournament.endDate = newEnd;
    await tournament.save();

    logTournamentEvent('tournament_rescheduled', {
      tournamentId,
      newStart,
      newEnd,
      adminId: (req.user as any)._id
    });

    // Notify participants (Placeholder - should ideally trigger notification service)
    // notificationService.notifyParticipants(tournamentId, 'Tournament Rescheduled', ...);

    // Invalidate caches
    await cacheService.invalidateTournamentCaches();
    invalidateAdminOverviewCache(tournamentId);

    res.json({
      success: true,
      message: 'Tournament rescheduled successfully',
      data: {
        id: tournament._id,
        startDate: tournament.startDate,
        endDate: tournament.endDate
      }
    });

  } catch (error) {
    console.error('Reschedule failed:', error);
    res.status(500).json({ success: false, error: 'Failed to reschedule tournament' });
  }
});

export default router;


