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
      const tgUser = window.Telegram?.WebApp?.initDataUnsafe?.user;

      const fallbackTelegramIdRaw = !tgUser?.id ? window.prompt('Enter Telegram ID (numeric)') : null;
      const telegramId = tgUser?.id || (fallbackTelegramIdRaw ? parseInt(fallbackTelegramIdRaw, 10) : null);
      if (!telegramId || !Number.isFinite(telegramId)) {
        throw new Error('Telegram user not available');
      }

      const payload = {
        telegramId,
        username: tgUser?.username || `user_${telegramId}`,
        firstName: tgUser?.first_name || tgUser?.username || 'User',
        lastName: tgUser?.last_name || '',
        photoUrl: tgUser?.photo_url
      };

      const result: any = await api.post('/api/auth/register', payload);
      const token = result?.token;
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