import { api } from './api';

export type PromotionVisibility = 'private' | 'scouts' | 'public';
export type PromotionFocus = 'balanced' | 'ranked' | 'tournament' | 'trial';

export type PlayerPromotionDashboard = {
  access: {
    hasAccess: boolean;
    canPublish: boolean;
    reason: string;
  };
  settings: {
    slug: string;
    enabled: boolean;
    visibility: PromotionVisibility;
    headline: string;
    scoutPitch: string;
    targetGames: string[];
    targetRoles: string[];
    targetTeams: string[];
    focus: PromotionFocus;
  };
  snapshot: any;
};

export const playerPromotionService = {
  getDashboard: async (): Promise<PlayerPromotionDashboard> => {
    const response: any = await api.get('/api/player-promotion/me');
    return response?.data || response;
  },

  updateSettings: async (payload: Record<string, unknown>): Promise<PlayerPromotionDashboard> => {
    const response: any = await api.patch('/api/player-promotion/me', payload);
    return response?.data || response;
  },

  refresh: async (): Promise<PlayerPromotionDashboard> => {
    const response: any = await api.post('/api/player-promotion/me/refresh', {});
    return response?.data || response;
  },

  getPublicLeaderboard: async (params?: { limit?: number; game?: string; role?: string }) => {
    const query = new URLSearchParams();
    if (params?.limit) query.set('limit', String(params.limit));
    if (params?.game) query.set('game', params.game);
    if (params?.role) query.set('role', params.role);
    const suffix = query.toString() ? `?${query.toString()}` : '';
    const response: any = await api.get(`/api/player-promotion/public/leaderboard${suffix}`);
    return response?.data || response || [];
  },

  searchPublicPlayers: async (q: string, limit = 8) => {
    const query = new URLSearchParams();
    query.set('q', q);
    query.set('limit', String(limit));
    const response: any = await api.get(`/api/player-promotion/public/search?${query.toString()}`);
    return response?.data || response || [];
  },

  getPublicProfile: async (identifier: string) => {
    const response: any = await api.get(`/api/player-promotion/public/players/${identifier}`);
    return response?.data || response;
  }
};
