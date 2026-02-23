export type FlameTier = 'top20' | 'top50' | 'top100' | 'top150' | 'default';

export const getTierByRank = (rank: number): FlameTier => {
  if (rank <= 20) return 'top20';
  if (rank <= 50) return 'top50';
  if (rank <= 100) return 'top100';
  if (rank <= 150) return 'top150';
  return 'default';
};

export const getTierByPoints = (points: number): FlameTier => {
  if (points >= 1600) return 'top20';
  if (points >= 1450) return 'top50';
  if (points >= 1300) return 'top100';
  if (points >= 1200) return 'top150';
  return 'default';
};

export const getIntensityByPointsAndRank = (points: number, rank?: number) => {
  const byPoints = Math.min(1, Math.max(0.25, points / 2000));
  const byRank = typeof rank === 'number'
    ? (rank <= 20 ? 1 : rank <= 50 ? 0.85 : rank <= 100 ? 0.7 : rank <= 150 ? 0.6 : 0.45)
    : 0.6;
  return Number(((byPoints + byRank) / 2).toFixed(2));
};

export const getPlayerPoints = (wins: number, losses: number) => {
  return 1000 + Number(wins || 0) * 8 - Number(losses || 0) * 4;
};

export const getTeamPoints = (wins: number, losses: number, winRate: number, tournaments: number) => {
  return 1000 + Number(wins || 0) * 10 - Number(losses || 0) * 3 + Number(winRate || 0) * 3 + Number(tournaments || 0) * 6;
};
