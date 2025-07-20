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
    try {
      // Check cache first
      if (userId) {
        const cached = getCachedProfile(userId);
        if (cached) {
          console.log('Using cached profile data');
          return cached;
        }
      }

      const profile = await ApiService.getUserProfile();
      
      // Cache the result
      if (userId && profile) {
        setCachedProfile(userId, profile);
      }
      
      return profile;
    } catch (error) {
      console.error('Error fetching profile:', error);
      throw error;
    }
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
    try {
      return await ApiService.getUserAchievements();
    } catch (error) {
      console.error('Error fetching achievements:', error);
      throw error;
    }
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