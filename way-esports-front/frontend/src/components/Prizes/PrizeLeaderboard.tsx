import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { api } from '../../services/api';

const Container = styled.div`
  padding: 20px;
  width: 100%;
  max-width: 100%;
  margin: 0;
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  gap: 15px;
  margin-bottom: 30px;
`;

const Title = styled.h2`
  color: #ffffff;
  margin: 0;
  font-size: 1.8rem;
`;

const TrophyIcon = styled.div`
  font-size: 2rem;
`;

const LeaderboardList = styled.div`
  background: rgba(255, 255, 255, 0.03);
  border-radius: 12px;
  padding: 20px;
  border: 1px solid rgba(255, 255, 255, 0.1);
`;

const LeaderboardItem = styled.div<{ $rank: number }>`
  display: flex;
  align-items: center;
  padding: 15px;
  background: rgba(255, 255, 255, 0.06);
  border-radius: 8px;
  margin-bottom: 10px;
  border-left: 4px solid ${({ $rank }) => 
    $rank === 1 ? '#FFD700' : 
    $rank === 2 ? '#C0C0C0' : 
    $rank === 3 ? '#CD7F32' : '#ff6b00'
  };

  &:last-child {
    margin-bottom: 0;
  }
`;

const Rank = styled.div<{ $rank: number }>`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  margin-right: 15px;
  background: ${({ $rank }) => 
    $rank === 1 ? '#FFD700' : 
    $rank === 2 ? '#C0C0C0' : 
    $rank === 3 ? '#CD7F32' : 'rgba(255, 107, 0, 0.2)'
  };
  color: ${({ $rank }) => 
    $rank === 1 ? '#000' : 
    $rank === 2 ? '#000' : 
    $rank === 3 ? '#000' : '#ff6b00'
  };
`;

const PlayerInfo = styled.div`
  flex: 1;
`;

const PlayerName = styled.div`
  color: #ffffff;
  font-weight: 600;
  margin-bottom: 5px;
`;

const PlayerStats = styled.div`
  color: #cccccc;
  font-size: 0.9rem;
`;

const PrizeAmount = styled.div`
  font-weight: bold;
  font-size: 1.1rem;
  color: #4CAF50;
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 40px;
  color: #999;
  font-style: italic;
`;

const LoadingState = styled.div`
  text-align: center;
  padding: 40px;
  color: #cccccc;
`;

interface LeaderboardEntry {
  username: string;
  totalPrizes: number;
  prizeCount: number;
  stats: {
    tournamentsWon: number;
    tournamentsPlayed: number;
  };
  photoUrl?: string;
}

const PrizeLeaderboard: React.FC = () => {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadLeaderboard = async () => {
      try {
        setLoading(true);
        const response: any = await api.get('/api/prizes/leaderboard?limit=20');
        const list = Array.isArray(response) ? response : (Array.isArray(response?.data) ? response.data : []);
        setLeaderboard(list);
      } catch (err: any) {
        setError(err?.message || 'Failed to load leaderboard');
      } finally {
        setLoading(false);
      }
    };

    loadLeaderboard();
  }, []);

  if (loading) {
    return (
      <Container>
        <LoadingState>Loading prize leaderboard...</LoadingState>
      </Container>
    );
  }

  if (error) {
    return (
      <Container>
        <EmptyState>Error: {error}</EmptyState>
      </Container>
    );
  }

  return (
    <Container>
      <Header>
        <TrophyIcon>{'\u{1F3C6}'}</TrophyIcon>
        <Title>Prize Leaderboard</Title>
      </Header>

      <LeaderboardList>
        {leaderboard.length > 0 ? (
          leaderboard.map((entry, index) => (
            <LeaderboardItem key={entry.username} $rank={index + 1}>
              <Rank $rank={index + 1}>
                {index + 1}
              </Rank>
              <PlayerInfo>
                <PlayerName>{entry.username}</PlayerName>
                <PlayerStats>
                  {(entry.stats?.tournamentsWon ?? 0)} wins {'\u2022'} {(entry.prizeCount ?? 0)} prizes
                </PlayerStats>
              </PlayerInfo>
              <PrizeAmount>${Number(entry.totalPrizes || 0).toFixed(2)}</PrizeAmount>
            </LeaderboardItem>
          ))
        ) : (
          <EmptyState>No prize winners yet. Be the first to win a tournament!</EmptyState>
        )}
      </LeaderboardList>
    </Container>
  );
};

export default PrizeLeaderboard;
