import Achievement from '../../models/Achievement';
import User from '../../models/User';

export async function evaluateUserAchievements(userId: string) {
  const user: any = await User.findById(userId);
  if (!user) return;

  const achievements = await Achievement.find({ isActive: true }).lean();
  const existing = new Set<string>((user.achievements || []).map((a: any) => a.toString()));

  const wins = Number(user.stats?.wins) || 0;
  const matchesPlayed = Number(user.stats?.wins || 0) + Number(user.stats?.losses || 0);
  const tournamentsPlayed = Number(user.stats?.tournamentsPlayed) || 0;

  const toAdd: string[] = [];

  for (const a of achievements as any[]) {
    const id = a._id?.toString();
    if (!id || existing.has(id)) continue;

    const type = a.criteria?.type;
    const value = Number(a.criteria?.value) || 0;

    let ok = false;
    if (type === 'wins_gte') ok = wins >= value;
    if (type === 'matches_played_gte') ok = matchesPlayed >= value;
    if (type === 'tournaments_played_gte') ok = tournamentsPlayed >= value;

    if (ok) toAdd.push(id);
  }

  if (toAdd.length) {
    await User.updateOne({ _id: userId }, { $addToSet: { achievements: { $each: toAdd } } });
  }
}
