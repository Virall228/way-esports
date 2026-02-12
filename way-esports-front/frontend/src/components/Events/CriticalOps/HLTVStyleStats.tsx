import React from 'react';
import styled from 'styled-components';
import { CriticalOpsMatch } from '../../../types/matches';

const Container = styled.div`
  display: grid;
  gap: ${({ theme }) => theme.spacing.lg};
`;

const MatchHeader = styled.div`
  background: ${({ theme }) => theme.colors.surface};
  border-radius: ${({ theme }) => theme.borderRadius.lg};
  padding: ${({ theme }) => theme.spacing.lg};
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.lg};
`;

const TeamSection = styled.div<{ $winner?: boolean }>`
  display: flex;
  flex-direction: column;
  align-items: ${({ $winner }) => $winner ? 'flex-start' : 'flex-end'};
  gap: ${({ theme }) => theme.spacing.sm};
`;

const TeamName = styled.h2<{ $winner?: boolean }>`
  font-size: ${({ theme }) => theme.typography.fontSizes.xl};
  font-weight: ${({ theme }) => theme.typography.fontWeights.bold};
  color: ${({ $winner, theme }) => $winner ? theme.colors.primary : theme.colors.text};
`;



const Score = styled.div`
  font-size: ${({ theme }) => theme.typography.fontSizes.xxl};
  font-weight: ${({ theme }) => theme.typography.fontWeights.bold};
  display: flex;
  gap: ${({ theme }) => theme.spacing.md};
`;

const ScoreNumber = styled.span<{ $winner?: boolean }>`
  color: ${({ $winner, theme }) => $winner ? theme.colors.primary : theme.colors.text};
`;

const MatchInfo = styled.div`
  text-align: center;
  color: ${({ theme }) => theme.colors.textSecondary};
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: ${({ theme }) => theme.spacing.lg};
`;

const StatsCard = styled.div`
  background: ${({ theme }) => theme.colors.surface};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  padding: ${({ theme }) => theme.spacing.lg};
`;

const StatsTitle = styled.h3`
  font-size: ${({ theme }) => theme.typography.fontSizes.lg};
  font-weight: ${({ theme }) => theme.typography.fontWeights.semibold};
  margin-bottom: ${({ theme }) => theme.spacing.md};
`;

const StatRow = styled.div`
  display: grid;
  grid-template-columns: auto 1fr auto;
  gap: ${({ theme }) => theme.spacing.md};
  align-items: center;
  padding: ${({ theme }) => theme.spacing.xs} 0;
`;

const StatLabel = styled.span`
  color: ${({ theme }) => theme.colors.textSecondary};
`;

const StatBar = styled.div<{ $value: number; $max: number }>`
  width: 100%;
  height: 4px;
  background: ${({ theme }) => theme.colors.background};
  border-radius: ${({ theme }) => theme.borderRadius.full};
  position: relative;
  overflow: hidden;

  &::after {
    content: '';
    position: absolute;
    left: 0;
    top: 0;
    height: 100%;
    width: ${({ $value, $max }) => ($value / $max) * 100}%;
    background: ${({ theme }) => theme.colors.primary};
    border-radius: ${({ theme }) => theme.borderRadius.full};
  }
`;

const StatValue = styled.span`
  font-weight: ${({ theme }) => theme.typography.fontWeights.medium};
`;

interface HLTVStyleStatsProps {
  match: CriticalOpsMatch;
}

const HLTVStyleStats: React.FC<HLTVStyleStatsProps> = ({ match }) => {
  return (
    <Container>
      <MatchHeader>
        <TeamSection $winner={match.winner === match.team1.id}>
          <TeamName $winner={match.winner === match.team1.id}>{match.team1.name}</TeamName>
          <span>{match.team1.tag}</span>
        </TeamSection>
        <div>
          <Score>
            <ScoreNumber $winner={match.winner === match.team1.id}>{match.team1.stats.score}</ScoreNumber>
            <span>:</span>
            <ScoreNumber $winner={match.winner === match.team2.id}>{match.team2.stats.score}</ScoreNumber>
          </Score>
          <MatchInfo>
            {(match.tournament?.name || 'Tournament')}
            {match.tournament?.round ? ` - ${match.tournament.round}` : ''}
            <br />
            {match.map}
          </MatchInfo>
        </div>
        <TeamSection $winner={match.winner === match.team2.id}>
          <TeamName $winner={match.winner === match.team2.id}>{match.team2.name}</TeamName>
          <span>{match.team2.tag}</span>
        </TeamSection>
      </MatchHeader>

      <StatsGrid>
        <StatsCard>
          <StatsTitle>Team Statistics</StatsTitle>
          <StatRow>
            <StatLabel>Total Kills</StatLabel>
            <StatBar 
              $value={match.team1.stats.totalKills} 
              $max={Math.max(match.team1.stats.totalKills, match.team2.stats.totalKills)} 
            />
            <StatValue>{match.team1.stats.totalKills}</StatValue>
          </StatRow>
          <StatRow>
            <StatLabel>Headshots</StatLabel>
            <StatBar 
              $value={match.team1.stats.totalHeadshots} 
              $max={Math.max(match.team1.stats.totalHeadshots, match.team2.stats.totalHeadshots)} 
            />
            <StatValue>{match.team1.stats.totalHeadshots}</StatValue>
          </StatRow>
          <StatRow>
            <StatLabel>Accuracy</StatLabel>
            <StatBar 
              $value={match.team1.stats.averageAccuracy} 
              $max={100} 
            />
            <StatValue>{match.team1.stats.averageAccuracy}%</StatValue>
          </StatRow>
        </StatsCard>

        <StatsCard>
          <StatsTitle>Round Statistics</StatsTitle>
          <StatRow>
            <StatLabel>Rounds Won</StatLabel>
            <StatBar 
              $value={match.team1.stats.roundsWon} 
              $max={match.team1.stats.roundsWon + match.team1.stats.roundsLost} 
            />
            <StatValue>{match.team1.stats.roundsWon}</StatValue>
          </StatRow>
          <StatRow>
            <StatLabel>Plants</StatLabel>
            <StatBar 
              $value={match.team1.stats.plantedBombs} 
              $max={Math.max(match.team1.stats.plantedBombs, match.team2.stats.plantedBombs)} 
            />
            <StatValue>{match.team1.stats.plantedBombs}</StatValue>
          </StatRow>
          <StatRow>
            <StatLabel>Defuses</StatLabel>
            <StatBar 
              $value={match.team1.stats.defusedBombs} 
              $max={Math.max(match.team1.stats.defusedBombs, match.team2.stats.defusedBombs)} 
            />
            <StatValue>{match.team1.stats.defusedBombs}</StatValue>
          </StatRow>
        </StatsCard>
      </StatsGrid>
    </Container>
  );
};

export default HLTVStyleStats; 
