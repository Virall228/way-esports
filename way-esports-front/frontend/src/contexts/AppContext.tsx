import React, { createContext, useContext, useState, useEffect } from 'react';
import { getFullUrl } from '../config/api';

interface User {
  id: string;
  username: string;
  photoUrl?: string;
  stats: {
    wins: number;
    losses: number;
    tournaments: number;
  };
  achievements: string[];
}

interface AppContextType {
  user: User | null;
  isLoading: boolean;
  setUser: (user: User | null) => void;
  language: 'en' | 'ru';
  setLanguage: (lang: 'en' | 'ru') => void;
  isDarkMode: boolean;
  toggleDarkMode: () => void;
  backgroundPreset: 'auto' | 'subtle' | 'default' | 'strong';
  setBackgroundPreset: (preset: 'auto' | 'subtle' | 'default' | 'strong') => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const useApp = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};

interface AppProviderProps {
  children: React.ReactNode;
}

export const AppProvider: React.FC<AppProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [language, setLanguage] = useState<'en' | 'ru'>('en');
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [backgroundPreset, setBackgroundPresetState] = useState<'auto' | 'subtle' | 'default' | 'strong'>('auto');

  useEffect(() => {
    try {
      const savedTheme = localStorage.getItem('theme');
      if (savedTheme === 'light') {
        setIsDarkMode(false);
      } else if (savedTheme === 'dark') {
        setIsDarkMode(true);
      }
      const savedLanguage = localStorage.getItem('language');
      if (savedLanguage === 'en' || savedLanguage === 'ru') {
        setLanguage(savedLanguage);
      }
    } catch {
      // ignore
    }

    // Initialize Telegram WebApp
    const initTelegramWebApp = async () => {
      try {
        if (window.Telegram?.WebApp) {
          const webapp = window.Telegram.WebApp;
          webapp.ready();
          webapp.expand();

          // Get user data from Telegram
          const userData = webapp.initDataUnsafe.user;
          if (userData) {
            setUser({
              id: userData.id.toString(),
              username: userData.username || 'User',
              photoUrl: userData.photo_url,
              stats: {
                wins: 0,
                losses: 0,
                tournaments: 0,
              },
              achievements: [],
            });
          }
        }
      } catch (error) {
        console.error('Failed to initialize Telegram WebApp:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initTelegramWebApp();
  }, []);

  useEffect(() => {
    const loadBackgroundPreset = async () => {
      try {
        const response = await fetch(getFullUrl('/api/ui-settings/public'));
        if (!response.ok) return;
        const payload = await response.json();
        const preset = String(payload?.data?.backgroundPreset || payload?.backgroundPreset || '').toLowerCase();
        if (preset === 'auto' || preset === 'subtle' || preset === 'default' || preset === 'strong') {
          setBackgroundPresetState(preset as 'auto' | 'subtle' | 'default' | 'strong');
        }
      } catch {
        // ignore network issues and keep defaults
      }
    };
    void loadBackgroundPreset();
  }, []);

  useEffect(() => {
    if (typeof document === 'undefined') return;
    const isMobile = typeof window !== 'undefined' && window.matchMedia('(max-width: 768px)').matches;
    const prefersReducedMotion = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const cores = typeof navigator !== 'undefined' ? Number((navigator as any).hardwareConcurrency || 0) : 0;
    const memory = typeof navigator !== 'undefined' ? Number((navigator as any).deviceMemory || 0) : 0;
    const powerfulDevice = (cores >= 8 || memory >= 8) && !prefersReducedMotion;
    const resolvedAutoPreset = isMobile ? 'subtle' : (powerfulDevice ? 'strong' : 'default');
    const resolvedPreset = backgroundPreset === 'auto' ? resolvedAutoPreset : backgroundPreset;
    document.body.setAttribute('data-bg-preset', resolvedPreset);
    document.body.setAttribute('data-bg-mode', backgroundPreset);
  }, [backgroundPreset]);

  const toggleDarkMode = () => {
    setIsDarkMode((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('theme', next ? 'dark' : 'light');
      } catch {
        // ignore
      }
      return next;
    });
  };

  const setBackgroundPreset = (preset: 'auto' | 'subtle' | 'default' | 'strong') => {
    setBackgroundPresetState(preset);
  };

  const value = {
    user,
    setUser,
    isLoading,
    language,
    setLanguage,
    isDarkMode,
    toggleDarkMode,
    backgroundPreset,
    setBackgroundPreset,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

// Add Telegram WebApp types
declare global {
  interface Window {
    Telegram: {
      WebApp: {
        ready: () => void;
        expand: () => void;
        initDataUnsafe: {
          user?: {
            id: number;
            username?: string;
            photo_url?: string;
          };
        };
      };
    };
  }
} 
