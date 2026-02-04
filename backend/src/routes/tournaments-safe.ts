import express from 'express';
import Tournament, { ITournament } from '../models/Tournament';
import Match from '../models/Match';
import { authenticateJWT, isAdmin } from '../middleware/auth';
import { checkTournamentAccess, checkTournamentRegistration, consumeFreeEntry } from '../middleware/tournamentAccess';

const router = express.Router();

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
      title: t.name, // Alias for frontend compatibility
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
    console.error('Failed to get tournaments:', error);
    res.status(500).json({ error: 'Failed to get tournaments' });
  }
});

// Get tournament by ID
router.get('/:id', async (req, res) => {
  try {
    const tournament = await Tournament.findById(req.params.id)
      .populate('registeredTeams', 'name tag logo members')
      .populate('matches', 'team1 team2 status startTime')
      .lean();

    if (!tournament) {
      return res.status(404).json({
        success: false,
        error: 'Tournament not found'
      });
    }

    // Transform for frontend compatibility
    const transformed = {
      id: String(tournament._id),
      name: tournament.name,
      title: tournament.name,
      game: tournament.game,
      status: tournament.status === 'ongoing' ? 'in_progress' : tournament.status,
      startDate: tournament.startDate?.toISOString(),
      endDate: tournament.endDate?.toISOString(),
      prizePool: tournament.prizePool || 0,
      maxTeams: tournament.maxTeams || 0,
      maxParticipants: tournament.maxTeams || 0,
      registeredTeams: (tournament.registeredTeams || []).map((team: any) => ({
        id: team._id?.toString() || team.toString(),
        name: team.name || '',
        tag: team.tag || '',
        logo: team.logo || '',
        players: team.members?.map((m: any) => m.toString()) || []
      })),
      participants: tournament.registeredTeams?.length || 0,
      currentParticipants: tournament.registeredTeams?.length || 0
    };

    res.json({
      success: true,
      data: transformed
    });
  } catch (error) {
    console.error('Failed to get tournament:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get tournament'
    });
  }
});

// Register for tournament (also available as /join for frontend compatibility)
router.post('/:id/register', authenticateJWT, checkTournamentAccess, checkTournamentRegistration, consumeFreeEntry, async (req: any, res) => {
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
  } catch (error) {
    console.error('Error registering for tournament:', error);
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
    if (maxTeams !== undefined) tournament.maxTeams = maxTeams;
    if (maxParticipants !== undefined) tournament.maxParticipants = maxParticipants;
    if (skillLevel) tournament.skillLevel = skillLevel;
    if (format) tournament.format = format;
    if (type) tournament.type = type;
    if (description !== undefined) tournament.description = description;
    if (rules !== undefined) tournament.rules = rules;

    await tournament.save();

    res.json({
      success: true,
      message: 'Tournament updated successfully',
      data: tournament
    });
  } catch (error) {
    console.error('Error updating tournament:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update tournament'
    });
  }
});

// Create tournament (admin only)
router.post('/', authenticateJWT, isAdmin, async (req, res) => {
  try {
    const {
      name,
      game,
      status = 'upcoming',
      startDate,
      endDate,
      prizePool = 0,
      maxTeams = 100,
      maxParticipants = 100,
      skillLevel = 'All Levels',
      format = 'single_elimination',
      type = 'team',
      description = '',
      rules = ''
    } = req.body;

    if (!name || !game || !startDate) {
      return res.status(400).json({
        success: false,
        error: 'Name, game, and start date are required'
      });
    }

    const tournament = new Tournament({
      name,
      game,
      status,
      startDate: new Date(startDate),
      endDate: endDate ? new Date(endDate) : undefined,
      prizePool,
      maxTeams,
      maxParticipants,
      skillLevel,
      format,
      type,
      description,
      rules,
      registeredTeams: [],
      registeredPlayers: [],
      matches: []
    });

    await tournament.save();

    res.status(201).json({
      success: true,
      message: 'Tournament created successfully',
      data: tournament
    });
  } catch (error) {
    console.error('Error creating tournament:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ success: false, error: error.message });
    }
    res.status(500).json({ success: false, error: 'Failed to create tournament' });
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

    // Check if tournament has registrations
    if ((tournament.registeredTeams?.length || 0) > 0 || (tournament.registeredPlayers?.length || 0) > 0) {
      return res.status(400).json({
        success: false,
        error: 'Cannot delete tournament with registered participants'
      });
    }

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

export default router;
