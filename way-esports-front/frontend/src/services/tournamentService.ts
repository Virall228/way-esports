import { api } from './api';
import { Tournament } from '../types';

export const tournamentService = {
  getAllTournaments: async (): Promise<Tournament[]> => {
    return api.get('/tournaments');
  },
  
  getTournamentById: async (id: string): Promise<Tournament> => {
    return api.get(`/tournaments/${id}`);
  },
  
  joinTournament: async (tournamentId: string): Promise<void> => {
    return api.post(`/tournaments/${tournamentId}/join`, {});
  },
  
  leaveTournament: async (tournamentId: string): Promise<void> => {
    return api.delete(`/tournaments/${tournamentId}/leave`);
  },
};