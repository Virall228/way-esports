import express from 'express';
import Match from '../models/Match';
import User from '../models/User';
import { authenticateJWT } from '../middleware/auth';

const router = express.Router();

const toNumber = (value: any, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const getMonthLabel = (date: Date) => {
  return date.toLocaleString('en-US', { month: 'short' });
};

router.get('/:id/analytics', authenticateJWT, async (req, res) => {
  try {
    const requester: any = req.user;
    const requesterId = requester?._id?.toString() || requester?.id;
    const targetId = req.params.id;

    if (!requesterId) {
      return res.status(401).json({ success: false, error: 'Authentication required' });
    }

    const role = requester?.role;
    const isAdmin = role === 'admin' || role === 'developer';
    if (!isAdmin && requesterId !== targetId) {
      return res.status(403).json({ success: false, error: 'Forbidden' });
    }

    const user: any = await User.findById(targetId).select('stats teams username firstName lastName').lean();
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    const wins = toNumber(user?.stats?.wins, 0);
    const losses = toNumber(user?.stats?.losses, 0);
    const totalMatches = wins + losses;
    const totalTournaments = toNumber(user?.stats?.tournamentsPlayed, 0);
    const winRate = totalMatches > 0 ? Math.round((wins / totalMatches) * 100) : 0;

    const teamIds = Array.isArray(user?.teams) ? user.teams.map((t: any) => t.toString()) : [];
    const teamIdSet = new Set(teamIds);

    let matches: any[] = [];
    if (teamIds.length) {
      matches = await Match.find({
        $or: [{ team1: { $in: teamIds } }, { team2: { $in: teamIds } }]
      })
        .populate('team1', 'name tag')
        .populate('team2', 'name tag')
        .populate('winner', 'name tag')
        .sort({ startTime: -1 })
        .limit(50)
        .lean();
    }

    const recentMatches = matches.slice(0, 10).map((match: any) => {
      const team1Id = match.team1?._id?.toString() || match.team1?.toString();
      const team2Id = match.team2?._id?.toString() || match.team2?.toString();
      const isTeam1 = team1Id && teamIdSet.has(team1Id);
      const userTeam = isTeam1 ? match.team1 : match.team2;
      const opponent = isTeam1 ? match.team2 : match.team1;
      const winnerId = match.winner?._id?.toString() || match.winner?.toString();
      const userTeamId = userTeam?._id?.toString() || userTeam?.toString();
      const result = winnerId && userTeamId && winnerId === userTeamId ? 'win' : 'loss';
      const score = match.score ? `${match.score.team1 ?? 0}-${match.score.team2 ?? 0}` : '0-0';

      return {
        id: String(match._id),
        opponent: opponent?.name || opponent?.tag || 'TBD',
        result,
        score,
        date: match.startTime || match.createdAt || new Date().toISOString()
      };
    });

    const now = new Date();
    const monthBuckets: { month: string; wins: number; losses: number; dateKey: string }[] = [];
    for (let i = 5; i >= 0; i -= 1) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const label = getMonthLabel(date);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      monthBuckets.push({ month: label, wins: 0, losses: 0, dateKey: key });
    }

    let totalScore = 0;
    let scoreSamples = 0;

    for (const match of matches) {
      const start = match.startTime ? new Date(match.startTime) : match.createdAt ? new Date(match.createdAt) : null;
      if (!start) continue;
      const key = `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, '0')}`;
      const bucket = monthBuckets.find((b) => b.dateKey === key);
      if (!bucket) continue;

      const team1Id = match.team1?._id?.toString() || match.team1?.toString();
      const team2Id = match.team2?._id?.toString() || match.team2?.toString();
      const isTeam1 = team1Id && teamIdSet.has(team1Id);
      const userTeamId = isTeam1 ? team1Id : team2Id;
      const winnerId = match.winner?._id?.toString() || match.winner?.toString();
      if (winnerId && userTeamId && winnerId === userTeamId) {
        bucket.wins += 1;
      } else {
        bucket.losses += 1;
      }

      if (match.score && typeof match.score.team1 !== 'undefined' && typeof match.score.team2 !== 'undefined') {
        const teamScore = isTeam1 ? match.score.team1 : match.score.team2;
        const scoreValue = toNumber(teamScore, NaN);
        if (Number.isFinite(scoreValue)) {
          totalScore += scoreValue;
          scoreSamples += 1;
        }
      }
    }

    const averageScore = scoreSamples ? Math.round(totalScore / scoreSamples) : 0;

    res.json({
      success: true,
      data: {
        totalTournaments,
        totalMatches,
        winRate,
        averageScore,
        recentMatches,
        performanceHistory: monthBuckets.map(({ month, wins: w, losses: l }) => ({
          month,
          wins: w,
          losses: l
        }))
      }
    });
  } catch (error: any) {
    console.error('Failed to build user analytics:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch analytics' });
  }
});

export default router;
