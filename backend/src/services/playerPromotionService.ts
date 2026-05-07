import mongoose from 'mongoose';
import PlayerPromotionProfile, { PromotionFocus, PromotionVisibility } from '../models/PlayerPromotionProfile';
import Team from '../models/Team';
import Tournament from '../models/Tournament';
import User from '../models/User';
import UserStats from '../models/UserStats';
import { SUPPORTED_GAMES } from '../config/games';
import { ensureUserStats } from './analyticsEngine';

const FALLBACK_GAMES = [...SUPPORTED_GAMES];
const TRAINING_LIBRARY = {
  aiming: {
    label: 'Aim & mechanics',
    recommendation: 'Run 35-minute aim duels, recoil control and entry timing drills before ranked or scrims.'
  },
  positioning: {
    label: 'Positioning & spacing',
    recommendation: 'Review VOD clips, isolate over-peeks and rehearse safer map pathing.'
  },
  utility: {
    label: 'Utility value',
    recommendation: 'Dedicate sessions to executes, support timing and utility trade patterns.'
  },
  clutchFactor: {
    label: 'Clutch conversion',
    recommendation: 'Practice 1vX retakes, late-round timing and calm comms under pressure.'
  },
  teamplay: {
    label: 'Teamplay & comms',
    recommendation: 'Schedule duo or trio sessions focused on trade timing, callouts and role sync.'
  }
} as const;

const ROLE_ARCHETYPES: Record<string, string[]> = {
  Entry: ['space-creator', 'first-contact rifler', 'tempo opener'],
  Sniper: ['pick specialist', 'long-angle controller', 'late-round closer'],
  Support: ['utility anchor', 'mid-round stabilizer', 'setup facilitator'],
  Lurker: ['map pressure lurker', 'flank threat', 'timing disruptor'],
  Flex: ['adaptive second caller', 'trade finisher', 'gap-filler']
};

const FOCUS_BASELINE: Record<PromotionFocus, { dailyHours: number; sessionsPerWeek: number }> = {
  balanced: { dailyHours: 2, sessionsPerWeek: 5 },
  ranked: { dailyHours: 3, sessionsPerWeek: 5 },
  tournament: { dailyHours: 4, sessionsPerWeek: 6 },
  trial: { dailyHours: 3, sessionsPerWeek: 6 }
};

const clamp = (value: number, min = 0, max = 100): number => Math.max(min, Math.min(max, value));

const toNumber = (value: unknown, fallback = 0): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const dedupeStrings = (values: string[]): string[] => Array.from(new Set(values.filter(Boolean)));

const trimArray = (value: unknown, maxItems: number, maxLength: number): string[] => (
  Array.isArray(value)
    ? value
      .map((item) => String(item || '').trim())
      .filter(Boolean)
      .slice(0, maxItems)
      .map((item) => item.slice(0, maxLength))
    : []
);

const slugify = (value: string): string => (
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48)
);

const formatMonth = (value: Date | string | number | undefined): string => {
  const date = value ? new Date(value) : new Date();
  if (Number.isNaN(date.getTime())) return '';
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`;
};

export const hasPlayerPromotionAccess = (user: any): boolean => {
  if (!user) return false;
  if (user.role === 'admin' || user.role === 'developer') return true;

  const now = Date.now();
  const subscriptionExpiresAt = user.subscriptionExpiresAt ? new Date(user.subscriptionExpiresAt).getTime() : 0;
  if (user.isSubscribed && (!subscriptionExpiresAt || subscriptionExpiresAt > now)) {
    return true;
  }
  return false;
};

export const buildPromotionAccessState = (user: any) => {
  const hasAccess = hasPlayerPromotionAccess(user);
  return {
    hasAccess,
    canPublish: hasAccess,
    reason: hasAccess
      ? 'active_subscription'
      : 'active_subscription_required'
  };
};

export const assertPlayerPromotionAccess = async (userId: string) => {
  const user = await User.findById(userId)
    .select('role isSubscribed subscriptionExpiresAt')
    .lean();

  if (!user) {
    const error = new Error('User not found');
    (error as any).statusCode = 404;
    throw error;
  }

  if (!hasPlayerPromotionAccess(user)) {
    const error = new Error('Scout Hub requires an active subscription');
    (error as any).statusCode = 402;
    (error as any).redirectTo = '/billing';
    throw error;
  }

  return user;
};

export const generateUniquePromotionSlug = async (seed: string, userId?: string): Promise<string> => {
  const normalized = slugify(seed) || `player-${String(userId || '').slice(-6) || 'scout'}`;
  let candidate = normalized;
  let suffix = 1;

  while (true) {
    const existing = await PlayerPromotionProfile.findOne({ slug: candidate }).select('user').lean();
    if (!existing || String(existing.user) === String(userId || '')) {
      return candidate;
    }
    suffix += 1;
    candidate = `${normalized.slice(0, 42)}-${suffix}`;
  }
};

export const ensurePlayerPromotionProfile = async (user: any) => {
  let profile = await PlayerPromotionProfile.findOne({ user: user._id });
  if (profile) return profile;

  const slug = await generateUniquePromotionSlug(user.username || user.firstName || `player-${user._id}`, String(user._id));
  profile = await PlayerPromotionProfile.create({
    user: user._id,
    slug,
    enabled: false,
    visibility: 'scouts',
    focus: 'balanced',
    adminUnlocked: false,
    targetGames: trimArray(user.gameProfiles?.map((item: any) => item?.game), 3, 40),
    targetRoles: trimArray([user.primaryRole], 3, 40),
    seoKeywords: trimArray([user.username, user.primaryRole], 8, 40)
  });
  return profile;
};

const buildGameSummary = (user: any, teams: any[]) => {
  const profiles = Array.isArray(user.gameProfiles) ? user.gameProfiles : [];
  const candidates = profiles.map((profile: any) => {
    const wins = toNumber(profile?.stats?.wins, 0);
    const matches = toNumber(profile?.stats?.matches, wins);
    const matchScore = clamp(matches * 4, 0, 100);
    const winRate = matches > 0 ? (wins / matches) * 100 : 0;
    return {
      game: String(profile?.game || '').trim(),
      username: String(profile?.username || '').trim(),
      rank: String(profile?.rank || '').trim(),
      wins,
      matches,
      winRate,
      score: Number((winRate * 0.7 + matchScore * 0.3).toFixed(2))
    };
  }).filter((profile: any) => profile.game);

  if (candidates.length > 0) {
    candidates.sort((a: any, b: any) => b.score - a.score);
    return {
      bestGame: candidates[0].game,
      bestGameProfile: candidates[0],
      games: candidates
    };
  }

  const teamGames = dedupeStrings((teams || []).map((team) => String(team?.game || '').trim()));
  const fallbackGame = teamGames[0] || FALLBACK_GAMES[0];
  return {
    bestGame: fallbackGame,
    bestGameProfile: {
      game: fallbackGame,
      username: user.username || '',
      rank: '',
      wins: 0,
      matches: 0,
      winRate: 0,
      score: 0
    },
    games: teamGames.map((game) => ({
      game,
      username: user.username || '',
      rank: '',
      wins: 0,
      matches: 0,
      winRate: 0,
      score: 0
    }))
  };
};

const buildConsistencyScore = (trend30d: Array<{ rating: number }> = []): number => {
  if (trend30d.length <= 1) return 55;
  let totalVariance = 0;
  for (let index = 1; index < trend30d.length; index += 1) {
    totalVariance += Math.abs(toNumber(trend30d[index]?.rating, 50) - toNumber(trend30d[index - 1]?.rating, 50));
  }
  const averageVariance = totalVariance / Math.max(1, trend30d.length - 1);
  return clamp(Number((100 - averageVariance * 3.2).toFixed(2)));
};

const buildMomentum = (trend30d: Array<{ rating: number }> = []) => {
  const first = toNumber(trend30d[0]?.rating, 50);
  const last = toNumber(trend30d[trend30d.length - 1]?.rating, first);
  const delta = Number((last - first).toFixed(2));
  const label = delta >= 8
    ? 'Rising fast'
    : delta >= 3
      ? 'Trending up'
      : delta <= -8
        ? 'Needs reset'
        : delta <= -3
          ? 'Cooling down'
          : 'Stable';

  return { delta, label };
};

const buildTrainingPlan = (stats: any, focus: PromotionFocus) => {
  const entries = Object.entries(stats?.skills || {}).map(([key, value]) => ({
    key,
    value: toNumber(value, 50)
  }));
  const weakest = entries.sort((a, b) => a.value - b.value).slice(0, 3);
  const baseline = FOCUS_BASELINE[focus] || FOCUS_BASELINE.balanced;

  return {
    dailyHours: baseline.dailyHours,
    weeklyHours: baseline.dailyHours * baseline.sessionsPerWeek,
    sessionsPerWeek: baseline.sessionsPerWeek,
    focusAreas: weakest.map((item) => ({
      key: item.key,
      label: TRAINING_LIBRARY[item.key as keyof typeof TRAINING_LIBRARY]?.label || item.key,
      currentScore: item.value,
      targetScore: clamp(item.value + 12),
      recommendation: TRAINING_LIBRARY[item.key as keyof typeof TRAINING_LIBRARY]?.recommendation || 'Focus this area in the next review block.'
    }))
  };
};

const buildSeoMetadata = (params: {
  user: any;
  profile: any;
  bestGame: string;
  bestRole: string;
  leaderboardScore: number;
}) => {
  const title = params.profile?.seoTitle || `${params.user.username} ${params.bestGame} scouting profile | WAY Esports`;
  const description = params.profile?.seoDescription
    || `${params.user.username} plays ${params.bestGame} as ${params.bestRole}. Scout score ${params.leaderboardScore}/100, tournament history, team fit and training recommendations on WAY Esports.`;
  const keywords = dedupeStrings([
    ...(Array.isArray(params.profile?.seoKeywords) ? params.profile.seoKeywords : []),
    params.user.username,
    params.bestGame,
    params.bestRole,
    'esports player scouting',
    'player leaderboard',
    'tournament history',
    'scout report'
  ]).slice(0, 12);
  return { title, description, keywords };
};

const buildTimeline = (teams: any[]) => {
  const raw = (teams || []).flatMap((team) => (
    Array.isArray(team?.achievements)
      ? team.achievements.map((achievement: any) => ({
        teamName: team?.name || 'Team',
        position: toNumber(achievement?.position, 0),
        prize: toNumber(achievement?.prize, 0),
        period: formatMonth(achievement?.date),
        date: achievement?.date ? new Date(achievement.date).getTime() : 0
      }))
      : []
  ));

  return raw
    .filter((item) => item.period)
    .sort((a, b) => b.date - a.date)
    .slice(0, 6);
};

const buildTeamContext = (stats: any, teams: any[]) => {
  const conflictScore = toNumber(stats?.behavioral?.conflictScore, 0);
  const leadership = toNumber(stats?.behavioral?.leadership, 50);
  const chill = toNumber(stats?.behavioral?.chill, 50);

  const chemistrySummary =
    conflictScore >= 45
      ? 'Needs calmer team environments and clearer role ownership to keep performance stable.'
      : leadership >= 70
        ? 'Raises team structure well and looks strongest with disciplined teammates.'
        : chill >= 70
          ? 'Handles noisy team environments better than average and keeps tilt low.'
          : 'Performs best with steady comms and defined mid-round responsibilities.';

  return {
    currentTeams: teams.map((team) => ({
      id: String(team?._id || ''),
      name: team?.name || 'Team',
      tag: team?.tag || '',
      game: team?.game || '',
      status: team?.status || 'active'
    })),
    stabilityLabel: teams.length >= 3
      ? 'Experienced in multiple environments'
      : teams.length === 2
        ? 'Adaptable core player'
        : 'Stable single-team profile',
    chemistrySummary
  };
};

const sanitizeTrainingPlan = (trainingPlan: any) => ({
  focusAreas: Array.isArray(trainingPlan?.focusAreas)
    ? trainingPlan.focusAreas.map((item: any) => ({
        key: String(item?.key || ''),
        label: String(item?.label || ''),
        currentScore: toNumber(item?.currentScore, 0),
        targetScore: toNumber(item?.targetScore, 0),
        recommendation: String(item?.recommendation || '')
      }))
    : [],
  dailyHours: toNumber(trainingPlan?.dailyHours, 0),
  weeklyHours: toNumber(trainingPlan?.weeklyHours, 0),
  sessionsPerWeek: toNumber(trainingPlan?.sessionsPerWeek, 0)
});

const sanitizePublicTeams = (teams: any[]) => (
  Array.isArray(teams)
    ? teams.map((item: any) => ({
        id: String(item?.id || ''),
        name: String(item?.name || ''),
        game: String(item?.game || ''),
        winRate: toNumber(item?.winRate, 0),
        reason: String(item?.reason || '')
      }))
    : []
);

const sanitizePublicTournaments = (tournaments: any[]) => (
  Array.isArray(tournaments)
    ? tournaments.map((item: any) => ({
        id: String(item?.id || ''),
        name: String(item?.name || ''),
        game: String(item?.game || ''),
        prizePool: toNumber(item?.prizePool, 0),
        reason: String(item?.reason || '')
      }))
    : []
);

const sanitizeTimeline = (timeline: any[]) => (
  Array.isArray(timeline)
    ? timeline.map((item: any) => ({
        teamName: String(item?.teamName || ''),
        period: String(item?.period || ''),
        position: toNumber(item?.position, 0),
        prize: toNumber(item?.prize, 0)
      }))
    : []
);

const buildUserFacingSnapshot = (snapshot: any) => ({
  publicUrl: String(snapshot?.publicUrl || ''),
  headline: String(snapshot?.headline || ''),
  scoutPitch: String(snapshot?.scoutPitch || ''),
  leaderboardScore: toNumber(snapshot?.leaderboardScore, 0),
  bestGame: String(snapshot?.bestGame || ''),
  bestRole: String(snapshot?.bestRole || ''),
  momentum: snapshot?.momentum || null,
  trainingPlan: sanitizeTrainingPlan(snapshot?.trainingPlan),
  recommendations: {
    bestFits: Array.isArray(snapshot?.recommendations?.bestFits)
      ? snapshot.recommendations.bestFits.map((item: any) => String(item || ''))
      : [],
    tournaments: sanitizePublicTournaments(snapshot?.recommendations?.tournaments)
  }
});

const buildPublicPromotionPayload = (snapshot: any, profile: any) => ({
  userId: String(snapshot?.userId || ''),
  username: String(snapshot?.username || ''),
  avatarUrl: String(snapshot?.avatarUrl || ''),
  publicUrl: String(snapshot?.publicUrl || ''),
  headline: String(snapshot?.headline || ''),
  scoutPitch: String(snapshot?.scoutPitch || ''),
  leaderboardScore: toNumber(snapshot?.leaderboardScore, 0),
  bestGame: String(snapshot?.bestGame || ''),
  bestRole: String(snapshot?.bestRole || ''),
  momentum: snapshot?.momentum || null,
  metrics: {
    impactRating: toNumber(snapshot?.metrics?.impactRating, 0),
    winRate: toNumber(snapshot?.metrics?.winRate, 0),
    consistencyScore: toNumber(snapshot?.metrics?.consistencyScore, 0),
    leadership: toNumber(snapshot?.metrics?.leadership, 0)
  },
  trainingPlan: sanitizeTrainingPlan(snapshot?.trainingPlan),
  recommendations: {
    bestFits: Array.isArray(snapshot?.recommendations?.bestFits)
      ? snapshot.recommendations.bestFits.map((item: any) => String(item || ''))
      : [],
    teams: sanitizePublicTeams(snapshot?.recommendations?.teams),
    tournaments: sanitizePublicTournaments(snapshot?.recommendations?.tournaments)
  },
  timeline: sanitizeTimeline(snapshot?.timeline),
  seo: snapshot?.seo || null,
  structuredData: snapshot?.structuredData || null,
  visibility: String(profile?.visibility || 'scouts'),
  slug: String(profile?.slug || '')
});

const buildLeaderboardScore = (params: {
  impactRating: number;
  winRate: number;
  consistencyScore: number;
  teamplay: number;
  clutchFactor: number;
  leadership: number;
}) => Number((
  params.impactRating * 0.4 +
  params.winRate * 0.24 +
  params.consistencyScore * 0.14 +
  params.teamplay * 0.08 +
  params.clutchFactor * 0.08 +
  params.leadership * 0.06
).toFixed(2));

const buildRecommendedTeams = async (bestGame: string, currentTeamIds: string[]) => {
  const teams = await Team.find({
    game: bestGame,
    status: 'active',
    _id: { $nin: currentTeamIds.filter((item) => mongoose.Types.ObjectId.isValid(item)) }
  })
    .sort({ 'stats.winRate': -1, 'stats.totalMatches': -1 })
    .limit(3)
    .select('name tag game stats members')
    .lean();

  return teams.map((team: any) => ({
    id: String(team?._id || ''),
    name: team?.name || 'Team',
    tag: team?.tag || '',
    game: team?.game || bestGame,
    winRate: toNumber(team?.stats?.winRate, 0),
    membersCount: Array.isArray(team?.members) ? team.members.length : 0,
    reason: `Strong ${team?.game || bestGame} roster with ${Math.round(toNumber(team?.stats?.winRate, 0))}% win rate.`
  }));
};

const buildRecommendedTournaments = async (games: string[]) => {
  const queryGames = games.length ? games : FALLBACK_GAMES;
  const tournaments = await Tournament.find({
    status: 'upcoming',
    game: { $in: queryGames }
  })
    .sort({ prizePool: -1, startDate: 1 })
    .limit(5)
    .select('name game prizePool startDate type skillLevel')
    .lean();

  return tournaments.map((tournament: any) => ({
    id: String(tournament?._id || ''),
    name: tournament?.name || 'Tournament',
    game: tournament?.game || '',
    prizePool: toNumber(tournament?.prizePool, 0),
    startDate: tournament?.startDate,
    type: tournament?.type || 'team',
    skillLevel: tournament?.skillLevel || 'Open',
    reason: `Fits ${tournament?.game || 'your profile'} and starts on a reachable timeline for preparation.`
  }));
};

export const buildPromotionSnapshot = async (userId: string) => {
  const user = await User.findById(userId)
    .select('username firstName lastName bio profileLogo photoUrl primaryRole stats gameProfiles role isSubscribed subscriptionExpiresAt createdAt')
    .lean();

  if (!user) {
    throw new Error('User not found');
  }

  const profile = await ensurePlayerPromotionProfile(user);
  const existingStats = await UserStats.findOne({ user: user._id }).lean();
  const ensuredStats = existingStats || (await ensureUserStats(String(user._id)))?.toObject?.();
  if (!ensuredStats) {
    throw new Error('Unable to build player analytics');
  }

  const teams = await Team.find({
    $or: [{ captain: user._id }, { members: user._id }, { players: user._id }]
  })
    .select('name tag game status stats achievements members')
    .lean();

  const totalWins = toNumber(user?.stats?.wins, 0);
  const totalLosses = toNumber(user?.stats?.losses, 0);
  const winRate = totalWins + totalLosses > 0
    ? Number(((totalWins / (totalWins + totalLosses)) * 100).toFixed(2))
    : 0;

  const { bestGame, bestGameProfile, games } = buildGameSummary(user, teams);
  const bestRole = String(profile.targetRoles?.[0] || user.primaryRole || ensuredStats.primaryRole || 'Flex');
  const consistencyScore = buildConsistencyScore(ensuredStats.trend30d || []);
  const momentum = buildMomentum(ensuredStats.trend30d || []);
  const teamplay = toNumber(ensuredStats?.skills?.teamplay, 50);
  const clutchFactor = toNumber(ensuredStats?.skills?.clutchFactor, 50);
  const leadership = toNumber(ensuredStats?.behavioral?.leadership, 50);
  const leaderboardScore = clamp(buildLeaderboardScore({
    impactRating: toNumber(ensuredStats?.impactRating, 0),
    winRate,
    consistencyScore,
    teamplay,
    clutchFactor,
    leadership
  }));

  const headline = String(
    profile.headline || `${bestRole} ${bestGame} player with ${Math.round(leaderboardScore)}/100 scout score`
  ).slice(0, 120);
  const scoutPitch = String(
    profile.scoutPitch || `${user.username} shows ${momentum.label.toLowerCase()} form, ${Math.round(winRate)}% win rate, and the strongest upside in ${bestGame}. Best fit: ${bestRole} roles in structured rosters that want reliable teamplay and clear development goals.`
  ).slice(0, 600);

  const trainingPlan = buildTrainingPlan(ensuredStats, profile.focus || 'balanced');
  const timeline = buildTimeline(teams);
  const teamContext = buildTeamContext(ensuredStats, teams);
  const currentTeamIds = teams.map((team) => String(team?._id || ''));
  const [recommendedTeams, recommendedTournaments] = await Promise.all([
    buildRecommendedTeams(bestGame, currentTeamIds),
    buildRecommendedTournaments(dedupeStrings([bestGame, ...games.map((item: any) => String(item?.game || ''))]))
  ]);
  const archetypes = ROLE_ARCHETYPES[bestRole] || ROLE_ARCHETYPES.Flex;
  const seo = buildSeoMetadata({
    user,
    profile,
    bestGame,
    bestRole,
    leaderboardScore
  });

  profile.lastSnapshotGeneratedAt = new Date();
  profile.lastLeaderboardScore = leaderboardScore;
  profile.lastBestGame = bestGame;
  profile.lastBestRole = bestRole;
  if (!profile.seoKeywords?.length) {
    profile.seoKeywords = seo.keywords;
  }
  await profile.save();

  return {
    access: buildPromotionAccessState(user),
    settings: {
      slug: profile.slug,
      enabled: Boolean(profile.enabled),
      visibility: profile.visibility as PromotionVisibility,
      headline: profile.headline || '',
      scoutPitch: profile.scoutPitch || '',
      targetGames: trimArray(profile.targetGames, 5, 40),
      targetRoles: trimArray(profile.targetRoles, 5, 40),
      targetTeams: trimArray(profile.targetTeams, 6, 80),
      focus: profile.focus || 'balanced'
    },
    snapshot: buildUserFacingSnapshot({
      userId: String(user._id),
      username: user.username,
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      bio: user.bio || '',
      avatarUrl: user.profileLogo || user.photoUrl || '',
      publicUrl: `/scouts/${profile.slug}`,
      headline,
      scoutPitch,
      leaderboardScore,
      bestGame,
      bestRole,
      bestGameProfile,
      momentum,
      metrics: {
        impactRating: toNumber(ensuredStats?.impactRating, 0),
        winRate,
        consistencyScore,
        teamplay,
        clutchFactor,
        leadership,
        chill: toNumber(ensuredStats?.behavioral?.chill, 50),
        conflictScore: toNumber(ensuredStats?.behavioral?.conflictScore, 0)
      },
      games,
      trainingPlan,
      recommendations: {
        tournaments: recommendedTournaments,
        teams: recommendedTeams,
        archetypes,
        improvementSummary: trainingPlan.focusAreas.map((item: any) => `${item.label}: ${item.recommendation}`).join(' '),
        bestFits: [
          `${bestRole} roles in ${bestGame}`,
          `${momentum.label} momentum windows`,
          teamContext.chemistrySummary
        ]
      },
      teamContext,
      timeline,
      seo,
      structuredData: {
        '@context': 'https://schema.org',
        '@type': 'Person',
        name: user.username,
        description: seo.description,
        jobTitle: `${bestRole} ${bestGame} player`,
        url: `/scouts/${profile.slug}`,
        knowsAbout: dedupeStrings([bestGame, bestRole, ...seo.keywords]).slice(0, 12)
      }
    })
  };
};

export const updatePlayerPromotionSettings = async (userId: string, payload: Record<string, unknown>) => {
  const user = await User.findById(userId)
    .select('username firstName role isSubscribed subscriptionExpiresAt')
    .lean();

  if (!user) {
    throw new Error('User not found');
  }

  const profile = await ensurePlayerPromotionProfile(user);
  const access = buildPromotionAccessState(user);

  if (typeof payload.slug === 'string' && payload.slug.trim()) {
    profile.slug = await generateUniquePromotionSlug(payload.slug, userId);
  }

  if (typeof payload.enabled === 'boolean') {
    if (payload.enabled && !access.hasAccess) {
      const error = new Error('Scout Hub requires an active subscription');
      (error as any).statusCode = 402;
      throw error;
    }
    profile.enabled = payload.enabled;
  }

  if (typeof payload.visibility === 'string' && ['private', 'scouts', 'public'].includes(payload.visibility)) {
    profile.visibility = payload.visibility as PromotionVisibility;
  }
  if (typeof payload.headline === 'string') profile.headline = payload.headline.trim().slice(0, 120);
  if (typeof payload.scoutPitch === 'string') profile.scoutPitch = payload.scoutPitch.trim().slice(0, 600);
  if (typeof payload.focus === 'string' && ['balanced', 'ranked', 'tournament', 'trial'].includes(payload.focus)) {
    profile.focus = payload.focus as PromotionFocus;
  }

  if (payload.targetGames !== undefined) profile.targetGames = trimArray(payload.targetGames, 5, 40);
  if (payload.targetRoles !== undefined) profile.targetRoles = trimArray(payload.targetRoles, 5, 40);
  if (payload.targetTeams !== undefined) profile.targetTeams = trimArray(payload.targetTeams, 6, 80);
  if (payload.seoKeywords !== undefined) profile.seoKeywords = trimArray(payload.seoKeywords, 12, 40);

  await profile.save();
  return buildPromotionSnapshot(userId);
};

export const getPublicPromotionProfile = async (identifier: string) => {
  const byUserId = mongoose.Types.ObjectId.isValid(identifier)
    ? await PlayerPromotionProfile.findOne({ user: identifier }).lean()
    : null;
  const profile = byUserId || await PlayerPromotionProfile.findOne({ slug: identifier.toLowerCase() }).lean();

  if (!profile || !profile.enabled || profile.visibility === 'private') {
    return null;
  }

  const data = await buildPromotionSnapshot(String(profile.user));
  if (!data?.access?.hasAccess) {
    return null;
  }
  return buildPublicPromotionPayload(data.snapshot, profile);
};

export const getPublicPromotionLeaderboard = async (params: {
  limit?: number;
  game?: string;
  role?: string;
  visibility?: PromotionVisibility | 'all';
}) => {
  const limit = Math.max(1, Math.min(50, Number(params.limit || 10)));
  const visibilityFilter = params.visibility && params.visibility !== 'all'
    ? [params.visibility]
    : ['scouts', 'public'];

  const profiles = await PlayerPromotionProfile.find({
    enabled: true,
    visibility: { $in: visibilityFilter }
  })
    .sort({ lastLeaderboardScore: -1, updatedAt: -1 })
    .limit(limit * 3)
    .select('user slug visibility')
    .lean();

  const hydrated = await Promise.all(
    profiles.map(async (profile) => {
      try {
        const data = await getPublicPromotionProfile(profile.slug);
        return data ? { ...data, visibility: profile.visibility } : null;
      } catch {
        return null;
      }
    })
  );

  return hydrated
    .filter(Boolean)
    .filter((item: any) => !params.game || item.bestGame === params.game)
    .filter((item: any) => !params.role || item.bestRole === params.role)
    .sort((a: any, b: any) => b.leaderboardScore - a.leaderboardScore)
    .slice(0, limit)
    .map((item: any, index: number) => ({
      rank: index + 1,
      userId: item.userId,
      slug: item.slug,
      username: item.username,
      headline: item.headline,
      bestGame: item.bestGame,
      bestRole: item.bestRole,
      leaderboardScore: item.leaderboardScore,
      momentum: item.momentum,
      avatarUrl: item.avatarUrl,
      publicUrl: `/scouts/${item.slug}`
    }));
};

export const searchPublicPromotionProfiles = async (query: string, limit = 10) => {
  const rows = await getPublicPromotionLeaderboard({ limit: Math.max(limit, 20), visibility: 'all' });
  const normalized = query.trim().toLowerCase();
  if (!normalized) return rows.slice(0, limit);

  return rows
    .filter((row) => (
      row.username.toLowerCase().includes(normalized) ||
      row.bestGame.toLowerCase().includes(normalized) ||
      row.bestRole.toLowerCase().includes(normalized) ||
      row.headline.toLowerCase().includes(normalized)
    ))
    .slice(0, limit);
};

export const listPublicPromotionSitemapEntries = async () => {
  const rows = await PlayerPromotionProfile.find({
    enabled: true,
    visibility: 'public'
  })
    .sort({ updatedAt: -1 })
    .populate('user', 'role isSubscribed subscriptionExpiresAt')
    .select('slug updatedAt user')
    .lean();

  return rows
    .filter((row: any) => hasPlayerPromotionAccess(row?.user))
    .map((row: any) => ({
      slug: String(row?.slug || ''),
      updatedAt: row?.updatedAt ? new Date(row.updatedAt).toISOString() : new Date().toISOString()
    }));
};
