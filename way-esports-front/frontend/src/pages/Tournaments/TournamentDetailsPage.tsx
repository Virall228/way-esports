import React, { useEffect, useMemo, useState } from 'react';
import styled from 'styled-components';
import { useParams } from 'react-router-dom';
import { api } from '../../services/api';

const Container = styled.div`
  padding: 1rem;
  max-width: 1400px;
  margin: 0 auto;
  color: #ffffff;

  @media (min-width: ${({ theme }) => theme.breakpoints.tablet}) {
    padding: 1.5rem;
  }

  @media (min-width: ${({ theme }) => theme.breakpoints.desktop}) {
    padding: 2.5rem;
  }
`;

const Header = styled.div`
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

const Tabs = styled.div`
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  margin-bottom: 1rem;
`;

const Tab = styled.button<{ $active: boolean }>`
  background: ${({ $active, theme }) => ($active ? theme.colors.gray[800] : 'transparent')};
  color: ${({ $active, theme }) => ($active ? theme.colors.white : theme.colors.text.secondary)};
  border: 1px solid ${({ $active, theme }) => ($active ? theme.colors.border.strong : 'rgba(255, 255, 255, 0.2)')};
  padding: 0.75rem 1.25rem;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  min-height: 44px;
`;

const List = styled.div`
  display: grid;
  gap: 12px;
`;

const Card = styled.div`
  background: ${({ theme }) => theme.colors.bg.secondary};
  border: 1px solid ${({ theme }) => theme.colors.border.light};
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

type Tournament = {
  id: string;
  name?: string;
  title?: string;
  game?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
};

type MatchItem = {
  id: string;
  tournamentId: string;
  status: 'upcoming' | 'live' | 'completed' | string;
  startTime: string;
  endTime?: string;
  round?: string;
  map?: string;
  team1?: { name?: string; tag?: string } | string;
  team2?: { name?: string; tag?: string } | string;
  score?: { team1?: number; team2?: number };
  winner?: any;
};

const TournamentDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [tab, setTab] = useState<'schedule' | 'live' | 'results' | 'bracket'>('schedule');
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [matches, setMatches] = useState<MatchItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      if (!id) return;
      try {
        setLoading(true);
        setError(null);

        const tRes: any = await api.get(`/api/tournaments/${id}`);
        const t = (tRes && tRes.data) || null;

        let m: any[] = [];
        if (tab === 'schedule') {
          const mRes = await api.get(`/api/tournaments/${id}/schedule`);
          m = (mRes && mRes.data) || [];
        } else if (tab === 'live') {
          const mRes = await api.get(`/api/tournaments/${id}/live`);
          m = (mRes && mRes.data) || [];
        } else {
          const mRes = await api.get(`/api/matches?tournament=${id}`);
          m = (mRes && mRes.data) || [];
        }

        if (!mounted) return;
        setTournament(t);
        setMatches(m);
      } catch (e: any) {
        if (!mounted) return;
        setError(e?.message || 'Failed to load tournament');
      } finally {
        if (!mounted) return;
        setLoading(false);
      }
    };

    load();
    return () => {
      mounted = false;
    };
  }, [id, tab]);

  const title = tournament?.title || tournament?.name || 'Tournament';

  const filteredMatches = useMemo(() => {
    const list = Array.isArray(matches) ? matches : [];
    // schedule/live tabs already filtered by backend; just pass through
    if (tab === 'schedule' || tab === 'live') return list;
    if (tab === 'results') return list.filter((m) => m.status === 'completed');
    return list;
  }, [matches, tab]);

  const rounds = useMemo(() => {
    const groups: Record<string, MatchItem[]> = {};
    for (const m of matches) {
      const key = (m.round || 'Round').toString();
      groups[key] = groups[key] || [];
      groups[key].push(m);
    }
    return Object.entries(groups);
  }, [matches]);

  return (
    <Container>
      <Header>
        <Title>{title}</Title>
        <Subtitle>
          <span>{tournament?.game || '—'}</span>
          <span>{tournament?.status || '—'}</span>
          <span>
            {tournament?.startDate ? new Date(tournament.startDate).toLocaleDateString() : '—'}
            {' - '}
            {tournament?.endDate ? new Date(tournament.endDate).toLocaleDateString() : '—'}
          </span>
        </Subtitle>
      </Header>

      <Tabs>
        <Tab $active={tab === 'schedule'} onClick={() => setTab('schedule')}>Schedule</Tab>
        <Tab $active={tab === 'live'} onClick={() => setTab('live')}>Live</Tab>
        <Tab $active={tab === 'results'} onClick={() => setTab('results')}>Results</Tab>
        <Tab $active={tab === 'bracket'} onClick={() => setTab('bracket')}>Bracket</Tab>
      </Tabs>

      {error && (
        <div style={{ color: '#e57373', padding: '20px 0' }}>{error}</div>
      )}

      {loading && !error && (
        <div style={{ color: '#cccccc', padding: '20px 0' }}>Loading...</div>
      )}

      {!loading && !error && tab !== 'bracket' && (
        <List>
          {filteredMatches.map((m) => {
            const t1 = typeof m.team1 === 'string' ? m.team1 : (m.team1?.name || m.team1?.tag || 'TBD');
            const t2 = typeof m.team2 === 'string' ? m.team2 : (m.team2?.name || m.team2?.tag || 'TBD');
            const score = m.score ? `${m.score.team1 ?? 0}:${m.score.team2 ?? 0}` : '—';

            return (
              <Card key={m.id}>
                <Row>
                  <Meta>{m.round || '—'}{m.map ? ` • ${m.map}` : ''}</Meta>
                  <Meta>{new Date(m.startTime).toLocaleString()}</Meta>
                </Row>

                <TeamsRow>
                  <TeamName>{t1}</TeamName>
                  <Vs>{tab === 'schedule' ? 'vs' : score}</Vs>
                  <TeamName style={{ textAlign: 'right' }}>{t2}</TeamName>
                </TeamsRow>

                <Row>
                  <Meta>Status: {m.status}</Meta>
                  <Meta>{m.endTime ? `End: ${new Date(m.endTime).toLocaleString()}` : ''}</Meta>
                </Row>
              </Card>
            );
          })}

          {!filteredMatches.length && (
            <div style={{ color: '#cccccc', padding: '20px 0' }}>No matches</div>
          )}
        </List>
      )}

      {!loading && !error && tab === 'bracket' && (
        <List>
          {rounds.map(([roundName, ms]) => (
            <Card key={roundName}>
              <Row>
                <TeamName>{roundName}</TeamName>
                <Meta>{ms.length} matches</Meta>
              </Row>
              <List>
                {ms.map((m) => {
                  const t1 = typeof m.team1 === 'string' ? m.team1 : (m.team1?.name || m.team1?.tag || 'TBD');
                  const t2 = typeof m.team2 === 'string' ? m.team2 : (m.team2?.name || m.team2?.tag || 'TBD');
                  const score = m.score ? `${m.score.team1 ?? 0}:${m.score.team2 ?? 0}` : '—';
                  return (
                    <Card key={m.id}>
                      <Row>
                        <Meta>{new Date(m.startTime).toLocaleString()}</Meta>
                        <Meta>{m.status}</Meta>
                      </Row>
                      <TeamsRow>
                        <TeamName>{t1}</TeamName>
                        <Vs>{score}</Vs>
                        <TeamName style={{ textAlign: 'right' }}>{t2}</TeamName>
                      </TeamsRow>
                    </Card>
                  );
                })}
              </List>
            </Card>
          ))}

          {!matches.length && (
            <div style={{ color: '#cccccc', padding: '20px 0' }}>No matches</div>
          )}
        </List>
      )}

      {!loading && !error && tab === 'bracket' && (
        <div style={{ color: '#cccccc', padding: '20px 0' }}>
          Bracket view will be implemented next (visual bracket tree powered by matches data).
        </div>
      )}
    </Container>
  );
};

export default TournamentDetailsPage;
