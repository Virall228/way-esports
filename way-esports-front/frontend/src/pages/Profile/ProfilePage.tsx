import React, { useState, useEffect, useMemo } from 'react';
import styled from 'styled-components';
import { useQuery } from '@tanstack/react-query';
import SubscriptionModal from '../../components/Subscription/SubscriptionModal';
import PhotoUploadModal from '../../components/Profile/PhotoUploadModal';
import AchievementsSection from '../../components/Profile/AchievementsSection';
import ReferralCard from '../../components/Referral/ReferralCard';
import SubscriptionCard from '../../components/Subscription/SubscriptionCard';
import SupportChat from '../../components/Support/SupportChat';
import {
  TournamentHistoryFilters,
  HistoryPagination,
  TournamentHistoryRow,
  TournamentHistorySection
} from '../../components/History';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useNotifications } from '../../contexts/NotificationContext';
import { api, ApiError } from '../../services/api';
import { getFullUrl } from '../../config/api';
import { Link } from 'react-router-dom';
import { useProfileQuery } from '../../hooks/useProfileQuery';
import { historyService } from '../../services/historyService';
import Card from '../../components/UI/Card';
import Button from '../../components/UI/Button';
import FlameAuraAvatar from '../../components/UI/FlameAuraAvatar';
import { getTierByPoints, getIntensityByPointsAndRank, getPlayerPoints } from '../../utils/flameRank';

type TelegramStatusCardData = {
  userId: string;
  shareLink?: string | null;
  sharePayload?: string;
  points?: number;
  winRate?: number;
  rankColor?: string;
};

const Bio = styled.p`
  line-height: 1.6;
  color: #ddd;
  font-style: italic;
  margin-top: 15px;
`;

const Container = styled.div`
  box-sizing: border-box;
  padding: 20px;
  width: 100%;
  max-width: 100%;
  margin: 0;
  color: ${({ theme }) => theme.colors.text.primary};
  overflow-x: clip;
`;

const ProfileHeader = styled(Card).attrs({ variant: 'elevated' })<{
  $wallpaperUrl?: string | null;
  $streakGlowColor?: string;
}>`
  position: relative;
  overflow: hidden;
  background: linear-gradient(180deg, rgba(12, 13, 16, 0.92) 0%, rgba(7, 8, 10, 0.95) 100%);
  border-radius: 16px;
  padding: 30px;
  margin-bottom: 30px;
  border: 1px solid ${({ theme }) => theme.colors.border.light};
  box-shadow: ${({ $streakGlowColor = 'rgba(255,255,255,0.1)' }) =>
    `0 0 0 1px ${$streakGlowColor}, 0 0 28px ${$streakGlowColor.replace('0.9', '0.35').replace('0.85', '0.3')}`};
  display: flex;
  align-items: flex-start;
  gap: 30px;
  flex-wrap: wrap;

  & > * {
    position: relative;
    z-index: 1;
  }

  &::before {
    content: '';
    position: absolute;
    inset: 0;
    background-image: ${({ $wallpaperUrl }) => ($wallpaperUrl ? `url("${$wallpaperUrl}")` : 'none')};
    background-size: cover;
    background-position: center;
    background-repeat: no-repeat;
    opacity: ${({ $wallpaperUrl }) => ($wallpaperUrl ? 0.22 : 0)};
    filter: blur(1px) saturate(0.9) contrast(0.9);
    transform: scale(1.02);
    z-index: 0;
  }

  &::after {
    content: '';
    position: absolute;
    inset: 0;
    background:
      linear-gradient(180deg, rgba(4, 5, 8, 0.12) 0%, rgba(4, 5, 8, 0.5) 65%, rgba(4, 5, 8, 0.78) 100%),
      radial-gradient(120% 85% at 15% 10%, rgba(255, 107, 0, 0.09) 0%, rgba(255, 107, 0, 0) 55%);
    z-index: 0;
  }

  @media (max-width: 768px) {
    padding: 16px;
    gap: 12px;
    flex-direction: column;
    align-items: stretch;
    text-align: left;

    &::before {
      background-position: center 30%;
      opacity: ${({ $wallpaperUrl }) => ($wallpaperUrl ? 0.1 : 0)};
      filter: blur(8px) saturate(0.75) contrast(0.82) brightness(0.58);
      transform: scale(1.02);
    }

    &::after {
      background:
        linear-gradient(180deg, rgba(4, 5, 8, 0.25) 0%, rgba(4, 5, 8, 0.75) 65%, rgba(4, 5, 8, 0.9) 100%),
        radial-gradient(120% 85% at 15% 10%, rgba(255, 107, 0, 0.08) 0%, rgba(255, 107, 0, 0) 55%);
    }
  }
`;

const Avatar = styled.div<{ $hasImage?: boolean; $imageUrl?: string | null; $size?: number }>`
  width: ${({ $size = 120 }) => `${$size}px`};
  height: ${({ $size = 120 }) => `${$size}px`};
  min-width: ${({ $size = 120 }) => `${$size}px`};
  min-height: ${({ $size = 120 }) => `${$size}px`};
  aspect-ratio: 1 / 1;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  cursor: pointer;
  transition: all 0.3s ease;
  overflow: visible;

  &:hover { transform: scale(1.05); box-shadow: 0 0 20px rgba(0,0,0,0.35); }

  &:hover::after {
    content: 'Change';
    position: absolute;
    top: 42px;
    left: 12px;
    right: 12px;
    background: rgba(0, 0, 0, 0.7);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.75rem;
    border-radius: 999px;
    border: 1px solid rgba(255, 255, 255, 0.2);
  }

  @media (max-width: 768px) {
    width: ${({ $size = 96 }) => `${$size}px`};
    height: ${({ $size = 96 }) => `${$size}px`};
    min-width: ${({ $size = 96 }) => `${$size}px`};
    min-height: ${({ $size = 96 }) => `${$size}px`};
    margin: 0 auto;

    &:hover {
      transform: none;
      box-shadow: none;
    }

    &:hover::after {
      content: none;
    }
  }
`;

const WallpaperActionRow = styled.div`
  margin-top: 14px;
  display: flex;
  gap: 8px;
  flex-wrap: wrap;

  @media (max-width: 768px) {
    display: grid;
    grid-template-columns: 1fr;
    gap: 8px;
  }
`;

const ProfileInfo = styled.div`
  flex: 1;
  min-width: 0;
  width: 100%;

  @media (max-width: 768px) {
    width: 100%;
  }
`;

const ProfileTop = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 20px;

  @media (max-width: 768px) {
    display: flex;
    flex-direction: column;
    align-items: center;
    margin-bottom: 12px;
  }
`;

const IdentityBlock = styled.div`
  @media (max-width: 768px) {
    text-align: center;
    width: 100%;
    max-width: 520px;
    margin: 0 auto;
  }
`;

const Username = styled.h1`
  font-size: clamp(1.7rem, 4.6vw, 2.5rem);
  margin-bottom: 5px;
  color: ${({ theme }) => theme.colors.text.primary};
  line-height: 1.08;
  word-break: break-word;
  overflow-wrap: anywhere;
`;

const UserOrg = styled.div`
  color: ${({ theme }) => theme.colors.text.secondary};
  font-size: 1.1rem;
  margin-bottom: 15px;
  word-break: break-word;
  overflow-wrap: anywhere;
`;

const GhostBadge = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 6px 10px;
  border-radius: 999px;
  background: rgba(255, 107, 0, 0.16);
  border: 1px solid rgba(255, 107, 0, 0.5);
  color: #ffd7b8;
  font-size: 0.8rem;
  margin-bottom: 10px;
  max-width: 100%;
  word-break: break-word;
  overflow-wrap: anywhere;

  @media (max-width: 768px) {
    margin-left: auto;
    margin-right: auto;
  }
`;

const UserStats = styled.div`
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 18px;
  min-width: 0;

  @media (max-width: 768px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 12px;
    margin-top: 8px;
  }
`;

const HeaderActionRow = styled.div`
  margin-top: 10px;
  display: flex;
  gap: 10px;
  align-items: center;
  flex-wrap: wrap;
  min-width: 0;

  @media (max-width: 768px) {
    justify-content: center;
    width: 100%;
    gap: 8px;
    display: grid;
    grid-template-columns: 1fr;
  }
`;

const StatItem = styled.div`
  text-align: center;
  min-width: 0;

  @media (max-width: 768px) {
    background: rgba(255, 255, 255, 0.04);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 10px;
    padding: 10px 8px;
  }
`;

const StatValue = styled.div`
  font-size: 1.8rem;
  font-weight: 700;
  color: ${({ theme }) => theme.colors.text.primary};
`;

const StatLabel = styled.div`
  color: ${({ theme }) => theme.colors.textSecondary};
  font-size: 0.9rem;
  margin-top: 5px;
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 25px;
  margin-bottom: 30px;
`;

const StatsCard = styled(Card).attrs({ variant: 'outlined' })`
  background: ${({ theme }) => theme.colors.surface};
  border-radius: 16px;
  padding: 25px;
`;

const StatFilters = styled.div`
  display: flex;
  gap: 20px;
  margin-bottom: 20px;
  flex-wrap: wrap;
`;

const StatFilterButton = styled(Button).attrs({ size: 'small' })``;

const CardTitle = styled.h3`
  color: ${({ theme }) => theme.colors.text.primary};
  margin-bottom: 20px;
  font-size: 1.3rem;
`;


const InlineAction = styled(Button).attrs({ variant: 'text', size: 'small' })`
  min-height: auto;
  padding: 0;
`;

const HeaderPrimaryButton = styled(Button).attrs({ size: 'small', variant: 'outline' })`
  @media (max-width: 768px) {
    width: 100%;
    justify-content: center;
    min-height: 42px;
  }
`;

const ShareLinkButton = styled.a`
  color: #ff6b00;
  font-size: 0.85rem;
  text-decoration: none;
  border: 1px solid rgba(255,107,0,0.5);
  border-radius: 10px;
  padding: 6px 10px;

  @media (max-width: 768px) {
    width: 100%;
    display: block;
    text-align: center;
  }
`;

const WallpaperPrimaryButton = styled(Button).attrs({ size: 'small', variant: 'outline' })`
  @media (max-width: 768px) {
    width: 100%;
    justify-content: center;
    min-height: 42px;
  }
`;

const WallpaperSecondaryButton = styled(Button).attrs({ size: 'small', variant: 'text' })`
  @media (max-width: 768px) {
    width: 100%;
    justify-content: center;
    min-height: 42px;
  }
`;

const InlineConfirm = styled(Button).attrs({ variant: 'text', size: 'small' })`
  min-height: auto;
  padding: 0;
  color: #00ff00;
`;

const InlineCancel = styled(Button).attrs({ variant: 'text', size: 'small' })`
  min-height: auto;
  padding: 0;
  color: #ff4444;
`;

const InlineInput = styled.input`
  min-height: 36px;
  border-radius: 8px;
  border: 1px solid ${({ theme }) => theme.colors.border.medium};
  background: ${({ theme }) => theme.colors.bg.elevated};
  color: ${({ theme }) => theme.colors.text.primary};
  padding: 0.4rem 0.65rem;
`;

const HistoryList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

const ProfilePage: React.FC = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const { addNotification } = useNotifications();
  const { data: profileData, refetch: refetchProfile } = useProfileQuery();
  const profile = profileData || user;
  const profileId = String(profile?.id || user?.id || '').trim();
  const [isSubscriptionOpen, setIsSubscriptionOpen] = useState(false);
  const [isPhotoUploadOpen, setIsPhotoUploadOpen] = useState(false);
  const [isEditingUsername, setIsEditingUsername] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [isEditingBio, setIsEditingBio] = useState(false);
  const [newBio, setNewBio] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isSavingUsername, setIsSavingUsername] = useState(false);
  const [aiGhostBadge, setAiGhostBadge] = useState<string>('');
  const [statusCardData, setStatusCardData] = useState<TelegramStatusCardData | null>(null);
  const [isUploadingWallpaper, setIsUploadingWallpaper] = useState(false);
  const [historyGameFilter, setHistoryGameFilter] = useState<string>('all');
  const [historyFromFilter, setHistoryFromFilter] = useState<string>('');
  const [historyToFilter, setHistoryToFilter] = useState<string>('');
  const [historyBaseStatusFilter, setHistoryBaseStatusFilter] = useState<string>('all');
  const [historyBaseSort, setHistoryBaseSort] = useState<'recent' | 'oldest'>('recent');
  const [historyBaseGameFilter, setHistoryBaseGameFilter] = useState<string>('all');
  const [historyBasePage, setHistoryBasePage] = useState<number>(1);
  const [historySort, setHistorySort] = useState<'recent' | 'oldest'>('recent');
  const [historyPage, setHistoryPage] = useState<number>(1);
  const [isExportingHistory, setIsExportingHistory] = useState(false);
  const isMobile = useMemo(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(max-width: 768px)').matches;
  }, []);
  const avatarSize = isMobile ? 96 : 120;

  const { data: historyData, isLoading: isHistoryLoading } = useQuery({
    queryKey: ['history', 'player', profileId, 'base', historyBasePage, historyBaseStatusFilter, historyBaseSort, historyBaseGameFilter],
    queryFn: () => historyService.getPlayerHistory(profileId, historyBasePage, 6, {
      status: historyBaseStatusFilter === 'all' ? '' : historyBaseStatusFilter,
      sort: historyBaseSort,
      game: historyBaseGameFilter === 'all' ? '' : historyBaseGameFilter
    }),
    enabled: Boolean(profileId),
    staleTime: 30000,
    refetchOnWindowFocus: false
  });

  const hasActiveSubscription = useMemo(() => {
    const expiresAtRaw = (profile as any)?.subscriptionExpiresAt || (user as any)?.subscriptionExpiresAt;
    const subscribedFlag = Boolean((profile as any)?.isSubscribed ?? (user as any)?.isSubscribed);
    if (!subscribedFlag) return false;
    if (!expiresAtRaw) return true;
    const expiresTs = new Date(expiresAtRaw).getTime();
    return Number.isFinite(expiresTs) && expiresTs > Date.now();
  }, [profile, user]);

  const { data: detailedHistoryData, isLoading: isDetailedHistoryLoading, refetch: refetchDetailedHistory } = useQuery({
    queryKey: ['history', 'player', profileId, 'matches', historyGameFilter, historyFromFilter, historyToFilter, historySort, historyPage],
    queryFn: () => historyService.getPlayerMatches(profileId, {
      page: historyPage,
      limit: 20,
      game: historyGameFilter === 'all' ? '' : historyGameFilter,
      from: historyFromFilter || '',
      to: historyToFilter || '',
      sort: historySort
    }),
    enabled: Boolean(profileId && hasActiveSubscription),
    staleTime: 20000,
    refetchOnWindowFocus: false
  });

  useEffect(() => {
    if (profile?.bio) {
      setNewBio(profile.bio);
    }
    if (profile?.username) {
      setNewUsername(profile.username);
    }
  }, [profile]);

  useEffect(() => {
    const loadGhostBadge = async () => {
      try {
        const targetId = profile?.id || user?.id;
        if (!targetId) return;
        const analyticsRes: any = await api.get(`/api/analytics/${targetId}`);
        const analyticsPayload = analyticsRes?.data || analyticsRes;
        const skills = analyticsPayload?.skills;
        if (!skills) return;
        const styleRes: any = await api.post('/api/intelligence/analytics/style-match', skills);
        const matches = styleRes?.data || styleRes || [];
        const top = Array.isArray(matches) ? matches[0] : null;
        if (!top?.pro || typeof top?.similarity !== 'number') return;
        setAiGhostBadge(`${top.similarity.toFixed(0)}% ${top.pro} Movement`);
      } catch {
        setAiGhostBadge('');
      }
    };
    void loadGhostBadge();
  }, [profile?.id, user?.id]);

  useEffect(() => {
    const loadStatusCard = async () => {
      try {
        const targetId = String(profile?.id || user?.id || '').trim();
        if (!targetId) return;
        const res: any = await api.get(`/api/intelligence/telegram/player-card/${targetId}`);
        const payload = (res?.data || res || null) as TelegramStatusCardData | null;
        if (payload) {
          setStatusCardData(payload);
        }
      } catch {
        setStatusCardData(null);
      }
    };
    void loadStatusCard();
  }, [profile?.id, user?.id]);

  useEffect(() => {
    setHistoryPage(1);
  }, [historyGameFilter, historyFromFilter, historyToFilter, historySort]);

  useEffect(() => {
    setHistoryBasePage(1);
  }, [historyBaseStatusFilter, historyBaseSort, historyBaseGameFilter]);

  const hasEmoji = (value: string) => /\p{Extended_Pictographic}/u.test(value);

  const handleSaveUsername = async () => {
    const normalizedUsername = newUsername.trim();
    if (!normalizedUsername) {
      addNotification({
        type: 'error',
        title: 'Invalid username',
        message: 'Username cannot be empty'
      });
      return;
    }
    if (hasEmoji(normalizedUsername)) {
      addNotification({
        type: 'error',
        title: 'Invalid username',
        message: 'Username cannot contain emoji'
      });
      return;
    }

    try {
      setIsSavingUsername(true);
      await api.patch('/api/profile', { username: normalizedUsername });
      await refetchProfile();
      setIsEditingUsername(false);
      addNotification({
        type: 'success',
        title: 'Username updated',
        message: 'Your username has been updated'
      });
    } catch (error: any) {
      let message = error?.message || 'Failed to update username';
      if (error instanceof ApiError && error.status === 429 && error.payload?.nextChangeAt) {
        const nextDate = new Date(error.payload.nextChangeAt).toLocaleString();
        message = `You can change username once every 7 days. Next change: ${nextDate}`;
      }
      addNotification({
        type: 'error',
        title: 'Update failed',
        message
      });
    } finally {
      setIsSavingUsername(false);
    }
  };

  const handleSaveBio = async () => {
    try {
      setIsSaving(true);
      await api.patch('/api/profile', { bio: newBio });
      await refetchProfile();
      setIsEditingBio(false);
    } catch (error) {
      console.error('Error saving bio:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handlePhotoUpload = async (file: File) => {
    try {
      const { url } = await api.uploadImage(file);

      // Update user profile with new logo URL
      await api.post('/api/profile/upload-logo', { logoUrl: url });

      // Refresh profile to get updated data
      await refetchProfile();
    } catch (error) {
      console.error('Error in photo upload:', error);
    }
  };

  const getFullAvatarUrl = (path: string | null | undefined) => {
    if (!path) return null;
    if (path.startsWith('http')) return path;
    const normalized = path.startsWith('/') ? path : `/${path}`;
    if (normalized.startsWith('/api/uploads/')) return getFullUrl(normalized);
    if (normalized.startsWith('/uploads/')) return getFullUrl(`/api${normalized}`);
    return normalized;
  };

  const getFullMediaUrl = (path: string | null | undefined) => {
    if (!path) return null;
    if (path.startsWith('http')) return path;
    const normalized = path.startsWith('/') ? path : `/${path}`;
    if (normalized.startsWith('/api/uploads/')) return getFullUrl(normalized);
    if (normalized.startsWith('/uploads/')) return getFullUrl(`/api${normalized}`);
    return normalized;
  };

  const wins = Number(profile?.stats?.wins || 0);
  const losses = Number(profile?.stats?.losses || 0);
  const points = getPlayerPoints(wins, losses);
  const historySummary = historyData?.summary || { tournaments: 0, matches: 0, wins: 0, losses: 0, winRate: 0 };
  const historyItems = Array.isArray(historyData?.items) ? historyData.items : [];
  const historyBasePagination = historyData?.pagination || { page: 1, limit: 6, total: 0, totalPages: 0 };
  const detailedItems = Array.isArray(detailedHistoryData?.items) ? detailedHistoryData.items : [];
  const detailedPagination = detailedHistoryData?.pagination || { page: 1, limit: 20, total: 0, totalPages: 0 };
  const profileTier = getTierByPoints(points);
  const profileIntensity = getIntensityByPointsAndRank(points);
  const wallpaperMeta = (profile as any)?.profileWallpaper;
  const wallpaperBaseUrl = wallpaperMeta?.status === 'removed'
    ? null
    : getFullMediaUrl(wallpaperMeta?.url);
  const wallpaperVersion = wallpaperMeta?.uploadedAt
    ? new Date(wallpaperMeta.uploadedAt).getTime()
    : 0;
  const wallpaperUrl = wallpaperBaseUrl
    ? `${wallpaperBaseUrl}${wallpaperBaseUrl.includes('?') ? '&' : '?'}v=${wallpaperVersion || 1}`
    : null;
  const winStreak = Number((profile as any)?.winStreak || 0);
  const streakGlowColor = winStreak > 5 ? 'rgba(51, 181, 255, 0.9)' : (winStreak > 3 ? 'rgba(176, 122, 255, 0.85)' : 'rgba(255, 255, 255, 0.1)');

  const copyStatusCard = async () => {
    const targetId = String(profile?.id || user?.id || '').trim();
    if (!targetId) return;
    const cardUrl = getFullUrl(`/api/intelligence/telegram/player-card/${targetId}.svg`);
    try {
      await navigator.clipboard.writeText(cardUrl);
      addNotification({
        type: 'success',
        title: 'Status card copied',
        message: 'Player status card URL copied to clipboard'
      });
    } catch {
      addNotification({
        type: 'warning',
        title: 'Copy failed',
        message: cardUrl
      });
    }
  };

  const handleWallpaperUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    try {
      setIsUploadingWallpaper(true);
      const uploaded = await api.uploadImage(file);
      await api.post('/api/profile/wallpaper', { wallpaperUrl: uploaded.url });
      await refetchProfile();
      addNotification({
        type: 'success',
        title: 'Wallpaper updated',
        message: 'Your profile wallpaper is now public'
      });
    } catch (error: any) {
      addNotification({
        type: 'error',
        title: 'Wallpaper update failed',
        message: error?.message || 'You need active subscription (5 days) and at least 1 played tournament'
      });
    } finally {
      setIsUploadingWallpaper(false);
    }
  };

  const removeWallpaper = async () => {
    try {
      await api.delete('/api/profile/wallpaper');
      await refetchProfile();
      addNotification({
        type: 'success',
        title: 'Wallpaper removed',
        message: 'Profile wallpaper removed'
      });
    } catch (error: any) {
      addNotification({
        type: 'error',
        title: 'Failed',
        message: error?.message || 'Failed to remove wallpaper'
      });
    }
  };

  const exportHistoryCsv = async () => {
    if (!profileId) return;
    try {
      setIsExportingHistory(true);
      const blob = await historyService.exportPlayerHistoryCsv(profileId);
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `player-${profileId}-tournament-history.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error: any) {
      addNotification({
        type: 'error',
        title: 'Export failed',
        message: error?.message || 'Failed to export tournament history'
      });
    } finally {
      setIsExportingHistory(false);
    }
  };

  return (
    <Container>
      <ProfileHeader $wallpaperUrl={wallpaperUrl} $streakGlowColor={streakGlowColor}>
        <Avatar
          $size={avatarSize}
          $hasImage={!!(profile?.profileLogo || profile?.photoUrl)}
          $imageUrl={profile?.profileLogo || profile?.photoUrl}
          onClick={() => setIsPhotoUploadOpen(true)}
        >
          <FlameAuraAvatar
            imageUrl={getFullAvatarUrl(profile?.profileLogo || profile?.photoUrl) || undefined}
            fallbackText={profile?.username || 'U'}
            size={avatarSize}
            tier={profileTier}
            intensity={profileIntensity}
          />
        </Avatar>
        <ProfileInfo>
          <ProfileTop>
            <IdentityBlock>
              <Username>{profile?.username || t('defaultUsername')}</Username>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '6px', justifyContent: 'center', flexWrap: 'wrap' }}>
                {isEditingUsername ? (
                  <>
                    <InlineInput
                      value={newUsername}
                      onChange={(e) => setNewUsername(e.target.value)}
                      maxLength={32}
                      placeholder="Username"
                    />
                    <InlineConfirm onClick={handleSaveUsername} disabled={isSavingUsername}>
                      {isSavingUsername ? t('saving') : t('save')}
                    </InlineConfirm>
                    <InlineCancel onClick={() => { setIsEditingUsername(false); setNewUsername(profile?.username || ''); }}>
                      {t('cancelAction')}
                    </InlineCancel>
                  </>
                ) : (
                  <InlineAction onClick={() => setIsEditingUsername(true)}>
                    Change username
                  </InlineAction>
                )}
              </div>
              <UserOrg>{t('memberLabel')}</UserOrg>
              {aiGhostBadge && <GhostBadge>AI Ghost: {aiGhostBadge}</GhostBadge>}
              <Link to={`/profile/${profile?.id || user?.id}`} style={{ color: '#ff6b00', fontSize: '0.9rem', textDecoration: 'none' }}>
                {'\u{1F517}'} {t('viewPublicProfile')}
              </Link>
              <HeaderActionRow>
                <HeaderPrimaryButton onClick={copyStatusCard}>
                  Copy Player Card
                </HeaderPrimaryButton>
                {statusCardData?.shareLink ? (
                  <ShareLinkButton
                    href={statusCardData.shareLink}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Open Telegram Share
                  </ShareLinkButton>
                ) : null}
                {statusCardData?.points ? (
                  <span style={{ color: statusCardData.rankColor || '#ffd7b8', fontSize: '0.82rem' }}>
                    Points {Number(statusCardData.points).toFixed(0)} • WinRate {Number(statusCardData.winRate || 0).toFixed(1)}%
                  </span>
                ) : null}
              </HeaderActionRow>
              <WallpaperActionRow>
                <label style={{ display: 'inline-flex', width: '100%' }}>
                  <input
                    type="file"
                    accept="image/*"
                    style={{ display: 'none' }}
                    onChange={handleWallpaperUpload}
                    disabled={isUploadingWallpaper}
                  />
                  <WallpaperPrimaryButton as="span">
                    {isUploadingWallpaper ? 'Uploading wallpaper...' : 'Set Public Wallpaper'}
                  </WallpaperPrimaryButton>
                </label>
                {wallpaperUrl ? (
                  <WallpaperSecondaryButton onClick={removeWallpaper}>
                    Remove wallpaper
                  </WallpaperSecondaryButton>
                ) : null}
              </WallpaperActionRow>
            </IdentityBlock>
          </ProfileTop>
          <UserStats>
            <StatItem>
              <StatValue>{profile?.stats?.matches || 0}</StatValue>
              <StatLabel>{t('matches')}</StatLabel>
            </StatItem>
            <StatItem>
              <StatValue>{profile?.stats?.wins || 0}</StatValue>
              <StatLabel>{t('wins')}</StatLabel>
            </StatItem>
            <StatItem>
              <StatValue>{profile?.stats?.mvps || 0}</StatValue>
              <StatLabel>{t('mvps')}</StatLabel>
            </StatItem>
            <StatItem>
              <StatValue>{profile?.stats?.kdRatio || '0.00'}</StatValue>
              <StatLabel>{t('kdRatio')}</StatLabel>
            </StatItem>
          </UserStats>

          <div style={{ marginTop: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <StatLabel>{t('bioLabel')}</StatLabel>
              {!isEditingBio ? (
                <InlineAction onClick={() => setIsEditingBio(true)}>
                  {t('editBio')}
                </InlineAction>
              ) : (
                <div style={{ display: 'flex', gap: '10px' }}>
                  <InlineConfirm onClick={handleSaveBio} disabled={isSaving}>
                    {isSaving ? t('saving') : t('save')}
                  </InlineConfirm>
                  <InlineCancel onClick={() => setIsEditingBio(false)}>
                    {t('cancelAction')}
                  </InlineCancel>
                </div>
              )}
            </div>

            {isEditingBio ? (
              <textarea
                value={newBio}
                onChange={(e) => setNewBio(e.target.value)}
                style={{
                  width: '100%',
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid #333',
                  color: '#fff',
                  padding: '10px',
                  borderRadius: '8px',
                  minHeight: '80px',
                  resize: 'vertical'
                }}
                placeholder={t('bioPlaceholder')}
              />
            ) : (
              <Bio style={{ marginTop: 0 }}>{profile?.bio || t('noBio')}</Bio>
            )}
          </div>
        </ProfileInfo>
      </ProfileHeader>

      <StatsGrid>
        <StatsCard>
          <CardTitle>Tournament History</CardTitle>
          <TournamentHistorySection
            loading={isHistoryLoading}
            emptyText="No tournament history yet."
            controls={
              <TournamentHistoryFilters
                game={historyBaseGameFilter}
                status={historyBaseStatusFilter}
                sort={historyBaseSort}
                onGameChange={setHistoryBaseGameFilter}
                onStatusChange={setHistoryBaseStatusFilter}
                onSortChange={setHistoryBaseSort}
              />
            }
            items={historyItems.map((item) => ({
              key: item.tournamentId,
              to: `/tournament/${item.tournamentId}`,
              title: item.tournamentName,
              subtitle: `${item.game} • ${item.matches} matches • ${item.wins}W/${item.losses}L`,
              rightText: `${item.winRate.toFixed(1)}%`
            }))}
            pagination={{
              page: historyBasePagination.page,
              totalPages: historyBasePagination.totalPages,
              loading: isHistoryLoading,
              onPrev: () => setHistoryBasePage((p) => Math.max(1, p - 1)),
              onNext: () => setHistoryBasePage((p) => Math.min(historyBasePagination.totalPages, p + 1))
            }}
          />
        </StatsCard>

        <StatsCard>
          <CardTitle>{t('achievementsLabel')}</CardTitle>
          <div style={{ color: '#999', fontStyle: 'italic', textAlign: 'center', padding: '40px 0' }}>
            {t('noAchievementsYet')}
          </div>
        </StatsCard>
      </StatsGrid>

      <StatsCard>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
          <span style={{ fontSize: '1.5rem' }}>{'\u{1F4CA}'}</span>
          <CardTitle style={{ margin: 0 }}>
            Premium Match History <span style={{ fontSize: '0.75rem', color: '#ffb074' }}>PRO</span>
          </CardTitle>
        </div>

        {!hasActiveSubscription ? (
          <div style={{ color: '#c7c7c7' }}>
            Detailed match history, filters and CSV export are available with active subscription.
          </div>
        ) : (
          <>
            <StatFilters>
              <StatFilterButton variant="brand">Tournaments ({historySummary.tournaments})</StatFilterButton>
              <StatFilterButton variant="outline">Matches ({historySummary.matches})</StatFilterButton>
              <StatFilterButton variant="outline">Winrate ({historySummary.winRate.toFixed(1)}%)</StatFilterButton>
            </StatFilters>

            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 12 }}>
              <select
                value={historyGameFilter}
                onChange={(e) => setHistoryGameFilter(e.target.value)}
                style={{ minHeight: 36, background: '#121418', color: '#fff', border: '1px solid #2b2f38', borderRadius: 8, padding: '0 10px' }}
              >
                <option value="all">All games</option>
                <option value="Critical Ops">Critical Ops</option>
                <option value="CS2">CS2</option>
                <option value="PUBG Mobile">PUBG Mobile</option>
                <option value="Standoff 2">Standoff 2</option>
                <option value="Dota 2">Dota 2</option>
                <option value="Valorant Mobile">Valorant Mobile</option>
              </select>
              <select
                value={historySort}
                onChange={(e) => setHistorySort(e.target.value as 'recent' | 'oldest')}
                style={{ minHeight: 36, background: '#121418', color: '#fff', border: '1px solid #2b2f38', borderRadius: 8, padding: '0 10px' }}
              >
                <option value="recent">Recent first</option>
                <option value="oldest">Oldest first</option>
              </select>
              <input
                type="date"
                value={historyFromFilter}
                onChange={(e) => setHistoryFromFilter(e.target.value)}
                style={{ minHeight: 36, background: '#121418', color: '#fff', border: '1px solid #2b2f38', borderRadius: 8, padding: '0 10px' }}
              />
              <input
                type="date"
                value={historyToFilter}
                onChange={(e) => setHistoryToFilter(e.target.value)}
                style={{ minHeight: 36, background: '#121418', color: '#fff', border: '1px solid #2b2f38', borderRadius: 8, padding: '0 10px' }}
              />
              <Button size="small" variant="outline" onClick={() => refetchDetailedHistory()} disabled={isDetailedHistoryLoading}>
                {isDetailedHistoryLoading ? 'Refreshing...' : 'Refresh'}
              </Button>
              <Button size="small" variant="outline" onClick={exportHistoryCsv} disabled={isExportingHistory}>
                {isExportingHistory ? 'Exporting...' : 'Export CSV'}
              </Button>
            </div>

            {isDetailedHistoryLoading ? (
              <div style={{ color: '#999' }}>Loading detailed history...</div>
            ) : !detailedItems.length ? (
              <div style={{ color: '#999' }}>No matches for selected filters.</div>
            ) : (
              <HistoryList>
                {detailedItems.map((row: any) => (
                  <TournamentHistoryRow
                    key={row.matchId}
                    to={`/tournament/${row.tournamentId}`}
                    title={row.tournamentName}
                    subtitle={`${row.game} • vs ${row.opponentTeam?.name || 'Team'} • ${row.score} • ${row.result.toUpperCase()}`}
                    rightText={row.result === 'win' ? 'W' : 'L'}
                    rightColor={row.result === 'win' ? '#79d888' : '#ff8a80'}
                  />
                ))}
              </HistoryList>
            )}
            <HistoryPagination
              page={detailedPagination.page}
              totalPages={detailedPagination.totalPages}
              loading={isDetailedHistoryLoading}
              onPrev={() => setHistoryPage((p) => Math.max(1, p - 1))}
              onNext={() => setHistoryPage((p) => Math.min(detailedPagination.totalPages, p + 1))}
            />
          </>
        )}
      </StatsCard>

      <AchievementsSection />

      <ReferralCard />
      <SubscriptionCard onManageSubscription={() => setIsSubscriptionOpen(true)} />

      <StatsCard>
        <CardTitle>Emergency Support</CardTitle>
        <SupportChat source="profile" subject="Profile Support" />
      </StatsCard>

      {/* Modals */}
      <SubscriptionModal
        isOpen={isSubscriptionOpen}
        onClose={() => setIsSubscriptionOpen(false)}
      />

      <PhotoUploadModal
        isOpen={isPhotoUploadOpen}
        onClose={() => setIsPhotoUploadOpen(false)}
        onUpload={handlePhotoUpload}
      />
    </Container>
  );
};

export default ProfilePage;
