import { api } from './api';
import { User } from '../types';

export const profileService = {
  getProfile: async (): Promise<User> => {
    return api.get('/api/profile');
  },
  
  updateProfile: async (data: Partial<User>): Promise<User> => {
    return api.patch('/api/profile', data);
  },
  
  getStats: async (): Promise<any> => {
    return api.get('/api/profile/stats');
  },
  
  addAchievement: async (achievementName: string): Promise<void> => {
    return api.post('/api/profile/achievements', { name: achievementName });
  },
};
