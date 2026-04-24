import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styled, { useTheme } from 'styled-components';
import Card from '../../components/UI/Card';
import Button from '../../components/UI/Button';
import SurfacePanel from '../../components/UI/SurfacePanel';
import SectionHeading from '../../components/UI/SectionHeading';
import { api } from '../../services/api';
import { useLanguage } from '../../contexts/LanguageContext';
import { useAuth } from '../../contexts/AuthContext';
import { designTokens } from '../../styles/designTokens';

const Container = styled.div`
  box-sizing: border-box;
  padding: 40px;
  width: 100%;
  max-width: 100%;
  margin: 0;
  color: ${({ theme }) => theme.colors.text.primary};
  overflow-x: clip;

  @media (max-width: 768px) {
    padding: 16px;
  }
`;

const HeroSection = styled(Card).attrs({ variant: 'elevated' })`
  background: ${({ theme }) =>
    theme.isLight
      ? theme.colors.bg.secondary
      : 'linear-gradient(135deg, rgba(7, 8, 10, 0.92) 0%, rgba(13, 15, 19, 0.86) 54%, rgba(30, 14, 4, 0.7) 100%)'};
  border: 1px solid ${({ theme }) => (theme.isLight ? theme.colors.border.medium : theme.colors.glass.panelBorder)};
  border-radius: 20px;
  padding: 80px 40px;
  text-align: center;
  margin-bottom: 60px;
  position: relative;
  overflow: hidden;
  box-shadow: ${({ theme }) => (theme.isLight ? theme.shadows.large : '0 28px 70px rgba(0, 0, 0, 0.55), 0 0 50px rgba(255, 107, 0, 0.12)')};
  
  &::before {
    content: '';
    position: absolute;
    inset: 0;
    background: ${({ theme }) =>
      theme.isLight
        ? "url('/images/main2.png') center/cover"
        : `
      linear-gradient(180deg, rgba(0, 0, 0, 0.42), rgba(5, 6, 7, 0.82)),
      radial-gradient(circle at 12% 50%, rgba(255, 107, 0, 0.28), transparent 28%),
      radial-gradient(circle at 86% 48%, rgba(255, 138, 31, 0.22), transparent 26%),
      url('/images/way-twitter-banner-bg.jpg') center/cover
    `};
    opacity: ${({ theme }) => (theme.isLight ? 0.1 : 0.72)};
    z-index: 0;
  }

  &::after {
    content: '';
    position: absolute;
    inset: 0;
    background:
      linear-gradient(118deg, transparent 0 41%, rgba(255, 138, 31, 0.2) 41.5%, transparent 42%),
      linear-gradient(64deg, transparent 0 62%, rgba(255, 255, 255, 0.08) 62.25%, transparent 63%);
    opacity: ${({ theme }) => (theme.isLight ? 0 : 1)};
    z-index: 0;
    pointer-events: none;
  }
  
  > * {
    position: relative;
    z-index: 1;
  }

  @media (max-width: 768px) {
    padding: 28px 16px;
    margin-bottom: 28px;
    border-radius: 14px;
    background: ${({ theme }) => theme.colors.bg.secondary};
    box-shadow: none;

    &::before {
      opacity: 0;
      background: none;
    }
  }
`;

const Logo = styled.div`
  width: 120px;
  height: 120px;
  background:
    url('/images/way-main-logo-metal-v2.jpg?v=3') center/cover no-repeat,
    url('/images/way-esports-logo.png.jpg') center/cover no-repeat;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 30px;
  border: 1px solid ${({ theme }) => (theme.isLight ? theme.colors.border.medium : 'rgba(255, 177, 93, 0.42)')};
  box-shadow: ${({ theme }) =>
    theme.isLight
      ? '0 12px 28px rgba(0, 0, 0, 0.18)'
      : '0 16px 36px rgba(0, 0, 0, 0.46), 0 0 34px rgba(255, 107, 0, 0.22)'};
  overflow: hidden;

  @media (max-width: 768px) {
    width: 88px;
    height: 88px;
    margin: 0 auto 16px;
  }
`;

const HeroTitle = styled.h1`
  font-size: 4rem;
  font-weight: 900;
  color: ${({ theme }) => theme.colors.text.primary};
  margin-bottom: 20px;
  letter-spacing: 4px;
  text-shadow: ${({ theme }) => (theme.isLight ? '0 6px 18px rgba(132, 95, 58, 0.16)' : '0 0 22px rgba(255, 255, 255, 0.18), 0 0 38px rgba(255, 107, 0, 0.18)')};

  @media (max-width: 768px) {
    font-size: 2rem;
    letter-spacing: 1px;
    margin-bottom: 10px;
  }
`;

const HeroSubtitle = styled.p`
  font-size: 1.3rem;
  color: ${({ theme }) => theme.colors.text.secondary};
  margin-bottom: 40px;
  line-height: 1.6;

  @media (max-width: 768px) {
    font-size: 0.95rem;
    margin-bottom: 18px;
  }
`;

const CTAButton = styled(Button).attrs({ variant: 'brand', size: 'large' })`
  padding: 18px 40px;
  border-radius: 8px;
  font-size: 1.1rem;
  letter-spacing: 1px;
  transition: transform 0.15s ease, box-shadow 0.15s ease;

  &:hover {
    transform: translateY(-1px);
  }

  @media (max-width: 768px) {
    width: 100%;
    font-size: 0.95rem;
    padding: 12px 14px;
    transition: none;

    &:hover {
      transform: none;
    }
  }
`;

const FeaturesGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
  gap: 40px;
  margin-bottom: 80px;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    gap: 12px;
    margin-bottom: 24px;
  }
`;

const FeatureCard = styled(Card).attrs({ variant: 'outlined' })`
  background: ${({ theme }) =>
    theme.isLight
      ? 'linear-gradient(180deg, rgba(255, 255, 255, 0.9) 0%, rgba(250, 245, 238, 0.88) 100%)'
      : '#2a2a2a'};
  border: 1px solid ${({ theme }) => (theme.isLight ? theme.colors.border.light : 'rgba(255, 255, 255, 0.1)')};
  border-radius: 16px;
  padding: 40px;
  text-align: center;
  transition: all 0.3s ease;

  &:hover { transform: translateY(-10px); border-color: ${({ theme }) => theme.colors.border.strong}; box-shadow: ${({ theme }) => (theme.isLight ? '0 22px 40px rgba(109, 78, 44, 0.12)' : '0 20px 40px rgba(0,0,0,0.3)')}; }

  @media (max-width: 768px) {
    padding: 18px 14px;
    border-radius: 12px;
    transition: none;

    &:hover {
      transform: none;
      box-shadow: none;
      border-color: ${({ theme }) => (theme.isLight ? theme.colors.border.light : 'rgba(255, 255, 255, 0.1)')};
    }
  }
`;

const PageRoot = styled.div`
  width: 100%;
  max-width: 100%;
  overflow-x: clip;

  @media (prefers-reduced-motion: reduce), (max-width: 768px) {
    * {
      animation: none !important;
      transition: none !important;
      scroll-behavior: auto !important;
    }
  }
`;

const FeatureIcon = styled.div`
  width: 80px;
  height: 80px;
  background: ${({ theme }) =>
    theme.isLight
      ? 'linear-gradient(135deg, rgba(255, 248, 240, 1), rgba(239, 225, 208, 1))'
      : `linear-gradient(135deg, ${theme.colors.gray[700]}, ${theme.colors.gray[900]})`};
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2rem;
  margin: 0 auto 25px;
  color: ${({ theme }) => (theme.isLight ? theme.colors.accent : '#ffffff')};
  border: 1px solid ${({ theme }) => (theme.isLight ? theme.colors.border.light : 'transparent')};

  @media (max-width: 768px) {
    width: 52px;
    height: 52px;
    border-radius: 12px;
    margin: 0 auto 10px;
    font-size: 1.35rem;
  }
`;

const FeatureTitle = styled.h3`
  font-size: 1.5rem;
  font-weight: 700;
  color: ${({ theme }) => theme.colors.text.primary};
  margin-bottom: 15px;

  @media (max-width: 768px) {
    font-size: 1.05rem;
    margin-bottom: 6px;
  }
`;

const FeatureDescription = styled.p`
  color: ${({ theme }) => theme.colors.text.secondary};
  line-height: 1.6;
  font-size: 1rem;

  @media (max-width: 768px) {
    font-size: 0.88rem;
    line-height: 1.45;
  }
`;

const StatsSection = styled.section`
  background: ${({ theme }) => theme.colors.bg.elevated};
  border-radius: 20px;
  padding: 60px 40px;
  margin-bottom: 80px;

  @media (max-width: 768px) {
    padding: 20px 14px;
    border-radius: 14px;
    margin-bottom: 20px;
  }
`;

const StatsTitle = styled.h2`
  font-size: 2.5rem;
  font-weight: 700;
  color: ${({ theme }) => theme.colors.text.primary};
  text-align: center;
  margin-bottom: 50px;
  letter-spacing: 2px;

  @media (max-width: 768px) {
    font-size: 1.35rem;
    margin-bottom: 14px;
    letter-spacing: 0.5px;
  }
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 40px;

  @media (max-width: 768px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 10px;
  }
`;

const StatCard = styled(Card).attrs({ variant: 'outlined' })`
  text-align: center;
  padding: 30px;
  background: ${({ theme }) => theme.colors.bg.secondary};
  border-radius: 12px;
  border: 1px solid ${({ theme }) => theme.colors.border.medium};

  @media (max-width: 768px) {
    padding: 12px 8px;
  }
`;

const StatNumber = styled.div`
  font-size: 3rem;
  font-weight: 900;
  color: ${({ theme }) => theme.colors.text.primary};
  margin-bottom: 10px;

  @media (max-width: 768px) {
    font-size: 1.35rem;
    margin-bottom: 4px;
  }
`;

const StatLabel = styled.div`
  color: ${({ theme }) => theme.colors.text.secondary};
  font-size: 1.1rem;
  font-weight: 500;

  @media (max-width: 768px) {
    font-size: 0.78rem;
  }
`;

const TopInfoGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, minmax(280px, 1fr));
  gap: 14px;
  margin-bottom: 14px;

  @media (max-width: 1600px) {
    grid-template-columns: repeat(2, minmax(280px, 1fr));
  }

  @media (max-width: 1280px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    gap: 10px;
    margin-bottom: 10px;
  }
`;

const BottomInfoGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(300px, 1fr));
  gap: 14px;
  margin-bottom: 20px;

  @media (max-width: 1600px) {
    grid-template-columns: 1fr;
  }

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    gap: 10px;
    margin-bottom: 14px;
  }
`;

const InfoCard = styled(SurfacePanel)`
  padding: 16px;
  min-height: 175px;
  min-width: 0;
  overflow: hidden;

  @media (max-width: 768px) {
    min-height: unset;
  }
`;

const InfoTitle = styled.h3`
  margin: 0 0 10px;
  font-size: 1rem;
  color: ${({ theme }) => theme.colors.text.primary};
`;

const TinyGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
`;

const TinyStat = styled.div`
  background: ${({ theme }) => (theme.isLight ? 'rgba(255, 255, 255, 0.74)' : 'rgba(255, 255, 255, 0.04)')};
  border: 1px solid ${({ theme }) => (theme.isLight ? theme.colors.border.light : 'rgba(255, 255, 255, 0.09)')};
  border-radius: 10px;
  padding: 10px;
`;

const TinyValue = styled.div`
  font-size: 1.1rem;
  font-weight: 800;
  color: ${({ theme }) => theme.colors.text.primary};
`;

const TinyLabel = styled.div`
  font-size: 0.78rem;
  color: ${({ theme }) => theme.colors.text.tertiary};
  margin-top: 2px;
`;

const QuickActions = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
`;

const ActionButton = styled(Button).attrs({ variant: 'outline', size: 'small' })`
  min-height: 34px;
  border-radius: ${designTokens.radius.pill};
  padding: 0 12px;
  max-width: 100%;
  white-space: normal;
  min-width: 0;
  text-align: center;
`;

const List = styled.div`
  display: grid;
  gap: 8px;
`;

const ListRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 10px;
  background: ${({ theme }) => (theme.isLight ? 'rgba(255, 255, 255, 0.74)' : 'rgba(255, 255, 255, 0.04)')};
  border: 1px solid ${({ theme }) => (theme.isLight ? theme.colors.border.light : 'rgba(255, 255, 255, 0.09)')};
  border-radius: 10px;
  padding: 10px;

  @media (max-width: 1024px) {
    align-items: flex-start;
  }
`;

const StatusPill = styled.span<{ $tone?: 'ok' | 'warn' }>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 999px;
  padding: 4px 8px;
  font-size: 0.72rem;
  border: 1px solid ${({ $tone }) => ($tone === 'warn' ? 'rgba(255,171,64,0.5)' : 'rgba(129,199,132,0.5)')};
  color: ${({ $tone }) => ($tone === 'warn' ? '#ffd180' : '#a5d6a7')};
  background: ${({ $tone }) => ($tone === 'warn' ? 'rgba(255,171,64,0.12)' : 'rgba(129,199,132,0.12)')};
  white-space: nowrap;
`;

const TimeMeta = styled.div`
  color: ${({ theme }) => theme.colors.text.tertiary};
  font-size: 0.74rem;
  margin-top: 2px;
`;

const RecommendationList = styled.div`
  display: grid;
  gap: 8px;
`;

const RecommendationRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 10px;
  background: ${({ theme }) => (theme.isLight ? 'rgba(255, 255, 255, 0.74)' : 'rgba(255, 255, 255, 0.04)')};
  border: 1px solid ${({ theme }) => (theme.isLight ? theme.colors.border.light : 'rgba(255, 255, 255, 0.09)')};
  border-radius: 10px;
  padding: 10px;

  @media (max-width: 1280px) {
    flex-direction: column;
    align-items: stretch;
  }
`;

const RecommendationText = styled.div`
  min-width: 0;
  flex: 1;
`;

const RecommendationTitle = styled.div`
  color: ${({ theme }) => theme.colors.text.primary};
  font-weight: 700;
  font-size: 0.86rem;
  line-height: 1.25;
  word-break: break-word;
  overflow-wrap: anywhere;
`;

const RecommendationDesc = styled.div`
  color: ${({ theme }) => theme.colors.text.secondary};
  font-size: 0.76rem;
  margin-top: 2px;
  line-height: 1.3;
  word-break: break-word;
  overflow-wrap: anywhere;
`;

const RecommendationActions = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
  flex-wrap: wrap;
  justify-content: flex-end;

  @media (max-width: 1280px) {
    justify-content: flex-start;
    width: 100%;
  }
`;

const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { user } = useAuth();
  const theme = useTheme();
  const hasScoutHubAccess = useMemo(() => {
    if (!user) return false;
    if (user.role === 'admin' || user.role === 'developer') return true;
    if (!user.isSubscribed) return false;
    if (!user.subscriptionExpiresAt) return true;
    const expiresAt = new Date(user.subscriptionExpiresAt).getTime();
    return Number.isNaN(expiresAt) || expiresAt > Date.now();
  }, [user]);
  const isMobile = useMemo(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(max-width: 768px)').matches;
  }, []);
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeTournaments: 0,
    activeTeams: 0,
    totalPrizePool: 0
  });
  const [recentNewsCount, setRecentNewsCount] = useState(0);
  const [liveTournaments, setLiveTournaments] = useState<Array<{ id: string; name: string; teams: number; status: string }>>([]);
  const [upcomingMatches, setUpcomingMatches] = useState<Array<{
    id: string;
    tournamentName: string;
    status: string;
    startTime: string | null;
    hasRoomCredentials?: boolean;
    roomVisibleAt?: string | null;
    myTeam?: { name?: string; tag?: string } | null;
    enemyTeam?: { name?: string; tag?: string } | null;
  }>>([]);

  const recommendations = useMemo(() => {
    const list: Array<{
      key: string;
      title: string;
      description: string;
      actionLabel: string;
      actionPath: string;
      tone: 'ok' | 'warn';
      priority: number;
    }> = [];

    if (!user?.isSubscribed) {
      list.push({
        key: 'sub',
        title: 'Activate subscription',
        description: 'Unlock all tournament entries and premium features.',
        actionLabel: 'Manage',
        actionPath: '/profile',
        tone: 'warn',
        priority: 1
      });
    }

    const freeEntries = Number((user as any)?.freeEntriesCount || 0);
    if (freeEntries > 0) {
      list.push({
        key: 'free',
        title: `Free tournament entry (${freeEntries})`,
        description: 'Welcome entry is active. Join your first tournament now.',
        actionLabel: 'Start',
        actionPath: '/tournaments',
        tone: 'ok',
        priority: 0
      });
    }

    const bonusEntries = Number((user as any)?.bonusEntries || 0);
    if (bonusEntries > 0) {
      list.push({
        key: 'bonus',
        title: `Use bonus entries (${bonusEntries})`,
        description: 'You can join tournaments now using bonus entries.',
        actionLabel: 'Join',
        actionPath: '/tournaments',
        tone: 'ok',
        priority: 2
      });
    }

    if (upcomingMatches.length > 0) {
      const first = upcomingMatches[0];
      const firstTime = first.startTime ? new Date(first.startTime).getTime() : NaN;
      const now = Date.now();
      const minutesLeft = Number.isFinite(firstTime) ? Math.floor((firstTime - now) / 60000) : null;
      const isSoon = minutesLeft !== null && minutesLeft >= 0 && minutesLeft <= 120;
      const isUrgent = minutesLeft !== null && minutesLeft >= 0 && minutesLeft <= 15;
      const roomVisibleAtTime = first.roomVisibleAt ? new Date(first.roomVisibleAt).getTime() : NaN;
      const canOpenRoomNow = first.hasRoomCredentials && Number.isFinite(roomVisibleAtTime) && roomVisibleAtTime <= now;

      list.push({
        key: 'match',
        title: isUrgent
          ? 'Match starts in under 15 min'
          : isSoon
            ? 'Match starts soon'
            : 'Upcoming match ready',
        description: isUrgent
          ? 'Open your match and verify room access.'
          : isSoon
          ? `${first.myTeam?.tag || first.myTeam?.name || 'My Team'} vs ${first.enemyTeam?.tag || first.enemyTeam?.name || 'Opponent'} in ${minutesLeft} min.`
          : `${first.myTeam?.tag || first.myTeam?.name || 'My Team'} vs ${first.enemyTeam?.tag || first.enemyTeam?.name || 'Opponent'}`,
        actionLabel: canOpenRoomNow ? 'Open Room' : 'Open',
        actionPath: '/matches',
        tone: isSoon ? 'warn' : 'ok',
        priority: isUrgent ? 0 : isSoon ? 1 : 3
      });
    } else {
      list.push({
        key: 'queue',
        title: 'No upcoming matches',
        description: 'Join a live tournament and get scheduled for a match.',
        actionLabel: 'Explore',
        actionPath: '/tournaments',
        tone: 'warn',
        priority: 4
      });
    }

    if (recentNewsCount > 0) {
      list.push({
        key: 'news',
        title: `New updates available (${recentNewsCount})`,
        description: 'Check latest news and platform announcements.',
        actionLabel: 'Read',
        actionPath: '/news',
        tone: 'ok',
        priority: 5
      });
    }

    return list.sort((a, b) => a.priority - b.priority).slice(0, 4);
  }, [user?.isSubscribed, (user as any)?.bonusEntries, (user as any)?.freeEntriesCount, upcomingMatches, recentNewsCount]);

  useEffect(() => {
    const run = async () => {
      try {
        if ((window as any).Telegram?.WebApp) {
          (window as any).Telegram.WebApp.ready();
          (window as any).Telegram.WebApp.expand();
        }

        const [res, newsRes, tournamentsRes, myMatchesRes]: any[] = await Promise.all([
          api.get('/api/stats'),
          api.get('/api/news?limit=3').catch(() => ({ data: [] })),
          api.get('/api/tournaments?limit=6').catch(() => ({ data: [] })),
          api.get('/api/matches/my/upcoming').catch(() => ({ data: [] }))
        ]);

        if (res?.success && res.data) {
          setStats({
            totalUsers: res.data.totalUsers || 0,
            activeTournaments: res.data.activeTournaments || 0,
            activeTeams: res.data.activeTeams || 0,
            totalPrizePool: res.data.totalPrizePool || 0
          });
        }

        const newsItems = Array.isArray(newsRes?.data) ? newsRes.data : [];
        setRecentNewsCount(newsItems.length);

        const tournamentItems = Array.isArray(tournamentsRes?.data) ? tournamentsRes.data : [];
        setLiveTournaments(
          tournamentItems
            .slice(0, 3)
            .map((row: any) => ({
              id: String(row?._id || row?.id || ''),
              name: String(row?.name || row?.title || 'Tournament'),
              teams: Array.isArray(row?.teams) ? row.teams.length : Number(row?.registeredTeams || row?.participantsCount || 0),
              status: String(row?.status || 'upcoming')
            }))
            .filter((row: any) => row.id)
        );

        const myMatches = Array.isArray(myMatchesRes?.data) ? myMatchesRes.data : [];
        setUpcomingMatches(
          myMatches
            .slice(0, 4)
            .map((row: any) => ({
              id: String(row?.id || row?._id || ''),
              tournamentName: String(row?.tournamentName || 'Tournament'),
              status: String(row?.status || 'scheduled'),
              startTime: row?.startTime ? String(row.startTime) : null,
              hasRoomCredentials: Boolean(row?.hasRoomCredentials),
              roomVisibleAt: row?.roomVisibleAt ? String(row.roomVisibleAt) : null,
              myTeam: row?.myTeam || null,
              enemyTeam: row?.enemyTeam || null
            }))
            .filter((row: any) => row.id)
        );
      } catch (e) {
        console.error('Failed to fetch stats:', e);
      }
    };
    run();
  }, []);

  return (
    <PageRoot>
      <Container>
      <HeroSection style={isMobile ? { minHeight: 'auto' } : undefined}>
        <Logo aria-label="WAY logo" />
        <HeroTitle>WAY ESPORTS</HeroTitle>
        <HeroSubtitle>
          {t('homeHeroSubtitle')}
        </HeroSubtitle>
        <CTAButton onClick={() => navigate('/tournaments')}>
          {t('joinTournament')}
        </CTAButton>
      </HeroSection>

      <TopInfoGrid>
        <InfoCard>
          <InfoTitle>Live Snapshot</InfoTitle>
          <TinyGrid>
            <TinyStat>
              <TinyValue>{stats.activeTournaments}</TinyValue>
              <TinyLabel>Active Tournaments</TinyLabel>
            </TinyStat>
            <TinyStat>
              <TinyValue>{stats.activeTeams}</TinyValue>
              <TinyLabel>Active Teams</TinyLabel>
            </TinyStat>
            <TinyStat>
              <TinyValue>{stats.totalUsers.toLocaleString()}</TinyValue>
              <TinyLabel>Players</TinyLabel>
            </TinyStat>
            <TinyStat>
              <TinyValue>{recentNewsCount}</TinyValue>
              <TinyLabel>News (latest)</TinyLabel>
            </TinyStat>
          </TinyGrid>
        </InfoCard>

        <InfoCard>
          <InfoTitle>My Action Center</InfoTitle>
          <div style={{ color: theme.colors.text.secondary, fontSize: '0.85rem', marginBottom: 10 }}>
            Sub: <strong style={{ color: user?.isSubscribed ? '#a5d6a7' : '#ffd180' }}>{user?.isSubscribed ? 'ACTIVE' : 'INACTIVE'}</strong>{' '}
            • Entries: <strong>{Number((user as any)?.freeEntriesCount || 0) + Number((user as any)?.bonusEntries || 0)}</strong>
          </div>
          <QuickActions>
            <ActionButton onClick={() => navigate('/tournaments')}>Join Tournament</ActionButton>
            <ActionButton onClick={() => navigate('/teams')}>Teams</ActionButton>
            <ActionButton onClick={() => navigate('/wallet')}>Wallet</ActionButton>
            {hasScoutHubAccess ? (
              <ActionButton onClick={() => navigate('/scout-hub')}>Scout Hub</ActionButton>
            ) : null}
            <ActionButton onClick={() => navigate('/analytics')}>Analytics</ActionButton>
            <ActionButton onClick={() => navigate('/profile')}>Profile</ActionButton>
            <ActionButton onClick={() => navigate('/settings')}>Support</ActionButton>
          </QuickActions>
        </InfoCard>

        <InfoCard>
          <InfoTitle>Recommended For You</InfoTitle>
          <RecommendationList>
            {recommendations.map((item) => (
              <RecommendationRow key={item.key}>
                <RecommendationText>
                  <RecommendationTitle>{item.title}</RecommendationTitle>
                  <RecommendationDesc>{item.description}</RecommendationDesc>
                </RecommendationText>
                <RecommendationActions>
                  <StatusPill $tone={item.tone}>{item.tone === 'ok' ? 'READY' : 'ACTION'}</StatusPill>
                  <ActionButton onClick={() => navigate(item.actionPath)}>{item.actionLabel}</ActionButton>
                </RecommendationActions>
              </RecommendationRow>
            ))}
          </RecommendationList>
        </InfoCard>
      </TopInfoGrid>

      <BottomInfoGrid>
        <InfoCard>
          <InfoTitle>Top Tournaments Now</InfoTitle>
          <List>
            {liveTournaments.length === 0 ? (
              <div style={{ color: theme.colors.text.tertiary, fontSize: '0.85rem' }}>No active tournaments yet.</div>
            ) : (
              liveTournaments.map((item) => (
                <ListRow key={item.id}>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ color: theme.colors.text.primary, fontWeight: 700, fontSize: '0.9rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {item.name}
                    </div>
                    <div style={{ color: theme.colors.text.secondary, fontSize: '0.78rem' }}>{item.teams} teams</div>
                  </div>
                  <StatusPill $tone={item.status === 'live' ? 'ok' : 'warn'}>{item.status.toUpperCase()}</StatusPill>
                </ListRow>
              ))
            )}
          </List>
        </InfoCard>

        <InfoCard>
          <InfoTitle>My Upcoming Matches</InfoTitle>
          <List>
            {upcomingMatches.length === 0 ? (
              <div style={{ color: theme.colors.text.tertiary, fontSize: '0.85rem' }}>No upcoming matches yet.</div>
            ) : (
              upcomingMatches.map((item) => (
                <ListRow key={item.id}>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ color: theme.colors.text.primary, fontWeight: 700, fontSize: '0.88rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {(item.myTeam?.tag || item.myTeam?.name || 'My Team')} vs {(item.enemyTeam?.tag || item.enemyTeam?.name || 'Opponent')}
                    </div>
                    <div style={{ color: theme.colors.text.secondary, fontSize: '0.76rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {item.tournamentName}
                    </div>
                    {item.startTime ? <TimeMeta>{new Date(item.startTime).toLocaleString()}</TimeMeta> : null}
                    {(() => {
                      const roomVisibleAt = item.roomVisibleAt ? new Date(item.roomVisibleAt).getTime() : NaN;
                      const roomOpen = Boolean(item.hasRoomCredentials) && Number.isFinite(roomVisibleAt) && roomVisibleAt <= Date.now();
                      return roomOpen ? <TimeMeta style={{ color: '#a5d6a7' }}>Room is open now</TimeMeta> : null;
                    })()}
                  </div>
                  <StatusPill $tone={item.status === 'live' ? 'ok' : 'warn'}>
                    {item.status === 'live' ? 'LIVE' : 'UPCOMING'}
                  </StatusPill>
                </ListRow>
              ))
            )}
          </List>
          <div style={{ marginTop: 10 }}>
            <ActionButton onClick={() => navigate('/matches')}>Open Matches</ActionButton>
          </div>
        </InfoCard>
      </BottomInfoGrid>

      <SectionHeading title={t('whyChoose')} center />

      <FeaturesGrid>
        <FeatureCard>
          <FeatureIcon>{'\u{1F3C6}'}</FeatureIcon>
          <FeatureTitle>{t('featureProfessionalTournaments')}</FeatureTitle>
          <FeatureDescription>
            {t('featureProfessionalTournamentsDesc')}
          </FeatureDescription>
        </FeatureCard>

        <FeatureCard>
          <FeatureIcon>{'\u{1F465}'}</FeatureIcon>
          <FeatureTitle>{t('featureTeamManagement')}</FeatureTitle>
          <FeatureDescription>
            {t('featureTeamManagementDesc')}
          </FeatureDescription>
        </FeatureCard>

        <FeatureCard>
          <FeatureIcon>{'\u{1F3AE}'}</FeatureIcon>
          <FeatureTitle>{t('featureMultiPlatform')}</FeatureTitle>
          <FeatureDescription>
            {t('featureMultiPlatformDesc')}
          </FeatureDescription>
        </FeatureCard>

        <FeatureCard>
          <FeatureIcon>{'\u{1F4CA}'}</FeatureIcon>
          <FeatureTitle>{t('featureAdvancedAnalytics')}</FeatureTitle>
          <FeatureDescription>
            {t('featureAdvancedAnalyticsDesc')}
          </FeatureDescription>
        </FeatureCard>

        <FeatureCard>
          <FeatureIcon>{'\u{1F3C5}'}</FeatureIcon>
          <FeatureTitle>{t('featureRewardsSystem')}</FeatureTitle>
          <FeatureDescription>
            {t('featureRewardsSystemDesc')}
          </FeatureDescription>
        </FeatureCard>

        <FeatureCard>
          <FeatureIcon>{'\u{1F310}'}</FeatureIcon>
          <FeatureTitle>{t('featureGlobalCommunity')}</FeatureTitle>
          <FeatureDescription>
            {t('featureGlobalCommunityDesc')}
          </FeatureDescription>
        </FeatureCard>
      </FeaturesGrid>

      <StatsSection>
        <StatsTitle>{t('platformStatistics')}</StatsTitle>
        <StatsGrid>
          <StatCard>
            <StatNumber>{stats.activeTournaments}+</StatNumber>
            <StatLabel>{t('statActiveTournaments')}</StatLabel>
          </StatCard>
          <StatCard>
            <StatNumber>{stats.totalUsers.toLocaleString()}+</StatNumber>
            <StatLabel>{t('statRegisteredPlayers')}</StatLabel>
          </StatCard>
          <StatCard>
            <StatNumber>{stats.activeTeams}+</StatNumber>
            <StatLabel>{t('statActiveTeams')}</StatLabel>
          </StatCard>
          <StatCard>
            <StatNumber>${stats.totalPrizePool.toLocaleString()}</StatNumber>
            <StatLabel>{t('statTotalPrizePool')}</StatLabel>
          </StatCard>
        </StatsGrid>
      </StatsSection>
      </Container>
    </PageRoot>
  );
};

export default HomePage;
