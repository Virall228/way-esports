import Achievement from '../../models/Achievement';

export async function seedDefaultAchievements() {
  const count = await Achievement.countDocuments();
  if (count > 0) return;

  await Achievement.insertMany([
    {
      key: 'first_match',
      name: 'First Match',
      description: 'Play your first match',
      icon: '🎮',
      isActive: true,
      criteria: { type: 'matches_played_gte', value: 1 }
    },
    {
      key: 'ten_matches',
      name: 'Getting Started',
      description: 'Play 10 matches',
      icon: '🧩',
      isActive: true,
      criteria: { type: 'matches_played_gte', value: 10 }
    },
    {
      key: 'fifty_matches',
      name: 'Grinder',
      description: 'Play 50 matches',
      icon: '⏱️',
      isActive: true,
      criteria: { type: 'matches_played_gte', value: 50 }
    },
    {
      key: 'first_win',
      name: 'First Win',
      description: 'Win your first match',
      icon: '🏆',
      isActive: true,
      criteria: { type: 'wins_gte', value: 1 }
    },
    {
      key: 'five_wins',
      name: 'On a Roll',
      description: 'Win 5 matches',
      icon: '🔥',
      isActive: true,
      criteria: { type: 'wins_gte', value: 5 }
    },
    {
      key: 'ten_wins',
      name: 'Winner',
      description: 'Win 10 matches',
      icon: '🥇',
      isActive: true,
      criteria: { type: 'wins_gte', value: 10 }
    },
    {
      key: 'twentyfive_wins',
      name: 'Champion',
      description: 'Win 25 matches',
      icon: '👑',
      isActive: true,
      criteria: { type: 'wins_gte', value: 25 }
    },
    {
      key: 'first_tournament',
      name: 'Tournament Debut',
      description: 'Play your first tournament match',
      icon: '🏟️',
      isActive: true,
      criteria: { type: 'tournaments_played_gte', value: 1 }
    },
    {
      key: 'five_tournaments',
      name: 'Tournament Regular',
      description: 'Play 5 tournament matches',
      icon: '📅',
      isActive: true,
      criteria: { type: 'tournaments_played_gte', value: 5 }
    },
    {
      key: 'ten_tournaments',
      name: 'Tournament Veteran',
      description: 'Play 10 tournament matches',
      icon: '🛡️',
      isActive: true,
      criteria: { type: 'tournaments_played_gte', value: 10 }
    }
  ]);
}
