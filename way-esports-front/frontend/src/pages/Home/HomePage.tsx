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
  padding: clamp(18px, 2vw, 34px);
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
      : 'linear-gradient(145deg, rgba(7, 9, 12, 0.98) 0%, rgba(10, 12, 16, 0.96) 54%, rgba(12, 14, 18, 0.95) 100%)'};
  border: 1px solid ${({ theme }) => (theme.isLight ? theme.colors.border.medium : theme.colors.border.light)};
  border-radius: 28px;
  padding: clamp(28px, 5vw, 88px) clamp(22px, 4vw, 48px);
  margin-bottom: 32px;
  position: relative;
  overflow: hidden;
  box-shadow: ${({ theme }) => (theme.isLight ? theme.shadows.large : '0 32px 72px rgba(0, 0, 0, 0.42), 0 0 40px rgba(219, 229, 241, 0.04)')};
  
  &::before {
    content: '';
    position: absolute;
    inset: 0;
    background: ${({ theme }) =>
      theme.isLight
        ? "url('/images/main2.png') center/cover"
        : `
      radial-gradient(circle at 18% 24%, rgba(255, 255, 255, 0.08), transparent 26%),
      radial-gradient(circle at 82% 22%, rgba(255, 255, 255, 0.07), transparent 22%),
      radial-gradient(circle at 50% 100%, rgba(148, 163, 184, 0.07), transparent 34%),
      linear-gradient(180deg, rgba(0, 0, 0, 0.14), rgba(5, 6, 8, 0.42))
    `};
    opacity: ${({ theme }) => (theme.isLight ? 0.1 : 1)};
    z-index: 0;
  }

  &::after {
    content: '';
    position: absolute;
    inset: 0;
    background:
      linear-gradient(180deg, rgba(255, 255, 255, 0.02), transparent 16%, transparent 84%, rgba(0, 0, 0, 0.24)),
      radial-gradient(circle at 50% 0%, rgba(255, 255, 255, 0.05), transparent 36%);
    opacity: ${({ theme }) => (theme.isLight ? 0 : 0.95)};
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
    text-align: center;
    background: ${({ theme }) => theme.colors.bg.secondary};
    box-shadow: none;

    &::before {
      opacity: 0;
      background: none;
    }
  }
`;

const HeroLayout = styled.div`
  display: grid;
  gap: 1.6rem;

  @media (min-width: 960px) {
    grid-template-columns: minmax(0, 1.2fr) minmax(280px, 0.8fr);
    align-items: end;
  }
`;

const HeroBody = styled.div`
  display: grid;
  justify-items: start;
  gap: 1rem;

  @media (max-width: 768px) {
    justify-items: center;
  }
`;

const HeroEyebrow = styled.span`
  display: inline-flex;
  align-items: center;
  min-height: 34px;
  padding: 0.45rem 0.85rem;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.08);
  color: ${({ theme }) => theme.colors.text.secondary};
  font-family: ${({ theme }) => theme.fonts.accent};
  font-size: 0.72rem;
  font-weight: ${({ theme }) => theme.fontWeights.medium};
  letter-spacing: -0.01em;
`;

const Logo = styled.div`
  width: 118px;
  height: 118px;
  background:
    #050608 url('/images/way-main-logo-metal-v2.jpg?v=20260428') center/cover no-repeat;
  border-radius: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0;
  border: 1px solid ${({ theme }) => (theme.isLight ? theme.colors.border.medium : 'rgba(255, 255, 255, 0.1)')};
  box-shadow: ${({ theme }) =>
    theme.isLight
      ? '0 12px 28px rgba(0, 0, 0, 0.18)'
      : '0 16px 36px rgba(0, 0, 0, 0.46), 0 0 34px rgba(219, 229, 241, 0.06)'};
  overflow: hidden;

  @media (max-width: 768px) {
    width: 88px;
    height: 88px;
    margin: 0 auto;
  }
`;

const HeroTitle = styled.h1`
  font-family: ${({ theme }) => theme.fonts.brand || theme.fonts.title};
  font-size: clamp(2.4rem, 7vw, 4.8rem);
  font-weight: 700;
  color: ${({ theme }) => theme.colors.text.primary};
  margin: 0;
  letter-spacing: 0.02em;
  text-shadow: ${({ theme }) => (theme.isLight ? '0 6px 18px rgba(132, 95, 58, 0.16)' : '0 10px 26px rgba(0, 0, 0, 0.32)')};
  line-height: 0.94;

  @media (max-width: 768px) {
    font-size: 2rem;
    letter-spacing: 0.01em;
  }
`;

const HeroSubtitle = styled.p`
  font-size: clamp(1rem, 2vw, 1.18rem);
  color: ${({ theme }) => theme.colors.text.secondary};
  margin: 0;
  max-width: 760px;
  line-height: 1.75;

  @media (max-width: 768px) {
    font-size: 0.95rem;
  }
`;

const HeroActions = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.85rem;

  @media (max-width: 768px) {
    width: 100%;
    justify-content: center;
  }
`;

const CTAButton = styled(Button).attrs({ variant: 'brand', size: 'large' })`
  padding: 18px 40px;
  border-radius: 18px;
  font-size: 1rem;
  letter-spacing: 0.03em;
  transition: transform 0.15s ease, box-shadow 0.15s ease;

  &:hover {
    transform: translateY(-1px);
  }

  @media (max-width: 768px) {
    flex: 1 1 100%;
    font-size: 0.95rem;
    padding: 12px 14px;
    transition: none;

    &:hover {
      transform: none;
    }
  }
`;

const HeroSecondaryButton = styled(Button).attrs({ variant: 'outline', size: 'large' })`
  min-height: 58px;
  padding: 16px 26px;
  border-radius: 18px;

  @media (max-width: 768px) {
    flex: 1 1 100%;
    min-height: 48px;
    padding: 12px 14px;
  }
`;

const HeroMetrics = styled.div`
  display: grid;
  gap: 0.85rem;
  align-self: stretch;

  @media (min-width: 620px) and (max-width: 959px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
`;

const HeroMetric = styled.div`
  position: relative;
  overflow: hidden;
  display: grid;
  gap: 0.35rem;
  padding: 1rem 1.05rem;
  border-radius: 18px;
  background: ${({ theme }) => (theme.isLight ? 'rgba(255, 255, 255, 0.82)' : 'rgba(255, 255, 255, 0.04)')};
  border: 1px solid ${({ theme }) => theme.colors.border.light};

  &::after {
    content: '';
    position: absolute;
    inset: auto -16% -50% auto;
    width: 7rem;
    height: 7rem;
    border-radius: 50%;
    background: radial-gradient(circle, rgba(245, 154, 74, 0.16), transparent 68%);
    pointer-events: none;
  }
`;

const HeroMetricValue = styled.div`
  position: relative;
  z-index: 1;
  color: ${({ theme }) => theme.colors.text.primary};
  font-size: clamp(1.35rem, 2vw, 1.9rem);
  font-weight: 800;
`;

const HeroMetricLabel = styled.div`
  position: relative;
  z-index: 1;
  color: ${({ theme }) => theme.colors.text.secondary};
  font-size: 0.82rem;
  line-height: 1.45;
`;

const FeaturesGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
  gap: 18px;
  margin-bottom: 32px;

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
      : 'linear-gradient(180deg, rgba(18, 22, 27, 0.82) 0%, rgba(8, 10, 13, 0.92) 100%)'};
  border: 1px solid ${({ theme }) => (theme.isLight ? theme.colors.border.light : theme.colors.border.light)};
  border-radius: 22px;
  padding: 32px 28px;
  text-align: center;
  transition: all 0.3s ease;

  &:hover { transform: translateY(-6px); border-color: ${({ theme }) => theme.colors.border.accent}; box-shadow: ${({ theme }) => (theme.isLight ? '0 22px 40px rgba(109, 78, 44, 0.12)' : '0 24px 44px rgba(0,0,0,0.3)')}; }

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
      : `linear-gradient(135deg, rgba(40, 46, 56, 0.92), rgba(13, 15, 19, 0.96))`};
  border-radius: 22px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2rem;
  margin: 0 auto 25px;
  color: ${({ theme }) => (theme.isLight ? theme.colors.accent : theme.colors.text.primary)};
  border: 1px solid ${({ theme }) => (theme.isLight ? theme.colors.border.light : theme.colors.border.light)};

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

const TopInfoGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(320px, 1fr));
  gap: 14px;
  margin-bottom: 14px;

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
  border: 1px solid ${({ theme }) => theme.colors.border.light};
  border-radius: 14px;
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
  border: 1px solid ${({ $tone }) => ($tone === 'warn' ? 'rgba(245,154,74,0.38)' : 'rgba(52,211,153,0.34)')};
  color: ${({ $tone }) => ($tone === 'warn' ? '#ffcd9b' : '#9ff0cf')};
  background: ${({ $tone }) => ($tone === 'warn' ? 'rgba(245,154,74,0.12)' : 'rgba(52,211,153,0.12)')};
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
  border: 1px solid ${({ theme }) => theme.colors.border.light};
  border-radius: 14px;
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
        <HeroLayout>
          <HeroBody>
            <HeroEyebrow>Competitive gaming platform</HeroEyebrow>
            <Logo aria-label="WAY logo" />
            <HeroTitle>WAY ESPORTS</HeroTitle>
            <HeroSubtitle>
              {t('homeHeroSubtitle')}
            </HeroSubtitle>
            <HeroActions>
              <CTAButton onClick={() => navigate('/tournaments')}>
                {t('joinTournament')}
              </CTAButton>
              <HeroSecondaryButton onClick={() => navigate('/matches')}>
                Open matches
              </HeroSecondaryButton>
            </HeroActions>
          </HeroBody>

          <HeroMetrics>
            <HeroMetric>
              <HeroMetricValue>{stats.activeTournaments}</HeroMetricValue>
              <HeroMetricLabel>Active tournaments open for entry and live progress.</HeroMetricLabel>
            </HeroMetric>
            <HeroMetric>
              <HeroMetricValue>{stats.activeTeams}</HeroMetricValue>
              <HeroMetricLabel>Teams building lineups, scrims and tournament runs.</HeroMetricLabel>
            </HeroMetric>
            <HeroMetric>
              <HeroMetricValue>{stats.totalUsers.toLocaleString()}</HeroMetricValue>
              <HeroMetricLabel>Players already inside the ecosystem.</HeroMetricLabel>
            </HeroMetric>
            <HeroMetric>
              <HeroMetricValue>${stats.totalPrizePool.toLocaleString()}</HeroMetricValue>
              <HeroMetricLabel>Total prize pool visible across the platform.</HeroMetricLabel>
            </HeroMetric>
          </HeroMetrics>
        </HeroLayout>
      </HeroSection>

      <TopInfoGrid>
        <InfoCard>
          <InfoTitle>Quick actions</InfoTitle>
          <div style={{ color: theme.colors.text.secondary, fontSize: '0.85rem', marginBottom: 10 }}>
            Sub: <strong style={{ color: user?.isSubscribed ? '#9ff0cf' : '#ffcd9b' }}>{user?.isSubscribed ? 'ACTIVE' : 'INACTIVE'}</strong>{' '}
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
          <InfoTitle>Recommended next</InfoTitle>
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
                      return roomOpen ? <TimeMeta style={{ color: '#9ff0cf' }}>Room is open now</TimeMeta> : null;
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

      <SectionHeading
        title="Platform strengths"
        subtitle="A cleaner, more focused interface across tournaments, teams, profiles, analytics and match flow."
        center
      />

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

      </Container>
    </PageRoot>
  );
};

export default HomePage;
