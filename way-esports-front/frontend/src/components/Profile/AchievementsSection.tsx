import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import { api } from '../../services/api';

const Container = styled.div`
  margin-top: 24px;
`;

const Title = styled.h2`
  color: ${({ theme }) => theme.colors.text.primary};
  margin-bottom: 16px;
  font-size: 1.5rem;
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
`;

const Card = styled.div<{ $earned?: boolean }>`
  background: ${({ theme, $earned }) => $earned ? theme.colors.surface : 'rgba(255,255,255,0.02)'};
  border: 1px solid ${({ theme, $earned }) => $earned ? theme.colors.border.medium : theme.colors.border.light};
  border-radius: 12px;
  padding: 16px;
  opacity: ${({ $earned }) => $earned ? 1 : 0.6};
  transition: all 0.3s ease;
`;

const Icon = styled.div`
  font-size: 2.5rem;
  margin-bottom: 8px;
`;

const Name = styled.div`
  color: ${({ theme }) => theme.colors.text.primary};
  font-weight: 600;
  margin-bottom: 4px;
`;

const Description = styled.div`
  color: ${({ theme }) => theme.colors.text.secondary};
  font-size: 0.9rem;
  margin-bottom: 12px;
`;

const Progress = styled.div`
  background: rgba(255,255,255,0.1);
  border-radius: 4px;
  height: 6px;
  overflow: hidden;
  margin-bottom: 4px;
`;

const ProgressFill = styled.div<{ $percent: number }>`
  height: 100%;
  background: ${({ theme }) => theme.colors.accent};
  width: ${({ $percent }) => $percent}%;
  transition: width 0.3s ease;
`;

const ProgressText = styled.div`
  color: ${({ theme }) => theme.colors.text.secondary};
  font-size: 0.8rem;
`;

interface Achievement {
  _id: string;
  key: string;
  name: string;
  description: string;
  icon: string;
  isActive: boolean;
  criteria: { type: string; value: number };
  earned?: boolean;
  progress?: number;
  current?: number;
}

const AchievementsSection: React.FC = () => {
  const [items, setItems] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const res: any = await api.get('/api/achievements/me');
        const list: Achievement[] = (res && res.data) || [];
        if (mounted) setItems(list);
      } catch (e: any) {
        if (mounted) setError(e?.message || 'Failed to load achievements');
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => { mounted = false; };
  }, []);

  if (loading) return <div style={{ color: '#888' }}>Loading achievements...</div>;
  if (error) return <div style={{ color: '#e57373' }}>{error}</div>;

  return (
    <Container>
      <Title>Achievements</Title>
      <Grid>
        {items.map((a) => (
          <Card key={a._id} $earned={a.earned}>
            <Icon>{a.icon}</Icon>
            <Name>{a.name}</Name>
            <Description>{a.description}</Description>
            {!a.earned && (
              <>
                <Progress>
                  <ProgressFill $percent={a.progress || 0} />
                </Progress>
                <ProgressText>
                  {a.current || 0} / {a.criteria?.value || 0}
                </ProgressText>
              </>
            )}
            {a.earned && (
              <ProgressText style={{ color: '#4caf50' }}>
                {'\u2713'} Earned
              </ProgressText>
            )}
          </Card>
        ))}
      </Grid>
    </Container>
  );
};

export default AchievementsSection;
