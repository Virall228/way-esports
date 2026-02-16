import React, { createContext, useContext, useEffect, useState } from 'react';
import { User } from '../types';
import { api } from '../services/api';

type LoginMethod = 'telegram' | 'email' | 'register' | 'otp' | 'google' | 'apple' | 'telegram_webapp';

interface LoginOptions {
  method?: LoginMethod;
  telegramId?: string;
  email?: string;
  password?: string;
  firstName?: string;
  username?: string;
  code?: string;
  idToken?: string;
  identityToken?: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (options?: LoginOptions) => Promise<void>;
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

  const applyAuthState = async (token: string, rawUser: any) => {
    setToken(token);
    const profile = await fetchProfile();
    if (!profile) {
      setUser(normalizeUser(rawUser));
    }
  };

  const loginWithTelegramId = async (telegramIdInput?: string) => {
    const telegramIdRaw = telegramIdInput ?? window.prompt('Enter Telegram ID') ?? '';
    const telegramId = telegramIdRaw.trim();
    if (!telegramId) {
      throw new Error('Telegram ID is required');
    }

    const result: any = await api.post('/api/auth/login', { telegramId });
    const token = result?.token || result?.sessionToken;
    const rawUser = result?.user;
    if (!token || !rawUser) {
      throw new Error('Invalid Telegram login response');
    }

    await applyAuthState(token, rawUser);
  };

  const loginWithEmailPassword = async (options?: Pick<LoginOptions, 'email' | 'password'>) => {
    const emailRaw = options?.email ?? window.prompt('Enter email') ?? '';
    const email = emailRaw.trim();
    const passwordRaw = options?.password ?? window.prompt('Enter password') ?? '';
    const password = passwordRaw.trim();

    if (!email || !password) {
      throw new Error('Email and password are required');
    }

    const result: any = await api.post('/api/auth/email/login', { email, password });
    const token = result?.token || result?.sessionToken;
    const rawUser = result?.user;
    if (!token || !rawUser) {
      throw new Error('Invalid email login response');
    }

    await applyAuthState(token, rawUser);
  };

  const registerWithEmailPassword = async (
    options?: Pick<LoginOptions, 'email' | 'password' | 'firstName' | 'username'>
  ) => {
    const emailRaw = options?.email ?? window.prompt('Enter email') ?? '';
    const email = emailRaw.trim();
    const passwordRaw = options?.password ?? window.prompt('Create password (min 8 chars)') ?? '';
    const password = passwordRaw.trim();
    const firstNameRaw = options?.firstName ?? window.prompt('First name (optional)') ?? '';
    const firstName = firstNameRaw.trim();
    const usernameRaw = options?.username ?? window.prompt('Username (optional)') ?? '';
    const username = usernameRaw.trim();

    if (!email || !password) {
      throw new Error('Email and password are required');
    }

    const result: any = await api.post('/api/auth/email/register', {
      email,
      password,
      firstName: firstName || undefined,
      username: username || undefined
    });
    const token = result?.token || result?.sessionToken;
    const rawUser = result?.user;
    if (!token || !rawUser) {
      throw new Error('Invalid email registration response');
    }

    await applyAuthState(token, rawUser);
  };

  const loginWithEmailOtp = async (options?: Pick<LoginOptions, 'email' | 'code'>) => {
    const emailRaw = options?.email ?? window.prompt('Enter email') ?? '';
    const email = emailRaw.trim();
    if (!email) {
      throw new Error('Email is required');
    }

    await api.post('/api/auth/email/request-otp', { email });
    const codeRaw = options?.code ?? window.prompt('Enter OTP code from email') ?? '';
    const code = codeRaw.trim();
    if (!code) {
      throw new Error('OTP code is required');
    }

    const result: any = await api.post('/api/auth/email/verify-otp', { email, code });
    const token = result?.token || result?.sessionToken;
    const rawUser = result?.user;
    if (!token || !rawUser) {
      throw new Error('Invalid OTP auth response');
    }

    await applyAuthState(token, rawUser);
  };

  const loginWithGoogleToken = async (idTokenInput?: string) => {
    const idTokenRaw = idTokenInput ?? window.prompt('Paste Google ID token') ?? '';
    const idToken = idTokenRaw.trim();
    if (!idToken) {
      throw new Error('Google ID token is required');
    }

    const result: any = await api.post('/api/auth/google', { idToken });
    const token = result?.token || result?.sessionToken;
    const rawUser = result?.user;
    if (!token || !rawUser) {
      throw new Error('Invalid Google auth response');
    }

    await applyAuthState(token, rawUser);
  };

  const loginWithAppleToken = async (identityTokenInput?: string) => {
    const identityTokenRaw = identityTokenInput ?? window.prompt('Paste Apple identity token') ?? '';
    const identityToken = identityTokenRaw.trim();
    if (!identityToken) {
      throw new Error('Apple identity token is required');
    }

    const result: any = await api.post('/api/auth/apple', { identityToken });
    const token = result?.token || result?.sessionToken;
    const rawUser = result?.user;
    if (!token || !rawUser) {
      throw new Error('Invalid Apple auth response');
    }

    await applyAuthState(token, rawUser);
  };

  const login = async (options?: LoginOptions) => {
    setIsLoading(true);
    try {
      const forcedMethod = options?.method;

      // Try Telegram Mini App authentication first
      if (
        (!forcedMethod || forcedMethod === 'telegram_webapp') &&
        typeof window !== 'undefined' &&
        (window as any).Telegram?.WebApp
      ) {
        const initData = (window as any).Telegram.WebApp.initData;

        if (initData) {
          try {
            const result: any = await api.post('/api/auth/telegram', { initData }, true);
            if (result?.success && result?.token && result?.user) {
              await applyAuthState(result.token, result.user);
              return;
            }
          } catch (telegramError) {
            console.warn('Telegram auth failed, falling back to manual registration:', telegramError);
          }
        }
      }

      const modeRaw = forcedMethod
        ? forcedMethod
        : window.prompt('Login method: telegram | email | register | otp | google | apple') || 'telegram';
      const mode = modeRaw.trim().toLowerCase();

      if (mode === 'email') {
        await loginWithEmailPassword(options);
        return;
      }

      if (mode === 'register') {
        await registerWithEmailPassword(options);
        return;
      }

      if (mode === 'otp') {
        await loginWithEmailOtp(options);
        return;
      }

      if (mode === 'google') {
        await loginWithGoogleToken(options?.idToken);
        return;
      }

      if (mode === 'apple') {
        await loginWithAppleToken(options?.identityToken);
        return;
      }

      await loginWithTelegramId(options?.telegramId);
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
    api.post('/api/auth/logout', {}).catch(() => {
      // ignore
    });
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
