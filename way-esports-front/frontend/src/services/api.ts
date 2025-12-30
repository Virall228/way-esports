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

const requestJson = async <T = any>(endpoint: string, method: HttpMethod, data?: any): Promise<T> => {
  const token = getToken();
  const headers: Record<string, string> = { ...API_CONFIG.DEFAULT_HEADERS };
  if (token) headers.Authorization = `Bearer ${token}`;

  const response = await fetch(buildUrl(endpoint), {
    method,
    headers,
    body: data !== undefined ? JSON.stringify(data) : undefined
  });

  const contentType = response.headers.get('content-type') || '';
  const isJson = contentType.includes('application/json');
  const payload = isJson ? await response.json() : await response.text();

  if (!response.ok) {
    const message = typeof payload === 'string' ? payload : (payload as any)?.error || (payload as any)?.message || 'Request failed';
    throw new Error(message);
  }

  return payload as T;
};

export const api = {
  get: async (endpoint: string) => requestJson(endpoint, 'GET'),
  post: async (endpoint: string, data: any) => requestJson(endpoint, 'POST', data),
  put: async (endpoint: string, data: any) => requestJson(endpoint, 'PUT', data),
  delete: async (endpoint: string) => requestJson(endpoint, 'DELETE'),
  request: async (endpoint: string, data?: any, method?: string) => {
    const httpMethod = (method || (data ? 'POST' : 'GET')).toUpperCase() as HttpMethod;
    return requestJson(endpoint, httpMethod, data);
  }
};