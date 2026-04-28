import React, { useEffect, useMemo, useState } from 'react';
import styled from 'styled-components';
import { Link, useParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { tournamentService } from '../../services/tournamentService';
import { api } from '../../services/api';
import { getFullUrl } from '../../config/api';
import { useAuth } from '../../contexts/AuthContext';
import { useNotifications } from '../../contexts/NotificationContext';
import Card from '../../components/UI/Card';
import Button from '../../components/UI/Button';
import FlameAuraAvatar from '../../components/UI/FlameAuraAvatar';
import TournamentBracket from '../../components/Tournaments/TournamentBracket';
import { resolveMediaUrl, resolveTeamLogoUrl } from '../../utils/media';
import { getIntensityByPointsAndRank, getTeamPoints, getTierByPoints } from '../../utils/flameRank';
import { Seo } from '../../components/SEO';
import { getGameHubPath } from '../../utils/discovery';
import {
  NoticeBanner,
  PageEmptyState,
  PageHero,
  PageShell,
  PageSubtitle,
  PageTitle
} from '../../components/UI/PageLayout';

type RoomData = {
  roomId: string;
  password: string;
  visibleAt?: string;
  expiresAt?: string;
};

type TeamVisual = {
  name: string;
  logo: string;
  tier: ReturnType<typeof getTierByPoints>;
  intensity: number;
  points: number;
};

const Container = styled(PageShell)`
  color: #ffffff;
`;

const Tabs = styled.div`
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
`;

const Tab = styled(Button).attrs<{ $active: boolean }>((props) => ({
  variant: props.$active ? 'brand' : 'outline',
  size: 'small'
}))<{ $active: boolean }>`
  padding: 0.75rem 1.25rem;
  min-height: 44px;
`;

const List = styled.div`
  display: grid;
  gap: 12px;
`;

const SurfaceCard = styled(Card).attrs({ variant: 'outlined' })`
  background: ${({ theme }) => theme.colors.bg.secondary};
  border-radius: 12px;
  padding: 14px;
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

const Row = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
`;

const TeamsRow = styled.div`
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  gap: 12px;
  min-width: 0;

  @media (max-width: 480px) {
    grid-template-columns: 1fr;
    gap: 8px;
  }
`;

const TeamName = styled.div`
  color: #ffffff;
  font-weight: 700;
  min-width: 0;
  overflow-wrap: anywhere;
  word-break: break-word;
  line-height: 1.2;
`;

const TeamCell = styled.div<{ $align?: 'left' | 'right' }>`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  justify-content: ${({ $align }) => ($align === 'right' ? 'flex-end' : 'flex-start')};
  width: 100%;
  flex-direction: ${({ $align }) => ($align === 'right' ? 'row-reverse' : 'row')};
  min-width: 0;

  @media (max-width: 480px) {
    justify-content: flex-start;
    flex-direction: row;
  }
`;

const Vs = styled.div`
  color: ${({ theme }) => theme.colors.text.secondary};
  font-weight: 700;
  text-align: center;
`;

const Meta = styled.div`
  color: ${({ theme }) => theme.colors.text.secondary};
  font-size: 0.85rem;
`;

const RegisteredTeamsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 10px;
  margin-bottom: 1rem;
`;

const RegisteredTeamItem = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 0.75rem 0.85rem;
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.08);
  min-width: 0;
`;

const RegisteredTeamsCard = styled(SurfaceCard)`
  margin-bottom: 1rem;
`;

const DiscoveryGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 1rem;
  margin-top: 1.25rem;
`;

const DiscoveryLink = styled(Link)`
  display: grid;
  gap: 0.45rem;
  padding: 1rem;
  border-radius: 20px;
  text-decoration: none;
  color: inherit;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.08);
  transition: transform ${({ theme }) => theme.transitions.fast}, border-color ${({ theme }) => theme.transitions.fast}, background ${({ theme }) => theme.transitions.fast};

  &:hover {
    transform: translateY(-2px);
    border-color: rgba(240, 138, 50, 0.2);
    background: rgba(255, 255, 255, 0.05);
  }
`;

const Banner = styled(PageHero)<{ $src?: string }>`
  height: 250px;
  width: 100%;
  background:
    linear-gradient(180deg, rgba(0,0,0,0.12), rgba(0,0,0,0.62)),
    ${({ $src, theme }) => ($src ? `url(${$src})` : theme.colors.bg.tertiary)};
  background-size: cover;
  background-position: center;
  display: flex;
  align-items: flex-end;
  padding: 2rem;
  position: relative;
  overflow: hidden;
  min-width: 0;

  @media (max-width: 600px) {
    height: 220px;
    padding: 1rem;
  }

  &::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 60%;
    background: linear-gradient(to top, rgba(0,0,0,0.8), transparent);
  }

  > * {
    position: relative;
    z-index: 1;
  }
`;

const HeroMetaRow = styled.div`
  display: flex;
  gap: 0.65rem;
  flex-wrap: wrap;
  margin-top: 0.75rem;
`;

const HeroMetaPill = styled.span<{ $tone?: 'default' | 'live' | 'muted' }>`
  display: inline-flex;
  align-items: center;
  min-height: 36px;
  padding: 0.35rem 0.85rem;
  border-radius: 999px;
  background: ${({ $tone = 'default' }) =>
    $tone === 'live'
      ? 'rgba(76, 175, 80, 0.14)'
      : $tone === 'muted'
        ? 'rgba(255,255,255,0.06)'
        : 'rgba(240, 138, 50, 0.16)'};
  border: 1px solid
    ${({ $tone = 'default' }) =>
      $tone === 'live'
        ? 'rgba(76, 175, 80, 0.22)'
        : $tone === 'muted'
          ? 'rgba(255,255,255,0.08)'
          : 'rgba(240, 138, 50, 0.22)'};
  color: ${({ $tone = 'default' }) =>
    $tone === 'live' ? '#b8f4c1' : $tone === 'muted' ? '#d8d8d8' : '#ffd4ae'};
  font-size: 0.88rem;
`;

const DiscoveryCopy = styled.span`
  color: ${({ theme }) => theme.colors.text.secondary};
  line-height: 1.55;
`;

const TournamentDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<'schedule' | 'live' | 'results' | 'bracket'>('schedule');
  const { isAuthenticated, user } = useAuth();
  const { addNotification } = useNotifications();
  const [roomByMatch, setRoomByMatch] = useState<Record<string, RoomData>>({});
  const [loadingRoomId, setLoadingRoomId] = useState<string | null>(null);
  const [streamConnected, setStreamConnected] = useState(false);
  const [streamUpdatedAt, setStreamUpdatedAt] = useState<string | null>(null);
  const { data: tournament, isLoading: isTournamentLoading, error: tournamentError } = useQuery({
    queryKey: ['tournament', id],
    queryFn: async () => {
      if (!id) return null;
      const res: any = await tournamentService.getById(id);
      return res?.data || res;
    },
    enabled: Boolean(id),
    staleTime: 30000,
    refetchOnWindowFocus: false
  });

  const { data: matches = [], isLoading: isMatchesLoading, error: matchesError } = useQuery({
    queryKey: ['tournament', id, 'matches', tab],
    queryFn: async () => {
      if (!id) return [];
      if (tab === 'schedule') {
        const res: any = await tournamentService.getSchedule(id);
        return res?.data || res || [];
      }
      if (tab === 'live') {
        const res: any = await tournamentService.getLive(id);
        return res?.data || res || [];
      }
      const res: any = await tournamentService.getMatches(id);
      return res?.data || res || [];
    },
    enabled: Boolean(id),
    staleTime: 15000,
    refetchOnWindowFocus: false
  });

  const loading = isTournamentLoading || isMatchesLoading;
  const error = (tournamentError as Error | null)?.message || (matchesError as Error | null)?.message || null;

  const title = tournament?.title || tournament?.name || 'Tournament';
  const tournamentBanner = resolveMediaUrl(tournament?.image || tournament?.coverImage || '');
  const gameHubPath = getGameHubPath(tournament?.game);

  const filteredMatches = useMemo(() => {
    const list = Array.isArray(matches) ? matches : [];
    // schedule/live tabs already filtered by backend; just pass through
    if (tab === 'schedule' || tab === 'live') return list;
    if (tab === 'results') return list.filter((m) => m.status === 'completed');
    return list;
  }, [matches, tab]);

  const registeredTeams = useMemo(() => {
    const list = Array.isArray(tournament?.registeredTeams) ? tournament.registeredTeams : [];
    return list.map((team: any) => ({
      id: String(team?.id || team?._id || ''),
      name: String(team?.name || team?.tag || 'Team'),
      logo: resolveTeamLogoUrl(team?.logo || ''),
      stats: team?.stats || {}
    }));
  }, [tournament?.registeredTeams]);

  const getTeamDisplay = (rawTeam: any): TeamVisual => {
    if (!rawTeam) {
      return { name: 'TBD', logo: '', tier: 'default', intensity: 0.35, points: 1000 };
    }
    if (typeof rawTeam === 'string') {
      return { name: rawTeam || 'TBD', logo: '', tier: 'default', intensity: 0.35, points: 1000 };
    }
    const wins = Number(rawTeam?.stats?.wins || 0);
    const losses = Number(rawTeam?.stats?.losses || 0);
    const winRate = Number(rawTeam?.stats?.winRate || 0);
    const tournamentsCount = Number(rawTeam?.stats?.tournaments || rawTeam?.stats?.tournamentsPlayed || 0);
    const points = getTeamPoints(wins, losses, winRate, tournamentsCount);
    return {
      name: String(rawTeam.name || rawTeam.tag || rawTeam.username || 'TBD'),
      logo: resolveTeamLogoUrl(rawTeam.logo || ''),
      tier: getTierByPoints(points),
      intensity: getIntensityByPointsAndRank(points),
      points
    };
  };

  const handleLoadRoom = async (matchId: string) => {
    try {
      setLoadingRoomId(matchId);
      const response: any = await api.get(`/api/matches/${matchId}/room`, true);
      const payload = response?.data || response;

      if (!payload?.roomId || !payload?.password) {
        throw new Error('Room credentials are not available yet');
      }

      setRoomByMatch((prev) => ({
        ...prev,
        [matchId]: {
          roomId: payload.roomId,
          password: payload.password,
          visibleAt: payload.visibleAt,
          expiresAt: payload.expiresAt
        }
      }));
    } catch (err: any) {
      addNotification({
        type: 'warning',
        title: 'Room Access',
        message: err?.message || 'Room credentials are not available'
      });
    } finally {
      setLoadingRoomId(null);
    }
  };

  useEffect(() => {
    if (!id || !user?.id) return;
    api.post('/api/analytics/track', {
      event: 'tournament_page_view',
      userId: user.id,
      data: { tournamentId: id },
      source: 'tournament_details'
    }).catch(() => {});
  }, [id, user?.id]);

  useEffect(() => {
    if (!id || !user?.id) return;
    api.post('/api/analytics/track', {
      event: 'page_view',
      userId: user.id,
      data: { page: 'tournament_details', tournamentId: id, tab },
      source: 'tournament_details'
    }).catch(() => {});
  }, [id, tab, user?.id]);

  useEffect(() => {
    if (!id) return;
    const streamUrl = getFullUrl(`/api/tournaments/${id}/stream`);
    let source: EventSource | null = null;

    try {
      source = new EventSource(streamUrl);
      source.addEventListener('open', () => setStreamConnected(true));
      source.addEventListener('error', () => setStreamConnected(false));
      const refresh = () => {
        setStreamUpdatedAt(new Date().toISOString());
        queryClient.invalidateQueries({ queryKey: ['tournament', id] });
        queryClient.invalidateQueries({ queryKey: ['tournament', id, 'matches'] });
        queryClient.invalidateQueries({ queryKey: ['tournament', String(id), 'bracket'] });
      };

      source.addEventListener('tournament_update', refresh);
      source.addEventListener('tournament_not_found', refresh);
    } catch {
      // Silent fallback: manual refresh still works
    }

    return () => {
      source?.close();
      setStreamConnected(false);
    };
  }, [id, queryClient]);

  return (
    <Container>
      <Seo
        title={`${title} | WAY Esports Tournament`}
        description={String(tournament?.description || `${title} tournament on ${tournament?.game || 'WAY Esports'} with prize pool ${Number(tournament?.prizePool || 0).toLocaleString()}.`).slice(0, 160)}
        canonicalPath={`/tournaments/${id || ''}`}
        image={tournamentBanner || '/images/main.png'}
        type="article"
        keywords={[title, tournament?.game || 'esports tournament', 'WAY Esports', tournament?.status || 'tournament']}
        jsonLd={{
          '@context': 'https://schema.org',
          '@type': 'Event',
          name: title,
          description: tournament?.description || '',
          startDate: tournament?.startDate || undefined,
          endDate: tournament?.endDate || undefined,
          eventStatus: tournament?.status || undefined,
          image: tournamentBanner || undefined,
          organizer: {
            '@type': 'Organization',
            name: 'WAY Esports'
          }
        }}
      />
      <Banner $src={tournamentBanner || '/images/main.png'}>
        <div style={{ minWidth: 0, width: '100%' }}>
          <PageTitle style={{ color: '#fff', marginBottom: '0.25rem' }}>{title}</PageTitle>
          <PageSubtitle style={{ color: 'rgba(255,255,255,0.82)', maxWidth: '760px' }}>
            {tournament?.description || `${title} on ${tournament?.game || 'WAY Esports'} with live schedule, standings and bracket context.`}
          </PageSubtitle>
          <HeroMetaRow>
            <HeroMetaPill>{tournament?.game || '\u2014'}</HeroMetaPill>
            <HeroMetaPill $tone="muted">{tournament?.status || '\u2014'}</HeroMetaPill>
            <HeroMetaPill $tone="muted">
              {tournament?.startDate ? new Date(tournament.startDate).toLocaleDateString() : '\u2014'}
            </HeroMetaPill>
            <HeroMetaPill $tone={streamConnected ? 'live' : 'default'}>
              Realtime: {streamConnected ? 'LIVE' : 'OFFLINE'}
            </HeroMetaPill>
            {streamUpdatedAt ? (
              <HeroMetaPill $tone="muted">
                Updated: {new Date(streamUpdatedAt).toLocaleTimeString()}
              </HeroMetaPill>
            ) : null}
          </HeroMetaRow>
        </div>
      </Banner>

      <Tabs>
        <Tab $active={tab === 'schedule'} onClick={() => setTab('schedule')}>Schedule</Tab>
        <Tab $active={tab === 'live'} onClick={() => setTab('live')}>Live</Tab>
        <Tab $active={tab === 'results'} onClick={() => setTab('results')}>Results</Tab>
        <Tab $active={tab === 'bracket'} onClick={() => setTab('bracket')}>Bracket</Tab>
      </Tabs>

      {registeredTeams.length > 0 && (
        <RegisteredTeamsCard>
          <Row>
            <TeamName>Registered Teams</TeamName>
            <Meta>{registeredTeams.length}</Meta>
          </Row>
          <RegisteredTeamsGrid>
            {registeredTeams.map((team: any) => {
                const visual = getTeamDisplay(team);
                return (
              <RegisteredTeamItem key={team.id || team.name}>
                <FlameAuraAvatar
                  imageUrl={visual.logo || undefined}
                  size={28}
                  tier={visual.tier}
                  intensity={visual.intensity}
                  fallbackText={visual.name.slice(0, 1).toUpperCase()}
                />
                <TeamName>{visual.name}</TeamName>
              </RegisteredTeamItem>
            )})}
          </RegisteredTeamsGrid>
        </RegisteredTeamsCard>
      )}

      {error ? <NoticeBanner $tone="error">{error}</NoticeBanner> : null}

      {loading && !error && (
        <PageEmptyState>Loading...</PageEmptyState>
      )}

      {!loading && !error && tab !== 'bracket' && (
        <List>
          {filteredMatches.map((m) => {
            const t1 = getTeamDisplay(m.team1);
            const t2 = getTeamDisplay(m.team2);
            const score = m.score ? `${m.score.team1 ?? 0}:${m.score.team2 ?? 0}` : '\u2014';

            return (
              <SurfaceCard key={m.id}>
                <Row>
                  <Meta>{m.round || '\u2014'}{m.map ? ` \u2022 ${m.map}` : ''}</Meta>
                  <Meta>{m.startTime ? new Date(m.startTime).toLocaleString() : '\u2014'}</Meta>
                </Row>

                <TeamsRow>
                  <TeamCell>
                    <FlameAuraAvatar
                      imageUrl={t1.logo || undefined}
                      size={28}
                      tier={t1.tier}
                      intensity={t1.intensity}
                      fallbackText={t1.name.slice(0, 1).toUpperCase()}
                    />
                    <TeamName>{t1.name}</TeamName>
                  </TeamCell>
                  <Vs>{tab === 'schedule' ? 'vs' : score}</Vs>
                  <TeamCell $align="right">
                    <FlameAuraAvatar
                      imageUrl={t2.logo || undefined}
                      size={28}
                      tier={t2.tier}
                      intensity={t2.intensity}
                      fallbackText={t2.name.slice(0, 1).toUpperCase()}
                    />
                    <TeamName>{t2.name}</TeamName>
                  </TeamCell>
                </TeamsRow>

                <Row>
                  <Meta>Status: {m.status}</Meta>
                  <Meta>{m.endTime ? `End: ${new Date(m.endTime).toLocaleString()}` : ''}</Meta>
                </Row>

                {isAuthenticated && m.id && ['upcoming', 'scheduled', 'live'].includes(String(m.status || '').toLowerCase()) && (
                  <Row style={{ justifyContent: 'flex-start', gap: '10px' }}>
                    <Button
                      variant="outline"
                      size="small"
                      onClick={() => handleLoadRoom(m.id!)}
                      disabled={loadingRoomId === m.id}
                    >
                      {loadingRoomId === m.id ? 'Loading room...' : 'Show Room Credentials'}
                    </Button>
                    {roomByMatch[m.id] && (
                      <Meta style={{ overflowWrap: 'anywhere', wordBreak: 'break-word' }}>
                        Room: <strong>{roomByMatch[m.id].roomId}</strong> | Password: <strong>{roomByMatch[m.id].password}</strong>
                      </Meta>
                    )}
                  </Row>
                )}
              </SurfaceCard>
            );
          })}

          {!filteredMatches.length && (
            <PageEmptyState>No matches</PageEmptyState>
          )}
        </List>
      )}

      {!loading && !error && tab === 'bracket' && (
        <TournamentBracket
          tournamentId={String(id || '')}
          tournamentName={title}
        />
      )}

      {!loading && !error && (
        <DiscoveryGrid>
          {gameHubPath ? (
            <DiscoveryLink to={gameHubPath}>
              <strong>{tournament?.game || 'Game'} hub</strong>
              <DiscoveryCopy>Open the wider game page with related events, teams and news.</DiscoveryCopy>
            </DiscoveryLink>
          ) : null}
          <DiscoveryLink to="/tournaments">
            <strong>All tournaments</strong>
            <DiscoveryCopy>Keep navigating through the public event index.</DiscoveryCopy>
          </DiscoveryLink>
          <DiscoveryLink to="/teams">
            <strong>Teams</strong>
            <DiscoveryCopy>Move from tournament pages into public team profiles.</DiscoveryCopy>
          </DiscoveryLink>
          <DiscoveryLink to="/matches">
            <strong>Matches</strong>
            <DiscoveryCopy>Track live and recent match activity across the platform.</DiscoveryCopy>
          </DiscoveryLink>
        </DiscoveryGrid>
      )}
    </Container>
  );
};

export default TournamentDetailsPage;
