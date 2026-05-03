import React, { useEffect, useMemo, useRef, useState } from 'react';
import styled from 'styled-components';
import { api } from '../../services/api';
import { getFullUrl } from '../../config/api';
import { useAuth } from '../../contexts/AuthContext';
import Button from '../../components/UI/Button';
import Card from '../../components/UI/Card';
import Input from '../../components/UI/Input';
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
  PageTitle
} from '../../components/UI/PageLayout';

const Page = styled(PageShell)`
  gap: 1.15rem;
`;

const HeroMetrics = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.9rem;
`;

const HeroMetric = styled.div`
  min-width: 148px;
  padding: 0.95rem 1rem;
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.08);
`;

const HeroMetricLabel = styled.div`
  color: ${({ theme }) => theme.colors.text.tertiary};
  font-size: 0.74rem;
  letter-spacing: -0.01em;
  margin-bottom: 0.45rem;
`;

const HeroMetricValue = styled.div`
  color: ${({ theme }) => theme.colors.text.primary};
  font-size: clamp(1.15rem, 2vw, 1.7rem);
  font-weight: 700;
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: 1rem;
`;

const SectionCard = styled(Card).attrs({ variant: 'outlined' })`
  display: grid;
  gap: 1rem;
  padding: clamp(1rem, 2vw, 1.35rem);
  border-radius: 24px;
  background: rgba(255, 255, 255, 0.025);
`;

const SectionHeader = styled.div`
  display: grid;
  gap: 0.35rem;
`;

const SectionTitle = styled.h2`
  margin: 0;
  color: ${({ theme }) => theme.colors.text.primary};
  font-size: clamp(1.02rem, 2vw, 1.28rem);
`;

const SectionCopy = styled.p`
  margin: 0;
  color: ${({ theme }) => theme.colors.text.secondary};
  font-size: 0.92rem;
  line-height: 1.6;
`;

const TrendSvg = styled.svg`
  width: 100%;
  height: 220px;
`;

const HeatmapCanvas = styled.canvas`
  width: 100%;
  height: 300px;
  border-radius: 22px;
  background: linear-gradient(180deg, rgba(8, 10, 13, 0.95), rgba(16, 20, 25, 0.9));
  border: 1px solid rgba(255, 255, 255, 0.08);
`;

const RadarWrap = styled.div`
  width: 100%;
  display: flex;
  justify-content: center;
`;

const RadarSvg = styled.svg`
  width: min(100%, 360px);
  height: auto;
`;

const StatsList = styled.div`
  display: grid;
  gap: 0.8rem;
`;

const ListItem = styled.div`
  display: grid;
  gap: 0.35rem;
  padding: 0.95rem 1rem;
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.07);
`;

const ItemHeading = styled.div`
  color: ${({ theme }) => theme.colors.text.primary};
  font-weight: 600;
  line-height: 1.45;
`;

const ItemMeta = styled.div`
  color: ${({ theme }) => theme.colors.text.secondary};
  font-size: 0.86rem;
  line-height: 1.55;
`;

const ComparisonGrid = styled.div`
  display: grid;
  gap: 0.75rem;
  grid-template-columns: repeat(3, minmax(0, 1fr));

  @media (max-width: 820px) {
    grid-template-columns: 1fr;
  }
`;

const ComparisonResults = styled.div`
  display: grid;
  gap: 0.75rem;
`;

const ComparisonTrack = styled.div`
  height: 12px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.08);
  overflow: hidden;
  display: flex;
`;

const ComparisonFill = styled.div<{ $tone?: 'accent' | 'cool'; $width: number }>`
  width: ${({ $width }) => `${Math.max(0, Math.min(100, $width))}%`};
  background: ${({ $tone = 'accent' }) =>
    $tone === 'cool'
      ? 'linear-gradient(90deg, rgba(90, 161, 255, 0.92), rgba(129, 195, 255, 0.92))'
      : 'linear-gradient(90deg, rgba(240, 138, 50, 0.92), rgba(255, 186, 120, 0.92))'};
`;

const ComparisonHint = styled.div`
  color: #ffd0a4;
  font-size: 0.86rem;
`;

const ActionRow = styled.div`
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
  align-items: center;
`;

const Muted = styled.div`
  color: ${({ theme }) => theme.colors.text.secondary};
`;

type AnalyticsPayload = {
  userId: string;
  primaryRole: string;
  impactRating: number;
  skills: {
    aiming: number;
    positioning: number;
    utility: number;
    clutchFactor: number;
    teamplay: number;
  };
  trend30d: Array<{ date: string; points?: number; rating?: number }>;
  heatmap: Array<{ x: number; y: number; count: number; eventType: string }>;
};

type HallOfFameRow = {
  _id?: string;
  userId: string;
  username: string;
  consecutiveDaysRank1: number;
  firstRank1At?: string;
  lastRank1At?: string;
};

type RankUpdateEvent = {
  userId?: string;
  previousRating: number;
  newRating: number;
  delta: number;
  previousPoints?: number;
  newPoints?: number;
  pointsDelta?: number;
  at: string;
};

const unwrapApiData = <T,>(payload: any): T => {
  if (payload && typeof payload === 'object' && 'data' in payload) {
    return payload.data as T;
  }
  return payload as T;
};

const radarKeys: Array<keyof AnalyticsPayload['skills']> = ['aiming', 'positioning', 'utility', 'clutchFactor', 'teamplay'];

const RadarChart: React.FC<{ skills: AnalyticsPayload['skills'] }> = ({ skills }) => {
  const size = 300;
  const center = size / 2;
  const maxR = 92;
  const labelDistance = maxR + 26;
  const points = radarKeys.map((key, index) => {
    const angle = (-Math.PI / 2) + (index * 2 * Math.PI) / radarKeys.length;
    const value = Number(skills[key] || 0) / 100;
    const r = maxR * value;
    const labelX = center + Math.cos(angle) * labelDistance;
    const labelY = center + Math.sin(angle) * labelDistance;
    const anchor = Math.cos(angle) < -0.25 ? 'end' : Math.cos(angle) > 0.25 ? 'start' : 'middle';
    return {
      key,
      x: center + Math.cos(angle) * r,
      y: center + Math.sin(angle) * r,
      labelX,
      labelY,
      anchor
    };
  });

  const polygon = points.map((point) => `${point.x},${point.y}`).join(' ');
  const rings = [20, 40, 60, 80, 100];

  return (
    <RadarWrap>
      <RadarSvg viewBox={`-18 -18 ${size + 36} ${size + 36}`} preserveAspectRatio="xMidYMid meet">
        {rings.map((ring) => (
          <circle
            key={ring}
            cx={center}
            cy={center}
            r={(maxR * ring) / 100}
            fill="none"
            stroke="rgba(255,255,255,0.12)"
            strokeWidth="1"
          />
        ))}
        {points.map((point) => (
          <line
            key={`${point.key}-line`}
            x1={center}
            y1={center}
            x2={point.labelX}
            y2={point.labelY}
            stroke="rgba(255,255,255,0.14)"
          />
        ))}
        <polygon points={polygon} fill="rgba(240,138,50,0.2)" stroke="#f5a04d" strokeWidth="2" />
        {points.map((point) => (
          <g key={point.key}>
            <circle cx={point.x} cy={point.y} r="3" fill="#f5a04d" />
            <text x={point.labelX} y={point.labelY} fill="#d9d9d9" fontSize="12" textAnchor={point.anchor}>
              {point.key}
            </text>
          </g>
        ))}
      </RadarSvg>
    </RadarWrap>
  );
};

const TrendChart: React.FC<{ trend: Array<{ date: string; points?: number; rating?: number }> }> = ({ trend }) => {
  const width = 720;
  const height = 220;
  const padding = 24;
  const points = trend.slice(-30);
  const metric = (point: { points?: number; rating?: number }) => Number(point.points ?? point.rating ?? 0);
  const max = Math.max(100, ...points.map(metric));
  const min = Math.min(0, ...points.map(metric));

  const path = points.map((point, index) => {
    const x = padding + (index * (width - padding * 2)) / Math.max(1, points.length - 1);
    const y = height - padding - ((metric(point) - min) / Math.max(1, max - min)) * (height - padding * 2);
    return `${index === 0 ? 'M' : 'L'}${x},${y}`;
  }).join(' ');

  const areaPath = `${path} L${width - padding},${height - padding} L${padding},${height - padding} Z`;

  return (
    <TrendSvg viewBox={`0 0 ${width} ${height}`}>
      <rect x="0" y="0" width={width} height={height} fill="transparent" />
      <path d={areaPath} fill="rgba(240,138,50,0.14)" />
      <path d={path} fill="none" stroke="#f5a04d" strokeWidth="2.5" />
    </TrendSvg>
  );
};

const renderHeatmap = (
  canvas: HTMLCanvasElement,
  points: Array<{ x: number; y: number; count: number; eventType: string }>
) => {
  const dpr = window.devicePixelRatio || 1;
  const width = canvas.clientWidth || 800;
  const height = canvas.clientHeight || 280;
  canvas.width = Math.floor(width * dpr);
  canvas.height = Math.floor(height * dpr);
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, width, height);

  for (const point of points) {
    const x = Math.max(0, Math.min(width, point.x * width));
    const y = Math.max(0, Math.min(height, point.y * height));
    const radius = 12 + Math.min(28, point.count * 2);
    const alpha = Math.min(0.8, 0.18 + point.count * 0.05);
    const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
    const tone = point.eventType === 'death' ? '255,84,84' : '78,201,140';
    gradient.addColorStop(0, `rgba(${tone}, ${alpha})`);
    gradient.addColorStop(1, `rgba(${tone}, 0)`);
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
  }
};

const AnalyticsPage: React.FC = () => {
  const { user } = useAuth();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [data, setData] = useState<AnalyticsPayload | null>(null);
  const [prospects, setProspects] = useState<Array<{ username: string; tag: string; score: number; summary: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [leftRating, setLeftRating] = useState('1000');
  const [rightRating, setRightRating] = useState('1000');
  const [winProbability, setWinProbability] = useState<{
    leftProbability: number;
    rightProbability: number;
    leftPoints?: number;
    rightPoints?: number;
  } | null>(null);
  const [leftTeamId, setLeftTeamId] = useState('');
  const [rightTeamId, setRightTeamId] = useState('');
  const [teamCompareResult, setTeamCompareResult] = useState<any | null>(null);
  const [styleMatches, setStyleMatches] = useState<Array<{ pro: string; similarity: number; summary: string }>>([]);
  const [hallOfFame, setHallOfFame] = useState<HallOfFameRow[]>([]);
  const [rankUpdates, setRankUpdates] = useState<RankUpdateEvent[]>([]);
  const [minDeltaFilter, setMinDeltaFilter] = useState('0');
  const [rankStreamConnected, setRankStreamConnected] = useState(false);
  const [rankStreamLastUpdateAt, setRankStreamLastUpdateAt] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      if (!user?.id) return;
      setLoading(true);
      setError(null);
      try {
        const [analyticsRes, prospectsRes, hallRes]: any[] = await Promise.all([
          api.get(`/api/analytics/${user.id}`),
          api.get('/api/scouting/top-prospects?limit=10'),
          api.get('/api/intelligence/hall-of-fame')
        ]);
        const analyticsData = unwrapApiData<AnalyticsPayload>(analyticsRes);
        const prospectsData = unwrapApiData<Array<{ username: string; tag: string; score: number; summary: string }>>(prospectsRes);
        const hallData = unwrapApiData<HallOfFameRow[]>(hallRes);
        setData(analyticsData && analyticsData.skills ? analyticsData : null);
        setProspects(Array.isArray(prospectsData) ? prospectsData : []);
        setHallOfFame(Array.isArray(hallData) ? hallData.slice(0, 10) : []);
      } catch (loadError: any) {
        setError(loadError?.message || 'Failed to load analytics');
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, [user?.id]);

  useEffect(() => {
    if (!canvasRef.current || !data?.heatmap) return;
    renderHeatmap(canvasRef.current, data.heatmap);
  }, [data?.heatmap]);

  useEffect(() => {
    const streamUrl = getFullUrl('/api/intelligence/stream/rank-updates');
    let source: EventSource | null = null;
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
    let cancelled = false;

    const onUpdate = (event: MessageEvent<string>) => {
      try {
        const parsed = JSON.parse(event.data) as RankUpdateEvent;
        setRankUpdates((prev) => [parsed, ...prev].slice(0, 8));
        setRankStreamLastUpdateAt(new Date().toISOString());
      } catch {
        // ignore malformed SSE payload
      }
    };

    const connect = () => {
      if (cancelled) return;
      source = new EventSource(streamUrl);
      source.addEventListener('open', () => setRankStreamConnected(true));
      source.addEventListener('rank_update', onUpdate as EventListener);
      source.onerror = () => {
        setRankStreamConnected(false);
        source?.close();
        if (!cancelled) {
          reconnectTimer = setTimeout(connect, 2500);
        }
      };
    };

    connect();

    return () => {
      cancelled = true;
      if (reconnectTimer) clearTimeout(reconnectTimer);
      source?.removeEventListener('rank_update', onUpdate as EventListener);
      source?.close();
      setRankStreamConnected(false);
    };
  }, []);

  const topProspects = useMemo(() => prospects.slice(0, 5), [prospects]);
  const comparisonLeader = winProbability
    ? winProbability.leftProbability >= winProbability.rightProbability
      ? 'Left'
      : 'Right'
    : null;
  const teamLeader = teamCompareResult
    ? Number(teamCompareResult?.left?.probability || 0) >= Number(teamCompareResult?.right?.probability || 0)
      ? 'Left Team'
      : 'Right Team'
    : null;

  const handleCompare = async () => {
    try {
      const res: any = await api.post('/api/intelligence/compare/win-probability', {
        left: { points: Number(leftRating) || 1000, rating: Number(leftRating) || 1000, winRate: 50 },
        right: { points: Number(rightRating) || 1000, rating: Number(rightRating) || 1000, winRate: 50 }
      });
      setWinProbability(
        unwrapApiData<{ leftProbability: number; rightProbability: number; leftPoints?: number; rightPoints?: number } | null>(res)
      );
    } catch {
      setWinProbability(null);
    }
  };

  const handleStyleMatch = async () => {
    if (!data) return;
    try {
      const res: any = await api.post('/api/intelligence/analytics/style-match', data.skills);
      const rows = unwrapApiData<Array<{ pro: string; similarity: number; summary: string }>>(res) || [];
      setStyleMatches(rows.slice(0, 3));
    } catch {
      setStyleMatches([]);
    }
  };

  const handleCompareTeams = async () => {
    try {
      const res: any = await api.post('/api/intelligence/compare/team-vs-team', {
        left: { teamId: leftTeamId || undefined, points: Number(leftRating) || 1000, rating: Number(leftRating) || 1000 },
        right: { teamId: rightTeamId || undefined, points: Number(rightRating) || 1000, rating: Number(rightRating) || 1000 }
      });
      setTeamCompareResult(unwrapApiData<any>(res));
    } catch {
      setTeamCompareResult(null);
    }
  };

  if (loading) {
    return (
      <Page>
        <PageEmptyState>Loading analytics...</PageEmptyState>
      </Page>
    );
  }

  if (error) {
    return (
      <Page>
        <NoticeBanner $tone="error">{error}</NoticeBanner>
      </Page>
    );
  }

  if (!data) {
    return (
      <Page>
        <PageEmptyState>No analytics available</PageEmptyState>
      </Page>
    );
  }

  return (
    <Page>
      <PageHero>
        <PageHeroLayout>
          <PageHeroContent>
            <PageTitle>Digital Athlete Intelligence</PageTitle>
            <PageSubtitle>
              A cleaner command view of your skill profile, momentum, scouting signals and live rating movement across the platform.
            </PageSubtitle>
          </PageHeroContent>
          <HeroMetrics>
            <HeroMetric>
              <HeroMetricLabel>Primary Role</HeroMetricLabel>
              <HeroMetricValue>{data.primaryRole}</HeroMetricValue>
            </HeroMetric>
            <HeroMetric>
              <HeroMetricLabel>Impact Rating</HeroMetricLabel>
              <HeroMetricValue>{data.impactRating.toFixed(1)}</HeroMetricValue>
            </HeroMetric>
            <HeroMetric>
              <HeroMetricLabel>Rank Stream</HeroMetricLabel>
              <HeroMetricValue>{rankStreamConnected ? 'LIVE' : 'Offline'}</HeroMetricValue>
            </HeroMetric>
          </HeroMetrics>
        </PageHeroLayout>
      </PageHero>

      <Grid>
        <SectionCard>
          <SectionHeader>
            <SectionTitle>Radar Skill Chart</SectionTitle>
            <SectionCopy>Mechanical and tactical balance across the five core dimensions of your competitive profile.</SectionCopy>
          </SectionHeader>
          <RadarChart skills={data.skills} />
        </SectionCard>

        <SectionCard>
          <SectionHeader>
            <SectionTitle>Performance Trend</SectionTitle>
            <SectionCopy>Thirty-day movement snapshot with a steadier, less noisy visual read on form.</SectionCopy>
          </SectionHeader>
          <TrendChart trend={data.trend30d} />
        </SectionCard>
      </Grid>

      <SectionCard>
        <SectionHeader>
          <SectionTitle>Heatmap</SectionTitle>
          <SectionCopy>Spatial concentration of combat events with cleaner contrast between pressure and survival zones.</SectionCopy>
        </SectionHeader>
        <HeatmapCanvas ref={canvasRef} />
      </SectionCard>

      <Grid>
        <SectionCard>
          <SectionHeader>
            <SectionTitle>Top Prospects</SectionTitle>
            <SectionCopy>AI scouting suggestions ranked by projected upside and immediate relevance.</SectionCopy>
          </SectionHeader>
          {!topProspects.length ? (
            <Muted>No insights generated yet.</Muted>
          ) : (
            <StatsList>
              {topProspects.map((row, index) => (
                <ListItem key={`${row.username}-${index}`}>
                  <ItemHeading>@{row.username} · {row.tag} · Score {Number(row.score).toFixed(1)}</ItemHeading>
                  <ItemMeta>{row.summary}</ItemMeta>
                </ListItem>
              ))}
            </StatsList>
          )}
        </SectionCard>

        <SectionCard>
          <SectionHeader>
            <SectionTitle>Hall of Fame</SectionTitle>
            <SectionCopy>Players holding the strongest multi-day control of the number-one slot.</SectionCopy>
          </SectionHeader>
          {!hallOfFame.length ? (
            <Muted>No hall of fame data yet.</Muted>
          ) : (
            <StatsList>
              {hallOfFame.map((row, index) => (
                <ListItem key={row._id || `${row.userId}-${index}`}>
                  <ItemHeading>#{index + 1} {row.username}</ItemHeading>
                  <ItemMeta>{row.consecutiveDaysRank1} days at #1</ItemMeta>
                </ListItem>
              ))}
            </StatsList>
          )}
        </SectionCard>
      </Grid>

      <Grid>
        <SectionCard>
          <SectionHeader>
            <SectionTitle>Realtime Rank Updates</SectionTitle>
            <SectionCopy>
              Stream health and larger rating changes, filtered so the panel stays useful during busy periods.
            </SectionCopy>
          </SectionHeader>
          <FilterRail>
            <FilterGroup>
              <FilterLabel>Stream</FilterLabel>
              <Muted>{rankStreamConnected ? 'LIVE' : 'OFFLINE'}</Muted>
            </FilterGroup>
            {rankStreamLastUpdateAt ? (
              <FilterGroup>
                <FilterLabel>Last Update</FilterLabel>
                <Muted>{new Date(rankStreamLastUpdateAt).toLocaleTimeString()}</Muted>
              </FilterGroup>
            ) : null}
            <FilterGroup style={{ minWidth: '220px', flex: 1 }}>
              <Input
                fullWidth
                value={minDeltaFilter}
                onChange={(e) => setMinDeltaFilter(e.target.value)}
                placeholder="Min delta filter"
              />
            </FilterGroup>
          </FilterRail>
          {!rankUpdates.length ? (
            <Muted>Waiting for rank updates...</Muted>
          ) : (
            <StatsList>
              {rankUpdates
                .filter((row) => Math.abs(Number(row.pointsDelta ?? row.delta ?? 0)) >= (Number(minDeltaFilter) || 0))
                .map((row, index) => (
                  <ListItem key={`${row.userId || 'user'}-${row.at}-${index}`}>
                    <ItemHeading>
                      {row.userId || 'unknown'} · {Number(row.previousPoints ?? row.previousRating)} → {Number(row.newPoints ?? row.newRating)}
                    </ItemHeading>
                    <ItemMeta>
                      Delta {Number(row.pointsDelta ?? row.delta) >= 0 ? '+' : ''}
                      {Number(row.pointsDelta ?? row.delta)} · {new Date(row.at).toLocaleString()}
                    </ItemMeta>
                  </ListItem>
                ))}
            </StatsList>
          )}
        </SectionCard>

        <SectionCard>
          <SectionHeader>
            <SectionTitle>Comparison Engine</SectionTitle>
            <SectionCopy>Quick probability reads for points-based duels and optional team-vs-team scenarios.</SectionCopy>
          </SectionHeader>

          <ComparisonGrid>
            <Input fullWidth value={leftRating} onChange={(e) => setLeftRating(e.target.value)} placeholder="Left points" />
            <Input fullWidth value={rightRating} onChange={(e) => setRightRating(e.target.value)} placeholder="Right points" />
            <Button variant="brand" onClick={handleCompare}>Compare</Button>
          </ComparisonGrid>

          {winProbability ? (
            <ComparisonResults>
              <ItemMeta>
                Left <strong>{(winProbability.leftProbability * 100).toFixed(1)}%</strong> · Right{' '}
                <strong>{(winProbability.rightProbability * 100).toFixed(1)}%</strong>
              </ItemMeta>
              <ItemMeta>
                Points baseline <strong>{Number(winProbability.leftPoints ?? (Number(leftRating) || 1000))}</strong> vs{' '}
                <strong>{Number(winProbability.rightPoints ?? (Number(rightRating) || 1000))}</strong>
              </ItemMeta>
              <ComparisonTrack>
                <ComparisonFill $width={Math.round(winProbability.leftProbability * 100)} />
                <ComparisonFill $tone="cool" $width={Math.round(winProbability.rightProbability * 100)} />
              </ComparisonTrack>
              {comparisonLeader ? <ComparisonHint>Suggested favorite: <strong>{comparisonLeader}</strong></ComparisonHint> : null}
            </ComparisonResults>
          ) : null}

          <ComparisonGrid>
            <Input fullWidth value={leftTeamId} onChange={(e) => setLeftTeamId(e.target.value)} placeholder="Left teamId (optional)" />
            <Input fullWidth value={rightTeamId} onChange={(e) => setRightTeamId(e.target.value)} placeholder="Right teamId (optional)" />
            <Button variant="outline" onClick={handleCompareTeams}>Team vs Team</Button>
          </ComparisonGrid>

          {teamCompareResult ? (
            <ComparisonResults>
              <ItemMeta>
                {teamCompareResult.left?.name || 'Left'} <strong>{((teamCompareResult.left?.probability || 0) * 100).toFixed(1)}%</strong> ·{' '}
                {teamCompareResult.right?.name || 'Right'} <strong>{((teamCompareResult.right?.probability || 0) * 100).toFixed(1)}%</strong>
              </ItemMeta>
              <ItemMeta>
                Team points <strong>{Number(teamCompareResult?.left?.points ?? teamCompareResult?.left?.rating ?? (Number(leftRating) || 1000))}</strong> vs{' '}
                <strong>{Number(teamCompareResult?.right?.points ?? teamCompareResult?.right?.rating ?? (Number(rightRating) || 1000))}</strong>
              </ItemMeta>
              <ComparisonTrack>
                <ComparisonFill $width={Math.round(Number(teamCompareResult?.left?.probability || 0) * 100)} />
                <ComparisonFill $tone="cool" $width={Math.round(Number(teamCompareResult?.right?.probability || 0) * 100)} />
              </ComparisonTrack>
              {teamLeader ? <ComparisonHint>Suggested favorite: <strong>{teamLeader}</strong></ComparisonHint> : null}
            </ComparisonResults>
          ) : null}
        </SectionCard>
      </Grid>

      <SectionCard>
        <SectionHeader>
          <SectionTitle>AI Style Match</SectionTitle>
          <SectionCopy>Cross-reference your current skill shape against pro-like archetypes and stylistic overlaps.</SectionCopy>
        </SectionHeader>
        <ActionRow>
          <Button variant="brand" onClick={handleStyleMatch}>Match vs Pro Profiles</Button>
        </ActionRow>
        {!styleMatches.length ? (
          <Muted>No style match calculated yet.</Muted>
        ) : (
          <StatsList>
            {styleMatches.map((row) => (
              <ListItem key={row.pro}>
                <ItemHeading>{row.pro} · {row.similarity.toFixed(1)}%</ItemHeading>
                <ItemMeta>{row.summary}</ItemMeta>
              </ListItem>
            ))}
          </StatsList>
        )}
      </SectionCard>
    </Page>
  );
};

export default AnalyticsPage;
