import express from 'express';
import { Tournament } from '../models/Tournament';
import { auth } from '../middleware/auth';

const router = express.Router();

// Get all tournaments
router.get('/', async (req, res) => {
  try {
    const tournaments = await Tournament.find()
      .sort({ startDate: -1 })
      .populate('registeredTeams', 'name logo');
    res.json(tournaments);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching tournaments' });
  }
});

// Get tournament by ID
router.get('/:id', async (req, res) => {
  try {
    const tournament = await Tournament.findById(req.params.id)
      .populate('registeredTeams', 'name logo players')
      .populate('bracket.matches.team1', 'name logo')
      .populate('bracket.matches.team2', 'name logo');

    if (!tournament) {
      return res.status(404).json({ message: 'Tournament not found' });
    }

    res.json(tournament);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching tournament' });
  }
});

// Create new tournament (admin only)
router.post('/', auth, async (req, res) => {
  try {
    const {
      name,
      game,
      startDate,
      endDate,
      maxTeams,
      prizePool,
      description,
      rules,
      format,
    } = req.body;

    const tournament = new Tournament({
      name,
      game,
      startDate,
      endDate,
      maxTeams,
      prizePool,
      description,
      rules,
      format,
      status: 'registration',
      registeredTeams: [],
      bracket: {
        rounds: [],
        matches: [],
      },
    });

    await tournament.save();
    res.status(201).json(tournament);
  } catch (error) {
    res.status(400).json({ message: 'Error creating tournament' });
  }
});

// Update tournament (admin only)
router.put('/:id', auth, async (req, res) => {
  try {
    const tournament = await Tournament.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true }
    );

    if (!tournament) {
      return res.status(404).json({ message: 'Tournament not found' });
    }

    res.json(tournament);
  } catch (error) {
    res.status(400).json({ message: 'Error updating tournament' });
  }
});

// Register team for tournament
router.post('/:id/register', auth, async (req, res) => {
  try {
    const tournament = await Tournament.findById(req.params.id);
    if (!tournament) {
      return res.status(404).json({ message: 'Tournament not found' });
    }

    if (tournament.status !== 'registration') {
      return res.status(400).json({ message: 'Registration is closed' });
    }

    if (tournament.registeredTeams.length >= tournament.maxTeams) {
      return res.status(400).json({ message: 'Tournament is full' });
    }

    const { teamId } = req.body;
    if (tournament.registeredTeams.includes(teamId)) {
      return res.status(400).json({ message: 'Team already registered' });
    }

    tournament.registeredTeams.push(teamId);
    await tournament.save();

    res.json(tournament);
  } catch (error) {
    res.status(400).json({ message: 'Error registering for tournament' });
  }
});

// Start tournament (admin only)
router.post('/:id/start', auth, async (req, res) => {
  try {
    const tournament = await Tournament.findById(req.params.id);
    if (!tournament) {
      return res.status(404).json({ message: 'Tournament not found' });
    }

    if (tournament.status !== 'registration') {
      return res.status(400).json({ message: 'Tournament cannot be started' });
    }

    if (tournament.registeredTeams.length < 2) {
      return res.status(400).json({ message: 'Not enough teams registered' });
    }

    // Generate tournament bracket
    tournament.status = 'in_progress';
    tournament.bracket = generateBracket(tournament.registeredTeams);
    await tournament.save();

    res.json(tournament);
  } catch (error) {
    res.status(400).json({ message: 'Error starting tournament' });
  }
});

// Update match result
router.put('/:id/matches/:matchId', auth, async (req, res) => {
  try {
    const tournament = await Tournament.findById(req.params.id);
    if (!tournament) {
      return res.status(404).json({ message: 'Tournament not found' });
    }

    const { score1, score2, winner } = req.body;
    const match = tournament.bracket.matches.id(req.params.matchId);
    
    if (!match) {
      return res.status(404).json({ message: 'Match not found' });
    }

    match.score1 = score1;
    match.score2 = score2;
    match.winner = winner;
    match.status = 'completed';

    // Update tournament progress
    updateTournamentProgress(tournament);
    await tournament.save();

    res.json(tournament);
  } catch (error) {
    res.status(400).json({ message: 'Error updating match result' });
  }
});

export default router; 