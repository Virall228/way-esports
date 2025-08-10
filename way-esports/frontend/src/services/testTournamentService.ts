import ApiService from './api';

export const testTournamentService = {
  // Register for tournament
  async registerForTournament(tournamentId: string): Promise<any> {
    try {
      const response = await ApiService.request(`/api/tournaments/${tournamentId}/register`, {
        method: 'POST'
      });
      return response;
    } catch (error) {
      console.error('Error registering for tournament:', error);
      throw error;
    }
  },

  // Get user status
  async getUserStatus(): Promise<any> {
    try {
      const response = await ApiService.request('/api/test/user-status');
      return response.data;
    } catch (error) {
      console.error('Error getting user status:', error);
      throw error;
    }
  },

  // Toggle subscription for testing
  async toggleSubscription(): Promise<any> {
    try {
      const response = await ApiService.request('/api/test/toggle-subscription', {
        method: 'POST'
      });
      return response;
    } catch (error) {
      console.error('Error toggling subscription:', error);
      throw error;
    }
  }
};

export default testTournamentService;