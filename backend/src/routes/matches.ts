import express from 'express';
import Match, { IMatch } from '../models/Match';
import Tournament from '../models/Tournament';

const router = express.Router();

// Get all matches
router.get('/', async (req, res) => {
  try {
    const { game, status, tournament } = req.query;
    const query: any = {};

    if (game) query.game = game;
    if (status) query.status = status;
    if (tournament) query.tournament = tournament;

    const matches = await Match.find(query)
      .populate('team1', 'name tag')
      .populate('team2', 'name tag')
      .populate('tournament', 'name')
      .sort({ startTime: 1 });

    res.json({
      success: true,
      data: matches
    });
  } catch (error) {
    console.error('Error fetching matches:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch matches'
    });
  }
});

// Get match by ID
router.get('/:id', async (req, res) => {
  try {
    const match = await Match.findById(req.params.id)
      .populate('team1')
      .populate('team2')
      .populate('tournament')
      .populate('winner');

    if (!match) {
      return res.status(404).json({
        success: false,
        error: 'Match not found'
      });
    }

    res.json({
      success: true,
      data: match
    });
  } catch (error) {
    console.error('Error fetching match:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch match'
    });
  }
});

// Create match
router.post('/', async (req, res) => {
  try {
    const matchData: Partial<IMatch> = req.body;

    // Verify tournament exists
    const tournament = await Tournament.findById(matchData.tournament);
    if (!tournament) {
      return res.status(404).json({
        success: false,
        error: 'Tournament not found'
      });
    }

    const match = new Match(matchData);
    await match.save();

    // Add match to tournament
    if (match._id) {
      tournament.matches.push(match._id as any);
      await tournament.save();
    }

    res.status(201).json({
      success: true,
      data: match
    });
  } catch (error) {
    console.error('Error creating match:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create match'
    });
  }
});

// Update match score and stats
router.put('/:id/score', async (req, res) => {
  try {
    const match = await Match.findById(req.params.id);

    if (!match) {
      return res.status(404).json({
        success: false,
        error: 'Match not found'
      });
    }

    const { score, stats, winner } = req.body;

    match.score = score;
    match.stats = stats;
    if (winner) {
      match.winner = winner;
      match.status = 'completed';
      match.endTime = new Date();
    }

    await match.save();

    res.json({
      success: true,
      data: match
    });
  } catch (error) {
    console.error('Error updating match score:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update match score'
    });
  }
});

// Update match status
router.put('/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    const match = await Match.findById(req.params.id);

    if (!match) {
      return res.status(404).json({
        success: false,
        error: 'Match not found'
      });
    }

    match.status = status;
    if (status === 'completed' && !match.endTime) {
      match.endTime = new Date();
    }

    await match.save();

    res.json({
      success: true,
      data: match
    });
  } catch (error) {
    console.error('Error updating match status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update match status'
    });
  }
});

export default router; 