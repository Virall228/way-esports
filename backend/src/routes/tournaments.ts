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
      .populate('registeredTeams', 'name tag')
      .sort({ startDate: 1 });

    res.json({
      success: true,
      data: tournaments
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
      .populate('registeredTeams')
      .populate('matches');

    if (!tournament) {
      return res.status(404).json({
        success: false,
        error: 'Tournament not found'
      });
    }

    res.json({
      success: true,
      data: tournament
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

    res.status(201).json({
      success: true,
      data: tournament
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

// Register for tournament
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

    res.json({
      success: true,
      data: tournament
    });
  } catch (error) {
    console.error('Error registering for tournament:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to register for tournament'
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

    res.json({
      success: true,
      data: updatedTournament
    });
  } catch (error) {
    console.error('Error updating tournament:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update tournament'
    });
  }
});

export default router; 