import React, { useMemo, useState } from 'react';
import styled from 'styled-components';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { useNotifications } from '../../contexts/NotificationContext';
import Card from '../../components/UI/Card';
import Button from '../../components/UI/Button';
import {
  FilterGroup,
  FilterLabel,
  FilterRail,
  NoticeBanner,
  PageEmptyState,
  PageHero,
  PageHeroContent,
  PageHeroLayout,
  PageShell,
  PageSubtitle,
  PageTitle,
  SelectField
} from '../../components/UI/PageLayout';
import { Seo } from '../../components/SEO';

type MatchItem = {
  id?: string;
  tournamentName?: string;
  game?: string;
  team1?: any;
  team2?: any;
  round?: string;
  map?: string;
  startTime?: string;
  status?: string;
  score?: { team1?: number; team2?: number };
};

type RoomData = {
  roomId: string;
  password: string;
  visibleAt?: string;
  expiresAt?: string;
};

const HeaderKicker = styled.div`
  margin-bottom: 0.75rem;
  color: ${({ theme }) => theme.colors.text.tertiary};
  font-family: ${({ theme }) => theme.fonts.accent};
  font-size: 0.8rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
`;

const Filters = styled.div`
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
`;

const FilterSelect = styled(SelectField)``;

const List = styled.div`
  display: grid;
  gap: 12px;
`;

const SurfaceCard = styled(Card).attrs({ variant: 'outlined' })`
  background: ${({ theme }) =>
    theme.isLight
      ? 'linear-gradient(180deg, rgba(255,255,255,0.9), rgba(247,239,229,0.88))'
      : 'linear-gradient(180deg, rgba(18, 22, 27, 0.88), rgba(8, 10, 13, 0.96))'};
  border-radius: 22px;
  padding: 18px;
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

  @media (max-width: 480px) {
    grid-template-columns: 1fr;
    gap: 8px;
  }
`;

const TeamName = styled.div`
  color: ${({ theme }) => theme.colors.text.primary};
  font-weight: 700;
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

const StatusBadge = styled.span<{ $status: string }>`
  padding: 4px 10px;
  border-radius: 999px;
  font-size: 0.75rem;
  text-transform: uppercase;
  font-weight: 700;
  letter-spacing: 0.6px;
  color: ${({ $status }) => ($status === 'live' ? '#fff' : '#111827')};
  background: ${({ $status }) => {
    if ($status === 'live') return '#fb7185';
    if ($status === 'completed') return '#86efac';
    if ($status === 'cancelled') return '#9ca3af';
    return '#fcd34d';
  }};
`;

const MatchesPage: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const { addNotification } = useNotifications();
  const [statusFilter, setStatusFilter] = useState<'all' | 'upcoming' | 'live' | 'completed' | 'cancelled'>('all');
  const [gameFilter, setGameFilter] = useState('all');
  const [roomByMatch, setRoomByMatch] = useState<Record<string, RoomData>>({});
  const [loadingRoomId, setLoadingRoomId] = useState<string | null>(null);

  const normalizeGame = (value: string) =>
    (value || '').toLowerCase().replace(/\s+/g, '').replace(/[^a-z0-9]/g, '');

  const { data: matchesRaw = [], isLoading, error } = useQuery({
    queryKey: ['matches'],
    queryFn: async () => {
      const res: any = await api.get('/api/matches', true);
      return res?.data || res || [];
    },
    staleTime: 15000,
    refetchOnWindowFocus: false
  });

  const matches = useMemo(() => {
    const list: MatchItem[] = Array.isArray(matchesRaw) ? matchesRaw : [];
    return list.filter((m) => {
      const status = (m.status || 'upcoming').toString();
      if (statusFilter !== 'all' && status !== statusFilter) return false;
      if (gameFilter !== 'all') {
        const game = normalizeGame((m.game || '').toString());
        if (game !== normalizeGame(gameFilter)) return false;
      }
      return true;
    });
  }, [matchesRaw, statusFilter, gameFilter]);

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

  return (
    <PageShell>
      <Seo
        title="Live and Upcoming Esports Matches | WAY Esports"
        description="Track live, upcoming and recent esports matches across tournaments on WAY Esports."
        canonicalPath="/matches"
        type="website"
        keywords={['esports matches', 'live matches', 'WAY Esports matches', 'match schedule']}
        jsonLd={{
          '@context': 'https://schema.org',
          '@type': 'CollectionPage',
          name: 'WAY Esports Matches',
          description: 'Live, upcoming and recent esports matches across the WAY Esports platform.'
        }}
      />
      <PageHero>
        <PageHeroLayout>
          <PageHeroContent>
            <HeaderKicker>Live operations</HeaderKicker>
            <PageTitle>Matches</PageTitle>
            <PageSubtitle>Live, upcoming, and recent matches across the platform with room access and schedule context in one place.</PageSubtitle>
          </PageHeroContent>
        </PageHeroLayout>
      </PageHero>

      <FilterRail>
        <Filters>
          <FilterGroup>
            <FilterLabel>Status</FilterLabel>
            <FilterSelect value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as any)}>
              <option value="all">All Statuses</option>
              <option value="upcoming">Upcoming</option>
              <option value="live">Live</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </FilterSelect>
          </FilterGroup>
          <FilterGroup>
            <FilterLabel>Game</FilterLabel>
            <FilterSelect value={gameFilter} onChange={(e) => setGameFilter(e.target.value)}>
              <option value="all">All Games</option>
              <option value="valorant-mobile">Valorant Mobile</option>
              <option value="critical-ops">Critical Ops</option>
              <option value="pubg-mobile">PUBG Mobile</option>
              <option value="cs2">CS2</option>
              <option value="dota2">Dota 2</option>
              <option value="standoff2">Standoff 2</option>
            </FilterSelect>
          </FilterGroup>
          <Button variant="outline" size="small" onClick={() => { setStatusFilter('all'); setGameFilter('all'); }}>
            Reset Filters
          </Button>
        </Filters>
      </FilterRail>

      {error && (
        <NoticeBanner $tone="error">{(error as Error)?.message || 'Failed to load matches'}</NoticeBanner>
      )}

      {isLoading && !error && (
        <PageEmptyState>Loading...</PageEmptyState>
      )}

      {!isLoading && !error && (
        <List>
          {matches.map((m) => {
            const t1 = typeof m.team1 === 'string' ? m.team1 : (m.team1?.name || m.team1?.tag || 'TBD');
            const t2 = typeof m.team2 === 'string' ? m.team2 : (m.team2?.name || m.team2?.tag || 'TBD');
            const score = m.score ? `${m.score.team1 ?? 0}:${m.score.team2 ?? 0}` : 'vs';
            const status = (m.status || 'upcoming').toString();

            return (
              <SurfaceCard key={m.id}>
                <Row>
                  <Meta>{m.tournamentName || 'Open Match'}{m.round ? ` \u2022 ${m.round}` : ''}{m.map ? ` \u2022 ${m.map}` : ''}</Meta>
                  <Row style={{ gap: '8px' }}>
                    <Meta>{m.startTime ? new Date(m.startTime).toLocaleString() : 'TBD'}</Meta>
                    <StatusBadge $status={status}>{status}</StatusBadge>
                  </Row>
                </Row>

                <TeamsRow>
                  <TeamName>{t1}</TeamName>
                  <Vs>{status === 'completed' ? score : 'vs'}</Vs>
                  <TeamName style={{ textAlign: 'right' }}>{t2}</TeamName>
                </TeamsRow>

                {isAuthenticated && (status === 'upcoming' || status === 'live') && m.id && (
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
                      <Meta>
                        Room: <strong>{roomByMatch[m.id].roomId}</strong> • Password: <strong>{roomByMatch[m.id].password}</strong>
                      </Meta>
                    )}
                  </Row>
                )}
              </SurfaceCard>
            );
          })}
          {!matches.length && (
            <PageEmptyState>No matches found.</PageEmptyState>
          )}
        </List>
      )}
    </PageShell>
  );
};

export default MatchesPage;
