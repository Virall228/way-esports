import { api } from './api';
import { Tournament } from '../types';

export const tournamentService = {
  getAllTournaments: async (): Promise<Tournament[]> => {
    return api.get('/api/tournaments');
  },
  
  getTournamentById: async (id: string): Promise<Tournament> => {
    return api.get(`/api/tournaments/${id}`);
  },
  
  joinTournament: async (tournamentId: string): Promise<void> => {
    return api.post(`/api/tournaments/${tournamentId}/join`, {});
  },
  
  leaveTournament: async (tournamentId: string): Promise<void> => {
    return api.delete(`/api/tournaments/${tournamentId}/leave`);
  },
};