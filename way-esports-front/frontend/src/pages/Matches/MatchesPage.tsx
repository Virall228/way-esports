import React, { useMemo, useState } from 'react';
import styled from 'styled-components';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { useNotifications } from '../../contexts/NotificationContext';
import Card from '../../components/UI/Card';
import Button from '../../components/UI/Button';

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

const Container = styled.div`
  padding: 1rem;
  width: 100%;
  max-width: 100%;
  margin: 0;
  color: #ffffff;

  @media (min-width: ${({ theme }) => theme.breakpoints.tablet}) {
    padding: 1.5rem;
  }

  @media (min-width: ${({ theme }) => theme.breakpoints.desktop}) {
    padding: 2.5rem;
  }
`;

const Header = styled(Card).attrs({ variant: 'elevated' })`
  background: ${({ theme }) => theme.colors.bg.secondary};
  border-radius: 16px;
  padding: 1.25rem;
  margin-bottom: 1.5rem;
  border: 1px solid ${({ theme }) => theme.colors.border.light};
`;

const Title = styled.h1`
  margin: 0 0 0.5rem 0;
  color: ${({ theme }) => theme.colors.text.primary};
  font-size: clamp(1.5rem, 4vw, 2.25rem);
`;

const Subtitle = styled.div`
  color: ${({ theme }) => theme.colors.text.secondary};
  font-size: 0.95rem;
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
`;

const Filters = styled.div`
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  margin-bottom: 1rem;
`;

const FilterSelect = styled.select`
  background: ${({ theme }) => theme.colors.bg.secondary};
  color: #ffffff;
  border: 1px solid ${({ theme }) => theme.colors.border.light};
  padding: 10px 14px;
  border-radius: 8px;
  min-height: 44px;
  cursor: pointer;

  option {
    background: ${({ theme }) => theme.colors.bg.secondary};
    color: #ffffff;
  }
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

  @media (max-width: 480px) {
    grid-template-columns: 1fr;
    gap: 8px;
  }
`;

const TeamName = styled.div`
  color: #ffffff;
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
  color: ${({ $status }) => ($status === 'live' ? '#fff' : '#0d0d0d')};
  background: ${({ $status }) => {
    if ($status === 'live') return '#ff4757';
    if ($status === 'completed') return '#2ed573';
    if ($status === 'cancelled') return '#888888';
    return '#f6c343';
  }};
`;

const EmptyState = styled.div`
  padding: 20px 0;
  color: ${({ theme }) => theme.colors.text.secondary};
`;

const MatchesPage: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const { addNotification } = useNotifications();
  const [statusFilter, setStatusFilter] = useState<'all' | 'upcoming' | 'live' | 'completed' | 'cancelled'>('all');
  const [gameFilter, setGameFilter] = useState('all');
  const [roomByMatch, setRoomByMatch] = useState<Record<string, RoomData>>({});
  const [loadingRoomId, setLoadingRoomId] = useState<string | null>(null);

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
        const game = (m.game || '').toString().toLowerCase();
        if (!game.includes(gameFilter.replace('-', ' '))) return false;
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
    <Container>
      <Header>
        <Title>Matches</Title>
        <Subtitle>
          <span>Live, upcoming, and recent matches across the platform.</span>
        </Subtitle>
      </Header>

      <Filters>
        <FilterSelect value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as any)}>
          <option value="all">All Statuses</option>
          <option value="upcoming">Upcoming</option>
          <option value="live">Live</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </FilterSelect>
        <FilterSelect value={gameFilter} onChange={(e) => setGameFilter(e.target.value)}>
          <option value="all">All Games</option>
          <option value="valorant">Valorant</option>
          <option value="critical-ops">Critical Ops</option>
          <option value="pubg-mobile">PUBG Mobile</option>
          <option value="cs2">CS2</option>
        </FilterSelect>
        <Button variant="outline" size="small" onClick={() => { setStatusFilter('all'); setGameFilter('all'); }}>
          Reset Filters
        </Button>
      </Filters>

      {error && (
        <EmptyState>{(error as Error)?.message || 'Failed to load matches'}</EmptyState>
      )}

      {isLoading && !error && (
        <EmptyState>Loading...</EmptyState>
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
                        Room: <strong>{roomByMatch[m.id].roomId}</strong> · Password: <strong>{roomByMatch[m.id].password}</strong>
                      </Meta>
                    )}
                  </Row>
                )}
              </SurfaceCard>
            );
          })}
          {!matches.length && (
            <EmptyState>No matches found.</EmptyState>
          )}
        </List>
      )}
    </Container>
  );
};

export default MatchesPage;
