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
let lastServerUnavailableNotifyAt = 0;
const SERVER_UNAVAILABLE_NOTIFY_COOLDOWN_MS = 15000;

const requestJson = async <T = any>(endpoint: string, method: HttpMethod, data?: any, includeTelegramData = false): Promise<T> => {
  const token = getToken();
  const headers: Record<string, string> = { ...API_CONFIG.DEFAULT_HEADERS };
  if (token) headers.Authorization = `Bearer ${token}`;
  if (method !== 'GET' && method !== 'DELETE') {
    const randomKey =
      (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function')
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    headers['X-Idempotency-Key'] = randomKey;
  }

  // Add Telegram initData if available and requested
  if (includeTelegramData && typeof window !== 'undefined' && (window as any).Telegram?.WebApp) {
    const initData = (window as any).Telegram.WebApp.initData;
    if (initData) {
      headers['X-Telegram-Data'] = initData;
    }
  }

  const controller = new AbortController();
  const timeoutMs = Math.max(1000, Number(API_CONFIG.TIMEOUT || 10000));
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(buildUrl(endpoint), {
      method,
      headers,
      body: data !== undefined ? JSON.stringify(data) : undefined,
      signal: controller.signal
    });

    const contentType = response.headers.get('content-type') || '';
    const isJson = contentType.includes('application/json');
    const payload = isJson ? await response.json() : await response.text();

    if (!response.ok) {
      const textPayload = typeof payload === 'string' ? payload : '';
      const normalizedText = textPayload.trim();
      const isHtmlPayload = /^<!doctype html>|^<html[\s>]/i.test(normalizedText);

      const message =
        isHtmlPayload
          ? `Server unavailable (${response.status})`
          : typeof payload === 'string'
            ? payload
            : (payload as any)?.error || (payload as any)?.message || 'Request failed';

      if (response.status === 402) {
        const redirectTo = (payload as any)?.redirectTo;
        if (redirectTo && typeof window !== 'undefined') {
          window.location.href = redirectTo;
        }
      }

      if (notifyHandler && response.status !== 401) {
        if (response.status >= 500) {
          const now = Date.now();
          if (now - lastServerUnavailableNotifyAt >= SERVER_UNAVAILABLE_NOTIFY_COOLDOWN_MS) {
            lastServerUnavailableNotifyAt = now;
            notifyHandler('error', 'Server unavailable', message);
          }
        } else {
          notifyHandler('error', 'Error', message);
        }
      }

      throw new ApiError(
        response.status,
        message,
        payload
      );
    }

    return payload as T;
  } catch (error: any) {
    if (error?.name === 'AbortError') {
      const timeoutError = new ApiError(504, `Request timeout (${timeoutMs} ms)`);
      if (notifyHandler) {
        notifyHandler('error', 'Network Error', timeoutError.message);
      }
      throw timeoutError;
    }

    if (error instanceof ApiError) throw error;

    if (notifyHandler) {
      notifyHandler('error', 'Network Error', error.message || 'Check your internet connection');
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
};

export const api = {
  get: async (endpoint: string, includeTelegramData = false) => requestJson(endpoint, 'GET', undefined, includeTelegramData),
  post: async (endpoint: string, data: any, includeTelegramData = false) => requestJson(endpoint, 'POST', data, includeTelegramData),
  put: async (endpoint: string, data: any, includeTelegramData = false) => requestJson(endpoint, 'PUT', data, includeTelegramData),
  patch: async (endpoint: string, data: any, includeTelegramData = false) => requestJson(endpoint, 'PATCH', data, includeTelegramData),
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
  },

  hasToken: () => Boolean(getToken())
};
