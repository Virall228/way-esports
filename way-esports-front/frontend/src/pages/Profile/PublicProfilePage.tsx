import React from 'react';
import { useParams } from 'react-router-dom';
import styled from 'styled-components';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../services/api';
import { historyService } from '../../services/historyService';
import { getFullUrl } from '../../config/api';
import Card from '../../components/UI/Card';
import FlameAuraAvatar from '../../components/UI/FlameAuraAvatar';
import { getTierByPoints, getIntensityByPointsAndRank, getPlayerPoints } from '../../utils/flameRank';
import Button from '../../components/UI/Button';
import { TournamentHistoryFilters, TournamentHistorySection } from '../../components/History';

const Container = styled.div`
  padding: 2rem 1rem;
  width: 100%;
  max-width: 100%;
  margin: 0;
  color: #fff;
`;

const ProfileHeader = styled(Card)<{
  $wallpaper?: string;
  $streakGlowColor?: string;
}>`
  position: relative;
  overflow: hidden;
  display: flex;
  align-items: center;
  gap: 2rem;
  padding: 2rem;
  margin-bottom: 2rem;
  background: ${({ theme }) => `linear-gradient(135deg, ${theme.colors.bg.secondary}, ${theme.colors.bg.tertiary})`};
  box-shadow: ${({ $streakGlowColor = 'rgba(255,255,255,0.12)' }) =>
    `0 0 0 1px ${$streakGlowColor}, 0 0 26px ${$streakGlowColor.replace('0.9', '0.35').replace('0.85', '0.3')}`};
  min-width: 0;
  & > * {
    position: relative;
    z-index: 1;
  }

  &::before {
    content: '';
    position: absolute;
    inset: 0;
    background-image: ${({ $wallpaper }) => ($wallpaper ? `url("${$wallpaper}")` : 'none')};
    background-size: cover;
    background-position: center;
    background-repeat: no-repeat;
    opacity: ${({ $wallpaper }) => ($wallpaper ? 0.28 : 0)};
    filter: blur(2px) saturate(0.9) contrast(0.9);
    transform: scale(1.04);
    z-index: 0;
  }

  &::after {
    content: '';
    position: absolute;
    inset: 0;
    background:
      linear-gradient(180deg, rgba(4, 5, 8, 0.14) 0%, rgba(4, 5, 8, 0.52) 65%, rgba(4, 5, 8, 0.8) 100%),
      radial-gradient(120% 85% at 15% 10%, rgba(255, 107, 0, 0.08) 0%, rgba(255, 107, 0, 0) 55%);
    z-index: 0;
  }

  @media (max-width: 600px) {
    flex-direction: column;
    text-align: center;
    padding: 1.1rem;
    gap: 1rem;

    &::before {
      background-position: center 28%;
      opacity: ${({ $wallpaper }) => ($wallpaper ? 0.22 : 0)};
      filter: blur(3px) saturate(0.86) contrast(0.86);
    }
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
  min-width: 0;
`;

const Username = styled.h1`
  font-size: 2.5rem;
  margin-bottom: 0.5rem;
  color: #ff6b00;
  word-break: break-word;
  overflow-wrap: anywhere;

  @media (max-width: 600px) {
    font-size: 1.7rem;
    line-height: 1.2;
  }
`;

const RealName = styled.h2`
  font-size: 1.2rem;
  color: #ccc;
  margin-bottom: 1rem;
  word-break: break-word;
  overflow-wrap: anywhere;

  @media (max-width: 600px) {
    font-size: 1rem;
    line-height: 1.25;
  }
`;

const ActionRow = styled.div`
  margin-top: 12px;
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  align-items: center;

  @media (max-width: 600px) {
    justify-content: center;
  }
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
    const [historyGameFilter, setHistoryGameFilter] = React.useState<string>('all');
    const [historyStatusFilter, setHistoryStatusFilter] = React.useState<string>('all');
    const [historySort, setHistorySort] = React.useState<'recent' | 'oldest'>('recent');
    const [historyPage, setHistoryPage] = React.useState<number>(1);
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

    const { data: historyData, isLoading: isHistoryLoading } = useQuery({
        queryKey: ['history', 'player', id, 'public', historyGameFilter, historyStatusFilter, historySort, historyPage],
        queryFn: async () => {
            if (!id) return null;
            return historyService.getPlayerHistory(id, historyPage, 8, {
                game: historyGameFilter === 'all' ? '' : historyGameFilter,
                status: historyStatusFilter === 'all' ? '' : historyStatusFilter,
                sort: historySort
            });
        },
        enabled: Boolean(id),
        staleTime: 30000,
        refetchOnWindowFocus: false
    });

    React.useEffect(() => {
        setHistoryPage(1);
    }, [historyGameFilter, historyStatusFilter, historySort]);

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
            <ProfileHeader $wallpaper={wallpaper} $streakGlowColor={streakGlowColor}>
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
                    <ActionRow>
                        <Button size="small" variant="outline" onClick={copyPlayerCardLink}>
                            Copy Player Card
                        </Button>
                        {statusCard?.shareLink ? (
                            <a href={statusCard.shareLink} target="_blank" rel="noreferrer" style={{ color: '#ff6b00', fontSize: '0.9rem', textDecoration: 'none' }}>
                                Open Telegram Share
                            </a>
                        ) : null}
                    </ActionRow>
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

            <h3>Tournament History</h3>
            <TournamentHistorySection
                loading={isHistoryLoading}
                emptyText="No tournament history yet."
                controls={
                    <TournamentHistoryFilters
                        game={historyGameFilter}
                        status={historyStatusFilter}
                        sort={historySort}
                        onGameChange={setHistoryGameFilter}
                        onStatusChange={setHistoryStatusFilter}
                        onSortChange={setHistorySort}
                    />
                }
                items={(historyData?.items || []).map((item: any) => ({
                    key: item.tournamentId,
                    title: item.tournamentName,
                    subtitle: `${item.game} • ${item.matches} matches • ${item.wins}W/${item.losses}L`,
                    rightText: `${Number(item.winRate || 0).toFixed(1)}%`
                }))}
                pagination={{
                    page: historyData?.pagination?.page || 1,
                    totalPages: historyData?.pagination?.totalPages || 0,
                    loading: isHistoryLoading,
                    onPrev: () => setHistoryPage((p) => Math.max(1, p - 1)),
                    onNext: () => setHistoryPage((p) => Math.min(historyData?.pagination?.totalPages || 1, p + 1))
                }}
            />
        </Container>
    );
};

export default PublicProfilePage;
