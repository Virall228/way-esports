import express, { Request, Response } from 'express';
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

const handleTournamentRegistration = async (req: any, res: any) => {
  try {
    const user = req.tournamentUser || req.user; // fallback
    const { teamId } = req.body;
    const userId = user?._id?.toString?.() || user?.id;
    let teamForRegistration: any = null;

    // 1. Prepare atomic update query
    const tournamentId = req.params.id;

    // Check if duplicate registration first (read-only check is fine for user experience, meaningful check is in update)
    const existing: any = await Tournament.findById(tournamentId).lean();
    if (!existing) return res.status(404).json({ success: false, error: 'Tournament not found' });

    // Validation logic (can be moved to middleware but kept here for clarity in atomic transition)
    if (existing.status !== 'upcoming' && existing.status !== 'open') {
      return res.status(400).json({ success: false, error: 'Tournament registration is closed' });
    }

    if (teamId) {
      const team: any = await Team.findById(teamId).select('captain members tournamentId').lean();
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

      const isAdminRole = (req.user as any)?.role === 'admin' || (req.user as any)?.role === 'developer';
      const isMember = !!userId && (
        team.captain?.toString?.() === userId ||
        (Array.isArray(team.members) && team.members.some((m: any) => m.toString?.() === userId))
      );

      if (!isAdminRole && !isMember) {
        return res.status(403).json({ success: false, error: 'Not authorized to register this team' });
      }

      if (userId) {
        const existingRegistration: any = await TournamentRegistration.findOne({
          userId,
          tournamentId,
          status: 'active'
        }).select('teamId').lean();

        if (existingRegistration?.teamId && existingRegistration.teamId.toString() !== teamId) {
          return res.status(409).json({ success: false, error: 'You are already participating in this tournament' });
        }
      }
    }

    const conditions: any = {
      _id: tournamentId,
      registeredPlayers: { $ne: user._id } // Prevent duplicate player registration
    };

    const update: any = {
      $addToSet: { registeredPlayers: user._id }
    };

    // If team registration, also register team
    if (teamId && existing.type === 'team') {
      // Add condition for team slot availability
      conditions['$expr'] = { $lt: [{ $size: "$registeredTeams" }, "$maxTeams"] }; // Concurrency Guard for teams
      conditions['registeredTeams'] = { $ne: teamId }; // Prevent duplicate team
      update['$addToSet']['registeredTeams'] = teamId;
    } else if (existing.type === 'solo') {
      // For solo tournaments, maxParticipants should be used. If not defined, fallback to maxTeams.
      conditions['$expr'] = {
        $lt: [
          { $size: "$registeredPlayers" },
          { $ifNull: ["$maxParticipants", "$maxTeams"] }
        ]
      };
    } else {
      // Default or mixed type, use maxTeams as a general capacity limit if maxParticipants is not explicitly for solo
      conditions['$expr'] = { $lt: [{ $size: "$registeredTeams" }, "$maxTeams"] };
    }

    // Atomic Update
    const updatedTournament: any = await Tournament.findOneAndUpdate(
      conditions,
      update,
      { new: true }
    )
      .populate('registeredTeams', 'name tag logo members')
      .populate('registeredPlayers', 'username firstName lastName');

    if (!updatedTournament) {
      // If update failed, it means either ID wrong OR condition failed (Full or Duplicate)
      // We re-fetch to see why
      const current = await Tournament.findById(tournamentId);
      if (!current) return res.status(404).json({ success: false, error: 'Tournament not found' });

      const isPlayerRegistered = current.registeredPlayers?.includes(user._id);
      if (isPlayerRegistered) {
        return res.status(400).json({ success: false, error: 'You are already registered for this tournament' });
      }

      const isTeamRegistered = teamId && current.registeredTeams?.includes(teamId);
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

    // Success response
    const transformed = {
      id: String(updatedTournament._id),
      name: updatedTournament.name,
      title: updatedTournament.name,
      game: updatedTournament.game,
      status: updatedTournament.status === 'ongoing' ? 'in_progress' : updatedTournament.status,
      startDate: updatedTournament.startDate?.toISOString(),
      endDate: updatedTournament.endDate?.toISOString(),
      prizePool: updatedTournament.prizePool || 0,
      maxTeams: updatedTournament.maxTeams || 0,
      maxParticipants: updatedTournament.maxParticipants ?? updatedTournament.maxTeams ?? 0,
      registeredTeams: (updatedTournament.registeredTeams || []).map((team: any) => ({
        id: team._id?.toString() || team.toString(),
        name: team.name || '',
        tag: team.tag || '',
        logo: team.logo || '',
        players: team.members?.map((m: any) => m.toString()) || []
      })),
      registeredPlayers: (updatedTournament.registeredPlayers || []).map((player: any) => ({
        id: player._id?.toString() || player.toString(),
        username: player.username || '',
        firstName: player.firstName || '',
        lastName: player.lastName || ''
      })),
      participants: updatedTournament.registeredPlayers?.length || 0,
      currentParticipants: updatedTournament.registeredPlayers?.length || 0
    };

    const usedFreeEntry = await consumeTournamentEntry(user);

    if (teamId && userId) {
      const role = teamForRegistration?.captain?.toString?.() === userId ? 'owner' : 'member';
      await TournamentRegistration.findOneAndUpdate(
        { userId, tournamentId },
        {
          $set: {
            teamId,
            role,
            status: 'active'
          }
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
    }

    if (userId) {
      await User.findByIdAndUpdate(userId, {
        $addToSet: { participatingTournaments: tournamentId }
      });
    }

    res.json({
      success: true,
      message: usedFreeEntry ?
        'Successfully registered using free entry' :
        'Successfully registered for tournament',
      usedFreeEntry,
      data: transformed
    });

    // Log tournament registration event
    logTournamentEvent('registration_completed', {
      tournamentId: updatedTournament._id,
      userId: user._id,
      usedFreeEntry,
      currentParticipants: updatedTournament.registeredPlayers?.length || 0
    });

    // Invalidate tournament caches
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
    const { game, status } = req.query as { game?: string; status?: string };
    const query: any = {};

    if (game) query.game = game;
    if (status) query.status = status;

    const tournaments = await Tournament.find(query)
      .populate('registeredTeams', 'name tag logo members')
      .populate('matches', 'team1 team2 status startTime')
      .sort({ startDate: 1 })
      .lean();

    // Transform for frontend compatibility
    const transformed = tournaments.map((t: any) => ({
      id: String(t._id),
      name: t.name,
      title: t.name,
      game: t.game,
      status: t.status,
      startDate: t.startDate,
      date: t.startDate ? new Date(t.startDate).toLocaleDateString() : 'TBD',
      prizePool: Number(t.prizePool || 0),
      participants: Number(t.participants ?? t.currentParticipants ?? 0),
      maxParticipants: Number(t.maxParticipants ?? t.maxTeams ?? 0),
      skillLevel: t.skillLevel || 'All Levels'
    }));

    res.json({ tournaments: transformed });
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
        status: tournament.status === 'ongoing' ? 'in_progress' : tournament.status,
        startDate: tournament.startDate?.toISOString() || new Date().toISOString(),
        endDate: tournament.endDate?.toISOString() || new Date().toISOString(),
        prizePool: tournament.prizePool || 0,
        maxTeams: tournament.maxTeams || 0,
        maxParticipants: tournament.maxParticipants ?? tournament.maxTeams ?? 0,
        registeredTeams: [],
        participants: 0,
        currentParticipants: 0,
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
  detectReferralFraud,
  rateLimitRegistration(5, 60000), // 5 attempts per minute
  checkTournamentAccess,
  // checkTournamentRegistration, // Integrated into atomic update
  handleTournamentRegistration);

// Join tournament (alias for register, frontend compatibility)
router.post('/:id/join',
  authenticateJWT,
  detectReferralFraud,
  rateLimitRegistration(5, 60000),
  checkTournamentAccess,
  handleTournamentRegistration);

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
    } catch (error) {
      console.error('Error updating tournament:', error);
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
