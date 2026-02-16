import express from 'express';
import Match, { IMatch } from '../models/Match';
import Tournament from '../models/Tournament';
import Team from '../models/Team';
import User from '../models/User';
import Wallet from '../models/Wallet';
import { authenticateJWT, isAdmin } from '../middleware/auth';
import { evaluateUserAchievements } from '../services/achievements/engine';

const router = express.Router();

const resolveUserId = (req: any): string | null => {
  const value = req.user?._id || req.user?.id;
  return value ? value.toString() : null;
};

const isAdminRole = (req: any): boolean => {
  const role = req.user?.role;
  return role === 'admin' || role === 'developer';
};

const ensureWalletDoc = async (userId: string) => {
  let wallet = await Wallet.findOne({ user: userId });
  if (!wallet) {
    wallet = await new Wallet({ user: userId }).save();
  }
  return wallet;
};

const isUserMatchParticipant = async (match: any, userId: string): Promise<boolean> => {
  const [team1, team2] = await Promise.all([
    Team.findById(match.team1).select('members players captain').lean(),
    Team.findById(match.team2).select('members players captain').lean()
  ]);

  const isInTeam = (team: any) => {
    if (!team) return false;
    const members = Array.isArray(team.members) ? team.members.map((m: any) => m.toString()) : [];
    const players = Array.isArray(team.players) ? team.players.map((m: any) => m.toString()) : [];
    const captainId = team.captain?.toString?.();
    return members.includes(userId) || players.includes(userId) || captainId === userId;
  };

  return isInTeam(team1) || isInTeam(team2);
};

async function distributeMatchWinnerPayout(matchId: string, winnerTeamId?: string | null) {
  if (!winnerTeamId) return;

  const lockedMatch: any = await Match.findOneAndUpdate(
    { _id: matchId, payoutProcessed: { $ne: true } },
    { $set: { payoutProcessed: true, payoutProcessedAt: new Date() } },
    { new: true }
  ).select('tournament winner team1 team2');

  if (!lockedMatch) return;

  const tournament: any = await Tournament.findById(lockedMatch.tournament)
    .select('prizePool matches status')
    .lean();

  if (!tournament || Number(tournament.prizePool || 0) <= 0) {
    return;
  }

  const winnerTeam: any = await Team.findById(winnerTeamId).select('members players captain name').lean();
  if (!winnerTeam) return;

  const participantIds = new Set<string>();
  if (winnerTeam.captain) participantIds.add(winnerTeam.captain.toString());
  (winnerTeam.members || []).forEach((m: any) => participantIds.add(m.toString()));
  (winnerTeam.players || []).forEach((p: any) => participantIds.add(p.toString()));

  const winners = Array.from(participantIds);
  if (!winners.length) return;

  const matchCount = Math.max(Array.isArray(tournament.matches) ? tournament.matches.length : 0, 1);
  const matchReward = Number((Number(tournament.prizePool || 0) / matchCount).toFixed(2));

  if (matchReward <= 0) return;

  const perUserReward = Number((matchReward / winners.length).toFixed(2));
  if (perUserReward <= 0) return;

  await Promise.all(
    winners.map(async (userId, index) => {
      const reference = `MATCH-${matchId}-${Date.now()}-${index + 1}`;
      const description = `Match win reward (${winnerTeam.name || 'Team'})`;

      const wallet = await ensureWalletDoc(userId);
      wallet.balance += perUserReward;
      wallet.transactions.push({
        type: 'prize',
        amount: perUserReward,
        description,
        status: 'completed',
        reference,
        date: new Date()
      });
      await wallet.save();

      await User.findByIdAndUpdate(userId, {
        $inc: { 'wallet.balance': perUserReward },
        $push: {
          'wallet.transactions': {
            type: 'prize',
            amount: perUserReward,
            description,
            status: 'completed',
            date: new Date()
          }
        }
      });
    })
  );
}

async function handleMatchCompleted(matchId: string, winnerTeamId?: string | null) {
  const match: any = await Match.findById(matchId).lean();
  if (!match) return;

  const team1Id = match.team1?.toString();
  const team2Id = match.team2?.toString();
  if (!team1Id || !team2Id) return;

  const [team1, team2] = await Promise.all([
    Team.findById(team1Id).select('members').lean(),
    Team.findById(team2Id).select('members').lean()
  ]);

  const team1Members: string[] = (team1?.members || []).map((m: any) => m.toString());
  const team2Members: string[] = (team2?.members || []).map((m: any) => m.toString());

  const incTournament = match.tournament ? 1 : 0;
  const winnerId = winnerTeamId ? winnerTeamId.toString() : (match.winner ? match.winner.toString() : null);

  const team1Won = !!winnerId && winnerId === team1Id;
  const team2Won = !!winnerId && winnerId === team2Id;

  const updateUsers = async (userIds: string[], inc: any) => {
    if (!userIds.length) return;
    await Promise.all(
      userIds.map(async (uid) => {
        try {
          await User.updateOne({ _id: uid }, { $inc: inc });
          await evaluateUserAchievements(uid);
        } catch (e) {
          console.error('achievement evaluation error:', e);
        }
      })
    );
  };

  const baseInc = incTournament ? { 'stats.tournamentsPlayed': incTournament } : {};

  if (team1Won) {
    await updateUsers(team1Members, { ...baseInc, 'stats.wins': 1 });
    await updateUsers(team2Members, { ...baseInc, 'stats.losses': 1 });
    await distributeMatchWinnerPayout(matchId, winnerId);
    return;
  }

  if (team2Won) {
    await updateUsers(team2Members, { ...baseInc, 'stats.wins': 1 });
    await updateUsers(team1Members, { ...baseInc, 'stats.losses': 1 });
    await distributeMatchWinnerPayout(matchId, winnerId);
    return;
  }

  // If match completed without a winner, only track tournament participation.
  if (incTournament) {
    await updateUsers(team1Members, baseInc);
    await updateUsers(team2Members, baseInc);
  }
}

// Get all matches
router.get('/', async (req, res) => {
  try {
    const { game, status, tournament } = req.query;
    const query: any = {};

    if (game) query.game = game;
    if (status) query.status = status;
    if (tournament) query.tournament = tournament;

    const matches: any[] = await Match.find(query)
      .populate('team1', 'name tag logo')
      .populate('team2', 'name tag logo')
      .populate('tournament', 'name game prizePool')
      .populate('winner', 'name tag')
      .sort({ startTime: 1 })
      .lean();

    // Transform for frontend compatibility
    const normalizeStatus = (raw: any) => {
      const s = (raw || '').toString();
      if (s === 'scheduled') return 'upcoming';
      return s || 'upcoming';
    };

    const transformed = matches.map((match: any) => ({
      id: String(match._id),
      tournamentId: match.tournament?._id?.toString() || match.tournament?.toString() || '',
      tournamentName: match.tournament?.name || '',
      game: match.game || match.tournament?.game || '',
      team1: match.team1 ? {
        id: match.team1._id?.toString() || match.team1.toString(),
        name: match.team1.name || '',
        tag: match.team1.tag || '',
        logo: match.team1.logo || ''
      } : match.team1,
      team2: match.team2 ? {
        id: match.team2._id?.toString() || match.team2.toString(),
        name: match.team2.name || '',
        tag: match.team2.tag || '',
        logo: match.team2.logo || ''
      } : match.team2,
      status: normalizeStatus(match.status),
      startTime: match.startTime?.toISOString() || new Date().toISOString(),
      endTime: match.endTime?.toISOString(),
      round: match.round || '',
      map: match.map || '',
      score: match.score || {},
      stats: match.stats || {},
      winner: match.winner ? {
        id: match.winner._id?.toString() || match.winner.toString(),
        name: match.winner.name || '',
        tag: match.winner.tag || ''
      } : match.winner,
      roomVisibleAt: match.roomCredentials?.visibleAt?.toISOString?.() || null,
      createdAt: match.createdAt?.toISOString(),
      updatedAt: match.updatedAt?.toISOString()
    }));

    res.json({
      success: true,
      data: transformed
    });
  } catch (error) {
    console.error('Error fetching matches:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch matches'
    });
  }
});

// Get room credentials for a match (participants/admin only)
router.get('/:id/room', authenticateJWT, async (req: any, res: any) => {
  try {
    const match: any = await Match.findById(req.params.id).lean();
    if (!match) {
      return res.status(404).json({ success: false, error: 'Match not found' });
    }

    if (!match.roomCredentials?.roomId || !match.roomCredentials?.password) {
      return res.status(404).json({ success: false, error: 'Room credentials are not generated yet' });
    }

    const requesterId = resolveUserId(req);
    if (!requesterId) {
      return res.status(401).json({ success: false, error: 'Authentication required' });
    }

    if (!isAdminRole(req)) {
      const isParticipant = await isUserMatchParticipant(match, requesterId);
      if (!isParticipant) {
        return res.status(403).json({ success: false, error: 'Access denied for this match room' });
      }
    }

    const visibleAt = match.roomCredentials.visibleAt ? new Date(match.roomCredentials.visibleAt) : null;
    const expiresAt = match.roomCredentials.expiresAt ? new Date(match.roomCredentials.expiresAt) : null;
    const now = new Date();

    if (visibleAt && now < visibleAt) {
      return res.status(403).json({
        success: false,
        error: 'Room credentials will be available 5 minutes before match start',
        availableAt: visibleAt.toISOString()
      });
    }

    if (expiresAt && now > expiresAt) {
      return res.status(410).json({ success: false, error: 'Room credentials expired' });
    }

    return res.json({
      success: true,
      data: {
        roomId: match.roomCredentials.roomId,
        password: match.roomCredentials.password,
        generatedAt: match.roomCredentials.generatedAt,
        visibleAt: match.roomCredentials.visibleAt,
        expiresAt: match.roomCredentials.expiresAt
      }
    });
  } catch (error) {
    console.error('Error fetching room credentials:', error);
    return res.status(500).json({ success: false, error: 'Failed to fetch room credentials' });
  }
});

// Get match by ID
router.get('/:id', async (req, res) => {
  try {
    const match: any = await Match.findById(req.params.id)
      .populate('team1', 'name tag logo members')
      .populate('team2', 'name tag logo members')
      .populate('tournament', 'name game prizePool startDate endDate')
      .populate('winner', 'name tag logo')
      .lean();

    if (!match) {
      return res.status(404).json({
        success: false,
        error: 'Match not found'
      });
    }

    // Transform for frontend compatibility
    const normalizeStatus = (raw: any) => {
      const s = (raw || '').toString();
      if (s === 'scheduled') return 'upcoming';
      return s || 'upcoming';
    };

    const transformed: any = {
      id: String(match._id),
      tournamentId: match.tournament?._id?.toString() || match.tournament?.toString() || '',
      tournamentName: match.tournament?.name || '',
      game: match.game || match.tournament?.game || '',
      team1: match.team1 ? {
        id: match.team1._id?.toString() || match.team1.toString(),
        name: match.team1.name || '',
        tag: match.team1.tag || '',
        logo: match.team1.logo || '',
        members: match.team1.members?.map((m: any) => m.toString()) || []
      } : match.team1,
      team2: match.team2 ? {
        id: match.team2._id?.toString() || match.team2.toString(),
        name: match.team2.name || '',
        tag: match.team2.tag || '',
        logo: match.team2.logo || '',
        members: match.team2.members?.map((m: any) => m.toString()) || []
      } : match.team2,
      status: normalizeStatus(match.status),
      startTime: match.startTime?.toISOString() || new Date().toISOString(),
      endTime: match.endTime?.toISOString(),
      round: match.round || '',
      map: match.map || '',
      score: match.score || {},
      stats: match.stats || {},
      winner: match.winner ? {
        id: match.winner._id?.toString() || match.winner.toString(),
        name: match.winner.name || '',
        tag: match.winner.tag || '',
        logo: match.winner.logo || ''
      } : match.winner,
      roomVisibleAt: match.roomCredentials?.visibleAt?.toISOString?.() || null,
      createdAt: match.createdAt?.toISOString(),
      updatedAt: match.updatedAt?.toISOString()
    };

    res.json({
      success: true,
      data: transformed
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
router.post('/', authenticateJWT, isAdmin, async (req, res) => {
  try {
    const matchData: Partial<IMatch> = req.body;

    // Verify tournament exists
    const tournament: any = await Tournament.findById(matchData.tournament);
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

    // Transform response for frontend
    const transformed: any = {
      id: String(match._id),
      tournamentId: match.tournament?.toString() || '',
      game: match.game || '',
      team1: match.team1?.toString() || match.team1,
      team2: match.team2?.toString() || match.team2,
      status: match.status || 'upcoming',
      startTime: match.startTime?.toISOString() || new Date().toISOString(),
      endTime: match.endTime?.toISOString(),
      score: match.score || {},
      stats: match.stats || {},
      winner: match.winner?.toString() || match.winner
    };

    res.status(201).json({
      success: true,
      data: transformed
    });
  } catch (error) {
    console.error('Error creating match:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create match'
    });
  }
});

// Bulk create matches
router.post('/batch', authenticateJWT, isAdmin, async (req, res) => {
  try {
    const items = Array.isArray(req.body) ? req.body : [];
    if (!items.length) {
      return res.status(400).json({ success: false, error: 'Request body must be a non-empty array' });
    }

    // Validate tournaments exist
    const tournamentIds = Array.from(new Set(items.map((i) => i.tournament).filter(Boolean)));
    if (tournamentIds.length) {
      const existing = await Tournament.find({ _id: { $in: tournamentIds } }).select('_id');
      const existingSet = new Set(existing.map((t: any) => t._id.toString()));
      const missing = tournamentIds.filter((id) => !existingSet.has(id.toString()));
      if (missing.length) {
        return res.status(404).json({ success: false, error: `Tournaments not found: ${missing.join(',')}` });
      }
    }

    const matches = await Match.insertMany(items, { ordered: false });

    // Link matches to tournaments
    const bulk = matches
      .filter((m) => m.tournament)
      .map((m) => ({
        updateOne: {
          filter: { _id: m.tournament },
          update: { $push: { matches: m._id } }
        }
      }));
    if (bulk.length) {
      await Tournament.bulkWrite(bulk, { ordered: false });
    }

    res.status(201).json({
      success: true,
      inserted: matches.length,
      data: matches
    });
  } catch (error: any) {
    console.error('Error bulk creating matches:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ success: false, error: error.message });
    }
    res.status(500).json({ success: false, error: 'Failed to create matches' });
  }
});

// Update match score and stats
router.put('/:id/score', authenticateJWT, isAdmin, async (req, res) => {
  try {
    const match = await Match.findById(req.params.id);

    if (!match) {
      return res.status(404).json({
        success: false,
        error: 'Match not found'
      });
    }

    const wasCompleted = match.status === 'completed';

    const { score, stats, winner } = req.body;

    match.score = score;
    match.stats = stats;
    if (winner) {
      match.winner = winner;
      match.status = 'completed';
      match.endTime = new Date();
    }

    await match.save();

    const nowCompleted = match.status === 'completed';
    if (!wasCompleted && nowCompleted) {
      await handleMatchCompleted((match as any)._id.toString(), match.winner?.toString());
    }

    // Transform response
    const transformed: any = {
      id: String(match._id),
      tournamentId: match.tournament?.toString() || '',
      game: match.game || '',
      team1: match.team1?.toString() || match.team1,
      team2: match.team2?.toString() || match.team2,
      status: match.status || 'upcoming',
      startTime: match.startTime?.toISOString() || new Date().toISOString(),
      endTime: match.endTime?.toISOString(),
      score: match.score || {},
      stats: match.stats || {},
      winner: match.winner?.toString() || match.winner
    };

    res.json({
      success: true,
      data: transformed
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
router.put('/:id/status', authenticateJWT, isAdmin, async (req, res) => {
  try {
    const { status } = req.body;
    const match = await Match.findById(req.params.id);

    if (!match) {
      return res.status(404).json({
        success: false,
        error: 'Match not found'
      });
    }

    const wasCompleted = match.status === 'completed';
    match.status = status;
    if (status === 'completed' && !match.endTime) {
      match.endTime = new Date();
    }

    await match.save();

    const nowCompleted = match.status === 'completed';
    if (!wasCompleted && nowCompleted) {
      await handleMatchCompleted((match as any)._id.toString(), match.winner?.toString());
    }

    // Transform response
    const transformed: any = {
      id: String(match._id),
      tournamentId: match.tournament?.toString() || '',
      game: match.game || '',
      team1: match.team1?.toString() || match.team1,
      team2: match.team2?.toString() || match.team2,
      status: match.status || 'upcoming',
      startTime: match.startTime?.toISOString() || new Date().toISOString(),
      endTime: match.endTime?.toISOString(),
      score: match.score || {},
      stats: match.stats || {},
      winner: match.winner?.toString() || match.winner
    };

    res.json({
      success: true,
      data: transformed
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
