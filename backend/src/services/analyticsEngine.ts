import mongoose from 'mongoose';
import UserStats from '../models/UserStats';
import MatchEvent from '../models/MatchEvent';
import User from '../models/User';

const clamp = (value: number, min = 0, max = 100) => Math.max(min, Math.min(max, value));

const toObjectId = (value: string) => new mongoose.Types.ObjectId(value);

const buildDefaultTrend = () => {
  const now = new Date();
  return Array.from({ length: 30 }).map((_, index) => {
    const daysAgo = 29 - index;
    const date = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);
    return { date, rating: 50 };
  });
};

export const calculateImpactRating = (stats: {
  skills: { aiming: number; positioning: number; utility: number; clutchFactor: number; teamplay: number };
  behavioral?: { conflictScore?: number };
}) => {
  const skills = stats.skills;
  const conflictPenalty = clamp(Number(stats.behavioral?.conflictScore || 0), 0, 100) * 0.08;
  const weighted =
    skills.aiming * 0.3 +
    skills.positioning * 0.2 +
    skills.utility * 0.15 +
    skills.clutchFactor * 0.25 +
    skills.teamplay * 0.1;
  return clamp(Number((weighted - conflictPenalty).toFixed(2)));
};

export async function ensureUserStats(userId: string) {
  const user = await User.findById(userId).select('_id primaryRole');
  if (!user) return null;

  let stats = await UserStats.findOne({ user: user._id });
  if (!stats) {
    const trend30d = buildDefaultTrend();
    const baseSkills = {
      aiming: 50,
      positioning: 50,
      utility: 50,
      clutchFactor: 50,
      teamplay: 50
    };
    const behavioral = { chill: 55, leadership: 50, conflictScore: 0 };
    stats = await UserStats.create({
      user: user._id,
      primaryRole: (user.primaryRole as any) || 'Flex',
      skills: baseSkills,
      behavioral,
      trend30d,
      impactRating: calculateImpactRating({ skills: baseSkills, behavioral })
    });
  }
  return stats;
}

export async function getHeatmapForUser(userId: string, days = 30) {
  const startDate = new Date(Date.now() - Math.max(1, days) * 24 * 60 * 60 * 1000);
  const rows = await MatchEvent.aggregate([
    {
      $match: {
        playerId: toObjectId(userId),
        createdAt: { $gte: startDate }
      }
    },
    {
      $group: {
        _id: {
          x: { $floor: { $multiply: ['$coordinateX', 20] } },
          y: { $floor: { $multiply: ['$coordinateY', 20] } },
          eventType: '$eventType'
        },
        count: { $sum: 1 }
      }
    },
    {
      $project: {
        _id: 0,
        x: { $divide: ['$_id.x', 20] },
        y: { $divide: ['$_id.y', 20] },
        eventType: '$_id.eventType',
        count: 1
      }
    },
    { $sort: { count: -1 } }
  ]);

  return rows;
}

export async function getAnalyticsForUser(userId: string) {
  const stats = await ensureUserStats(userId);
  if (!stats) return null;

  const impactRating = calculateImpactRating({
    skills: stats.skills,
    behavioral: stats.behavioral
  });

  if (stats.impactRating !== impactRating) {
    stats.impactRating = impactRating;
    await stats.save();
  }

  const heatmap = await getHeatmapForUser(userId, 30);

  return {
    userId,
    primaryRole: stats.primaryRole,
    skills: stats.skills,
    behavioral: stats.behavioral,
    impactRating: stats.impactRating,
    trend30d: stats.trend30d,
    heatmap
  };
}

