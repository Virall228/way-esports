// API Configuration
export const API_CONFIG = {
  // Базовый URL API
  BASE_URL: getApiUrl(),
  
  // Таймауты
  TIMEOUT: 10000,
  
  // Заголовки по умолчанию
  DEFAULT_HEADERS: {
    'Content-Type': 'application/json',
  },
  
  // Endpoints
  ENDPOINTS: {
    AUTH: {
      LOGIN: '/api/auth/login',
      LOGOUT: '/api/auth/logout',
      REFRESH: '/api/auth/refresh',
    },
    PROFILE: {
      GET: '/api/profile',
      UPDATE: '/api/profile',
      UPLOAD_LOGO: '/api/profile/upload-logo',
      ACHIEVEMENTS: '/api/profile/achievements',
      NOTIFICATIONS: '/api/profile/notifications',
      GAME_PROFILES: '/api/profile/game-profiles',
    },
    TOURNAMENTS: {
      LIST: '/api/tournaments',
      GET: (id: string) => `/api/tournaments/${id}`,
      JOIN: (id: string) => `/api/tournaments/${id}/join`,
      CREATE: '/api/tournaments',
      UPDATE: (id: string) => `/api/tournaments/${id}`,
      DELETE: (id: string) => `/api/tournaments/${id}`,
    },
    TEAMS: {
      LIST: '/api/teams',
      GET: (id: string) => `/api/teams/${id}`,
      CREATE: '/api/teams',
      UPDATE: (id: string) => `/api/teams/${id}`,
      DELETE: (id: string) => `/api/teams/${id}`,
    },
    WALLET: {
      BALANCE: '/api/wallet/balance',
      WITHDRAW: '/api/wallet/withdraw',
      TRANSACTIONS: '/api/wallet/transactions',
    },
    REWARDS: {
      LIST: '/api/rewards',
      CLAIM: (id: string) => `/api/rewards/${id}/claim`,
    },
  },
};

// Функция для получения URL API
function getApiUrl(): string {
  const normalize = (rawUrl: string): string => {
    const trimmed = rawUrl.trim();
    if (!trimmed) return '';
    const noTrailingSlash = trimmed.replace(/\/+$/, '');
    return noTrailingSlash.replace(/\/api$/i, '');
  };

  // Проверяем различные способы получения переменных окружения
  if (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_URL) {
    return normalize(import.meta.env.VITE_API_URL);
  }
  
  if (typeof process !== 'undefined' && process.env?.REACT_APP_API_URL) {
    return normalize(process.env.REACT_APP_API_URL);
  }
  
  if (typeof window !== 'undefined' && (window as any).__API_URL__) {
    return normalize((window as any).__API_URL__);
  }
  
  return '';
}

// Функция для проверки доступности API
export async function checkApiHealth(): Promise<boolean> {
  try {
    const response = await fetch(`${API_CONFIG.BASE_URL}/api/health`, {
      method: 'GET',
      headers: API_CONFIG.DEFAULT_HEADERS,
    });
    return response.ok;
  } catch (error) {
    console.warn('API health check failed:', error);
    return false;
  }
}

// Функция для получения полного URL
export function getFullUrl(endpoint: string): string {
  return `${API_CONFIG.BASE_URL}${endpoint}`;
} 