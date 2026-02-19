import express, { Request, Response } from 'express';
import mongoose from 'mongoose';
import Tournament, { ITournament } from '../models/Tournament';
import Match from '../models/Match';
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
const SUPPORTED_MATCH_GAMES = new Set(['Critical Ops', 'CS2', 'PUBG Mobile']);
const MATCH_INTERVAL_MIN = 30;

const normalizeMatchGame = (game: string | undefined): 'Critical Ops' | 'CS2' | 'PUBG Mobile' => {
  if (game && SUPPORTED_MATCH_GAMES.has(game)) {
    return game as 'Critical Ops' | 'CS2' | 'PUBG Mobile';
  }
  return 'CS2';
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
      game: normalizeMatchGame(tournament.game),
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

const handleTournamentRegistration = async (req: any, res: any) => {
  try {
    const user = req.tournamentUser || req.user;
    const { teamId } = req.body;
    const userId = user?._id?.toString?.() || user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Authentication required' });
    }
    const tournamentId = req.params.id;
    let teamForRegistration: any = null;
    const isAdminRole = (req.user as any)?.role === 'admin' || (req.user as any)?.role === 'developer';

    const existing: any = await Tournament.findById(tournamentId).lean();
    if (!existing) return res.status(404).json({ success: false, error: 'Tournament not found' });

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
              role,
              status: 'pending'
            }
          },
          { upsert: true, new: true, setDefaultsOnInsert: true }
        );
      }

      await cacheService.invalidateTournamentCaches();

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
      const participantRows = buildTeamParticipantRows(teamForRegistration);
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
    const { game, status, search } = req.query as { game?: string; status?: string; search?: string };
    const { page, limit, skip } = parsePagination(req.query as Record<string, unknown>, {
      defaultLimit: 20,
      maxLimit: 100
    });
    const query: any = {};

    if (game) query.game = game;
    if (status) query.status = status;
    if (search) {
      query.name = { $regex: search.trim(), $options: 'i' };
    }

    const total = await Tournament.countDocuments(query);

    const tournaments = await Tournament.find(query)
      .populate('registeredTeams', 'name tag logo members')
      .populate('matches', 'team1 team2 status startTime')
      .sort({ startDate: 1 })
      .skip(skip)
      .limit(limit)
      .lean();

    // Transform for frontend compatibility
    const transformed = tournaments.map((t: any) => ({
      id: String(t._id),
      name: t.name,
      title: t.name,
      game: t.game,
      image: t.image || t.coverImage || '',
      coverImage: t.coverImage || t.image || '',
      status: t.status,
      type: t.type || 'team',
      startDate: t.startDate,
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

// Get tournament by ID
router.get('/:id', async (req, res) => {
  try {
    const tournament: any = await Tournament.findById(req.params.id)
      .populate('registeredTeams', 'name tag logo members captain')
      .populate('matches', 'team1 team2 status startTime endTime score winner')
      .populate('createdBy', 'username firstName lastName')
      .lean();

    if (!tournament) {
      return res.status(404).json({
        success: false,
        error: 'Tournament not found'
      });
    }

    // Transform for frontend compatibility
    const transformed: any = {
      id: String(tournament._id),
      name: tournament.name,
      title: tournament.name,
      game: tournament.game,
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

// Admin: list team registration requests for tournament
router.get('/:id/requests', authenticateJWT, isAdmin, async (req: any, res: any) => {
  try {
    const statusFilter = typeof req.query.status === 'string' ? req.query.status.trim() : 'pending';
    const tournament: any = await Tournament.findById(req.params.id)
      .populate('registrationRequests.team', 'name tag logo members captain stats')
      .populate('registrationRequests.requestedBy', 'username firstName lastName telegramId')
      .lean();

    if (!tournament) {
      return res.status(404).json({ success: false, error: 'Tournament not found' });
    }

    const requests = Array.isArray(tournament.registrationRequests) ? tournament.registrationRequests : [];
    const filtered = requests.filter((entry: any) => {
      if (!statusFilter || statusFilter === 'all') return true;
      return entry?.status === statusFilter;
    });

    const data = filtered.map((entry: any) => ({
      id: `${entry?.team?._id?.toString?.() || entry?.team?.toString?.() || ''}:${entry?.requestedAt || ''}`,
      teamId: entry?.team?._id?.toString?.() || entry?.team?.toString?.() || '',
      teamName: entry?.team?.name || '',
      teamTag: entry?.team?.tag || '',
      teamLogo: entry?.team?.logo || '',
      membersCount: Array.isArray(entry?.team?.members) ? entry.team.members.length : 0,
      stats: {
        wins: Number(entry?.team?.stats?.wins || 0),
        losses: Number(entry?.team?.stats?.losses || 0),
        winRate: Number(entry?.team?.stats?.winRate || 0)
      },
      requestedBy: entry?.requestedBy ? {
        id: entry.requestedBy._id?.toString?.() || '',
        username: entry.requestedBy.username || '',
        firstName: entry.requestedBy.firstName || '',
        lastName: entry.requestedBy.lastName || '',
        telegramId: entry.requestedBy.telegramId || null
      } : null,
      status: entry?.status || 'pending',
      requestedAt: entry?.requestedAt?.toISOString?.() || null,
      reviewedAt: entry?.reviewedAt?.toISOString?.() || null,
      note: entry?.note || ''
    }));

    return res.json({
      success: true,
      data
    });
  } catch (error) {
    console.error('Error fetching tournament requests:', error);
    return res.status(500).json({ success: false, error: 'Failed to fetch tournament requests' });
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

// Admin: tournament overview (participants, pending requests, matches, bracket)
router.get('/:id/admin-overview', authenticateJWT, isAdmin, async (req, res) => {
  try {
    const tournamentId = req.params.id;
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

    return res.json({
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
            : null
        })),
        bracket
      }
    });
  } catch (error) {
    console.error('Error fetching admin tournament overview:', error);
    return res.status(500).json({ success: false, error: 'Failed to fetch admin tournament overview' });
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
      if (status) tournament.status = status;
      if (startDate) tournament.startDate = new Date(startDate);
      if (endDate) tournament.endDate = new Date(endDate);
      if (prizePool !== undefined) tournament.prizePool = prizePool;
      if (maxTeams !== undefined) tournament.maxTeams = Number(maxTeams);
      if (maxParticipants !== undefined) tournament.maxParticipants = Number(maxParticipants);
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
    const matches = await Match.find({ tournament: tournamentId, status: 'scheduled' })
      .populate('team1', 'name tag logo')
      .populate('team2', 'name tag logo')
      .sort({ startTime: 1 })
      .lean();

    const transformed = matches.map((m: any) => ({
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
    const matches = await Match.find({ tournament: tournamentId, status: 'live' })
      .populate('team1', 'name tag logo')
      .populate('team2', 'name tag logo')
      .populate('winner', 'name tag logo')
      .sort({ startTime: 1 })
      .lean();

    const transformed = matches.map((m: any) => ({
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
