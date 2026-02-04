import express from 'express';
import Tournament, { ITournament } from '../models/Tournament';
import Match from '../models/Match';
import { authenticateJWT, isAdmin } from '../middleware/auth';
import { checkTournamentAccess, checkTournamentRegistration, consumeFreeEntry } from '../middleware/tournamentAccess';
import { handleTournamentConcurrency, rateLimitRegistration } from '../middleware/concurrency';
import { detectReferralFraud, validateReferralCompletion } from '../middleware/fraudDetection';
import cacheService from '../services/cacheService';
import { logTournamentEvent } from '../services/loggingService';

const router = express.Router();

// Get all tournaments
router.get('/', async (req, res) => {
  try {
    const { game, status } = req.query as { game?: string; status?: string };
    
    // Use cached tournaments
    const tournaments = await cacheService.getTournaments({ game, status });
    
    res.json({ tournaments });
      participants: t.registeredTeams?.length || 0,
      currentParticipants: t.registeredTeams?.length || 0,
      format: t.format || 'single_elimination',
      type: t.type || 'team',
      description: t.description || '',
      rules: t.rules || '',
      matches: (t.matches || []).map((m: any) => ({
        id: m._id?.toString() || m.toString(),
        ...m
      })),
      createdAt: t.createdAt?.toISOString(),
      updatedAt: t.updatedAt?.toISOString()
    }));

    res.json({
      success: true,
      data: transformed
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
      status: tournament.status === 'ongoing' ? 'in_progress' : tournament.status,
      startDate: tournament.startDate?.toISOString() || new Date().toISOString(),
      endDate: tournament.endDate?.toISOString() || new Date().toISOString(),
      prizePool: tournament.prizePool || 0,
      maxTeams: tournament.maxTeams || 0,
      maxParticipants: tournament.maxTeams || 0,
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
router.post('/', authenticateJWT, isAdmin, async (req, res) => {
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
      maxTeams: Number(req.body.maxTeams) || 16,
      maxPlayers: req.body.maxPlayers ? Number(req.body.maxPlayers) : undefined,
      status: req.body.status || 'upcoming',
      format: req.body.format || 'single_elimination',
      type: req.body.type || 'team',
      description: req.body.description || '',
      rules: req.body.rules || '',
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
      maxParticipants: tournament.maxTeams || 0,
      registeredTeams: [],
      participants: 0,
      currentParticipants: 0,
      format: tournament.format || 'single_elimination',
      type: tournament.type || 'team',
      description: tournament.description || '',
      rules: tournament.rules || ''
    };

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
router.post('/:id/register', 
  authenticateJWT, 
  detectReferralFraud,
  rateLimitRegistration(5, 60000), // 5 attempts per minute
  handleTournamentConcurrency,
  checkTournamentAccess, 
  checkTournamentRegistration, 
  consumeFreeEntry, 
  validateReferralCompletion,
  async (req: any, res) => {
  try {
    const tournament = req.tournament;
    const user = req.tournamentUser;
    const usedFreeEntry = req.usedFreeEntry;

    if (!tournament || !user) {
      return res.status(400).json({
        success: false,
        error: 'Invalid tournament or user'
      });
    }

    const { teamId } = req.body;

    // Register user for tournament (solo registration)
    if (!tournament.registeredPlayers.includes(user._id)) {
      tournament.registeredPlayers.push(user._id);
    }

    // If team registration, also register team
    if (teamId && tournament.type === 'team') {
      if (!tournament.registeredTeams.includes(teamId)) {
        tournament.registeredTeams.push(teamId);
      }
    }

    await tournament.save();

    // Reload tournament with populated data
    const updatedTournament: any = await Tournament.findById(req.params.id)
      .populate('registeredTeams', 'name tag logo members')
      .populate('registeredPlayers', 'username firstName lastName')
      .lean();

    if (!updatedTournament) {
      return res.status(404).json({
        success: false,
        error: 'Tournament not found after registration'
      });
    }

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
      maxParticipants: updatedTournament.maxTeams || 0,
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
      tournamentId: tournament._id,
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
});

// Join tournament (alias for register, frontend compatibility)
router.post('/:id/join', authenticateJWT, checkTournamentAccess, checkTournamentRegistration, consumeFreeEntry, async (req: any, res) => {
  // Same logic as register, just different endpoint name
  return req.route.handle(req, res);
});

// Update tournament (admin only)
router.put('/:id', authenticateJWT, isAdmin, async (req, res) => {
  try {
    const tournament = await Tournament.findById(req.params.id);

    if (!tournament) {
      return res.status(404).json({
        success: false,
        error: 'Tournament not found'
      });
    }

    // Admin can update any tournament, but we still check if user exists
    // Remove the authorization check for admins - they should be able to update any tournament
    
    // Update tournament fields
    const updateData: any = {};
    
    // Only allow updating specific fields
    const allowedFields = ['name', 'game', 'startDate', 'endDate', 'prizePool', 'maxTeams', 'maxPlayers', 
                          'status', 'format', 'type', 'description', 'rules', 'isRegistrationOpen'];
    
    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        if (field === 'startDate' || field === 'endDate') {
          const date = new Date(req.body[field]);
          if (!isNaN(date.getTime())) {
            updateData[field] = date;
          }
        } else if (field === 'prizePool' || field === 'maxTeams' || field === 'maxPlayers') {
          updateData[field] = Number(req.body[field]);
        } else {
          updateData[field] = req.body[field];
        }
      }
    });

    // Validate dates if both are being updated
    if (updateData.startDate && updateData.endDate) {
      const startDate = new Date(updateData.startDate);
      const endDate = new Date(updateData.endDate);
      if (endDate <= startDate) {
        return res.status(400).json({ success: false, error: 'End date must be after start date' });
      }
    }

    const updatedTournament: any = await Tournament.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!updatedTournament) {
      return res.status(404).json({ success: false, error: 'Tournament not found' });
    }

    // Reload tournament with populated data for complete response
    const populatedTournament: any = await Tournament.findById(updatedTournament._id)
      .populate('registeredTeams', 'name tag logo members')
      .lean();

    // Transform response for frontend compatibility
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
      maxParticipants: populatedTournament.maxTeams || 0,
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

export default router;
