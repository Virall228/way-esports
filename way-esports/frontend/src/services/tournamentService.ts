import ApiService from './api';

// Cache for tournament data
const tournamentCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 2 * 60 * 1000; // 2 minutes for tournaments

const isCacheValid = (timestamp: number): boolean => {
  return Date.now() - timestamp < CACHE_TTL;
};

const getCachedTournaments = (key: string): any => {
  const cached = tournamentCache.get(key);
  if (cached && isCacheValid(cached.timestamp)) {
    return cached.data;
  }
  return null;
};

const setCachedTournaments = (key: string, data: any): void => {
  tournamentCache.set(key, {
    data,
    timestamp: Date.now()
  });
};

export const tournamentService = {
  // Get all tournaments with filters and caching
  async getTournaments(filters?: any): Promise<any[]> {
    try {
      const cacheKey = `tournaments:${JSON.stringify(filters || {})}`;
      
      // Check cache first
      const cached = getCachedTournaments(cacheKey);
      if (cached) {
        console.log('Using cached tournaments data');
        return cached;
      }

      const tournaments = await ApiService.getTournaments(filters);
      
      // Cache the result
      setCachedTournaments(cacheKey, tournaments);
      
      return tournaments;
    } catch (error) {
      console.error('Error fetching tournaments:', error);
      throw error;
    }
  },

  // Get specific tournament
  async getTournament(id: string): Promise<any> {
    try {
      const cacheKey = `tournament:${id}`;
      
      // Check cache first
      const cached = getCachedTournaments(cacheKey);
      if (cached) {
        return cached;
      }

      const tournament = await ApiService.getTournament(id);
      
      // Cache the result
      setCachedTournaments(cacheKey, tournament);
      
      return tournament;
    } catch (error) {
      console.error('Error fetching tournament:', error);
      throw error;
    }
  },

  // Register as solo player
  async registerAsPlayer(tournamentId: string): Promise<any> {
    try {
      const result = await ApiService.request(`/api/tournaments/${tournamentId}/register-player`, {
        method: 'POST',
      });
      
      // Clear related cache
      this.clearTournamentCache(tournamentId);
      this.clearTournamentsCache();
      
      return result;
    } catch (error) {
      console.error('Error registering as player:', error);
      throw error;
    }
  },

  // Register team
  async registerTeam(tournamentId: string, teamId: string): Promise<any> {
    try {
      const result = await ApiService.request(`/api/tournaments/${tournamentId}/register-team`, {
        method: 'POST',
        body: JSON.stringify({ teamId }),
      });
      
      // Clear related cache
      this.clearTournamentCache(tournamentId);
      this.clearTournamentsCache();
      
      return result;
    } catch (error) {
      console.error('Error registering team:', error);
      throw error;
    }
  },

  // Get registration status
  async getRegistrationStatus(tournamentId: string): Promise<any> {
    try {
      return await ApiService.request(`/api/tournaments/${tournamentId}/registration-status`);
    } catch (error) {
      console.error('Error getting registration status:', error);
      throw error;
    }
  },

  // Unregister from tournament
  async unregister(tournamentId: string): Promise<any> {
    try {
      const result = await ApiService.request(`/api/tournaments/${tournamentId}/unregister`, {
        method: 'DELETE',
      });
      
      // Clear related cache
      this.clearTournamentCache(tournamentId);
      this.clearTournamentsCache();
      
      return result;
    } catch (error) {
      console.error('Error unregistering from tournament:', error);
      throw error;
    }
  },

  // Legacy methods for backward compatibility
  async joinTournament(tournamentId: string): Promise<any> {
    return this.registerAsPlayer(tournamentId);
  },

  async leaveTournament(tournamentId: string): Promise<any> {
    return this.unregister(tournamentId);
  },

  // Get tournament brackets
  async getTournamentBrackets(tournamentId: string): Promise<any> {
    try {
      return await ApiService.request(`/api/tournaments/${tournamentId}/brackets`);
    } catch (error) {
      console.error('Error fetching tournament brackets:', error);
      throw error;
    }
  },

  // Get tournament participants
  async getTournamentParticipants(tournamentId: string): Promise<any[]> {
    try {
      return await ApiService.request(`/api/tournaments/${tournamentId}/participants`);
    } catch (error) {
      console.error('Error fetching tournament participants:', error);
      throw error;
    }
  },

  // Get user's tournaments
  async getUserTournaments(): Promise<any[]> {
    try {
      return await ApiService.request('/api/tournaments/my');
    } catch (error) {
      console.error('Error fetching user tournaments:', error);
      throw error;
    }
  },

  // Create tournament (admin only)
  async createTournament(tournamentData: any): Promise<any> {
    try {
      const result = await ApiService.request('/api/tournaments', {
        method: 'POST',
        body: JSON.stringify(tournamentData),
      });
      
      // Clear tournaments cache
      this.clearTournamentsCache();
      
      return result;
    } catch (error) {
      console.error('Error creating tournament:', error);
      throw error;
    }
  },

  // Update tournament (admin only)
  async updateTournament(tournamentId: string, tournamentData: any): Promise<any> {
    try {
      const result = await ApiService.request(`/api/tournaments/${tournamentId}`, {
        method: 'PUT',
        body: JSON.stringify(tournamentData),
      });
      
      // Clear related cache
      this.clearTournamentCache(tournamentId);
      this.clearTournamentsCache();
      
      return result;
    } catch (error) {
      console.error('Error updating tournament:', error);
      throw error;
    }
  },

  // Delete tournament (admin only)
  async deleteTournament(tournamentId: string): Promise<any> {
    try {
      const result = await ApiService.request(`/api/tournaments/${tournamentId}`, {
        method: 'DELETE',
      });
      
      // Clear related cache
      this.clearTournamentCache(tournamentId);
      this.clearTournamentsCache();
      
      return result;
    } catch (error) {
      console.error('Error deleting tournament:', error);
      throw error;
    }
  },

  // Cache management
  clearTournamentsCache(): void {
    for (const [key] of tournamentCache.entries()) {
      if (key.startsWith('tournaments:')) {
        tournamentCache.delete(key);
      }
    }
  },

  clearTournamentCache(tournamentId: string): void {
    tournamentCache.delete(`tournament:${tournamentId}`);
  },

  clearAllCache(): void {
    tournamentCache.clear();
  }
};

export default tournamentService; 