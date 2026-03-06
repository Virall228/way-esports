import { api } from './api';
import { Tournament } from '../types';

type TournamentListFilters = {
  game?: string;
  cadence?: 'daily' | 'weekly' | 'all';
  teamMode?: '2v2' | '5v5' | 'all';
};

const list = async (filters: TournamentListFilters = {}): Promise<Tournament[]> => {
  const params = new URLSearchParams();
  if (filters.game && filters.game !== 'all') params.set('game', filters.game);
  if (filters.cadence && filters.cadence !== 'all') params.set('cadence', filters.cadence);
  if (filters.teamMode && filters.teamMode !== 'all') params.set('teamMode', filters.teamMode);
  const query = params.toString();
  return api.get(query ? `/api/tournaments?${query}` : '/api/tournaments');
};

const getById = async (id: string): Promise<Tournament> => {
  return api.get(`/api/tournaments/${id}`);
};

const getSchedule = async (id: string) => {
  return api.get(`/api/tournaments/${id}/schedule`);
};

const getLive = async (id: string) => {
  return api.get(`/api/tournaments/${id}/live`);
};

const getMatches = async (id: string) => {
  return api.get(`/api/matches?tournament=${id}`);
};

const join = async (tournamentId: string, teamId?: string | null): Promise<void> => {
  return api.post(`/api/tournaments/${tournamentId}/register`, { teamId });
};

const leave = async (tournamentId: string): Promise<void> => {
  return api.delete(`/api/tournaments/${tournamentId}/leave`);
};

export const tournamentService = {
  list,
  getById,
  getSchedule,
  getLive,
  getMatches,
  join,
  leave,
  getAllTournaments: list,
  getTournamentById: getById,
  joinTournament: join,
  leaveTournament: leave
};
