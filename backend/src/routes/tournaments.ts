import express from 'express';
import Tournament, { ITournament } from '../models/Tournament';
import { checkSubscriptionStatus } from '../../middleware/subscriptionAuth';
import { mockAuth } from '../../middleware/mockAuth';

const router = express.Router();

// Get all tournaments
router.get('/', async (req, res) => {
  try {
    const { game, status } = req.query;
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
      id: t._id.toString(),
      name: t.name,
      title: t.name, // Alias for frontend compatibility
      game: t.game,
      status: t.status === 'ongoing' ? 'in_progress' : t.status, // Map status
      startDate: t.startDate?.toISOString() || new Date().toISOString(),
      endDate: t.endDate?.toISOString() || new Date().toISOString(),
      prizePool: t.prizePool || 0,
      maxTeams: t.maxTeams || 0,
      maxParticipants: t.maxTeams || 0, // Alias
      registeredTeams: (t.registeredTeams || []).map((team: any) => ({
        id: team._id?.toString() || team.toString(),
        name: team.name || '',
        tag: team.tag || '',
        logo: team.logo || '',
        players: team.members?.map((m: any) => m.toString()) || []
      })),
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
    const tournament = await Tournament.findById(req.params.id)
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
      id: tournament._id.toString(),
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

// Create tournament
router.post('/', async (req, res) => {
  try {
    const tournamentData: Partial<ITournament> = {
      ...req.body
    };
    if (req.user?.id) {
      tournamentData.createdBy = req.user.id as any;
    }

    const tournament = new Tournament(tournamentData);
    await tournament.save();

    // Transform response for frontend
    const transformed: any = {
      id: tournament._id.toString(),
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
router.post('/batch', async (req, res) => {
  try {
    const items = Array.isArray(req.body) ? req.body : [];
    if (!items.length) {
      return res.status(400).json({ success: false, error: 'Request body must be a non-empty array' });
    }

    const payload = items.map((item) => {
      const doc: any = { ...item };
      if (req.user?.id && !doc.createdBy) {
        doc.createdBy = req.user.id;
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
router.post('/:id/register', mockAuth, checkSubscriptionStatus, async (req: any, res) => {
  try {
    // Check if user has active subscription
    if (!req.hasActiveSubscription) {
      return res.status(403).json({
        success: false,
        message: 'Active subscription required to register for tournaments',
        requiresSubscription: true,
        redirectTo: '/subscription'
      });
    }

    const tournament = await Tournament.findById(req.params.id);

    if (!tournament) {
      return res.status(404).json({
        success: false,
        error: 'Tournament not found'
      });
    }

    if (tournament.registeredTeams.length >= tournament.maxTeams) {
      return res.status(400).json({
        success: false,
        error: 'Tournament is full'
      });
    }

    if (tournament.status !== 'upcoming') {
      return res.status(400).json({
        success: false,
        error: 'Tournament registration is closed'
      });
    }

    const { teamId } = req.body;

    if (tournament.registeredTeams.includes(teamId)) {
      return res.status(400).json({
        success: false,
        error: 'Team is already registered'
      });
    }

    tournament.registeredTeams.push(teamId);
    await tournament.save();

    // Reload tournament with populated data
    const updatedTournament = await Tournament.findById(req.params.id)
      .populate('registeredTeams', 'name tag logo members')
      .lean();

    // Transform response
    const transformed: any = {
      id: updatedTournament!._id.toString(),
      name: updatedTournament!.name,
      game: updatedTournament!.game,
      status: updatedTournament!.status === 'ongoing' ? 'in_progress' : updatedTournament!.status,
      startDate: updatedTournament!.startDate?.toISOString(),
      endDate: updatedTournament!.endDate?.toISOString(),
      prizePool: updatedTournament!.prizePool || 0,
      maxTeams: updatedTournament!.maxTeams || 0,
      registeredTeams: (updatedTournament!.registeredTeams || []).map((team: any) => ({
        id: team._id?.toString() || team.toString(),
        name: team.name || '',
        tag: team.tag || '',
        logo: team.logo || '',
        players: team.members?.map((m: any) => m.toString()) || []
      })),
      participants: updatedTournament!.registeredTeams?.length || 0,
      currentParticipants: updatedTournament!.registeredTeams?.length || 0
    };

    res.json({
      success: true,
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
router.post('/:id/join', mockAuth, checkSubscriptionStatus, async (req: any, res) => {
  try {
    // Check if user has active subscription
    if (!req.hasActiveSubscription) {
      return res.status(403).json({
        success: false,
        message: 'Active subscription required to register for tournaments',
        requiresSubscription: true,
        redirectTo: '/subscription'
      });
    }

    const tournament = await Tournament.findById(req.params.id);

    if (!tournament) {
      return res.status(404).json({
        success: false,
        error: 'Tournament not found'
      });
    }

    if (tournament.registeredTeams.length >= tournament.maxTeams) {
      return res.status(400).json({
        success: false,
        error: 'Tournament is full'
      });
    }

    if (tournament.status !== 'upcoming') {
      return res.status(400).json({
        success: false,
        error: 'Tournament registration is closed'
      });
    }

    const { teamId } = req.body;

    if (tournament.registeredTeams.includes(teamId)) {
      return res.status(400).json({
        success: false,
        error: 'Team is already registered'
      });
    }

    tournament.registeredTeams.push(teamId);
    await tournament.save();

    // Reload tournament with populated data
    const updatedTournament = await Tournament.findById(req.params.id)
      .populate('registeredTeams', 'name tag logo members')
      .lean();

    // Transform response
    const transformed: any = {
      id: updatedTournament!._id.toString(),
      name: updatedTournament!.name,
      game: updatedTournament!.game,
      status: updatedTournament!.status === 'ongoing' ? 'in_progress' : updatedTournament!.status,
      startDate: updatedTournament!.startDate?.toISOString(),
      endDate: updatedTournament!.endDate?.toISOString(),
      prizePool: updatedTournament!.prizePool || 0,
      maxTeams: updatedTournament!.maxTeams || 0,
      registeredTeams: (updatedTournament!.registeredTeams || []).map((team: any) => ({
        id: team._id?.toString() || team.toString(),
        name: team.name || '',
        tag: team.tag || '',
        logo: team.logo || '',
        players: team.members?.map((m: any) => m.toString()) || []
      })),
      participants: updatedTournament!.registeredTeams?.length || 0,
      currentParticipants: updatedTournament!.registeredTeams?.length || 0
    };

    res.json({
      success: true,
      data: transformed
    });
  } catch (error) {
    console.error('Error joining tournament:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to join tournament'
    });
  }
});

// Update tournament
router.put('/:id', async (req, res) => {
  try {
    const tournament = await Tournament.findById(req.params.id);

    if (!tournament) {
      return res.status(404).json({
        success: false,
        error: 'Tournament not found'
      });
    }

    if (req.user?.id && tournament.createdBy.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to update this tournament'
      });
    }

    const updatedTournament = await Tournament.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    // Transform response
    const transformed: any = {
      id: updatedTournament._id.toString(),
      name: updatedTournament.name,
      game: updatedTournament.game,
      status: updatedTournament.status === 'ongoing' ? 'in_progress' : updatedTournament.status,
      startDate: updatedTournament.startDate?.toISOString(),
      endDate: updatedTournament.endDate?.toISOString(),
      prizePool: updatedTournament.prizePool || 0,
      maxTeams: updatedTournament.maxTeams || 0,
      registeredTeams: updatedTournament.registeredTeams?.map((t: any) => t.toString()) || [],
      format: updatedTournament.format,
      type: updatedTournament.type,
      description: updatedTournament.description || '',
      rules: updatedTournament.rules || ''
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

// Delete tournament
router.delete('/:id', async (req, res) => {
  try {
    const tournament = await Tournament.findById(req.params.id);

    if (!tournament) {
      return res.status(404).json({
        success: false,
        error: 'Tournament not found'
      });
    }

    if (req.user?.id && tournament.createdBy.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to delete this tournament'
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