import User from '../models/User';
import UserStats from '../models/UserStats';
import ScoutingInsight from '../models/ScoutingInsight';
import { calculateImpactRating, ensureUserStats } from './analyticsEngine';
import { generateAiScoutInsight } from './aiScoutingProvider';

const LOW_RANK_MARKERS = ['bronze', 'silver', 'iron', 'rookie', 'beginner', 'newbie'];

const getWeekKey = (date = new Date()) => {
  const utc = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const dayNum = utc.getUTCDay() || 7;
  utc.setUTCDate(utc.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(utc.getUTCFullYear(), 0, 1));
  const week = Math.ceil((((utc.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  return `${utc.getUTCFullYear()}-W${String(week).padStart(2, '0')}`;
};

const isLowRank = (rank: string | undefined) => {
  if (!rank) return true;
  const normalized = rank.trim().toLowerCase();
  return LOW_RANK_MARKERS.some((marker) => normalized.includes(marker));
};

const buildSummary = (username: string, impactRating: number, role: string, isHiddenGem: boolean) => {
  if (isHiddenGem) {
    return `Player @${username} shows high impact (${impactRating}) despite low rank profile. Role: ${role}. Suggested for trial.`;
  }
  return `Player @${username} has stable prospect score (${impactRating}) on role ${role}.`;
};

export async function refreshWeeklyTopProspects(limit = 10) {
  const weekKey = getWeekKey();

  const users = await User.find({ isBanned: { $ne: true } })
    .select('_id username gameProfiles primaryRole role')
    .limit(500);

  const scored: Array<{
    userId: string;
    username: string;
    score: number;
    impactRating: number;
    tag: 'Hidden Gem' | 'Prospect';
    summary: string;
  }> = [];

  for (const user of users) {
    const userId = user._id.toString();
    const stats = await ensureUserStats(userId);
    if (!stats) continue;

    const impactRating = calculateImpactRating({
      skills: stats.skills,
      behavioral: stats.behavioral
    });

    const rank = Array.isArray((user as any).gameProfiles) ? (user as any).gameProfiles?.[0]?.rank : undefined;
    const lowRank = isLowRank(rank);
    let hiddenGem = lowRank && impactRating >= 70;
    const teamplayBoost = Number(stats.skills.teamplay || 0) * 0.1;
    const leadershipBoost = Number(stats.behavioral?.leadership || 0) * 0.08;
    const conflictPenalty = Number(stats.behavioral?.conflictScore || 0) * 0.15;
    let score = Math.max(0, Math.min(100, impactRating + teamplayBoost + leadershipBoost - conflictPenalty));
    let summary = buildSummary(user.username, impactRating, stats.primaryRole, hiddenGem);
    let source: 'heuristic' | 'gemini' | 'openai' = 'heuristic';

    const ai = await generateAiScoutInsight({
      username: user.username,
      role: stats.primaryRole,
      rank: String(rank || 'unknown'),
      impactRating,
      skills: {
        aiming: Number(stats.skills.aiming || 0),
        positioning: Number(stats.skills.positioning || 0),
        utility: Number(stats.skills.utility || 0),
        clutchFactor: Number(stats.skills.clutchFactor || 0),
        teamplay: Number(stats.skills.teamplay || 0)
      },
      behavioral: {
        chill: Number(stats.behavioral?.chill || 0),
        leadership: Number(stats.behavioral?.leadership || 0),
        conflictScore: Number(stats.behavioral?.conflictScore || 0)
      }
    });
    if (ai) {
      if (typeof ai.scoreDelta === 'number') {
        score = Math.max(0, Math.min(100, score + ai.scoreDelta));
      }
      if (ai.tag === 'Hidden Gem' || ai.tag === 'Prospect') {
        hiddenGem = ai.tag === 'Hidden Gem';
      }
      if (ai.summary) summary = ai.summary;
      source = ai.source;
    }

    stats.impactRating = impactRating;
    stats.hiddenGem = hiddenGem;
    stats.hiddenGemReason = hiddenGem ? 'High impact with low rank profile' : '';
    if ((user as any).primaryRole && stats.primaryRole !== (user as any).primaryRole) {
      stats.primaryRole = (user as any).primaryRole;
    }
    await stats.save();

    scored.push({
      userId,
      username: user.username,
      score: Number(score.toFixed(2)),
      impactRating,
      tag: hiddenGem ? 'Hidden Gem' : 'Prospect',
      summary
    });

    await ScoutingInsight.findOneAndUpdate(
      { user: userId, weekKey },
      {
        $set: {
          score: Number(score.toFixed(2)),
          impactRating,
          tag: hiddenGem ? 'Hidden Gem' : 'Prospect',
          summary,
          source
        }
      },
      { upsert: true, new: true }
    );
  }

  const top = scored.sort((a, b) => b.score - a.score).slice(0, limit);

  return top;
}

export async function getTopProspects(limit = 10) {
  const weekKey = getWeekKey();
  const insights = await ScoutingInsight.find({ weekKey })
    .populate('user', 'username role primaryRole')
    .sort({ score: -1 })
    .limit(Math.max(1, limit));

  if (!insights.length) {
    await refreshWeeklyTopProspects(Math.max(10, limit));
    const refreshed = await ScoutingInsight.find({ weekKey })
      .populate('user', 'username role primaryRole')
      .sort({ score: -1 })
      .limit(Math.max(1, limit));
    return refreshed;
  }

  return insights;
}

export const scoutingUtils = { getWeekKey };
