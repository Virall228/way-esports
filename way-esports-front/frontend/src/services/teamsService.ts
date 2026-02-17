import { api } from './api';

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

export const teamsService = {
  list: async () => api.get('/api/teams'),
  getById: async (id: string) => api.get(`/api/teams/${id}`),
  create: async (payload: CreateTeamPayload) => api.post('/api/teams/create', payload),
  join: async (payload: JoinTeamPayload) => api.post('/api/teams/join', payload),
  update: async (id: string, payload: Partial<CreateTeamPayload>) => api.put(`/api/teams/${id}`, payload),
  updateLogo: async (id: string, logoUrl: string) => api.post(`/api/teams/${id}/logo`, { logoUrl })
};
