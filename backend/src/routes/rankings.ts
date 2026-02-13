import express from 'express';
import Team from '../models/Team';
import User from '../models/User';
import Tournament from '../models/Tournament';

const router = express.Router();

// Get team rankings
router.get('/teams/rankings', async (req, res) => {
  try {
    const timeFrameRaw = (req.query.timeFrame || req.query.timeframe || 'week') as string;
    const gameRaw = (req.query.game || 'all') as string;
    const timeFrame = timeFrameRaw.toLowerCase();
    const game = gameRaw.toLowerCase();
    const query: any = {};
    
    // Add game filter if specified
    if (game && game !== 'all') {
      query.game = game;
    }

    // Add time frame filter
    const now = new Date();
    if (timeFrame === 'month') {
      query.createdAt = { $gte: new Date(now.getFullYear(), now.getMonth() - 1, now.getDate()) };
    } else if (timeFrame === 'week') {
      query.createdAt = { $gte: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) };
    }

    // Get teams with stats
    const teams = await Team.find(query)
      .sort({ 'stats.winRate': -1, 'stats.totalPrizeMoney': -1 })
      .lean();

    // Calculate rankings
    const rankedTeams = teams.map((team: any, index) => ({
      _id: team._id,
      name: team.name,
      tag: team.tag,
      logo: team.logo,
      game: team.game,
      rank: index + 1,
      totalPrize: team?.stats?.totalPrizeMoney || 0,
      tournamentWins: (team?.achievements || []).filter((a: any) => a?.position === 1).length,
      matches: team?.stats?.totalMatches || 0,
      wins: team?.stats?.wins || 0,
      losses: team?.stats?.losses || 0,
      winRate: team?.stats?.winRate || 0
    }));

    res.json(rankedTeams);
  } catch (error: any) {
    console.error('Error fetching team rankings:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch team rankings' });
  }
});

// Get player rankings
router.get('/players/rankings', async (req, res) => {
  try {
    const gameRaw = (req.query.game || 'all') as string;
    const game = gameRaw.toLowerCase();
    const query: any = {};
    
    // Add game filter if specified
    if (game && game !== 'all') {
      query['gameProfiles.game'] = game;
    }

    // Get users with stats
    const users = await User.find(query)
      .populate('teams', 'name tag')
      .sort({ 'stats.totalPrizeMoney': -1, 'stats.wins': -1 })
      .lean();

    // Calculate rankings
    const rankedPlayers = users.map((user: any, index) => ({
      _id: user._id,
      username: user.username,
      firstName: user.firstName,
      lastName: user.lastName,
      profileLogo: user.profileLogo,
      rank: index + 1,
      totalPrize: user?.stats?.totalPrizeMoney || 0,
      tournamentWins: user?.stats?.tournamentWins || 0,
      matches: user?.stats?.totalMatches || 0,
      wins: user?.stats?.wins || 0,
      losses: user?.stats?.losses || 0,
      winRate: user?.stats?.winRate || 0,
      teams: user.teams
    }));

    res.json(rankedPlayers);
  } catch (error: any) {
    console.error('Error fetching player rankings:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch player rankings' });
  }
});

export default router;

