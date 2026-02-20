import User from '../models/User';
import UserStats from '../models/UserStats';

const ROLE_LIMITS: Record<string, number> = {
  Entry: 2,
  Sniper: 1,
  Support: 2,
  Lurker: 1,
  Flex: 5
};

type SuggestionInput = {
  playerIds: string[];
};

export async function suggestTeamByRoles(input: SuggestionInput) {
  const uniqueIds = Array.from(new Set((input.playerIds || []).filter(Boolean)));
  if (uniqueIds.length < 2) {
    return {
      composition: [],
      warnings: ['At least 2 players are required'],
      recommendations: []
    };
  }

  const users = await User.find({ _id: { $in: uniqueIds } }).select('_id username primaryRole');
  const stats = await UserStats.find({ user: { $in: uniqueIds } }).select('user behavioral primaryRole');
  const statsByUserId = new Map(stats.map((item) => [item.user.toString(), item]));

  const composition = users.map((user) => {
    const userStats = statsByUserId.get(user._id.toString());
    const role = (user.primaryRole || userStats?.primaryRole || 'Flex') as string;
    return {
      userId: user._id.toString(),
      username: user.username,
      role,
      chill: Number(userStats?.behavioral?.chill || 50),
      leadership: Number(userStats?.behavioral?.leadership || 50),
      conflictScore: Number(userStats?.behavioral?.conflictScore || 0)
    };
  });

  const roleCounts = composition.reduce<Record<string, number>>((acc, player) => {
    acc[player.role] = (acc[player.role] || 0) + 1;
    return acc;
  }, {});

  const warnings: string[] = [];
  const recommendations: string[] = [];

  for (const [role, count] of Object.entries(roleCounts)) {
    const limit = ROLE_LIMITS[role] ?? 2;
    if (count > limit) {
      warnings.push(`Too many ${role} players (${count}/${limit})`);
      if (role === 'Sniper') {
        recommendations.push('Replace one Sniper with Support or Entry for better utility balance');
      } else {
        recommendations.push(`Consider replacing one ${role} with Support/Flex`);
      }
    }
  }

  const avgConflict = composition.reduce((sum, p) => sum + p.conflictScore, 0) / composition.length;
  const avgChill = composition.reduce((sum, p) => sum + p.chill, 0) / composition.length;
  const avgLeadership = composition.reduce((sum, p) => sum + p.leadership, 0) / composition.length;

  if (avgConflict > 45) {
    warnings.push('Team conflict risk is high');
    recommendations.push('Add players with higher Chill/Leadership or rotate high-conflict members');
  }
  if (avgChill < 45) {
    recommendations.push('Current team has low Chill index. Add at least one stable Support/Flex');
  }
  if (avgLeadership < 40) {
    recommendations.push('No clear in-game leader. Add a player with leadership score > 65');
  }

  return {
    composition,
    roleCounts,
    teamMetrics: {
      avgConflict: Number(avgConflict.toFixed(2)),
      avgChill: Number(avgChill.toFixed(2)),
      avgLeadership: Number(avgLeadership.toFixed(2))
    },
    warnings,
    recommendations
  };
}

