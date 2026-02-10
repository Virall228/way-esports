import { api } from './api';
import { Tournament } from '../types';

const list = async (): Promise<Tournament[]> => {
  return api.get('/api/tournaments');
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
