import React, { createContext, useContext, useEffect, useState } from 'react';
import { User } from '../types';
import { api } from '../services/api';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: () => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const normalizeUser = (raw: any): User => {
    const id = raw?.id || raw?._id || '';
    return {
      id: String(id),
      username: raw?.username || 'User',
      telegramId: Number(raw?.telegramId ?? raw?.telegram_id ?? 0),
      email: raw?.email,
      avatar: raw?.photoUrl || raw?.photo_url || raw?.profileLogo || raw?.avatar,
      teamId: raw?.teamId,
      createdAt: raw?.createdAt ? new Date(raw.createdAt) : new Date()
    };
  };

  const setToken = (token: string | null) => {
    try {
      if (!token) {
        localStorage.removeItem('auth_token');
        return;
      }
      localStorage.setItem('auth_token', token);
    } catch {
    }
  };

  const getToken = (): string | null => {
    try {
      return localStorage.getItem('auth_token');
    } catch {
      return null;
    }
  };

  const fetchProfile = async (): Promise<User | null> => {
    try {
      const profile = await api.get('/api/auth/profile');
      const normalized = normalizeUser(profile);
      setUser(normalized);
      return normalized;
    } catch {
      return null;
    }
  };

  useEffect(() => {
    const bootstrap = async () => {
      const token = getToken();

      // If we have no token but are in Telegram, try auto-login
      if (!token && typeof window !== 'undefined' && (window as any).Telegram?.WebApp?.initData) {
        setIsLoading(true);
        try {
          await login();
          return; // login already handles setIsLoading(false)
        } catch (e) {
          console.error('Auto-login failed:', e);
        } finally {
          setIsLoading(false);
        }
      }

      if (!token) return;

      setIsLoading(true);
      try {
        const ok = await fetchProfile();
        if (!ok) {
          setToken(null);
          setUser(null);
        }
      } finally {
        setIsLoading(false);
      }
    };

    bootstrap();
  }, []);

  const login = async () => {
    setIsLoading(true);
    try {
      // Try Telegram Mini App authentication first
      if (typeof window !== 'undefined' && (window as any).Telegram?.WebApp) {
        const initData = (window as any).Telegram.WebApp.initData;

        if (initData) {
          // Use new Telegram authentication endpoint
          try {
            const result: any = await api.post('/api/auth/telegram', { initData }, true);
            if (result?.success && result?.token && result?.user) {
              setToken(result.token);
              setUser(normalizeUser(result.user));
              return;
            }
          } catch (telegramError) {
            console.warn('Telegram auth failed, falling back to manual registration:', telegramError);
          }
        }
      }

      // Fallback: Email OTP (passwordless)
      const emailRaw = window.prompt('Enter email for login');
      const email = (emailRaw || '').trim();
      if (!email) {
        throw new Error('Email is required');
      }

      await api.post('/api/auth/email/request-otp', { email });
      const codeRaw = window.prompt('Enter OTP code from email');
      const code = (codeRaw || '').trim();
      if (!code) {
        throw new Error('OTP code is required');
      }

      const result: any = await api.post('/api/auth/email/verify-otp', { email, code });
      const token = result?.token || result?.sessionToken;
      const rawUser = result?.user;
      if (!token || !rawUser) {
        throw new Error('Invalid auth response');
      }

      setToken(token);
      setUser(normalizeUser(rawUser));
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
  };

  const value = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 