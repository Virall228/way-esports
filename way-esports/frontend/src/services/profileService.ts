import ApiService from './api';

// Cache for profile data
const profileCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

const isCacheValid = (timestamp: number): boolean => {
  return Date.now() - timestamp < CACHE_TTL;
};

const getCachedProfile = (userId: string): any => {
  const cached = profileCache.get(userId);
  if (cached && isCacheValid(cached.timestamp)) {
    return cached.data;
  }
  return null;
};

const setCachedProfile = (userId: string, data: any): void => {
  profileCache.set(userId, {
    data,
    timestamp: Date.now()
  });
};

export const profileService = {
  // Get user profile with caching
  async getProfile(userId?: string): Promise<any> {
    // Return mock profile data for demo
    console.log('Returning mock profile data (demo mode)');
    return {
      id: '1',
      username: 'player123',
      email: 'player@example.com',
      avatar: null,
      level: 15,
      experience: 2450,
      rank: 'Gold',
      gamesPlayed: 127,
      wins: 89,
      losses: 38,
      winRate: 70.1,
      favoriteGame: 'Critical Ops',
      joinDate: '2023-01-15',
      lastActive: new Date().toISOString(),
      achievements: [],
      stats: {
        kills: 1250,
        deaths: 890,
        assists: 340,
        kdr: 1.4
      }
    };
  },

  // Update user profile
  async updateProfile(profileData: any): Promise<any> {
    try {
      const updatedProfile = await ApiService.updateUserProfile(profileData);
      
      // Clear cache for this user
      if (updatedProfile.id) {
        profileCache.delete(updatedProfile.id);
      }
      
      return updatedProfile;
    } catch (error) {
      console.error('Error updating profile:', error);
      throw error;
    }
  },

  // Get user achievements
  async getAchievements(): Promise<any[]> {
    // Return mock achievements for demo
    console.log('Returning mock achievements data (demo mode)');
    return [
      {
        id: '1',
        name: 'First Victory',
        description: 'Win your first match',
        icon: '🏆',
        unlockedAt: '2023-01-20',
        rarity: 'common'
      },
      {
        id: '2',
        name: 'Sharpshooter',
        description: 'Get 10 headshots in a single match',
        icon: '🎯',
        unlockedAt: '2023-02-15',
        rarity: 'rare'
      }
    ];
  },

  // Update user stats
  async updateStats(stats: any): Promise<any> {
    try {
      return await ApiService.updateUserProfile({ stats });
    } catch (error) {
      console.error('Error updating stats:', error);
      throw error;
    }
  },

  // Get user match history
  async getMatchHistory(filters?: any): Promise<any[]> {
    try {
      return await ApiService.request(`/api/profile/matches${filters ? `?${new URLSearchParams(filters).toString()}` : ''}`);
    } catch (error) {
      console.error('Error fetching match history:', error);
      throw error;
    }
  },

  // Get user team info
  async getTeamInfo(): Promise<any> {
    try {
      return await ApiService.request('/api/profile/team');
    } catch (error) {
      console.error('Error fetching team info:', error);
      throw error;
    }
  },

  // Clear profile cache
  clearCache(): void {
    profileCache.clear();
  },

  // Clear cache for specific user
  clearUserCache(userId: string): void {
    profileCache.delete(userId);
  }
};

export default profileService; 