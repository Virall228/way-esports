import HallOfFame from '../models/HallOfFame';
import User from '../models/User';

const DAY_MS = 24 * 60 * 60 * 1000;

export async function updateHallOfFameSnapshot() {
  const HallOfFameModel: any = HallOfFame;
  const topPlayer: any = await User.findOne({})
    .sort({ 'stats.wins': -1, 'stats.tournamentsWon': -1, createdAt: 1 })
    .select('username')
    .lean();

  if (!topPlayer?._id) {
    return { updated: false, reason: 'no_players' as const };
  }

  const now = new Date();
  const existing = await HallOfFameModel.findOne({ userId: topPlayer._id });

  if (!existing) {
    await HallOfFameModel.create({
      userId: topPlayer._id,
      username: topPlayer.username || 'Player',
      consecutiveDaysRank1: 1,
      firstRank1At: now,
      lastRank1At: now
    });

    return {
      updated: true,
      userId: String(topPlayer._id),
      username: topPlayer.username || 'Player',
      days: 1
    };
  }

  const last = existing.lastRank1At ? new Date(existing.lastRank1At) : null;
  const nextDays =
    last && Math.floor((now.getTime() - last.getTime()) / DAY_MS) >= 1
      ? existing.consecutiveDaysRank1 + 1
      : Math.max(existing.consecutiveDaysRank1, 1);

  existing.username = topPlayer.username || existing.username;
  existing.consecutiveDaysRank1 = nextDays;
  existing.lastRank1At = now;
  if (!existing.firstRank1At) existing.firstRank1At = now;
  await existing.save();

  return {
    updated: true,
    userId: String(topPlayer._id),
    username: topPlayer.username || existing.username,
    days: nextDays
  };
}
