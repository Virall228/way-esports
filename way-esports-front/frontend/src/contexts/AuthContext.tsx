import React, { createContext, useContext, useEffect, useState } from 'react';
import { User } from '../types';
import { api } from '../services/api';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: () => Promise<void>;
  logout: () => void;
  fetchProfile: () => Promise<User | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const normalizeUser = (raw: any): User => {
    const source = raw?.data || raw?.user || raw || {};
    const wallet = source?.wallet || {};
    const stats = source?.stats || {};

    return {
      id: String(source?.id || source?._id || ''),
      username: source?.username || 'User',
      telegramId: Number(source?.telegramId ?? source?.telegram_id ?? 0),
      email: source?.email,
      firstName: source?.firstName,
      lastName: source?.lastName,
      bio: source?.bio,
      profileLogo: source?.profileLogo || source?.photoUrl || source?.photo_url || source?.avatar,
      role: source?.role || 'user',
      avatar: source?.photoUrl || source?.photo_url || source?.profileLogo || source?.avatar,
      teamId: source?.teamId,
      teams: Array.isArray(source?.teams)
        ? source.teams.map((team: any) => String(team?.id || team?._id || team))
        : [],
      participatingTournaments: Array.isArray(source?.participatingTournaments)
        ? source.participatingTournaments.map((item: any) => String(item?.id || item?._id || item))
        : [],
      isSubscribed: Boolean(source?.isSubscribed),
      freeEntriesCount: Number(source?.freeEntriesCount || 0),
      bonusEntries: Number(source?.bonusEntries || 0),
      balance: Number(source?.balance ?? wallet?.balance ?? 0),
      stats: {
        ...stats,
        matches: Number(stats?.matches ?? stats?.tournamentsPlayed ?? 0),
        mvps: Number(stats?.mvps ?? 0),
        kdRatio: Number(stats?.kdRatio ?? 0)
      },
      createdAt: source?.createdAt ? new Date(source.createdAt) : new Date()
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
      // ignore
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
      const profile = await api.get('/api/profile');
      const normalized = normalizeUser(profile);
      setUser(normalized);
      return normalized;
    } catch {
      return null;
    }
  };

  const login = async () => {
    setIsLoading(true);
    try {
      // Try Telegram Mini App authentication first
      if (typeof window !== 'undefined' && (window as any).Telegram?.WebApp) {
        const initData = (window as any).Telegram.WebApp.initData;

        if (initData) {
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

  useEffect(() => {
    const bootstrap = async () => {
      const token = getToken();

      if (!token && typeof window !== 'undefined' && (window as any).Telegram?.WebApp?.initData) {
        setIsLoading(true);
        try {
          await login();
          return;
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const logout = () => {
    setToken(null);
    setUser(null);
  };

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    logout,
    fetchProfile
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
