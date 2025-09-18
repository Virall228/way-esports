import { profileService } from '../services/profileService';

// Mock apiService
jest.mock('../services/api', () => ({
  __esModule: true,
  default: {
    getUserProfile: jest.fn(),
    updateProfile: jest.fn(),
    request: jest.fn(),
  },
}));

describe('ProfileService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getProfile', () => {
    it('should call getUserProfile from apiService', async () => {
      const mockResponse = { success: true, data: { username: 'test' } };
      const apiService = require('../services/api').default;
      apiService.getUserProfile.mockResolvedValue(mockResponse);

      const result = await profileService.getProfile();

      expect(apiService.getUserProfile).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockResponse);
    });
  });

  describe('updateProfile', () => {
    it('should call updateProfile from apiService', async () => {
      const mockData = { profileLogo: 'test.jpg' };
      const mockResponse = { success: true, data: mockData };
      const apiService = require('../services/api').default;
      apiService.updateProfile.mockResolvedValue(mockResponse);

      const result = await profileService.updateProfile(mockData);

      expect(apiService.updateProfile).toHaveBeenCalledWith(mockData);
      expect(result).toEqual(mockResponse);
    });
  });

  describe('uploadProfileLogo', () => {
    it('should call request with correct parameters', async () => {
      const logoUrl = 'data:image/jpeg;base64,test';
      const mockResponse = { success: true, data: { profileLogo: logoUrl } };
      const apiService = require('../services/api').default;
      apiService.request.mockResolvedValue(mockResponse);

      const result = await profileService.uploadProfileLogo(logoUrl);

      expect(apiService.request).toHaveBeenCalledWith('/api/profile/upload-logo', {
        method: 'POST',
        body: JSON.stringify({ logoUrl }),
      });
      expect(result).toEqual(mockResponse);
    });
  });

  describe('getAchievements', () => {
    it('should call request for achievements', async () => {
      const mockResponse = { success: true, data: ['achievement1', 'achievement2'] };
      const apiService = require('../services/api').default;
      apiService.request.mockResolvedValue(mockResponse);

      const result = await profileService.getAchievements();

      expect(apiService.request).toHaveBeenCalledWith('/api/profile/achievements');
      expect(result).toEqual(mockResponse);
    });
  });

  describe('addAchievement', () => {
    it('should call request to add achievement', async () => {
      const achievement = 'New Achievement';
      const mockResponse = { success: true, data: [achievement] };
      const apiService = require('../services/api').default;
      apiService.request.mockResolvedValue(mockResponse);

      const result = await profileService.addAchievement(achievement);

      expect(apiService.request).toHaveBeenCalledWith('/api/profile/achievements', {
        method: 'POST',
        body: JSON.stringify({ achievement }),
      });
      expect(result).toEqual(mockResponse);
    });
  });
}); 