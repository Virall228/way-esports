import React from 'react';
import { useParams } from 'react-router-dom';
import styled from 'styled-components';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../services/api';
import { getFullUrl } from '../../config/api';
import Card from '../../components/UI/Card';
import FlameAuraAvatar from '../../components/UI/FlameAuraAvatar';
import { getTierByPoints, getIntensityByPointsAndRank, getPlayerPoints } from '../../utils/flameRank';
import Button from '../../components/UI/Button';

const Container = styled.div`
  padding: 2rem 1rem;
  width: 100%;
  max-width: 100%;
  margin: 0;
  color: #fff;
`;

const ProfileHeader = styled(Card)`
  display: flex;
  align-items: center;
  gap: 2rem;
  padding: 2rem;
  margin-bottom: 2rem;
  background: linear-gradient(135deg, ${({ theme }) => theme.colors.bg.secondary}, ${({ theme }) => theme.colors.bg.tertiary});
  background-size: cover;
  background-position: center;

  @media (max-width: 600px) {
    flex-direction: column;
    text-align: center;
  }
`;

const AvatarWrap = styled.div`
  width: 150px;
  height: 150px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
`;

const Info = styled.div`
  flex: 1;
`;

const Username = styled.h1`
  font-size: 2.5rem;
  margin-bottom: 0.5rem;
  color: #ff6b00;
`;

const RealName = styled.h2`
  font-size: 1.2rem;
  color: #ccc;
  margin-bottom: 1rem;
`;

const Bio = styled.p`
  line-height: 1.6;
  color: #ddd;
  font-style: italic;
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin-bottom: 2rem;
`;

const StatItem = styled(Card)`
  text-align: center;
  padding: 1.5rem;
`;

const StatValue = styled.div`
  font-size: 2rem;
  font-weight: bold;
  color: #ff6b00;
`;

const StatLabel = styled.div`
  color: #aaa;
  font-size: 0.9rem;
  text-transform: uppercase;
`;

const PublicProfilePage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const toAvatarUrl = (value?: string | null) => {
        if (!value) return '/images/default-avatar.png';
        if (value.startsWith('http')) return value;
        const normalized = value.startsWith('/') ? value : `/${value}`;
        if (normalized.startsWith('/api/uploads/')) return getFullUrl(normalized);
        if (normalized.startsWith('/uploads/')) return getFullUrl(`/api${normalized}`);
        return normalized;
    };
    const { data: profile, isLoading, error } = useQuery({
        queryKey: ['profile', id],
        queryFn: async () => {
            const res: any = await api.get(`/api/profile/${id}/public`);
            if (res?.success === false) {
                throw new Error('Profile not found');
            }
            return res?.data || res;
        },
        enabled: Boolean(id),
        staleTime: 30000,
        refetchOnWindowFocus: false
    });

    const { data: statusCard } = useQuery({
        queryKey: ['public-profile-card', id],
        queryFn: async () => {
            if (!id) return null;
            const res: any = await api.get(`/api/intelligence/telegram/player-card/${id}`);
            return res?.data || res || null;
        },
        enabled: Boolean(id),
        staleTime: 30000,
        refetchOnWindowFocus: false
    });

    if (isLoading) return <Container>Loading profile...</Container>;
    if (error || !profile) {
        const message = (error as Error | undefined)?.message || 'Not found';
        return <Container>Error: {message}</Container>;
    }

    const wins = Number(profile?.stats?.wins || 0);
    const losses = Number(profile?.stats?.losses || 0);
    const points = getPlayerPoints(wins, losses);
    const profileTier = getTierByPoints(points);
    const profileIntensity = getIntensityByPointsAndRank(points);
    const wallpaperMeta = profile?.profileWallpaper;
    const wallpaperBase = wallpaperMeta?.status === 'removed'
      ? ''
      : toAvatarUrl(wallpaperMeta?.url || '');
    const wallpaperVersion = wallpaperMeta?.uploadedAt
      ? new Date(wallpaperMeta.uploadedAt).getTime()
      : 1;
    const wallpaper = wallpaperBase
      ? `${wallpaperBase}${wallpaperBase.includes('?') ? '&' : '?'}v=${wallpaperVersion || 1}`
      : '';
    const winStreak = Number(profile?.winStreak || 0);
    const streakGlowColor = winStreak > 5 ? 'rgba(51, 181, 255, 0.9)' : (winStreak > 3 ? 'rgba(176, 122, 255, 0.85)' : 'rgba(255,255,255,0.12)');

    const copyPlayerCardLink = async () => {
        if (!id) return;
        const cardUrl = getFullUrl(`/api/intelligence/telegram/player-card/${id}.svg`);
        try {
            await navigator.clipboard.writeText(cardUrl);
        } catch {
            // ignore clipboard errors
        }
    };

    return (
        <Container>
            <ProfileHeader
                style={{
                    background: wallpaper
                      ? `linear-gradient(180deg, rgba(10, 10, 12, 0.62) 0%, rgba(4, 5, 8, 0.84) 100%), url("${wallpaper}") center / cover no-repeat`
                      : undefined,
                    boxShadow: `0 0 0 1px ${streakGlowColor}, 0 0 26px ${streakGlowColor.replace('0.9', '0.35').replace('0.85', '0.3')}`
                }}
            >
                <AvatarWrap>
                    <FlameAuraAvatar
                        imageUrl={toAvatarUrl(profile.profileLogo || profile.photoUrl)}
                        fallbackText={profile.username || 'U'}
                        size={150}
                        tier={profileTier}
                        intensity={profileIntensity}
                    />
                </AvatarWrap>
                <Info>
                    <Username>{profile.username}</Username>
                    <RealName>{profile.firstName} {profile.lastName}</RealName>
                    <Bio>{profile.bio || "This user hasn't set a bio yet."}</Bio>
                    <div style={{ marginTop: '12px', display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                        <Button size="small" variant="outline" onClick={copyPlayerCardLink}>
                            Copy Player Card
                        </Button>
                        {statusCard?.shareLink ? (
                            <a href={statusCard.shareLink} target="_blank" rel="noreferrer" style={{ color: '#ff6b00', fontSize: '0.9rem', textDecoration: 'none' }}>
                                Open Telegram Share
                            </a>
                        ) : null}
                    </div>
                </Info>
            </ProfileHeader>

            <StatsGrid>
                <StatItem>
                    <StatValue>{profile.stats?.tournamentsPlayed || 0}</StatValue>
                    <StatLabel>Tournaments Played</StatLabel>
                </StatItem>
                <StatItem>
                    <StatValue>{profile.stats?.tournamentsWon || 0}</StatValue>
                    <StatLabel>Tournaments Won</StatLabel>
                </StatItem>
                <StatItem>
                    <StatValue>{profile.teams?.length || 0}</StatValue>
                    <StatLabel>Teams Joined</StatLabel>
                </StatItem>
            </StatsGrid>

            <h3>Game Profiles</h3>
            <StatsGrid>
                {(profile.gameProfiles || []).map((gp: any) => (
                    <StatItem key={gp.game}>
                        <StatLabel>{gp.game}</StatLabel>
                        <StatValue style={{ fontSize: '1.2rem' }}>{gp.username}</StatValue>
                    </StatItem>
                ))}
            </StatsGrid>
        </Container>
    );
};

export default PublicProfilePage;
