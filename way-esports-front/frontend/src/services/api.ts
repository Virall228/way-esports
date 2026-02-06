import { API_CONFIG, getFullUrl } from '../config/api';

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export class ApiError extends Error {
  status: number;
  payload: any;

  constructor(status: number, message: string, payload?: any) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.payload = payload;
  }
}

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

let notifyHandler: ((type: 'success' | 'error', title: string, message: string) => void) | null = null;

const requestJson = async <T = any>(endpoint: string, method: HttpMethod, data?: any, includeTelegramData = false): Promise<T> => {
  const token = getToken();
  const headers: Record<string, string> = { ...API_CONFIG.DEFAULT_HEADERS };
  if (token) headers.Authorization = `Bearer ${token}`;

  // Add Telegram initData if available and requested
  if (includeTelegramData && typeof window !== 'undefined' && (window as any).Telegram?.WebApp) {
    const initData = (window as any).Telegram.WebApp.initData;
    if (initData) {
      headers['X-Telegram-Data'] = initData;
    }
  }

  try {
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

      if (notifyHandler && response.status !== 401) {
        notifyHandler('error', 'Error', message);
      }

      throw new ApiError(
        response.status,
        message,
        payload
      );
    }

    return payload as T;
  } catch (error: any) {
    if (error instanceof ApiError) throw error;

    if (notifyHandler) {
      notifyHandler('error', 'Network Error', error.message || 'Check your internet connection');
    }
    throw error;
  }
};

export const api = {
  get: async (endpoint: string, includeTelegramData = false) => requestJson(endpoint, 'GET', undefined, includeTelegramData),
  post: async (endpoint: string, data: any, includeTelegramData = false) => requestJson(endpoint, 'POST', data, includeTelegramData),
  put: async (endpoint: string, data: any, includeTelegramData = false) => requestJson(endpoint, 'PUT', data, includeTelegramData),
  delete: async (endpoint: string, includeTelegramData = false) => requestJson(endpoint, 'DELETE', undefined, includeTelegramData),
  request: async (endpoint: string, data?: any, method?: string, includeTelegramData = false) => {
    const httpMethod = (method || (data ? 'POST' : 'GET')).toUpperCase() as HttpMethod;
    return requestJson(endpoint, httpMethod, data, includeTelegramData);
  },

  uploadImage: async (file: File): Promise<{ success: boolean, url: string }> => {
    const token = getToken();
    const formData = new FormData();
    formData.append('image', file);

    const headers: Record<string, string> = {};
    if (token) headers.Authorization = `Bearer ${token}`;

    const response = await fetch(buildUrl('/api/uploads'), {
      method: 'POST',
      headers,
      body: formData
    });

    const result = await response.json();
    if (!response.ok) {
      if (notifyHandler) notifyHandler('error', 'Upload Failed', result.error || 'Failed to upload image');
      throw new Error(result.error || 'Upload failed');
    }

    if (notifyHandler) notifyHandler('success', 'Success', 'Image uploaded successfully');
    return result;
  },

  setNotifyHandler: (handler: typeof notifyHandler) => {
    notifyHandler = handler;
  }
};