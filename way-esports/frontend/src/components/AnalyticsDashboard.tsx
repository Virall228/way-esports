import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { useAuth } from '../contexts/AuthContext';
import { useApi } from '../hooks/useApi';

const DashboardContainer = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
`;

const DashboardHeader = styled.div`
  margin-bottom: 2rem;
`;

const DashboardTitle = styled.h1`
  color: #ffffff;
  margin-bottom: 0.5rem;
`;

const DashboardSubtitle = styled.p`
  color: #cccccc;
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
`;

const StatCard = styled.div`
  background: #1a1a1a;
  padding: 1.5rem;
  border-radius: 8px;
  border-left: 4px solid #007bff;
`;

const StatTitle = styled.h3`
  color: #cccccc;
  margin: 0 0 0.5rem 0;
  font-size: 0.9rem;
`;

const StatValue = styled.div`
  color: #ffffff;
  font-size: 2rem;
  font-weight: bold;
`;

const ChartContainer = styled.div`
  background: #1a1a1a;
  padding: 1.5rem;
  border-radius: 8px;
  margin-bottom: 1.5rem;
`;

const ChartTitle = styled.h3`
  color: #ffffff;
  margin-bottom: 1rem;
`;

const PerformanceChart = styled.div`
  display: flex;
  align-items: end;
  gap: 0.5rem;
  height: 200px;
`;

const ChartBar = styled.div<{ height: number; color: string }>`
  flex: 1;
  background: ${props => props.color};
  height: ${props => props.height}%;
  min-height: 10px;
  border-radius: 4px 4px 0 0;
  position: relative;
`;

const BarLabel = styled.div`
  position: absolute;
  bottom: -20px;
  left: 50%;
  transform: translateX(-50%);
  font-size: 0.8rem;
  color: #cccccc;
`;

const RecentMatches = styled.div`
  background: #1a1a1a;
  padding: 1.5rem;
  border-radius: 8px;
`;

const MatchItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  border-bottom: 1px solid #333;
  
  &:last-child {
    border-bottom: none;
  }
`;

const MatchResult = styled.span<{ result: 'win' | 'loss' }>`
  color: ${props => props.result === 'win' ? '#28a745' : '#dc3545'};
  font-weight: bold;
`;

interface AnalyticsData {
  totalTournaments: number;
  totalMatches: number;
  winRate: number;
  averageScore: number;
  recentMatches: Array<{
    id: string;
    opponent: string;
    result: 'win' | 'loss';
    score: string;
    date: string;
  }>;
  performanceHistory: Array<{
    month: string;
    wins: number;
    losses: number;
  }>;
}

export const AnalyticsDashboard: React.FC = () => {
  const { user } = useAuth();
  const api = useApi();
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);

  useEffect(() => {
    if (user) {
      fetchAnalytics();
    }
  }, [user]);

  const fetchAnalytics = async () => {
    try {
      const response = await api.request(`/api/users/${user?.id}/analytics`);
      setAnalytics(response.data);
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
    }
  };

  if (!analytics) return <div>Loading...</div>;

  return (
    <DashboardContainer>
      <DashboardHeader>
        <DashboardTitle>Analytics Dashboard</DashboardTitle>
        <DashboardSubtitle>Track your performance and progress</DashboardSubtitle>
      </DashboardHeader>

      <StatsGrid>
        <StatCard>
          <StatTitle>Total Tournaments</StatTitle>
          <StatValue>{analytics.totalTournaments}</StatValue>
        </StatCard>
        <StatCard>
          <StatTitle>Total Matches</StatTitle>
          <StatValue>{analytics.totalMatches}</StatValue>
        </StatCard>
        <StatCard>
          <StatTitle>Win Rate</StatTitle>
          <StatValue>{analytics.winRate}%</StatValue>
        </StatCard>
        <StatCard>
          <StatTitle>Average Score</StatTitle>
          <StatValue>{analytics.averageScore}</StatValue>
        </StatCard>
      </StatsGrid>

      <ChartContainer>
        <ChartTitle>Performance History</ChartTitle>
        <PerformanceChart>
          {analytics.performanceHistory.map((data, index) => {
            const total = data.wins + data.losses;
            const winRate = total > 0 ? (data.wins / total) * 100 : 0;
            return (
              <ChartBar 
                key={index} 
                height={winRate} 
                color={winRate > 50 ? '#28a745' : '#dc3545'}
              >
                <BarLabel>{data.month}</BarLabel>
              </ChartBar>
            );
          })}
        </PerformanceChart>
      </ChartContainer>

      <RecentMatches>
        <ChartTitle>Recent Matches</ChartTitle>
        {analytics.recentMatches.map(match => (
          <MatchItem key={match.id}>
            <div>
              <strong>{match.opponent}</strong>
              <div style={{ color: '#cccccc', fontSize: '0.9rem' }}>
                {new Date(match.date).toLocaleDateString()}
              </div>
            </div>
            <div>
              <MatchResult result={match.result}>
                {match.result.toUpperCase()}
              </MatchResult>
              <div style={{ color: '#cccccc' }}>{match.score}</div>
            </div>
          </MatchItem>
        ))}
      </RecentMatches>
    </DashboardContainer>
  );
};
