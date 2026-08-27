import { api, type ApiRequestOptions } from './api';

export interface CreateTeamPayload {
  name: string;
  tag: string;
  game: string;
  tournamentId?: string | null;
  description?: string;
  logo?: string;
  isPrivate?: boolean;
  requiresApproval?: boolean;
}

export interface JoinTeamPayload {
  teamId: string;
  tournamentId?: string | null;
}

export interface TeamJoinRequest {
  id: string;
  requestedAt: string;
  user: {
    id: string;
    username?: string;
    firstName?: string;
    lastName?: string;
    profileLogo?: string;
    telegramId?: string | number;
  };
}

export const teamsService = {
  list: async (options?: boolean | ApiRequestOptions) => api.get('/api/teams', options),
  getById: async (id: string, options?: boolean | ApiRequestOptions) => api.get(`/api/teams/${id}`, options),
  create: async (payload: CreateTeamPayload) => api.post('/api/teams/create', payload),
  join: async (payload: JoinTeamPayload) => api.post('/api/teams/join', payload),
  update: async (id: string, payload: Partial<CreateTeamPayload>) => api.put(`/api/teams/${id}`, payload),
  updateLogo: async (id: string, logoUrl: string) => api.post(`/api/teams/${id}/logo`, { logoUrl }),
  remove: async (id: string) => api.delete(`/api/teams/${id}`),
  getJoinRequests: async (teamId: string, options?: boolean | ApiRequestOptions) => api.get(`/api/teams/${teamId}/join-requests`, options),
  approveJoinRequest: async (teamId: string, userId: string) => api.post(`/api/teams/${teamId}/join-requests/${userId}/approve`, {}),
  rejectJoinRequest: async (teamId: string, userId: string) => api.post(`/api/teams/${teamId}/join-requests/${userId}/reject`, {})
};
