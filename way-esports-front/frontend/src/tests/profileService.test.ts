import { profileService } from '../services/profileService';

const apiMock = {
  get: jest.fn(),
  patch: jest.fn(),
  post: jest.fn()
};

jest.mock('../services/api', () => ({
  api: apiMock
}));

describe('ProfileService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('getProfile calls /api/profile', async () => {
    const mockResponse = { success: true };
    apiMock.get.mockResolvedValue(mockResponse);

    const result = await profileService.getProfile();

    expect(apiMock.get).toHaveBeenCalledWith('/api/profile');
    expect(result).toBe(mockResponse);
  });

  it('updateProfile uses PATCH /api/profile', async () => {
    const payload = { bio: 'hello' };
    const mockResponse = { success: true, data: payload };
    apiMock.patch.mockResolvedValue(mockResponse);

    const result = await profileService.updateProfile(payload);

    expect(apiMock.patch).toHaveBeenCalledWith('/api/profile', payload);
    expect(result).toBe(mockResponse);
  });

  it('getStats calls /api/profile/stats', async () => {
    const mockResponse = { success: true };
    apiMock.get.mockResolvedValue(mockResponse);

    const result = await profileService.getStats();

    expect(apiMock.get).toHaveBeenCalledWith('/api/profile/stats');
    expect(result).toBe(mockResponse);
  });

  it('addAchievement posts to /api/profile/achievements', async () => {
    const achievementName = 'Winner';
    const mockResponse = { success: true };
    apiMock.post.mockResolvedValue(mockResponse);

    const result = await profileService.addAchievement(achievementName);

    expect(apiMock.post).toHaveBeenCalledWith('/api/profile/achievements', { name: achievementName });
    expect(result).toBe(mockResponse);
  });
});
