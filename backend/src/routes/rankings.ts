import express from 'express';
import Team from '../models/Team';
import User from '../models/User';
import Tournament from '../models/Tournament';
import cacheService from '../services/cacheService';
import { getSupportedGameQuery } from '../config/games';

const router = express.Router();

const normalizePlayerDisplayName = (user: any): string => {
  const username = String(user?.username || '').trim();
  const firstName = String(user?.firstName || '').trim();
  const lastName = String(user?.lastName || '').trim();
  const fullName = [firstName, lastName].filter(Boolean).join(' ').trim();

  const autoUsername =
    !username ||
    /^user(_|-)?\d+$/i.test(username) ||
    /^player(_|-)?\d+$/i.test(username) ||
    username.toLowerCase() === 'user';

  if (!autoUsername) return username;
  if (fullName) return fullName;
  if (username) return username;

  const emailPrefix = String(user?.email || '').split('@')[0]?.trim();
  if (emailPrefix) return emailPrefix;

  return 'Player';
};

// Get team rankings
router.get('/teams/rankings', async (req, res) => {
  try {
    const timeFrameRaw = (req.query.timeFrame || req.query.timeframe || 'week') as string;
    const gameRaw = (req.query.game || 'all') as string;
    const timeFrame = timeFrameRaw.toLowerCase();
    const game = gameRaw.toLowerCase();
    const query: any = {};
    const limitRaw = Number(req.query.limit || 100);
    const limit = Number.isFinite(limitRaw) ? Math.max(1, Math.min(300, limitRaw)) : 100;
    
    // Add game filter if specified
    if (game && game !== 'all') {
      const gameQuery = getSupportedGameQuery(gameRaw);
      if (gameQuery) query.game = gameQuery;
    }

    // Add time frame filter
    const now = new Date();
    if (timeFrame === 'month') {
      query.createdAt = { $gte: new Date(now.getFullYear(), now.getMonth() - 1, now.getDate()) };
    } else if (timeFrame === 'week') {
      query.createdAt = { $gte: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) };
    }

    const cacheKey = `rankings:teams:${timeFrame}:${game}:${limit}`;
    const teams = (await cacheService.getOrSet(
      cacheKey,
      async () =>
        Team.find(query)
          .select('name tag logo game stats achievements')
          .sort({ 'stats.winRate': -1, 'stats.totalPrizeMoney': -1 })
          .limit(limit)
          .lean(),
      { key: cacheKey, ttl: 20 }
    )) || [];

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
    const timeFrameRaw = (req.query.timeFrame || req.query.timeframe || 'week') as string;
    const gameRaw = (req.query.game || 'all') as string;
    const timeFrame = timeFrameRaw.toLowerCase();
    const game = gameRaw.toLowerCase();
    const query: any = {};
    const limitRaw = Number(req.query.limit || 100);
    const limit = Number.isFinite(limitRaw) ? Math.max(1, Math.min(300, limitRaw)) : 100;
    
    // Add game filter if specified
    if (game && game !== 'all') {
      const gameQuery = getSupportedGameQuery(gameRaw);
      if (gameQuery) query['gameProfiles.game'] = gameQuery;
    }

    const now = new Date();
    if (timeFrame === 'month') {
      query.createdAt = { $gte: new Date(now.getFullYear(), now.getMonth() - 1, now.getDate()) };
    } else if (timeFrame === 'week') {
      query.createdAt = { $gte: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) };
    }

    const cacheKey = `rankings:players:${timeFrame}:${game}:${limit}`;
    const users = (await cacheService.getOrSet(
      cacheKey,
      async () =>
        User.find(query)
          .select('username firstName lastName email profileLogo stats teams')
          .populate('teams', 'name tag')
          .sort({ 'stats.totalPrizeMoney': -1, 'stats.wins': -1 })
          .limit(limit)
          .lean(),
      { key: cacheKey, ttl: 20 }
    )) || [];

    // Calculate rankings
    const rankedPlayers = users.map((user: any, index) => {
      const displayName = normalizePlayerDisplayName(user);
      return {
      displayName,
      name: displayName,
      _id: user._id,
      username: user.username,
      firstName: user.firstName,
      lastName: user.lastName,
      profileLogo: user.profileLogo,
      rank: index + 1,
      points: Number(user?.stats?.points || user?.stats?.rankPoints || 0),
      totalPrize: user?.stats?.totalPrizeMoney || 0,
      tournamentWins: user?.stats?.tournamentWins || 0,
      matches: user?.stats?.totalMatches || 0,
      wins: user?.stats?.wins || 0,
      losses: user?.stats?.losses || 0,
      winRate: user?.stats?.winRate || 0,
      teams: user.teams
    };
    });

    res.json(rankedPlayers);
  } catch (error: any) {
    console.error('Error fetching player rankings:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch player rankings' });
  }
});

export default router;

