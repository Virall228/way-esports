import express from 'express';
import mongoose from 'mongoose';
import { Tournament } from '../models/Tournament';
import { auth } from '../middleware/auth';
import {
  canManageTournament,
  canRegisterForTournament,
  canRegisterTeam,
  canUpdateMatch,
  validateTournamentData,
  rateLimitTournamentOperations,
  checkTournamentCapacity,
  preventDuplicateRegistration
} from '../middleware/tournament-auth';

const router = express.Router();

// Helper function to update tournament progress
function updateTournamentProgress(tournament: any): void {
  const matches = tournament.bracket.matches;
  
  // Check if all matches in current round are completed
  const rounds = Math.max(...matches.map((m: any) => m.round));
  
  for (let round = 1; round < rounds; round++) {
    const roundMatches = matches.filter((m: any) => m.round === round);
    const completedMatches = roundMatches.filter((m: any) => m.status === 'completed');
    
    if (completedMatches.length === roundMatches.length) {
      // Advance winners to next round
      const nextRoundMatches = matches.filter((m: any) => m.round === round + 1);
      
      completedMatches.forEach((match: any, index: number) => {
        const nextMatchIndex = Math.floor(index / 2);
        const nextMatch = nextRoundMatches[nextMatchIndex];
        
        if (nextMatch) {
          if (index % 2 === 0) {
            // Set winner in first position
            if (match.winnerType === 'team') {
              nextMatch.team1 = match.winner;
              nextMatch.player1 = null;
            } else {
              nextMatch.player1 = match.winner;
              nextMatch.team1 = null;
            }
          } else {
            // Set winner in second position
            if (match.winnerType === 'team') {
              nextMatch.team2 = match.winner;
              nextMatch.player2 = null;
            } else {
              nextMatch.player2 = match.winner;
              nextMatch.team2 = null;
            }
          }
          
          // If both participants are set, match can start
          const hasParticipant1 = nextMatch.team1 || nextMatch.player1;
          const hasParticipant2 = nextMatch.team2 || nextMatch.player2;
          
          if (hasParticipant1 && hasParticipant2) {
            nextMatch.status = 'pending';
          }
        }
      });
    }
  }
  
  // Check if tournament is completed
  const finalMatch = matches.find((m: any) => m.round === rounds);
  if (finalMatch && finalMatch.status === 'completed') {
    tournament.status = 'completed';
  }
}

// Get all tournaments with pagination and filtering
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;
    
    // Build filter object
    const filter: any = { isActive: true };
    
    if (req.query.status) {
      filter.status = req.query.status;
    }
    
    if (req.query.game) {
      filter.game = req.query.game;
    }
    
    if (req.query.search) {
      filter.name = { $regex: req.query.search, $options: 'i' };
    }

    // Use aggregation for better performance with large datasets
    const tournaments = await Tournament.aggregate([
      { $match: filter },
      { $sort: { startDate: -1 } },
      { $skip: skip },
      { $limit: limit },
      {
        $lookup: {
          from: 'teams',
          localField: 'registeredTeams',
          foreignField: '_id',
          as: 'registeredTeams',
          pipeline: [
            { $project: { name: 1, logo: 1, tag: 1 } }
          ]
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: 'registeredPlayers',
          foreignField: '_id',
          as: 'registeredPlayers',
          pipeline: [
            { $project: { username: 1, avatar: 1 } }
          ]
        }
      },
      {
        $addFields: {
          participantCount: { 
            $add: [
              { $size: '$registeredTeams' }, 
              { $size: '$registeredPlayers' }
            ] 
          },
          spotsRemaining: {
            $cond: {
              if: { $eq: ['$type', 'team'] },
              then: { $subtract: ['$maxTeams', { $size: '$registeredTeams' }] },
              else: {
                $cond: {
                  if: { $eq: ['$type', 'solo'] },
                  then: { $subtract: ['$maxPlayers', { $size: '$registeredPlayers' }] },
                  else: { 
                    $subtract: [
                      { $add: [{ $ifNull: ['$maxTeams', 0] }, { $ifNull: ['$maxPlayers', 0] }] },
                      { $add: [{ $size: '$registeredTeams' }, { $size: '$registeredPlayers' }] }
                    ]
                  }
                }
              }
            }
          }
        }
      }
    ]);

    // Get total count for pagination
    const totalCount = await Tournament.countDocuments(filter);
    const totalPages = Math.ceil(totalCount / limit);

    res.json({
      tournaments,
      pagination: {
        currentPage: page,
        totalPages,
        totalCount,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error('Error fetching tournaments:', error);
    res.status(500).json({ message: 'Error fetching tournaments' });
  }
});

// Get tournament by ID with optimized population
router.get('/:id', async (req, res) => {
  try {
    const tournament = await Tournament.aggregate([
      { $match: { _id: new mongoose.Types.ObjectId(req.params.id), isActive: true } },
      {
        $lookup: {
          from: 'teams',
          localField: 'registeredTeams',
          foreignField: '_id',
          as: 'registeredTeams',
          pipeline: [
            {
              $lookup: {
                from: 'users',
                localField: 'players.userId',
                foreignField: '_id',
                as: 'playerDetails',
                pipeline: [
                  { $project: { username: 1, avatar: 1, stats: 1 } }
                ]
              }
            },
            {
              $project: {
                name: 1,
                logo: 1,
                tag: 1,
                captain: 1,
                stats: 1,
                players: {
                  $map: {
                    input: '$players',
                    as: 'player',
                    in: {
                      $mergeObjects: [
                        '$$player',
                        {
                          $arrayElemAt: [
                            {
                              $filter: {
                                input: '$playerDetails',
                                cond: { $eq: ['$$this._id', '$$player.userId'] }
                              }
                            },
                            0
                          ]
                        }
                      ]
                    }
                  }
                }
              }
            }
          ]
        }
      },
      {
        $lookup: {
          from: 'teams',
          localField: 'bracket.matches.team1',
          foreignField: '_id',
          as: 'team1Details'
        }
      },
      {
        $lookup: {
          from: 'teams',
          localField: 'bracket.matches.team2',
          foreignField: '_id',
          as: 'team2Details'
        }
      },
      {
        $addFields: {
          participantCount: { $size: '$registeredTeams' },
          spotsRemaining: { $subtract: ['$maxTeams', { $size: '$registeredTeams' }] },
          'bracket.matches': {
            $map: {
              input: '$bracket.matches',
              as: 'match',
              in: {
                $mergeObjects: [
                  '$$match',
                  {
                    team1Details: {
                      $arrayElemAt: [
                        {
                          $filter: {
                            input: '$team1Details',
                            cond: { $eq: ['$$this._id', '$$match.team1'] }
                          }
                        },
                        0
                      ]
                    },
                    team2Details: {
                      $arrayElemAt: [
                        {
                          $filter: {
                            input: '$team2Details',
                            cond: { $eq: ['$$this._id', '$$match.team2'] }
                          }
                        },
                        0
                      ]
                    }
                  }
                ]
              }
            }
          }
        }
      }
    ]);

    if (!tournament || tournament.length === 0) {
      return res.status(404).json({ message: 'Tournament not found' });
    }

    res.json(tournament[0]);
  } catch (error) {
    console.error('Error fetching tournament:', error);
    res.status(500).json({ message: 'Error fetching tournament' });
  }
});

// Create new tournament (admin only)
router.post('/', auth, validateTournamentData, rateLimitTournamentOperations(5, 300000), async (req, res) => {
  if (!req.user) return res.status(401).json({ message: 'User not authenticated' });
  try {
    const {
      name,
      game,
      startDate,
      endDate,
      maxTeams,
      maxPlayers,
      prizePool,
      description,
      rules,
      format,
      type = 'team', // Default to team tournament
    } = req.body;

    // Validate tournament type requirements
    if (type === 'team' && !maxTeams) {
      return res.status(400).json({ message: 'maxTeams is required for team tournaments' });
    }
    
    if (type === 'solo' && !maxPlayers) {
      return res.status(400).json({ message: 'maxPlayers is required for solo tournaments' });
    }
    
    if (type === 'mixed' && !maxTeams && !maxPlayers) {
      return res.status(400).json({ message: 'Either maxTeams or maxPlayers is required for mixed tournaments' });
    }

    const tournament = new Tournament({
      name,
      game,
      startDate,
      endDate,
      maxTeams,
      maxPlayers,
      prizePool,
      description,
      rules,
      format,
      type,
      status: 'registration',
      registeredTeams: [],
      registeredPlayers: [],
      bracket: {
        rounds: 0,
        matches: [],
      },
      createdBy: req.user.id,
    });

    await tournament.save();
    res.status(201).json(tournament);
  } catch (error) {
    console.error('Error creating tournament:', error);
    res.status(400).json({ message: 'Error creating tournament', error: error.message });
  }
});

// Update tournament (admin only)
router.put('/:id', auth, canManageTournament, validateTournamentData, async (req, res) => {
  try {
    const tournament = await Tournament.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true }
    );

    if (!tournament) {
      return res.status(404).json({ message: 'Tournament not found' });
    }

    if (!req.user) {
        return res.status(401).json({ message: 'User not authenticated' });
    }
    if (tournament.createdBy.toString() !== req.user.id) {
      return res.status(403).json({ message: 'You do not have permission to update this tournament' });
    }

    res.json(tournament);
  } catch (error) {
    res.status(400).json({ message: 'Error updating tournament' });
  }
});

// Register team for tournament
router.post('/:id/register-team', auth, canRegisterForTournament, canRegisterTeam, checkTournamentCapacity, preventDuplicateRegistration, async (req, res) => {
  try {
    const tournament = await Tournament.findById(req.params.id);
    if (!tournament) {
      return res.status(404).json({ message: 'Tournament not found' });
    }

    if (!tournament.isRegistrationOpen()) {
      return res.status(400).json({ message: 'Registration is closed' });
    }

    if (tournament.type === 'solo') {
      return res.status(400).json({ message: 'This tournament is for solo players only' });
    }

    const { teamId } = req.body;
    if (tournament.registeredTeams.includes(teamId)) {
      return res.status(400).json({ message: 'Team already registered' });
    }

    // Check if tournament is full for teams
    if (tournament.type === 'team' && tournament.registeredTeams.length >= tournament.maxTeams) {
      return res.status(400).json({ message: 'Tournament is full' });
    }

    if (tournament.type === 'mixed') {
      const totalParticipants = tournament.registeredTeams.length + tournament.registeredPlayers.length;
      const maxTotal = (tournament.maxTeams || 0) + (tournament.maxPlayers || 0);
      if (totalParticipants >= maxTotal) {
        return res.status(400).json({ message: 'Tournament is full' });
      }
    }

    tournament.registeredTeams.push(teamId);
    await tournament.save();

    res.json(tournament);
  } catch (error) {
    console.error('Error registering team:', error);
    res.status(400).json({ message: 'Error registering team for tournament' });
  }
});

// Register solo player for tournament
router.post('/:id/register-player', auth, canRegisterForTournament, checkTournamentCapacity, preventDuplicateRegistration, async (req, res) => {
  try {
    const tournament = await Tournament.findById(req.params.id);
    if (!tournament) {
      return res.status(404).json({ message: 'Tournament not found' });
    }

    if (!tournament.isRegistrationOpen()) {
      return res.status(400).json({ message: 'Registration is closed' });
    }

    if (tournament.type === 'team') {
      return res.status(400).json({ message: 'This tournament is for teams only' });
    }

    if (!req.user) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    const playerId = req.user.id;
    
    // Check if player is already registered
    if (tournament.registeredPlayers.includes(playerId)) {
      return res.status(400).json({ message: 'Player already registered' });
    }

    // Check if player is registered with a team in this tournament
    if (tournament.registeredTeams.length > 0) {
      // This would require checking team rosters, for now we'll allow it
      // TODO: Add proper team membership check
    }

    // Check if tournament is full for players
    if (tournament.type === 'solo' && tournament.registeredPlayers.length >= tournament.maxPlayers) {
      return res.status(400).json({ message: 'Tournament is full' });
    }

    if (tournament.type === 'mixed') {
      const totalParticipants = tournament.registeredTeams.length + tournament.registeredPlayers.length;
      const maxTotal = (tournament.maxTeams || 0) + (tournament.maxPlayers || 0);
      if (totalParticipants >= maxTotal) {
        return res.status(400).json({ message: 'Tournament is full' });
      }
    }

    tournament.registeredPlayers.push(playerId);
    await tournament.save();

    res.json(tournament);
  } catch (error) {
    console.error('Error registering player:', error);
    res.status(400).json({ message: 'Error registering player for tournament' });
  }
});

// Legacy route for backward compatibility
router.post('/:id/register', auth, async (req, res) => {
  const { teamId } = req.body;
  
  if (teamId) {
    // Redirect to team registration
    req.body = { teamId };
    return router.handle(req, res, () => {});
  } else {
    // Redirect to player registration
    return router.handle(req, res, () => {});
  }
});

// Start tournament (admin only)
router.post('/:id/start', auth, canManageTournament, async (req, res) => {
  try {
    const tournament = await Tournament.findById(req.params.id);
    if (!tournament) {
      return res.status(404).json({ message: 'Tournament not found' });
    }

    if (tournament.status !== 'registration') {
      return res.status(400).json({ message: 'Tournament cannot be started' });
    }

    if (!tournament.canStart()) {
      return res.status(400).json({ message: 'Not enough participants registered' });
    }

    // Generate tournament bracket
    tournament.status = 'in_progress';
    tournament.generateBracket();
    await tournament.save();

    res.json(tournament);
  } catch (error) {
    res.status(400).json({ message: 'Error starting tournament' });
  }
});

// Update match result
router.put('/:id/matches/:matchId', auth, canUpdateMatch, async (req, res) => {
  try {
    const tournament = await Tournament.findById(req.params.id);
    if (!tournament) {
      return res.status(404).json({ message: 'Tournament not found' });
    }

    const { score1, score2, winner, winnerType } = req.body;
    const match = tournament.bracket.matches.id(req.params.matchId);
    
    if (!match) {
      return res.status(404).json({ message: 'Match not found' });
    }

    // Validate winner - check both teams and players
    const validWinners = [
      match.team1?.toString(),
      match.team2?.toString(),
      match.player1?.toString(),
      match.player2?.toString()
    ].filter(Boolean);

    if (!validWinners.includes(winner)) {
      return res.status(400).json({ message: 'Invalid winner' });
    }

    // Validate winnerType
    if (!['team', 'player'].includes(winnerType)) {
      return res.status(400).json({ message: 'Invalid winner type' });
    }

    match.score1 = score1;
    match.score2 = score2;
    match.winner = winner;
    match.winnerType = winnerType;
    match.status = 'completed';
    match.actualEndTime = new Date();

    // Update tournament progress
    updateTournamentProgress(tournament);
    await tournament.save();

    res.json(tournament);
  } catch (error) {
    console.error('Error updating match result:', error);
    res.status(400).json({ message: 'Error updating match result' });
  }
});

// Check if user is registered in tournament
router.get('/:id/registration-status', auth, async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    const tournament = await Tournament.findById(req.params.id);
    if (!tournament) {
      return res.status(404).json({ message: 'Tournament not found' });
    }

    const userId = req.user.id;
    
    // Check if user is registered as solo player
    const isRegisteredAsPlayer = tournament.registeredPlayers.includes(userId);
    
    // Check if user is registered with a team (would need to check team rosters)
    // For now, we'll just check if user has any teams registered
    let isRegisteredWithTeam = false;
    // TODO: Implement proper team membership check
    
    res.json({
      isRegistered: isRegisteredAsPlayer || isRegisteredWithTeam,
      registrationType: isRegisteredAsPlayer ? 'player' : isRegisteredWithTeam ? 'team' : null,
      canRegisterAsPlayer: tournament.type !== 'team' && tournament.isRegistrationOpen() && !isRegisteredAsPlayer,
      canRegisterWithTeam: tournament.type !== 'solo' && tournament.isRegistrationOpen() && !isRegisteredWithTeam
    });
  } catch (error) {
    console.error('Error checking registration status:', error);
    res.status(500).json({ message: 'Error checking registration status' });
  }
});

// Unregister from tournament
router.delete('/:id/unregister', auth, async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    const tournament = await Tournament.findById(req.params.id);
    if (!tournament) {
      return res.status(404).json({ message: 'Tournament not found' });
    }

    if (tournament.status !== 'registration') {
      return res.status(400).json({ message: 'Cannot unregister after registration closes' });
    }

    const userId = req.user.id;
    let wasRegistered = false;

    // Remove from registered players
    const playerIndex = tournament.registeredPlayers.indexOf(userId);
    if (playerIndex > -1) {
      tournament.registeredPlayers.splice(playerIndex, 1);
      wasRegistered = true;
    }

    // TODO: Remove from team registrations if applicable

    if (!wasRegistered) {
      return res.status(400).json({ message: 'User is not registered for this tournament' });
    }

    await tournament.save();
    res.json({ message: 'Successfully unregistered from tournament' });
  } catch (error) {
    console.error('Error unregistering from tournament:', error);
    res.status(500).json({ message: 'Error unregistering from tournament' });
  }
});

export default router; 