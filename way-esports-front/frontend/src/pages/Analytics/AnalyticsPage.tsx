import React, { useEffect, useMemo, useRef, useState } from 'react';
import styled from 'styled-components';
import { api } from '../../services/api';
import { getFullUrl } from '../../config/api';
import { useAuth } from '../../contexts/AuthContext';

const Page = styled.div`
  display: grid;
  gap: 16px;
`;

const Card = styled.section`
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.03);
  padding: 16px;
`;

const Title = styled.h2`
  margin: 0 0 12px;
  font-size: 1.1rem;
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 16px;
`;

const TrendSvg = styled.svg`
  width: 100%;
  height: 220px;
`;

const HeatmapCanvas = styled.canvas`
  width: 100%;
  height: 280px;
  border-radius: 10px;
  background: rgba(0, 0, 0, 0.35);
  border: 1px solid rgba(255, 255, 255, 0.08);
`;

const Input = styled.input`
  width: 100%;
  min-height: 42px;
  border-radius: 10px;
  border: 1px solid rgba(255, 255, 255, 0.14);
  background: rgba(255, 255, 255, 0.04);
  color: #fff;
  padding: 8px 10px;
`;

const ActionButton = styled.button`
  min-height: 42px;
  border-radius: 10px;
  border: 1px solid rgba(255, 107, 0, 0.5);
  background: #ff6b00;
  color: #000;
  font-weight: 700;
  padding: 0 14px;
  cursor: pointer;
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

const RadarWrap = styled.div`
  width: 100%;
  display: flex;
  justify-content: center;
`;

const RadarSvg = styled.svg`
  width: min(100%, 360px);
  height: auto;
`;

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

  const polygon = points.map((p) => `${p.x},${p.y}`).join(' ');
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
      {points.map((p) => (
        <line key={`${p.key}-line`} x1={center} y1={center} x2={p.labelX} y2={p.labelY} stroke="rgba(255,255,255,0.14)" />
      ))}
      <polygon points={polygon} fill="rgba(255,107,0,0.24)" stroke="#ff6b00" strokeWidth="2" />
      {points.map((p) => (
        <g key={p.key}>
          <circle cx={p.x} cy={p.y} r="3" fill="#ff6b00" />
          <text x={p.labelX} y={p.labelY} fill="#ddd" fontSize="12" textAnchor={p.anchor}>
            {p.key}
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
  const metric = (p: { points?: number; rating?: number }) => Number(p.points ?? p.rating ?? 0);
  const max = Math.max(100, ...points.map(metric));
  const min = Math.min(0, ...points.map(metric));

  const path = points.map((p, idx) => {
    const x = padding + (idx * (width - padding * 2)) / Math.max(1, points.length - 1);
    const y = height - padding - ((metric(p) - min) / Math.max(1, max - min)) * (height - padding * 2);
    return `${idx === 0 ? 'M' : 'L'}${x},${y}`;
  }).join(' ');

  const areaPath = `${path} L${width - padding},${height - padding} L${padding},${height - padding} Z`;

  return (
    <TrendSvg viewBox={`0 0 ${width} ${height}`}>
      <rect x="0" y="0" width={width} height={height} fill="transparent" />
      <path d={areaPath} fill="rgba(255,107,0,0.18)" />
      <path d={path} fill="none" stroke="#ff6b00" strokeWidth="2.5" />
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
    const tone = point.eventType === 'death' ? '255,59,48' : '52,199,89';
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
  const [winProbability, setWinProbability] = useState<{ leftProbability: number; rightProbability: number; leftPoints?: number; rightPoints?: number } | null>(null);
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
      } catch (e: any) {
        setError(e?.message || 'Failed to load analytics');
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
      setWinProbability(unwrapApiData<{ leftProbability: number; rightProbability: number; leftPoints?: number; rightPoints?: number } | null>(res));
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

  if (loading) return <Page>Loading analytics...</Page>;
  if (error) return <Page>{error}</Page>;
  if (!data) return <Page>No analytics available</Page>;

  return (
    <Page>
      <Card>
        <Title>Digital Athlete</Title>
        <div style={{ color: '#bbb', fontSize: 13 }}>
          Role: <strong>{data.primaryRole}</strong> | Impact Rating: <strong>{data.impactRating.toFixed(1)}</strong>
        </div>
      </Card>

      <Grid>
        <Card>
          <Title>Radar Skill Chart</Title>
          <RadarChart skills={data.skills} />
        </Card>
        <Card>
          <Title>Performance Trend (30 days)</Title>
          <TrendChart trend={data.trend30d} />
        </Card>
      </Grid>

      <Card>
        <Title>Heatmap</Title>
        <HeatmapCanvas ref={canvasRef} />
      </Card>

      <Card>
        <Title>AI Insights - Top Prospects</Title>
        {topProspects.length === 0 && <div style={{ color: '#aaa' }}>No insights generated yet.</div>}
        {topProspects.map((row, index) => (
          <div key={`${row.username}-${index}`} style={{ padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
            <strong>@{row.username}</strong> | {row.tag} | Score {Number(row.score).toFixed(1)}
            <div style={{ color: '#bbb', marginTop: 4, fontSize: 13 }}>{row.summary}</div>
          </div>
        ))}
      </Card>

      <Grid>
        <Card>
          <Title>Hall of Fame</Title>
          {!hallOfFame.length && <div style={{ color: '#999' }}>No hall of fame data yet.</div>}
          {hallOfFame.map((row, index) => (
            <div key={row._id || `${row.userId}-${index}`} style={{ padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
              <strong>#{index + 1} {row.username}</strong> - {row.consecutiveDaysRank1} days at #1
            </div>
          ))}
        </Card>

        <Card>
          <Title>Realtime Rank Updates</Title>
          <div style={{ color: rankStreamConnected ? '#81c784' : '#ffab91', fontSize: 12, marginBottom: 8 }}>
            Stream: {rankStreamConnected ? 'LIVE' : 'OFFLINE'}
            {rankStreamLastUpdateAt ? ` • Last: ${new Date(rankStreamLastUpdateAt).toLocaleTimeString()}` : ''}
          </div>
          {!rankUpdates.length && <div style={{ color: '#999' }}>Waiting for rank updates...</div>}
          <div style={{ display: 'grid', gap: 10, gridTemplateColumns: '1fr auto', marginBottom: 12 }}>
            <Input
              value={minDeltaFilter}
              onChange={(e) => setMinDeltaFilter(e.target.value)}
              placeholder="Min delta filter (example: 15)"
            />
          </div>
          {rankUpdates
            .filter((row) => Math.abs(Number(row.pointsDelta ?? row.delta ?? 0)) >= (Number(minDeltaFilter) || 0))
            .map((row, index) => (
            <div key={`${row.userId || 'user'}-${row.at}-${index}`} style={{ padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
              User: <strong>{row.userId || 'unknown'}</strong> | {Number(row.previousPoints ?? row.previousRating)} -&gt; {Number(row.newPoints ?? row.newRating)} points ({Number(row.pointsDelta ?? row.delta) >= 0 ? '+' : ''}{Number(row.pointsDelta ?? row.delta)})
            </div>
          ))}
        </Card>

        <Card>
          <Title>Comparison Engine</Title>
          <div style={{ display: 'grid', gap: 10, gridTemplateColumns: '1fr 1fr auto' }}>
            <Input value={leftRating} onChange={(e) => setLeftRating(e.target.value)} placeholder="Left points" />
            <Input value={rightRating} onChange={(e) => setRightRating(e.target.value)} placeholder="Right points" />
            <ActionButton onClick={handleCompare}>Compare</ActionButton>
          </div>
          {winProbability && (
            <div style={{ marginTop: 12, color: '#ddd', display: 'grid', gap: 8 }}>
              <div>
                Left: <strong>{(winProbability.leftProbability * 100).toFixed(1)}%</strong> | Right:{' '}
                <strong>{(winProbability.rightProbability * 100).toFixed(1)}%</strong>
              </div>
              <div style={{ color: '#bbb', fontSize: 13 }}>
                Points baseline: <strong>{Number(winProbability.leftPoints ?? (Number(leftRating) || 1000))}</strong> vs{' '}
                <strong>{Number(winProbability.rightPoints ?? (Number(rightRating) || 1000))}</strong>
              </div>
              <div style={{ height: 10, borderRadius: 6, background: 'rgba(255,255,255,0.1)', overflow: 'hidden', display: 'flex' }}>
                <div style={{ width: `${Math.round(winProbability.leftProbability * 100)}%`, background: '#ff6b00' }} />
                <div style={{ width: `${Math.round(winProbability.rightProbability * 100)}%`, background: '#4da3ff' }} />
              </div>
              <div style={{ color: '#ffcf99', fontSize: 13 }}>
                Suggested favorite: <strong>{comparisonLeader}</strong>
              </div>
            </div>
          )}
          <div style={{ marginTop: 14, display: 'grid', gap: 10, gridTemplateColumns: '1fr 1fr auto' }}>
            <Input value={leftTeamId} onChange={(e) => setLeftTeamId(e.target.value)} placeholder="Left teamId (optional)" />
            <Input value={rightTeamId} onChange={(e) => setRightTeamId(e.target.value)} placeholder="Right teamId (optional)" />
            <ActionButton onClick={handleCompareTeams}>Team vs Team</ActionButton>
          </div>
          {teamCompareResult && (
            <div style={{ marginTop: 12, color: '#ddd', display: 'grid', gap: 8 }}>
              <div>
                {teamCompareResult.left?.name || 'Left'}: <strong>{((teamCompareResult.left?.probability || 0) * 100).toFixed(1)}%</strong> |{' '}
                {teamCompareResult.right?.name || 'Right'}: <strong>{((teamCompareResult.right?.probability || 0) * 100).toFixed(1)}%</strong>
              </div>
              <div style={{ color: '#bbb', fontSize: 13 }}>
                Team points: <strong>{Number(teamCompareResult?.left?.points ?? teamCompareResult?.left?.rating ?? (Number(leftRating) || 1000))}</strong> vs{' '}
                <strong>{Number(teamCompareResult?.right?.points ?? teamCompareResult?.right?.rating ?? (Number(rightRating) || 1000))}</strong>
              </div>
              <div style={{ height: 10, borderRadius: 6, background: 'rgba(255,255,255,0.1)', overflow: 'hidden', display: 'flex' }}>
                <div style={{ width: `${Math.round(Number(teamCompareResult?.left?.probability || 0) * 100)}%`, background: '#ff6b00' }} />
                <div style={{ width: `${Math.round(Number(teamCompareResult?.right?.probability || 0) * 100)}%`, background: '#4da3ff' }} />
              </div>
              <div style={{ color: '#ffcf99', fontSize: 13 }}>
                Suggested favorite: <strong>{teamLeader}</strong>
              </div>
            </div>
          )}
        </Card>

        <Card>
          <Title>AI Style Match</Title>
          <ActionButton onClick={handleStyleMatch}>Match vs Pro Profiles</ActionButton>
          <div style={{ marginTop: 12, display: 'grid', gap: 8 }}>
            {styleMatches.map((row) => (
              <div key={row.pro} style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: 8 }}>
                <strong>{row.pro}</strong> | {row.similarity.toFixed(1)}%
                <div style={{ color: '#bbb', fontSize: 13 }}>{row.summary}</div>
              </div>
            ))}
            {!styleMatches.length && <div style={{ color: '#999' }}>No style match calculated yet.</div>}
          </div>
        </Card>
      </Grid>
    </Page>
  );
};

export default AnalyticsPage;
