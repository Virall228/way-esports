import { API_CONFIG, getFullUrl } from '../config/api';

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

const getToken = (): string | null => {
  try {
    return localStorage.getItem('auth_token');
  } catch {
    return null;
  }
};

const buildUrl = (endpoint: string): string => {
  if (/^https?:\/\//i.test(endpoint)) return endpoint;
  return getFullUrl(endpoint);
};

const requestJson = async <T = any>(endpoint: string, method: HttpMethod, data?: any, includeTelegramData = false): Promise<T> => {
  const token = getToken();
  const headers: Record<string, string> = { ...API_CONFIG.DEFAULT_HEADERS };
  if (token) headers.Authorization = `Bearer ${token}`;

  // Add Telegram initData if available and requested
  if (includeTelegramData && typeof window !== 'undefined' && window.Telegram?.WebApp) {
    const initData = window.Telegram.WebApp.initData;
    if (initData) {
      headers['X-Telegram-Data'] = initData;
    }
  }

  const response = await fetch(buildUrl(endpoint), {
    method,
    headers,
    body: data !== undefined ? JSON.stringify(data) : undefined
  });

  const contentType = response.headers.get('content-type') || '';
  const isJson = contentType.includes('application/json');
  const payload = isJson ? await response.json() : await response.text();

  if (!response.ok) {
    const message =
      typeof payload === 'string'
        ? payload
        : (payload as any)?.error || (payload as any)?.message || 'Request failed';

    const details = typeof payload === 'string' ? payload : JSON.stringify(payload);
    throw new Error(`[${response.status}] ${message}${details ? ` | ${details}` : ''}`);
  }

  return payload as T;
};

export const api = {
  get: async (endpoint: string, includeTelegramData = false) => requestJson(endpoint, 'GET', undefined, includeTelegramData),
  post: async (endpoint: string, data: any, includeTelegramData = false) => requestJson(endpoint, 'POST', data, includeTelegramData),
  put: async (endpoint: string, data: any, includeTelegramData = false) => requestJson(endpoint, 'PUT', data, includeTelegramData),
  delete: async (endpoint: string, includeTelegramData = false) => requestJson(endpoint, 'DELETE', undefined, includeTelegramData),
  request: async (endpoint: string, data?: any, method?: string, includeTelegramData = false) => {
    const httpMethod = (method || (data ? 'POST' : 'GET')).toUpperCase() as HttpMethod;
    return requestJson(endpoint, httpMethod, data, includeTelegramData);
  }
};