import React, { useMemo, useState } from 'react';
import styled from 'styled-components';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { tournamentService } from '../../services/tournamentService';
import Card from '../../components/UI/Card';
import Button from '../../components/UI/Button';

type MatchItem = {
  id?: string;
  team1?: any;
  team2?: any;
  round?: string;
  map?: string;
  startTime?: string;
  endTime?: string;
  status?: string;
  score?: { team1?: number; team2?: number };
};

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

const Tabs = styled.div`
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  margin-bottom: 1rem;
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

const Banner = styled.div<{ $src?: string }>`
  height: 250px;
  width: 100%;
  background: ${({ $src, theme }) => ($src ? `url(${$src})` : theme.colors.bg.tertiary)};
  background-size: cover;
  background-position: center;
  border-radius: 16px;
  margin-bottom: 1.5rem;
  border: 1px solid ${({ theme }) => theme.colors.border.light};
  display: flex;
  align-items: flex-end;
  padding: 2rem;
  position: relative;
  overflow: hidden;

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

const TournamentDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [tab, setTab] = useState<'schedule' | 'live' | 'results' | 'bracket'>('schedule');
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
      <Banner $src={tournament?.image || tournament?.coverImage}>
        <div>
          <Title style={{ color: '#fff', marginBottom: '0.25rem' }}>{title}</Title>
          <Subtitle>
            <span style={{ color: '#ff6b00', fontWeight: 'bold' }}>{tournament?.game || '\u2014'}</span>
            <span style={{ color: '#fff' }}>{'\u2022'} {tournament?.status || '\u2014'}</span>
            <span style={{ color: '#fff' }}>
              {'\u2022'} {tournament?.startDate ? new Date(tournament.startDate).toLocaleDateString() : '\u2014'}
            </span>
          </Subtitle>
        </div>
      </Banner>

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
            const score = m.score ? `${m.score.team1 ?? 0}:${m.score.team2 ?? 0}` : '\u2014';

            return (
              <SurfaceCard key={m.id}>
                <Row>
                  <Meta>{m.round || '\u2014'}{m.map ? ` \u2022 ${m.map}` : ''}</Meta>
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
              </SurfaceCard>
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
            <SurfaceCard key={roundName}>
              <Row>
                <TeamName>{roundName}</TeamName>
                <Meta>{ms.length} matches</Meta>
              </Row>
              <List>
                {ms.map((m) => {
                  const t1 = typeof m.team1 === 'string' ? m.team1 : (m.team1?.name || m.team1?.tag || 'TBD');
                  const t2 = typeof m.team2 === 'string' ? m.team2 : (m.team2?.name || m.team2?.tag || 'TBD');
                  const score = m.score ? `${m.score.team1 ?? 0}:${m.score.team2 ?? 0}` : '\u2014';
                  return (
                    <SurfaceCard key={m.id}>
                      <Row>
                        <Meta>{new Date(m.startTime).toLocaleString()}</Meta>
                        <Meta>{m.status}</Meta>
                      </Row>
                      <TeamsRow>
                        <TeamName>{t1}</TeamName>
                        <Vs>{score}</Vs>
                        <TeamName style={{ textAlign: 'right' }}>{t2}</TeamName>
                      </TeamsRow>
                    </SurfaceCard>
                  );
                })}
              </List>
            </SurfaceCard>
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
