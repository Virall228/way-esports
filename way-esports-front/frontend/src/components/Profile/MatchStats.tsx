import React, { useState } from 'react';
import styled from 'styled-components';

const StatsContainer = styled.div`
  background: #2a2a2a;
  border-radius: 12px;
  padding: 24px;
  margin: 20px 0;
`;

const StatsHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 2px solid #ff6b00;
`;

const StatsTitle = styled.h2`
  font-size: 24px;
  font-weight: 700;
  color: #ffffff;
  margin: 0;
`;

const FilterBar = styled.div`
  display: flex;
  gap: 12px;
  margin-bottom: 20px;
`;

const FilterButton = styled.button<{ $active?: boolean }>`
  background: ${({ $active }) => 
    $active ? '#ff6b00' : '#1a1a1a'};
  color: ${({ $active }) => 
    $active ? '#000000' : '#ffffff'};
  padding: 8px 16px;
  border-radius: 6px;
  font-weight: 500;
  border: 1px solid ${({ $active }) => 
    $active ? '#ff6b00' : 'rgba(255, 107, 0, 0.3)'};
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    background: ${({ $active }) => 
      $active ? '#ff8533' : 'rgba(255, 107, 0, 0.1)'};
  }
`;

const MatchCard = styled.div<{ $won?: boolean }>`
  background: ${({ $won }) => $won ? 'rgba(46, 213, 115, 0.05)' : 'rgba(255, 71, 87, 0.05)'};
  border: 2px solid ${({ $won }) => $won ? '#2ed573' : '#ff4757'};
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 16px;
  transition: all 0.3s ease;
  cursor: pointer;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  }
`;

const MatchHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
`;

const MatchInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const MatchTitle = styled.h3`
  font-size: 18px;
  font-weight: 600;
  color: #ffffff;
  margin: 0;
`;

const MatchDate = styled.div`
  color: #cccccc;
  font-size: 14px;
`;

const MatchResult = styled.div<{ $won?: boolean }>`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
`;

const ResultText = styled.span<{ $won?: boolean }>`
  color: ${({ $won }) => $won ? '#2ed573' : '#ff4757'};
  font-weight: 700;
  font-size: 16px;
`;

const Score = styled.div`
  color: #ffffff;
  font-weight: 600;
  font-size: 18px;
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 16px;
  margin-bottom: 16px;
`;

const StatItem = styled.div`
  text-align: center;
  padding: 12px;
  background: rgba(255, 107, 0, 0.1);
  border-radius: 6px;
`;

const StatValue = styled.div`
  font-size: 20px;
  font-weight: 700;
  color: #ff6b00;
`;

const StatLabel = styled.div`
  color: #cccccc;
  font-size: 12px;
  margin-top: 4px;
`;

const ExpandButton = styled.button`
  background: #ff6b00;
  color: #000000;
  border: none;
  padding: 8px 16px;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.3s ease;

  &:hover {
    background: #ff8533;
  }
`;

const MatchDetails = styled.div<{ $expanded: boolean }>`
  max-height: ${({ $expanded }) => $expanded ? '500px' : '0'};
  overflow: hidden;
  transition: max-height 0.3s ease;
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid #333;
`;

const RoundStats = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
  margin-bottom: 16px;
`;

const RoundCard = styled.div`
  background: #1a1a1a;
  border-radius: 6px;
  padding: 12px;
`;

const RoundTitle = styled.h4`
  color: #ff6b00;
  font-size: 14px;
  font-weight: 600;
  margin: 0 0 8px 0;
`;

const RoundStatsGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
  font-size: 12px;
`;

const RoundStat = styled.div`
  display: flex;
  justify-content: space-between;
  color: #cccccc;
`;

const PerformanceChart = styled.div`
  background: #1a1a1a;
  border-radius: 6px;
  padding: 16px;
  margin-top: 16px;
`;

const ChartTitle = styled.h4`
  color: #ff6b00;
  font-size: 14px;
  font-weight: 600;
  margin: 0 0 12px 0;
`;

const ChartBar = styled.div<{ $value: number; $max: number }>`
  height: 20px;
  background: linear-gradient(90deg, #ff6b00 ${({ $value, $max }) => ($value / $max) * 100}%, #333 ${({ $value, $max }) => ($value / $max) * 100}%);
  border-radius: 10px;
  margin-bottom: 8px;
  position: relative;
`;

const ChartLabel = styled.div`
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: #cccccc;
  margin-bottom: 4px;
`;

interface MatchStats {
  id: number;
  tournament: string;
  opponent: string;
  date: string;
  result: 'win' | 'loss';
  score: string;
  kills: number;
  deaths: number;
  assists: number;
  kdRatio: number;
  headshots: number;
  accuracy: number;
  rounds: {
    round: number;
    kills: number;
    deaths: number;
    assists: number;
    result: 'win' | 'loss';
  }[];
  performance: {
    kills: number;
    deaths: number;
    assists: number;
    headshots: number;
    accuracy: number;
  };
}

interface MatchStatsProps {
  username: string;
}

const MatchStats: React.FC<MatchStatsProps> = ({ username }) => {
  const [activeFilter, setActiveFilter] = useState('all');
  const [expandedMatch, setExpandedMatch] = useState<number | null>(null);

  // Example user match data
  const matchHistory: MatchStats[] = [
    {
      id: 1,
      tournament: "Critical Ops Pro League",
      opponent: "Nova Esports",
      date: "March 15, 2024",
      result: "win",
      score: "16-14",
      kills: 25,
      deaths: 12,
      assists: 8,
      kdRatio: 2.08,
      headshots: 18,
      accuracy: 78.5,
      rounds: [
        { round: 1, kills: 3, deaths: 1, assists: 0, result: 'win' },
        { round: 2, kills: 2, deaths: 2, assists: 1, result: 'loss' },
        { round: 3, kills: 4, deaths: 0, assists: 2, result: 'win' },
        { round: 4, kills: 1, deaths: 3, assists: 0, result: 'loss' },
        { round: 5, kills: 3, deaths: 1, assists: 1, result: 'win' },
        { round: 6, kills: 2, deaths: 2, assists: 2, result: 'win' },
        { round: 7, kills: 5, deaths: 1, assists: 0, result: 'win' },
        { round: 8, kills: 2, deaths: 1, assists: 1, result: 'win' },
        { round: 9, kills: 1, deaths: 1, assists: 1, result: 'loss' },
        { round: 10, kills: 2, deaths: 0, assists: 0, result: 'win' }
      ],
      performance: {
        kills: 25,
        deaths: 12,
        assists: 8,
        headshots: 18,
        accuracy: 78.5
      }
    },
    {
      id: 2,
      tournament: "CS2 WAY Cup",
      opponent: "Tribe Gaming",
      date: "March 14, 2024",
      result: "win",
      score: "13-7",
      kills: 22,
      deaths: 8,
      assists: 12,
      kdRatio: 2.75,
      headshots: 16,
      accuracy: 82.3,
      rounds: [
        { round: 1, kills: 4, deaths: 0, assists: 1, result: 'win' },
        { round: 2, kills: 2, deaths: 1, assists: 2, result: 'win' },
        { round: 3, kills: 3, deaths: 1, assists: 0, result: 'win' },
        { round: 4, kills: 1, deaths: 2, assists: 1, result: 'loss' },
        { round: 5, kills: 2, deaths: 1, assists: 2, result: 'win' },
        { round: 6, kills: 3, deaths: 0, assists: 1, result: 'win' },
        { round: 7, kills: 2, deaths: 1, assists: 2, result: 'win' },
        { round: 8, kills: 1, deaths: 1, assists: 1, result: 'win' },
        { round: 9, kills: 2, deaths: 0, assists: 1, result: 'win' },
        { round: 10, kills: 2, deaths: 1, assists: 1, result: 'win' }
      ],
      performance: {
        kills: 22,
        deaths: 8,
        assists: 12,
        headshots: 16,
        accuracy: 82.3
      }
    },
    {
      id: 3,
      tournament: "PUBG Mobile Masters",
      opponent: "Cloud9",
      date: "March 13, 2024",
      result: "loss",
      score: "7-13",
      kills: 18,
      deaths: 15,
      assists: 6,
      kdRatio: 1.2,
      headshots: 12,
      accuracy: 65.8,
      rounds: [
        { round: 1, kills: 2, deaths: 1, assists: 0, result: 'win' },
        { round: 2, kills: 1, deaths: 2, assists: 1, result: 'loss' },
        { round: 3, kills: 3, deaths: 1, assists: 0, result: 'win' },
        { round: 4, kills: 0, deaths: 3, assists: 0, result: 'loss' },
        { round: 5, kills: 2, deaths: 1, assists: 1, result: 'win' },
        { round: 6, kills: 1, deaths: 2, assists: 0, result: 'loss' },
        { round: 7, kills: 2, deaths: 1, assists: 1, result: 'win' },
        { round: 8, kills: 1, deaths: 2, assists: 0, result: 'loss' },
        { round: 9, kills: 3, deaths: 1, assists: 1, result: 'win' },
        { round: 10, kills: 1, deaths: 1, assists: 1, result: 'loss' }
      ],
      performance: {
        kills: 18,
        deaths: 15,
        assists: 6,
        headshots: 12,
        accuracy: 65.8
      }
    }
  ];

  const filteredMatches = matchHistory.filter(match => {
    if (activeFilter === 'all') return true;
    if (activeFilter === 'wins') return match.result === 'win';
    if (activeFilter === 'losses') return match.result === 'loss';
    return true;
  });

  const toggleMatchExpansion = (matchId: number) => {
    setExpandedMatch(expandedMatch === matchId ? null : matchId);
  };

  const renderMatch = (match: MatchStats) => (
    <MatchCard key={match.id} $won={match.result === 'win'}>
      <MatchHeader>
        <MatchInfo>
          <MatchTitle>{match.tournament}</MatchTitle>
          <MatchDate>vs {match.opponent} {'\u2022'} {match.date}</MatchDate>
        </MatchInfo>
        <MatchResult $won={match.result === 'win'}>
          <ResultText $won={match.result === 'win'}>
            {match.result === 'win' ? 'VICTORY' : 'DEFEAT'}
          </ResultText>
          <Score>{match.score}</Score>
        </MatchResult>
      </MatchHeader>

      <StatsGrid>
        <StatItem>
          <StatValue>{match.kills}</StatValue>
          <StatLabel>Kills</StatLabel>
        </StatItem>
        <StatItem>
          <StatValue>{match.deaths}</StatValue>
          <StatLabel>Deaths</StatLabel>
        </StatItem>
        <StatItem>
          <StatValue>{match.assists}</StatValue>
          <StatLabel>Assists</StatLabel>
        </StatItem>
        <StatItem>
          <StatValue>{match.kdRatio.toFixed(2)}</StatValue>
          <StatLabel>K/D Ratio</StatLabel>
        </StatItem>
        <StatItem>
          <StatValue>{match.headshots}</StatValue>
          <StatLabel>Headshots</StatLabel>
        </StatItem>
        <StatItem>
          <StatValue>{match.accuracy}%</StatValue>
          <StatLabel>Accuracy</StatLabel>
        </StatItem>
      </StatsGrid>

      <ExpandButton onClick={() => toggleMatchExpansion(match.id)}>
        {expandedMatch === match.id ? 'Hide Details' : 'Show Round Details'}
      </ExpandButton>

      <MatchDetails $expanded={expandedMatch === match.id}>
        <RoundStats>
          {match.rounds.slice(0, 10).map(round => (
            <RoundCard key={round.round}>
              <RoundTitle>Round {round.round}</RoundTitle>
              <RoundStatsGrid>
                <RoundStat>
                  <span>Kills:</span>
                  <span style={{ color: '#2ed573' }}>{round.kills}</span>
                </RoundStat>
                <RoundStat>
                  <span>Deaths:</span>
                  <span style={{ color: '#ff4757' }}>{round.deaths}</span>
                </RoundStat>
                <RoundStat>
                  <span>Assists:</span>
                  <span style={{ color: '#ffd700' }}>{round.assists}</span>
                </RoundStat>
                <RoundStat>
                  <span>Result:</span>
                  <span style={{ color: round.result === 'win' ? '#2ed573' : '#ff4757' }}>
                    {round.result === 'win' ? 'WIN' : 'LOSS'}
                  </span>
                </RoundStat>
              </RoundStatsGrid>
            </RoundCard>
          ))}
        </RoundStats>

        <PerformanceChart>
          <ChartTitle>Performance Overview</ChartTitle>
          <div>
            <ChartLabel>
              <span>Kills</span>
              <span>{match.performance.kills}</span>
            </ChartLabel>
            <ChartBar $value={match.performance.kills} $max={30} />
          </div>
          <div>
            <ChartLabel>
              <span>Headshots</span>
              <span>{match.performance.headshots}</span>
            </ChartLabel>
            <ChartBar $value={match.performance.headshots} $max={25} />
          </div>
          <div>
            <ChartLabel>
              <span>Accuracy</span>
              <span>{match.performance.accuracy}%</span>
            </ChartLabel>
            <ChartBar $value={match.performance.accuracy} $max={100} />
          </div>
        </PerformanceChart>
      </MatchDetails>
    </MatchCard>
  );

  return (
    <StatsContainer>
      <StatsHeader>
        <StatsTitle>{'\u{1F4CA}'} Match Statistics - {username}</StatsTitle>
      </StatsHeader>

      <FilterBar>
        <FilterButton 
          $active={activeFilter === 'all'} 
          onClick={() => setActiveFilter('all')}
        >
          All Matches ({matchHistory.length})
        </FilterButton>
        <FilterButton 
          $active={activeFilter === 'wins'} 
          onClick={() => setActiveFilter('wins')}
        >
          Wins ({matchHistory.filter(m => m.result === 'win').length})
        </FilterButton>
        <FilterButton 
          $active={activeFilter === 'losses'} 
          onClick={() => setActiveFilter('losses')}
        >
          Losses ({matchHistory.filter(m => m.result === 'loss').length})
        </FilterButton>
      </FilterBar>

      {filteredMatches.map(renderMatch)}
    </StatsContainer>
  );
};

export default MatchStats; 
