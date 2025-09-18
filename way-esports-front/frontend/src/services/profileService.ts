import { api } from './api';
import { User } from '../types';

export const profileService = {
  getProfile: async (): Promise<User> => {
    return api.get('/profile');
  },
  
  updateProfile: async (data: Partial<User>): Promise<User> => {
    return api.put('/profile', data);
  },
  
  getStats: async (): Promise<any> => {
    return api.get('/profile/stats');
  },
  
  addAchievement: async (achievementName: string): Promise<void> => {
    return api.post('/profile/achievements', { name: achievementName });
  },
};