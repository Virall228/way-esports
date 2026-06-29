import CareerHubState from '../models/CareerHubState';
import Match from '../models/Match';
import PlayerPromotionProfile from '../models/PlayerPromotionProfile';
import Team from '../models/Team';
import Tournament from '../models/Tournament';
import User from '../models/User';
import { ensurePlayerPromotionProfile, hasPlayerPromotionAccess } from './playerPromotionService';

type MissionReward = {
  walletCredits: number;
  bonusEntries: number;
  achievementKey?: string;
};

type MissionDefinition = {
  id: string;
  title: string;
  description: string;
  target: number;
  reward: MissionReward;
  ctaLabel: string;
  ctaRoute: string;
};

type MissionStatus = MissionDefinition & {
  current: number;
  completed: boolean;
  claimed: boolean;
  progressPercent: number;
  rewardLabel: string;
};

type ActionItem = {
  id: string;
  title: string;
  description: string;
  ctaLabel: string;
  ctaRoute: string;
  priority: number;
  tag: string;
};

const clamp = (value: number, min = 0, max = 100): number => Math.max(min, Math.min(max, value));

const toNumber = (value: unknown, fallback = 0): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const getWeekWindow = () => {
  const now = new Date();
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const day = start.getUTCDay();
  const shift = day === 0 ? -6 : 1 - day;
  start.setUTCDate(start.getUTCDate() + shift);
  start.setUTCHours(0, 0, 0, 0);

  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + 7);

  return {
    now,
    start,
    end,
    weekKey: start.toISOString().slice(0, 10)
  };
};

const buildRewardLabel = (reward: MissionReward): string => {
  const parts: string[] = [];
  if (reward.walletCredits > 0) parts.push(`${reward.walletCredits} credits`);
  if (reward.bonusEntries > 0) parts.push(`${reward.bonusEntries} bonus entr${reward.bonusEntries > 1 ? 'ies' : 'y'}`);
  return parts.join(' + ') || 'Reward unlocked';
};

const getReadinessTier = (score: number) => {
  if (score >= 85) return { label: 'Circuit Live', nextLabel: 'Elite Track', nextThreshold: 100 };
  if (score >= 65) return { label: 'Scout Ready', nextLabel: 'Circuit Live', nextThreshold: 85 };
  if (score >= 40) return { label: 'Contender', nextLabel: 'Scout Ready', nextThreshold: 65 };
  return { label: 'Rookie Setup', nextLabel: 'Contender', nextThreshold: 40 };
};

const sortActions = (actions: ActionItem[]): ActionItem[] => (
  actions
    .sort((a, b) => b.priority - a.priority)
    .slice(0, 5)
);

const buildMissionCatalog = (dynamicTournamentRoute: string): MissionDefinition[] => ([
  {
    id: 'identity-stack',
    title: 'Identity Stack',
    description: 'Lock in your public player identity with a full profile foundation.',
    target: 4,
    reward: { walletCredits: 25, bonusEntries: 0, achievementKey: 'career_identity_stack' },
    ctaLabel: 'Update profile',
    ctaRoute: '/profile'
  },
  {
    id: 'competitive-loadout',
    title: 'Competitive Loadout',
    description: 'Connect game profiles and rank context so the platform can recommend better opportunities.',
    target: 3,
    reward: { walletCredits: 30, bonusEntries: 0, achievementKey: 'career_competitive_loadout' },
    ctaLabel: 'Add game profiles',
    ctaRoute: '/profile'
  },
  {
    id: 'squad-link',
    title: 'Squad Link',
    description: 'Create or join a team to unlock the tournament and matchmaking loop.',
    target: 1,
    reward: { walletCredits: 0, bonusEntries: 1, achievementKey: 'career_squad_link' },
    ctaLabel: 'Open teams',
    ctaRoute: '/teams'
  },
  {
    id: 'bracket-ready',
    title: 'Bracket Ready',
    description: 'Get registered in at least one active tournament flow this week.',
    target: 1,
    reward: { walletCredits: 40, bonusEntries: 0, achievementKey: 'career_bracket_ready' },
    ctaLabel: 'Find tournament',
    ctaRoute: dynamicTournamentRoute
  },
  {
    id: 'weekly-grind',
    title: 'Weekly Grind',
    description: 'Finish two matches this week to keep your momentum and visibility moving.',
    target: 2,
    reward: { walletCredits: 35, bonusEntries: 0, achievementKey: 'career_weekly_grind' },
    ctaLabel: 'Open matches',
    ctaRoute: '/matches'
  }
]);

const buildMissionProgress = (params: {
  user: any;
  teams: any[];
  activeTournaments: any[];
  recentCompletedMatches: any[];
  recommendationRoute: string;
  claimedMissionIds: Set<string>;
}): MissionStatus[] => {
  const {
    user,
    teams,
    activeTournaments,
    recentCompletedMatches,
    recommendationRoute,
    claimedMissionIds
  } = params;

  const gameProfiles = Array.isArray(user?.gameProfiles) ? user.gameProfiles : [];
  const hasPrimaryImage = Boolean(user?.profileLogo || user?.photoUrl);
  const hasRole = Boolean(user?.primaryRole);
  const hasEmail = Boolean(user?.email);
  const hasBio = Boolean(String(user?.bio || '').trim());

  const identityProgress = [
    hasBio,
    hasPrimaryImage,
    hasRole,
    hasEmail
  ].filter(Boolean).length;

  const loadoutProgress = [
    gameProfiles.some((item: any) => String(item?.username || '').trim()),
    gameProfiles.length >= 2,
    gameProfiles.some((item: any) => String(item?.rank || item?.ingameId || '').trim())
  ].filter(Boolean).length;

  const squadProgress = teams.length > 0 ? 1 : 0;
  const bracketProgress = activeTournaments.length > 0 ? 1 : 0;
  const grindProgress = Math.min(2, recentCompletedMatches.length);

  const valuesByMission: Record<string, number> = {
    'identity-stack': identityProgress,
    'competitive-loadout': loadoutProgress,
    'squad-link': squadProgress,
    'bracket-ready': bracketProgress,
    'weekly-grind': grindProgress
  };

  return buildMissionCatalog(recommendationRoute).map((mission) => {
    const current = Math.min(mission.target, valuesByMission[mission.id] || 0);
    const completed = current >= mission.target;
    return {
      ...mission,
      current,
      completed,
      claimed: claimedMissionIds.has(mission.id),
      progressPercent: clamp(Math.round((current / mission.target) * 100)),
      rewardLabel: buildRewardLabel(mission.reward)
    };
  });
};

const buildReadinessScore = (params: {
  user: any;
  teams: any[];
  activeTournaments: any[];
  recentCompletedMatches: any[];
  scoutProfile: any | null;
  scoutAccess: boolean;
}) => {
  const { user, teams, activeTournaments, recentCompletedMatches, scoutProfile, scoutAccess } = params;

  const gameProfiles = Array.isArray(user?.gameProfiles) ? user.gameProfiles : [];
  const achievementsCount = Array.isArray(user?.achievements) ? user.achievements.length : 0;
  const wins = toNumber(user?.stats?.wins, 0);
  const losses = toNumber(user?.stats?.losses, 0);
  const totalMatches = wins + losses;
  const winRate = totalMatches > 0 ? (wins / totalMatches) * 100 : 0;

  let score = 0;

  score += String(user?.bio || '').trim() ? 8 : 0;
  score += (user?.profileLogo || user?.photoUrl) ? 8 : 0;
  score += user?.primaryRole ? 6 : 0;
  score += user?.email ? 4 : 0;
  score += user?.profileWallpaper?.url ? 4 : 0;

  score += clamp(gameProfiles.length * 6, 0, 12);
  score += gameProfiles.some((item: any) => String(item?.rank || item?.ingameId || '').trim()) ? 6 : 0;
  score += teams.length > 0 ? 10 : 0;
  score += activeTournaments.length > 0 ? 10 : 0;

  score += clamp(recentCompletedMatches.length * 5, 0, 10);
  score += clamp(Math.round(winRate / 10), 0, 10);
  score += clamp(achievementsCount * 2, 0, 8);

  if (scoutAccess) {
    score += 5;
    score += scoutProfile?.enabled ? 7 : 0;
    score += scoutProfile?.visibility === 'public' ? 2 : 0;
  }

  return clamp(score);
};

const buildTournamentRecommendationReason = (params: {
  tournament: any;
  preferredGames: string[];
  hasTeam: boolean;
}) => {
  const { tournament, preferredGames, hasTeam } = params;
  if (preferredGames.includes(String(tournament?.game || '').toLowerCase())) {
    return `Matches your current ${tournament.game} focus.`;
  }
  if (hasTeam && tournament?.type === 'team') {
    return 'Best fit if your squad wants another active bracket.';
  }
  if (!hasTeam && tournament?.type === 'solo') {
    return 'Good solo entry while you build a longer team arc.';
  }
  return 'Healthy opening for activity, visibility and progression.';
};

const buildRecommendedTournaments = (params: {
  tournaments: any[];
  preferredGames: string[];
  hasTeam: boolean;
}) => (
  params.tournaments
    .map((tournament: any) => {
      const isGameFit = params.preferredGames.includes(String(tournament?.game || '').toLowerCase());
      const participantCount = tournament?.type === 'team'
        ? (Array.isArray(tournament?.registeredTeams) ? tournament.registeredTeams.length : 0)
        : (Array.isArray(tournament?.registeredPlayers) ? tournament.registeredPlayers.length : 0);
      const maxParticipants = tournament?.type === 'team'
        ? toNumber(tournament?.maxTeams, 0)
        : toNumber(tournament?.maxPlayers || tournament?.maxParticipants, 0);
      const slotsLeft = Math.max(0, maxParticipants - participantCount);
      const fitScore = clamp(
        45
          + (isGameFit ? 30 : 0)
          + (params.hasTeam && tournament?.type === 'team' ? 12 : 0)
          + (!params.hasTeam && tournament?.type === 'solo' ? 10 : 0)
          + (slotsLeft > 0 ? 8 : 0)
      );

      return {
        id: String(tournament?._id || ''),
        name: String(tournament?.name || 'Tournament'),
        game: String(tournament?.game || ''),
        type: String(tournament?.type || 'team'),
        prizePool: toNumber(tournament?.prizePool, 0),
        startDate: tournament?.startDate,
        slotsLeft,
        fitScore,
        fitReason: buildTournamentRecommendationReason({
          tournament,
          preferredGames: params.preferredGames,
          hasTeam: params.hasTeam
        }),
        route: `/tournaments/${String(tournament?._id || '')}`
      };
    })
    .sort((a, b) => b.fitScore - a.fitScore || new Date(a.startDate).getTime() - new Date(b.startDate).getTime())
    .slice(0, 4)
);

const buildUpcomingMatches = (matches: any[], teamIds: string[]) => (
  matches.map((match: any) => {
    const team1Id = String(match?.team1?._id || match?.team1 || '');
    const team2Id = String(match?.team2?._id || match?.team2 || '');
    const isHome = teamIds.includes(team1Id);
    const ourTeam = isHome ? match?.team1 : match?.team2;
    const opponent = isHome ? match?.team2 : match?.team1;
    return {
      id: String(match?._id || ''),
      tournamentName: String(match?.tournament?.name || 'Tournament'),
      game: String(match?.game || match?.tournament?.game || ''),
      round: String(match?.round || 'Round'),
      status: String(match?.status || 'scheduled'),
      startTime: match?.startTime,
      route: '/matches',
      ourTeam: {
        name: String(ourTeam?.name || 'Your Team'),
        tag: String(ourTeam?.tag || '')
      },
      opponent: {
        name: String(opponent?.name || 'Opponent'),
        tag: String(opponent?.tag || '')
      }
    };
  })
);

const buildCurrentStreak = (recentMatches: any[], teamIds: string[]): number => {
  let streak = 0;

  for (const match of recentMatches) {
    const winnerId = String(match?.winner || '');
    if (!winnerId) break;
    if (teamIds.includes(winnerId)) {
      streak += 1;
      continue;
    }
    break;
  }

  return streak;
};

const buildSpotlight = (params: {
  claimableCount: number;
  upcomingMatches: any[];
  nextActions: ActionItem[];
}) => {
  if (params.claimableCount > 0) {
    return {
      title: 'Rewards Ready',
      summary: `You have ${params.claimableCount} weekly mission reward${params.claimableCount > 1 ? 's' : ''} ready to claim right now.`,
      ctaLabel: 'Claim rewards',
      ctaRoute: '/career-hub',
      tone: 'positive'
    };
  }

  if (params.upcomingMatches.length > 0) {
    const nextMatch = params.upcomingMatches[0];
    return {
      title: 'Next Match Locked',
      summary: `${nextMatch.ourTeam.name} vs ${nextMatch.opponent.name} is the next priority on your schedule.`,
      ctaLabel: 'Open matches',
      ctaRoute: '/matches',
      tone: 'urgent'
    };
  }

  const topAction = params.nextActions[0];
  if (topAction) {
    return {
      title: topAction.title,
      summary: topAction.description,
      ctaLabel: topAction.ctaLabel,
      ctaRoute: topAction.ctaRoute,
      tone: 'focus'
    };
  }

  return {
    title: 'Momentum Stable',
    summary: 'Your platform setup looks healthy. Push into tournaments or Scout Hub to accelerate growth.',
    ctaLabel: 'Open tournaments',
    ctaRoute: '/tournaments',
    tone: 'focus'
  };
};

export const buildCareerHubDashboard = async (userId: string) => {
  const { now, start, end, weekKey } = getWeekWindow();

  const user = await User.findById(userId)
    .select([
      'username',
      'firstName',
      'lastName',
      'email',
      'bio',
      'profileLogo',
      'photoUrl',
      'profileWallpaper',
      'primaryRole',
      'teams',
      'participatingTournaments',
      'stats',
      'gameProfiles',
      'isSubscribed',
      'subscriptionExpiresAt',
      'wallet.balance',
      'notifications',
      'freeEntriesCount',
      'bonusEntries',
      'achievements',
      'role'
    ].join(' '))
    .lean();

  if (!user) {
    const error = new Error('User not found');
    (error as any).statusCode = 404;
    throw error;
  }

  const teams = await Team.find({
    $or: [{ captain: user._id }, { members: user._id }, { players: user._id }]
  })
    .select('name tag game status captain members players stats joinRequests')
    .lean();

  const teamIds = teams.map((team: any) => String(team?._id || ''));

  const activeTournamentFilter: any = {
    status: { $in: ['upcoming', 'ongoing'] },
    $or: [{ registeredPlayers: user._id }]
  };

  if (teamIds.length > 0) {
    activeTournamentFilter.$or.push({ registeredTeams: { $in: teamIds } });
  }

  const recommendedTournamentsFilter: any = {
    status: 'upcoming',
    isRegistrationOpen: true,
    startDate: { $gte: new Date(now.getTime() - 24 * 60 * 60 * 1000) }
  };

  const recentMatchFilter: any = {
    status: 'completed',
    $or: [{ endTime: { $gte: start } }, { updatedAt: { $gte: start } }]
  };
  const upcomingMatchFilter: any = {
    status: { $in: ['scheduled', 'live'] },
    startTime: { $lt: end }
  };

  if (teamIds.length > 0) {
    const teamSelector = [{ team1: { $in: teamIds } }, { team2: { $in: teamIds } }];
    recentMatchFilter.$and = [{ $or: teamSelector }];
    upcomingMatchFilter.$and = [{ $or: teamSelector }];
  } else {
    recentMatchFilter._id = null;
    upcomingMatchFilter._id = null;
  }

  const [activeTournaments, candidateTournaments, recentCompletedMatches, upcomingMatchesRaw, state] = await Promise.all([
    Tournament.find(activeTournamentFilter)
      .select('name game startDate status prizePool type registeredTeams registeredPlayers')
      .sort({ startDate: 1 })
      .lean(),
    Tournament.find(recommendedTournamentsFilter)
      .select('name game startDate prizePool type maxTeams maxPlayers maxParticipants registeredTeams registeredPlayers')
      .sort({ startDate: 1 })
      .limit(10)
      .lean(),
    Match.find(recentMatchFilter)
      .select('status startTime endTime updatedAt winner team1 team2')
      .sort({ endTime: -1, updatedAt: -1 })
      .limit(10)
      .lean(),
    Match.find(upcomingMatchFilter)
      .populate([
        { path: 'team1', select: 'name tag' },
        { path: 'team2', select: 'name tag' },
        { path: 'tournament', select: 'name game' }
      ])
      .select('team1 team2 tournament game round status startTime')
      .sort({ startTime: 1 })
      .limit(5)
      .lean(),
    CareerHubState.findOne({ user: user._id, weekKey }).lean()
  ]);

  const scoutAccess = hasPlayerPromotionAccess(user);
  let scoutProfile: any = await PlayerPromotionProfile.findOne({ user: user._id }).lean();
  if (scoutAccess && !scoutProfile) {
    scoutProfile = await ensurePlayerPromotionProfile(user);
  }

  const preferredGames = Array.from(new Set([
    ...((Array.isArray(user?.gameProfiles) ? user.gameProfiles : []).map((item: any) => String(item?.game || '').trim().toLowerCase()).filter(Boolean)),
    ...teams.map((team: any) => String(team?.game || '').trim().toLowerCase()).filter(Boolean)
  ]));
  const activeTournamentIds = new Set(activeTournaments.map((item: any) => String(item?._id || '')));

  const recommendations = buildRecommendedTournaments({
    tournaments: candidateTournaments.filter((item: any) => !activeTournamentIds.has(String(item?._id || ''))),
    preferredGames,
    hasTeam: teams.length > 0
  });

  const claimedMissionIds = new Set((state?.claimedMissions || []).map((item: any) => String(item?.missionId || '')));
  const recommendationRoute = recommendations[0]?.route || '/tournaments';
  const weeklyMissions = buildMissionProgress({
    user,
    teams,
    activeTournaments,
    recentCompletedMatches,
    recommendationRoute,
    claimedMissionIds
  });

  const readinessScore = buildReadinessScore({
    user,
    teams,
    activeTournaments,
    recentCompletedMatches,
    scoutProfile,
    scoutAccess
  });
  const readinessTier = getReadinessTier(readinessScore);
  const progressToNextTier = readinessTier.nextThreshold <= readinessScore
    ? 100
    : clamp(Math.round((readinessScore / readinessTier.nextThreshold) * 100));

  const claimableCount = weeklyMissions.filter((mission) => mission.completed && !mission.claimed).length;
  const unreadNotifications = Array.isArray(user?.notifications)
    ? user.notifications.filter((item: any) => !item?.read).length
    : 0;

  const nextActions: ActionItem[] = [];

  if (claimableCount > 0) {
    nextActions.push({
      id: 'claim-rewards',
      title: 'Claim Weekly Rewards',
      description: `${claimableCount} mission reward${claimableCount > 1 ? 's are' : ' is'} waiting in Career Hub.`,
      ctaLabel: 'Open Career Hub',
      ctaRoute: '/career-hub',
      priority: 100,
      tag: 'rewards'
    });
  }

  if (!String(user?.bio || '').trim() || !(user?.profileLogo || user?.photoUrl)) {
    nextActions.push({
      id: 'complete-profile',
      title: 'Finish your player card',
      description: 'A complete identity layer directly improves trust, conversion and recommendations.',
      ctaLabel: 'Edit profile',
      ctaRoute: '/profile',
      priority: 94,
      tag: 'profile'
    });
  }

  if ((Array.isArray(user?.gameProfiles) ? user.gameProfiles.length : 0) < 2) {
    nextActions.push({
      id: 'add-game-profiles',
      title: 'Add more game loadout data',
      description: 'More game profiles improve tournament fit and future scout visibility.',
      ctaLabel: 'Open profile',
      ctaRoute: '/profile',
      priority: 88,
      tag: 'setup'
    });
  }

  if (!teams.length) {
    nextActions.push({
      id: 'join-team',
      title: 'Join or create a squad',
      description: 'Team membership unlocks more tournament loops, history and match structure.',
      ctaLabel: 'Open teams',
      ctaRoute: '/teams',
      priority: 92,
      tag: 'team'
    });
  }

  if (!activeTournaments.length) {
    nextActions.push({
      id: 'join-tournament',
      title: 'Enter your next bracket',
      description: recommendations[0]?.fitReason || 'Your next performance milestone is tournament participation.',
      ctaLabel: recommendations[0] ? 'View best-fit event' : 'Browse tournaments',
      ctaRoute: recommendations[0]?.route || '/tournaments',
      priority: 90,
      tag: 'competition'
    });
  }

  if (scoutAccess && !scoutProfile?.enabled) {
    nextActions.push({
      id: 'activate-scout-hub',
      title: 'Activate Scout Hub',
      description: 'Turn your stats into a scout-facing pitch and public discovery surface.',
      ctaLabel: 'Open Scout Hub',
      ctaRoute: '/scout-hub',
      priority: 82,
      tag: 'discovery'
    });
  }

  if (!scoutAccess) {
    nextActions.push({
      id: 'unlock-scout-hub',
      title: 'Unlock Scout Hub access',
      description: 'Subscription adds public promotion, scout visibility and a stronger growth loop.',
      ctaLabel: 'View billing',
      ctaRoute: '/billing',
      priority: 72,
      tag: 'upgrade'
    });
  }

  if (upcomingMatchesRaw.length > 0) {
    nextActions.push({
      id: 'prepare-match',
      title: 'Prepare your next match block',
      description: 'Check the next scheduled lobby, round context and opponent before the window opens.',
      ctaLabel: 'Open matches',
      ctaRoute: '/matches',
      priority: 86,
      tag: 'schedule'
    });
  }

  const upcomingMatches = buildUpcomingMatches(upcomingMatchesRaw, teamIds);
  const currentStreak = buildCurrentStreak(recentCompletedMatches, teamIds);
  const sortedActions = sortActions(nextActions);
  const spotlight = buildSpotlight({
    claimableCount,
    upcomingMatches,
    nextActions: sortedActions
  });

  return {
    meta: {
      generatedAt: new Date().toISOString(),
      weekKey,
      windowStart: start.toISOString(),
      windowEnd: end.toISOString(),
      claimableCount
    },
    overview: {
      readinessScore,
      readinessLabel: readinessTier.label,
      nextTierLabel: readinessTier.nextLabel,
      progressToNextTier,
      activeMissions: weeklyMissions.filter((mission) => !mission.claimed).length,
      completedMissions: weeklyMissions.filter((mission) => mission.completed).length,
      totalMissions: weeklyMissions.length,
      walletBalance: toNumber(user?.wallet?.balance, 0),
      entriesAvailable: toNumber(user?.freeEntriesCount, 0) + toNumber(user?.bonusEntries, 0),
      unreadNotifications,
      currentStreak,
      currentTeams: teams.length,
      activeTournaments: activeTournaments.length,
      bestGame: preferredGames[0] || '',
      primaryRole: String(user?.primaryRole || 'Flex')
    },
    spotlight,
    nextActions: sortedActions,
    weeklyMissions,
    recommendations: {
      tournaments: recommendations
    },
    schedule: {
      upcomingMatches
    },
    roster: {
      teams: teams.map((team: any) => ({
        id: String(team?._id || ''),
        name: String(team?.name || ''),
        tag: String(team?.tag || ''),
        game: String(team?.game || ''),
        status: String(team?.status || 'active'),
        memberCount: Math.max(
          Array.isArray(team?.members) ? team.members.length : 0,
          Array.isArray(team?.players) ? team.players.length : 0
        ),
        pendingJoinRequests: Array.isArray(team?.joinRequests)
          ? team.joinRequests.filter((item: any) => item?.status === 'pending').length
          : 0,
        isCaptain: String(team?.captain || '') === String(user?._id || ''),
        winRate: toNumber(team?.stats?.winRate, 0),
        totalMatches: toNumber(team?.stats?.totalMatches, 0)
      }))
    },
    scout: {
      hasAccess: scoutAccess,
      enabled: Boolean(scoutProfile?.enabled),
      visibility: String(scoutProfile?.visibility || 'private'),
      headline: String(scoutProfile?.headline || ''),
      publicUrl: scoutProfile?.slug ? `/scouts/${scoutProfile.slug}` : '',
      leaderboardScore: toNumber(scoutProfile?.lastLeaderboardScore, 0),
      bestGame: String(scoutProfile?.lastBestGame || preferredGames[0] || ''),
      bestRole: String(scoutProfile?.lastBestRole || user?.primaryRole || 'Flex'),
      ctaRoute: scoutAccess ? '/scout-hub' : '/billing'
    }
  };
};

export const claimCareerMission = async (userId: string, missionId: string) => {
  const dashboard = await buildCareerHubDashboard(userId);
  const mission = (dashboard?.weeklyMissions || []).find((item: any) => item.id === missionId);

  if (!mission) {
    const error = new Error('Mission not found');
    (error as any).statusCode = 404;
    throw error;
  }

  if (!mission.completed) {
    const error = new Error('Mission is not completed yet');
    (error as any).statusCode = 400;
    throw error;
  }

  if (mission.claimed) {
    const error = new Error('Mission reward already claimed this week');
    (error as any).statusCode = 409;
    throw error;
  }

  const { weekKey } = getWeekWindow();

  const state = await CareerHubState.findOneAndUpdate(
    { user: userId, weekKey },
    { $setOnInsert: { user: userId, weekKey } },
    { new: true, upsert: true }
  );

  if (state.claimedMissions.some((item: any) => item?.missionId === missionId)) {
    const error = new Error('Mission reward already claimed this week');
    (error as any).statusCode = 409;
    throw error;
  }

  const user: any = await User.findById(userId);
  if (!user) {
    const error = new Error('User not found');
    (error as any).statusCode = 404;
    throw error;
  }

  const walletCredits = toNumber(mission.reward?.walletCredits, 0);
  const bonusEntries = toNumber(mission.reward?.bonusEntries, 0);
  const achievementKey = String(mission.reward?.achievementKey || '');

  if (walletCredits > 0) {
    user.wallet.balance = toNumber(user?.wallet?.balance, 0) + walletCredits;
    user.wallet.transactions.push({
      type: 'referral',
      amount: walletCredits,
      description: `Career Hub mission reward: ${mission.title}`,
      date: new Date()
    });
  }

  if (bonusEntries > 0) {
    user.bonusEntries = toNumber(user?.bonusEntries, 0) + bonusEntries;
    user.wallet.transactions.push({
      type: 'referral',
      amount: 0,
      description: `Career Hub bonus entry reward: ${mission.title}`,
      date: new Date()
    });
  }

  if (achievementKey && !Array.isArray(user.achievements)) {
    user.achievements = [];
  }

  if (achievementKey && !user.achievements.includes(achievementKey)) {
    user.achievements.push(achievementKey);
  }

  await user.save();

  state.claimedMissions.push({
    missionId,
    claimedAt: new Date(),
    walletCredits,
    bonusEntries,
    achievementKey: achievementKey || undefined
  } as any);
  state.lastViewedAt = new Date();
  await state.save();

  return buildCareerHubDashboard(userId);
};

export const claimAllCareerMissions = async (userId: string) => {
  let dashboard = await buildCareerHubDashboard(userId);
  const claimableMissionIds = (dashboard?.weeklyMissions || [])
    .filter((mission: any) => mission.completed && !mission.claimed)
    .map((mission: any) => String(mission.id || ''))
    .filter(Boolean);

  for (const missionId of claimableMissionIds) {
    dashboard = await claimCareerMission(userId, missionId);
  }

  return {
    claimedMissionIds: claimableMissionIds,
    dashboard
  };
};

export const touchCareerHubView = async (userId: string) => {
  const { weekKey } = getWeekWindow();
  await CareerHubState.findOneAndUpdate(
    { user: userId, weekKey },
    {
      $setOnInsert: { user: userId, weekKey },
      $set: { lastViewedAt: new Date() }
    },
    { upsert: true, new: true }
  );
};
