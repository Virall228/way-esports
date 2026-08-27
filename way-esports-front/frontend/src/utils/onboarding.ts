import { useEffect, useState } from 'react';
import { User } from '../types';
import { profileService } from '../services/profileService';

const NEW_USER_ONBOARDING_STORAGE_PREFIX = 'way-esports:onboarding:new-user';
const NEW_USER_ONBOARDING_VERSION = 'v1';

export const isRecentlyRegistered = (user?: User | null, days = 10): boolean => {
  if (!user?.createdAt) return false;
  const createdAt = user.createdAt instanceof Date ? user.createdAt.getTime() : new Date(user.createdAt).getTime();
  if (!Number.isFinite(createdAt)) return false;
  return Date.now() - createdAt <= days * 24 * 60 * 60 * 1000;
};

const buildNewUserOnboardingKey = (userId: string) =>
  `${NEW_USER_ONBOARDING_STORAGE_PREFIX}:${NEW_USER_ONBOARDING_VERSION}:${userId}`;

const readOnboardingFlag = (key: string): boolean => {
  try {
    return window.localStorage.getItem(key) === '1';
  } catch {
    return false;
  }
};

const writeOnboardingFlag = (key: string) => {
  try {
    window.localStorage.setItem(key, '1');
  } catch {
    // ignore storage errors
  }
};

const hasSeenNewUserOnboarding = (user?: User | null): boolean => {
  const seenAt = user?.onboarding?.newUserTipsSeenAt;
  if (!seenAt) return false;
  const timestamp = seenAt instanceof Date ? seenAt.getTime() : new Date(seenAt).getTime();
  return Number.isFinite(timestamp);
};

export const useOneTimeNewUserOnboarding = (user?: User | null, days = 10): boolean => {
  const eligible = isRecentlyRegistered(user, days);
  const userId = user?.id ? String(user.id) : '';
  const storageKey = userId ? buildNewUserOnboardingKey(userId) : '';
  const serverSeen = hasSeenNewUserOnboarding(user);
  const [resolvedKey, setResolvedKey] = useState<string>('');
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (!eligible || !storageKey) {
      setResolvedKey(storageKey);
      setIsVisible(false);
      return;
    }

    if (resolvedKey === storageKey) {
      return;
    }

    if (serverSeen) {
      writeOnboardingFlag(storageKey);
      setResolvedKey(storageKey);
      setIsVisible(false);
      return;
    }

    const alreadySeen = readOnboardingFlag(storageKey);
    if (alreadySeen) {
      void profileService.markNewUserOnboardingSeen().catch(() => {
        // Keep local one-time behavior even if sync is temporarily unavailable.
      });
      setResolvedKey(storageKey);
      setIsVisible(false);
      return;
    }

    writeOnboardingFlag(storageKey);
    void profileService.markNewUserOnboardingSeen().catch(() => {
      // Keep local one-time behavior even if sync is temporarily unavailable.
    });
    setResolvedKey(storageKey);
    setIsVisible(true);
  }, [eligible, resolvedKey, serverSeen, storageKey]);

  return eligible && resolvedKey === storageKey && isVisible;
};
