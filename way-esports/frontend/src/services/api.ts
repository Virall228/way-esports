import { API_CONFIG, getFullUrl } from '../config/api';

class ApiService {
  private baseURL: string;
  private timeout: number = 10000; // 10 seconds timeout
  private cache = new Map<string, { data: any; timestamp: number; ttl: number }>();

  constructor() {
    this.baseURL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
    console.log('API Service initialized with base URL:', this.baseURL);
  }

  private getCacheKey(endpoint: string, options?: RequestInit): string {
    const method = options?.method || 'GET';
    const body = options?.body ? JSON.stringify(options.body) : '';
    return `${method}:${endpoint}:${body}`;
  }

  private isCacheValid(key: string): boolean {
    const cached = this.cache.get(key);
    if (!cached) return false;
    
    const now = Date.now();
    return now - cached.timestamp < cached.ttl;
  }

  private getCachedData(key: string): any {
    const cached = this.cache.get(key);
    return cached ? cached.data : null;
  }

  private setCache(key: string, data: any, ttl: number = 300000): void { // 5 minutes default
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });
  }

  private clearExpiredCache(): void {
    const now = Date.now();
    for (const [key, value] of this.cache.entries()) {
      if (now - value.timestamp > value.ttl) {
        this.cache.delete(key);
      }
    }
  }

  async request(endpoint: string, options: RequestInit = {}): Promise<any> {
    const url = `${this.baseURL}${endpoint}`;
    const method = options.method || 'GET';
    const cacheKey = this.getCacheKey(endpoint, options);
    
    // Clear expired cache entries
    this.clearExpiredCache();
    
    // Check cache for GET requests
    if (method === 'GET' && this.isCacheValid(cacheKey)) {
      console.log('Using cached data for:', endpoint);
      return this.getCachedData(cacheKey);
    }
    
    const defaultOptions: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      credentials: 'include', // Include cookies for authentication
    };

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      const response = await fetch(url, {
        ...defaultOptions,
        ...options,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        
        if (response.status === 401) {
          // Handle unauthorized - redirect to login
          window.location.href = '/login';
          throw new Error('Unauthorized');
        }
        if (response.status === 403 && errorData.requiresSubscription) {
          // Handle subscription required error
          const error = new Error(errorData.message || 'Subscription required');
          (error as any).requiresSubscription = true;
          (error as any).redirectTo = errorData.redirectTo;
          throw error;
        }
        if (response.status === 404) {
          throw new Error('Resource not found');
        }
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      // Cache successful GET requests
      if (method === 'GET') {
        this.setCache(cacheKey, data);
      }
      
      return data;
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  // Auth methods
  async login(initData: string): Promise<any> {
    return this.request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ initData }),
    });
  }

  async logout(): Promise<any> {
    return this.request('/api/auth/logout', {
      method: 'POST',
    });
  }

  async refreshToken(): Promise<any> {
    return this.request('/api/auth/refresh', {
      method: 'POST',
    });
  }

  // Profile methods
  async getUserProfile(): Promise<any> {
    return this.request('/api/profile');
  }

  async updateUserProfile(data: any): Promise<any> {
    return this.request('/api/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async getUserAchievements(): Promise<any> {
    return this.request('/api/profile/achievements');
  }

  // Tournament methods
  async getTournaments(filters?: any): Promise<any> {
    const queryParams = filters ? `?${new URLSearchParams(filters).toString()}` : '';
    return this.request(`/api/tournaments${queryParams}`);
  }

  async getTournament(id: string): Promise<any> {
    return this.request(`/api/tournaments/${id}`);
  }

  async joinTournament(tournamentId: string): Promise<any> {
    return this.request(`/api/tournaments/${tournamentId}/join`, {
      method: 'POST',
    });
  }

  async leaveTournament(tournamentId: string): Promise<any> {
    return this.request(`/api/tournaments/${tournamentId}/leave`, {
      method: 'POST',
    });
  }

  // Team methods
  async getTeams(): Promise<any> {
    return this.request('/api/teams');
  }

  async getTeam(id: string): Promise<any> {
    return this.request(`/api/teams/${id}`);
  }

  async createTeam(teamData: any): Promise<any> {
    return this.request('/api/teams', {
      method: 'POST',
      body: JSON.stringify(teamData),
    });
  }

  async joinTeam(teamId: string): Promise<any> {
    return this.request(`/api/teams/${teamId}/join`, {
      method: 'POST',
    });
  }

  async leaveTeam(teamId: string): Promise<any> {
    return this.request(`/api/teams/${teamId}/leave`, {
      method: 'POST',
    });
  }

  // Wallet methods
  async getWalletBalance(): Promise<any> {
    return this.request('/api/wallet/balance');
  }

  async getTransactions(): Promise<any> {
    return this.request('/api/wallet/transactions');
  }

  async withdraw(amount: number): Promise<any> {
    return this.request('/api/wallet/withdraw', {
      method: 'POST',
      body: JSON.stringify({ amount }),
    });
  }

  // News methods
  async getNews(): Promise<any> {
    return this.request('/api/news');
  }

  async getNewsArticle(id: string): Promise<any> {
    return this.request(`/api/news/${id}`);
  }

  // Search methods
  async search(query: string, filters?: any): Promise<any> {
    const params = new URLSearchParams({ q: query, ...filters });
    return this.request(`/api/search?${params.toString()}`);
  }

  // Rankings methods
  async getRankings(type: 'teams' | 'players' = 'players'): Promise<any> {
    return this.request(`/api/rankings/${type}`);
  }

  // Admin methods
  async getAdminStats(): Promise<any> {
    return this.request('/api/admin/stats');
  }

  async getAdminUsers(): Promise<any> {
    return this.request('/api/admin/users');
  }

  async updateUserRole(userId: string, role: string): Promise<any> {
    return this.request(`/api/admin/users/${userId}/role`, {
      method: 'PUT',
      body: JSON.stringify({ role }),
    });
  }

  // Cache management
  clearCache(): void {
    this.cache.clear();
  }

  clearCacheForEndpoint(endpoint: string): void {
    for (const key of this.cache.keys()) {
      if (key.includes(endpoint)) {
        this.cache.delete(key);
      }
    }
  }
}

export default new ApiService(); 