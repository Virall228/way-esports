import React, { useEffect, useMemo, useRef, useState } from 'react';
import styled from 'styled-components';
import { api } from '../../services/api';
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
  trend30d: Array<{ date: string; rating: number }>;
  heatmap: Array<{ x: number; y: number; count: number; eventType: string }>;
};

const radarKeys: Array<keyof AnalyticsPayload['skills']> = ['aiming', 'positioning', 'utility', 'clutchFactor', 'teamplay'];

const RadarChart: React.FC<{ skills: AnalyticsPayload['skills'] }> = ({ skills }) => {
  const size = 240;
  const center = size / 2;
  const maxR = 90;
  const points = radarKeys.map((key, index) => {
    const angle = (-Math.PI / 2) + (index * 2 * Math.PI) / radarKeys.length;
    const value = Number(skills[key] || 0) / 100;
    const r = maxR * value;
    return {
      key,
      x: center + Math.cos(angle) * r,
      y: center + Math.sin(angle) * r,
      labelX: center + Math.cos(angle) * (maxR + 20),
      labelY: center + Math.sin(angle) * (maxR + 20)
    };
  });

  const polygon = points.map((p) => `${p.x},${p.y}`).join(' ');
  const rings = [20, 40, 60, 80, 100];

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
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
          <text x={p.labelX} y={p.labelY} fill="#ddd" fontSize="11" textAnchor="middle">
            {p.key}
          </text>
        </g>
      ))}
    </svg>
  );
};

const TrendChart: React.FC<{ trend: Array<{ date: string; rating: number }> }> = ({ trend }) => {
  const width = 720;
  const height = 220;
  const padding = 24;
  const points = trend.slice(-30);
  const max = Math.max(100, ...points.map((p) => p.rating));
  const min = Math.min(0, ...points.map((p) => p.rating));

  const path = points.map((p, idx) => {
    const x = padding + (idx * (width - padding * 2)) / Math.max(1, points.length - 1);
    const y = height - padding - ((p.rating - min) / Math.max(1, max - min)) * (height - padding * 2);
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

  useEffect(() => {
    const load = async () => {
      if (!user?.id) return;
      setLoading(true);
      setError(null);
      try {
        const [analyticsRes, prospectsRes]: any[] = await Promise.all([
          api.get(`/api/analytics/${user.id}`),
          api.get('/api/scouting/top-prospects?limit=10')
        ]);
        const analyticsData = analyticsRes?.data || analyticsRes;
        const prospectsData = prospectsRes?.data || prospectsRes || [];
        setData(analyticsData);
        setProspects(Array.isArray(prospectsData) ? prospectsData : []);
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

  const topProspects = useMemo(() => prospects.slice(0, 5), [prospects]);

  if (loading) {
    return <Page>Loading analytics...</Page>;
  }

  if (error) {
    return <Page>{error}</Page>;
  }

  if (!data) {
    return <Page>No analytics available</Page>;
  }

  return (
    <Page>
      <Card>
        <Title>Digital Athlete</Title>
        <div style={{ color: '#bbb', fontSize: 13 }}>
          Role: <strong>{data.primaryRole}</strong> · Impact Rating: <strong>{data.impactRating.toFixed(1)}</strong>
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
        <Title>AI Insights · Top Prospects</Title>
        {topProspects.length === 0 && <div style={{ color: '#aaa' }}>No insights generated yet.</div>}
        {topProspects.map((row, index) => (
          <div key={`${row.username}-${index}`} style={{ padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
            <strong>@{row.username}</strong> · {row.tag} · Score {Number(row.score).toFixed(1)}
            <div style={{ color: '#bbb', marginTop: 4, fontSize: 13 }}>{row.summary}</div>
          </div>
        ))}
      </Card>
    </Page>
  );
};

export default AnalyticsPage;

