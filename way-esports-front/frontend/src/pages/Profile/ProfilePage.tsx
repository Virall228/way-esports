import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import SubscriptionModal from '../../components/Subscription/SubscriptionModal';
import PhotoUploadModal from '../../components/Profile/PhotoUploadModal';
import AchievementsSection from '../../components/Profile/AchievementsSection';
import ReferralCard from '../../components/Referral/ReferralCard';
import SubscriptionCard from '../../components/Subscription/SubscriptionCard';
import SupportChat from '../../components/Support/SupportChat';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useNotifications } from '../../contexts/NotificationContext';
import { api, ApiError } from '../../services/api';
import { getFullUrl } from '../../config/api';
import { Link } from 'react-router-dom';
import { useProfileQuery } from '../../hooks/useProfileQuery';
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
  padding: 20px;
  width: 100%;
  max-width: 100%;
  margin: 0;
  color: ${({ theme }) => theme.colors.text.primary};
`;

const ProfileHeader = styled(Card).attrs({ variant: 'elevated' })`
  background:
    linear-gradient(180deg, rgba(12, 13, 16, 0.74) 0%, rgba(7, 8, 10, 0.86) 100%),
    rgba(255, 255, 255, 0.05);
  background-size: cover;
  background-position: center;
  border-radius: 16px;
  padding: 30px;
  margin-bottom: 30px;
  border: 1px solid ${({ theme }) => theme.colors.border.light};
  display: flex;
  align-items: flex-start;
  gap: 30px;
  flex-wrap: wrap;
`;

const Avatar = styled.div<{ $hasImage?: boolean; $imageUrl?: string | null }>`
  width: 120px;
  height: 120px;
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
`;

const WallpaperActionRow = styled.div`
  margin-top: 14px;
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
`;

const ProfileInfo = styled.div`
  flex: 1;
`;

const ProfileTop = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 20px;
`;

const Username = styled.h1`
  font-size: 2.5rem;
  margin-bottom: 5px;
  color: ${({ theme }) => theme.colors.text.primary};
`;

const UserOrg = styled.div`
  color: ${({ theme }) => theme.colors.text.secondary};
  font-size: 1.1rem;
  margin-bottom: 15px;
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
`;

const UserStats = styled.div`
  display: flex;
  gap: 30px;
  flex-wrap: wrap;
`;

const StatItem = styled.div`
  text-align: center;
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

const ProfilePage: React.FC = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const { addNotification } = useNotifications();
  const { data: profileData, refetch: refetchProfile } = useProfileQuery();
  const profile = profileData || user;
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

  return (
    <Container>
      <ProfileHeader
        style={{
          background: wallpaperUrl
            ? `linear-gradient(180deg, rgba(10, 10, 12, 0.6) 0%, rgba(4, 5, 8, 0.8) 100%), url("${wallpaperUrl}") center / cover no-repeat`
            : undefined,
          boxShadow: `0 0 0 1px ${streakGlowColor}, 0 0 28px ${streakGlowColor.replace('0.9', '0.35').replace('0.85', '0.3')}`
        }}
      >
        <Avatar
          $hasImage={!!(profile?.profileLogo || profile?.photoUrl)}
          $imageUrl={profile?.profileLogo || profile?.photoUrl}
          onClick={() => setIsPhotoUploadOpen(true)}
        >
          <FlameAuraAvatar
            imageUrl={getFullAvatarUrl(profile?.profileLogo || profile?.photoUrl) || undefined}
            fallbackText={profile?.username || 'U'}
            size={120}
            tier={profileTier}
            intensity={profileIntensity}
          />
        </Avatar>
        <ProfileInfo>
          <ProfileTop>
            <div>
              <Username>{profile?.username || t('defaultUsername')}</Username>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '6px' }}>
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
              <div style={{ marginTop: 10, display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                <Button
                  size="small"
                  variant="outline"
                  onClick={copyStatusCard}
                >
                  Copy Player Card
                </Button>
                {statusCardData?.shareLink ? (
                  <a
                    href={statusCardData.shareLink}
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      color: '#ff6b00',
                      fontSize: '0.85rem',
                      textDecoration: 'none',
                      border: '1px solid rgba(255,107,0,0.5)',
                      borderRadius: 10,
                      padding: '6px 10px'
                    }}
                  >
                    Open Telegram Share
                  </a>
                ) : null}
                {statusCardData?.points ? (
                  <span style={{ color: statusCardData.rankColor || '#ffd7b8', fontSize: '0.82rem' }}>
                    Points {Number(statusCardData.points).toFixed(0)} • WinRate {Number(statusCardData.winRate || 0).toFixed(1)}%
                  </span>
                ) : null}
              </div>
              <WallpaperActionRow>
                <label style={{ display: 'inline-flex' }}>
                  <input
                    type="file"
                    accept="image/*"
                    style={{ display: 'none' }}
                    onChange={handleWallpaperUpload}
                    disabled={isUploadingWallpaper}
                  />
                  <Button size="small" variant="outline" as="span">
                    {isUploadingWallpaper ? 'Uploading wallpaper...' : 'Set Public Wallpaper'}
                  </Button>
                </label>
                {wallpaperUrl ? (
                  <Button size="small" variant="text" onClick={removeWallpaper}>
                    Remove wallpaper
                  </Button>
                ) : null}
                <span style={{ color: '#9ea7b4', fontSize: '12px' }}>
                  Unlock: subscription 5+ days and at least 1 played tournament (admins free).
                </span>
              </WallpaperActionRow>
            </div>
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
          <CardTitle>{t('recentMatches')}</CardTitle>
          <div style={{ color: '#999', fontStyle: 'italic', textAlign: 'center', padding: '40px 0' }}>
            {t('noRecentMatches')}
          </div>
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
          <CardTitle style={{ margin: 0 }}>{t('matchStatistics')}</CardTitle>
        </div>

        <StatFilters>
          <StatFilterButton variant="brand">{t('allMatches')} (0)</StatFilterButton>
          <StatFilterButton variant="outline">{t('wins')} (0)</StatFilterButton>
          <StatFilterButton variant="outline">{t('losses')} (0)</StatFilterButton>
        </StatFilters>

        <div style={{ color: '#999', fontStyle: 'italic', textAlign: 'center', padding: '40px 0' }}>
          {t('noMatchStats')}
        </div>
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
