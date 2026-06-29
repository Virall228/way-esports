import { api } from './api';

export type CareerHubAction = {
  id: string;
  title: string;
  description: string;
  ctaLabel: string;
  ctaRoute: string;
  priority: number;
  tag: string;
};

export type CareerHubMission = {
  id: string;
  title: string;
  description: string;
  current: number;
  target: number;
  completed: boolean;
  claimed: boolean;
  progressPercent: number;
  ctaLabel: string;
  ctaRoute: string;
  reward: {
    walletCredits: number;
    bonusEntries: number;
    achievementKey?: string;
  };
  rewardLabel: string;
};

export type CareerHubTournamentRecommendation = {
  id: string;
  name: string;
  game: string;
  type: string;
  prizePool: number;
  startDate: string;
  slotsLeft: number;
  fitScore: number;
  fitReason: string;
  route: string;
};

export type CareerHubMatch = {
  id: string;
  tournamentName: string;
  game: string;
  round: string;
  status: string;
  startTime: string;
  route: string;
  ourTeam: {
    name: string;
    tag: string;
  };
  opponent: {
    name: string;
    tag: string;
  };
};

export type CareerHubTeam = {
  id: string;
  name: string;
  tag: string;
  game: string;
  status: string;
  memberCount: number;
  pendingJoinRequests: number;
  isCaptain: boolean;
  winRate: number;
  totalMatches: number;
};

export type CareerHubDashboard = {
  meta: {
    generatedAt: string;
    weekKey: string;
    windowStart: string;
    windowEnd: string;
    claimableCount: number;
  };
  overview: {
    readinessScore: number;
    readinessLabel: string;
    nextTierLabel: string;
    progressToNextTier: number;
    activeMissions: number;
    completedMissions: number;
    totalMissions: number;
    walletBalance: number;
    entriesAvailable: number;
    unreadNotifications: number;
    currentStreak: number;
    currentTeams: number;
    activeTournaments: number;
    bestGame: string;
    primaryRole: string;
  };
  spotlight: {
    title: string;
    summary: string;
    ctaLabel: string;
    ctaRoute: string;
    tone: 'positive' | 'urgent' | 'focus';
  };
  nextActions: CareerHubAction[];
  weeklyMissions: CareerHubMission[];
  recommendations: {
    tournaments: CareerHubTournamentRecommendation[];
  };
  schedule: {
    upcomingMatches: CareerHubMatch[];
  };
  roster: {
    teams: CareerHubTeam[];
  };
  scout: {
    hasAccess: boolean;
    enabled: boolean;
    visibility: string;
    headline: string;
    publicUrl: string;
    leaderboardScore: number;
    bestGame: string;
    bestRole: string;
    ctaRoute: string;
  };
};

const unwrap = <T,>(response: any): T => (response?.data || response) as T;

export const careerHubService = {
  getDashboard: async (): Promise<CareerHubDashboard> => {
    const response = await api.get('/api/career-hub/me');
    return unwrap<CareerHubDashboard>(response);
  },

  refresh: async (): Promise<CareerHubDashboard> => {
    const response = await api.post('/api/career-hub/me/refresh', {});
    return unwrap<CareerHubDashboard>(response);
  },

  claimMission: async (missionId: string): Promise<CareerHubDashboard> => {
    const response = await api.post(`/api/career-hub/me/missions/${missionId}/claim`, {});
    return unwrap<CareerHubDashboard>(response);
  }
};
