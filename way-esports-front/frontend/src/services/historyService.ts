import { api } from './api';

export type TournamentHistoryItem = {
  tournamentId: string;
  tournamentName: string;
  game: string;
  status: string;
  startDate?: string | null;
  endDate?: string | null;
  image?: string | null;
  matches: number;
  wins: number;
  losses: number;
  winRate: number;
  lastMatchAt?: string | null;
};

export type TournamentHistorySummary = {
  tournaments: number;
  matches: number;
  wins: number;
  losses: number;
  winRate: number;
};

export type TournamentHistoryResponse = {
  summary: TournamentHistorySummary;
  items: TournamentHistoryItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

export type DetailedMatchHistoryItem = {
  matchId: string;
  tournamentId: string;
  tournamentName: string;
  game: string;
  result: 'win' | 'loss';
  score: string;
  myScore: number;
  opponentScore: number;
  opponentTeam: {
    id: string;
    name: string;
    tag?: string;
  };
  round?: string;
  map?: string;
  playedAt?: string | null;
};

export type DetailedMatchHistoryResponse = {
  items: DetailedMatchHistoryItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

const normalize = (payload: any): TournamentHistoryResponse => {
  const data = payload?.data || payload || {};
  return {
    summary: {
      tournaments: Number(data?.summary?.tournaments || 0),
      matches: Number(data?.summary?.matches || 0),
      wins: Number(data?.summary?.wins || 0),
      losses: Number(data?.summary?.losses || 0),
      winRate: Number(data?.summary?.winRate || 0)
    },
    items: Array.isArray(data?.items) ? data.items : [],
    pagination: {
      page: Number(data?.pagination?.page || 1),
      limit: Number(data?.pagination?.limit || 20),
      total: Number(data?.pagination?.total || 0),
      totalPages: Number(data?.pagination?.totalPages || 0)
    }
  };
};

type HistoryQueryParams = {
  page?: number;
  limit?: number;
  game?: string;
  status?: string;
  from?: string;
  to?: string;
  sort?: 'recent' | 'oldest';
};

const toPagination = (data: any) => ({
  page: Number(data?.pagination?.page || 1),
  limit: Number(data?.pagination?.limit || 20),
  total: Number(data?.pagination?.total || 0),
  totalPages: Number(data?.pagination?.totalPages || 0)
});

const buildHistoryQuery = (params?: HistoryQueryParams) => {
  const search = new URLSearchParams();
  if (params?.page) search.set('page', String(params.page));
  if (params?.limit) search.set('limit', String(params.limit));
  if (params?.game) search.set('game', params.game);
  if (params?.status) search.set('status', params.status);
  if (params?.from) search.set('from', params.from);
  if (params?.to) search.set('to', params.to);
  if (params?.sort) search.set('sort', params.sort);
  const query = search.toString();
  return query ? `?${query}` : '';
};

const fetchHistory = async (path: string, params?: HistoryQueryParams) => {
  const response: any = await api.get(`${path}${buildHistoryQuery(params)}`);
  return response?.data || response || {};
};

export const historyService = {
  async getPlayerHistory(
    userId: string,
    page = 1,
    limit = 20,
    params?: { game?: string; status?: string; from?: string; to?: string; sort?: 'recent' | 'oldest' }
  ) {
    const payload = await fetchHistory(`/api/history/player/${userId}`, { ...params, page, limit });
    return normalize(payload);
  },

  async getTeamHistory(
    teamId: string,
    page = 1,
    limit = 20,
    params?: { game?: string; status?: string; from?: string; to?: string; sort?: 'recent' | 'oldest' }
  ) {
    const payload = await fetchHistory(`/api/history/team/${teamId}`, { ...params, page, limit });
    return normalize(payload);
  },

  async getPlayerMatches(
    userId: string,
    params?: { page?: number; limit?: number; game?: string; from?: string; to?: string; sort?: 'recent' | 'oldest' }
  ): Promise<DetailedMatchHistoryResponse> {
    const data = await fetchHistory(`/api/history/player/${userId}/matches`, params);
    return {
      items: Array.isArray(data?.items) ? data.items : [],
      pagination: toPagination(data)
    };
  },

  async getTeamMatches(
    teamId: string,
    params?: { page?: number; limit?: number; game?: string; from?: string; to?: string; sort?: 'recent' | 'oldest' }
  ): Promise<DetailedMatchHistoryResponse> {
    const data = await fetchHistory(`/api/history/team/${teamId}/matches`, params);
    return {
      items: Array.isArray(data?.items) ? data.items : [],
      pagination: toPagination(data)
    };
  },

  playerExportCsvUrl(userId: string) {
    return `/api/history/player/${userId}/export.csv`;
  },

  teamExportCsvUrl(teamId: string) {
    return `/api/history/team/${teamId}/export.csv`;
  },

  async exportPlayerHistoryCsv(userId: string): Promise<Blob> {
    const token = localStorage.getItem('authToken');
    const response = await fetch(this.playerExportCsvUrl(userId), {
      headers: token ? { Authorization: `Bearer ${token}` } : undefined
    });
    if (!response.ok) {
      const text = await response.text();
      throw new Error(text || 'Failed to export history');
    }
    return response.blob();
  },

  async exportTeamHistoryCsv(teamId: string): Promise<Blob> {
    const token = localStorage.getItem('authToken');
    const response = await fetch(this.teamExportCsvUrl(teamId), {
      headers: token ? { Authorization: `Bearer ${token}` } : undefined
    });
    if (!response.ok) {
      const text = await response.text();
      throw new Error(text || 'Failed to export history');
    }
    return response.blob();
  }
};
