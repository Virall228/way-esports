import React, { useState } from 'react';
import styled from 'styled-components';

const BracketContainer = styled.div`
  padding: 20px;
  background: #1a1a1a;
  border-radius: 12px;
  margin: 20px 0;
`;

const BracketHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 2px solid #ff6b00;
`;

const BracketTitle = styled.h2`
  font-size: 24px;
  font-weight: 700;
  color: #ffffff;
  margin: 0;
`;

const BracketStage = styled.div`
  color: #ff6b00;
  font-weight: 600;
  font-size: 16px;
`;

const BracketGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 20px;
`;

const MatchCard = styled.div<{ $isWinner?: boolean }>`
  background: ${({ $isWinner }) => $isWinner ? '#2a2a2a' : '#1f1f1f'};
  border: 2px solid ${({ $isWinner }) => $isWinner ? '#ffd700' : '#ff6b00'};
  border-radius: 8px;
  padding: 16px;
  transition: all 0.3s ease;
  cursor: pointer;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(255, 107, 0, 0.3);
  }
`;

const MatchHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid #333;
`;

const MatchNumber = styled.span`
  color: #ff6b00;
  font-weight: 600;
  font-size: 14px;
`;

const MatchScore = styled.div`
  color: #ffffff;
  font-weight: 700;
  font-size: 16px;
`;

const MatchStatus = styled.span<{ $status: string }>`
  background: ${({ $status }) => 
    $status === 'completed' ? '#2ed573' : 
    $status === 'live' ? '#ff4757' : '#ffd700'};
  color: #000000;
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
`;

const TeamContainer = styled.div<{ $isWinner?: boolean }>`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  background: ${({ $isWinner }) => $isWinner ? 'rgba(255, 215, 0, 0.1)' : 'transparent'};
  border-radius: 4px;
  margin: 4px 0;
`;

const TeamInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`;

const TeamLogo = styled.div`
  width: 32px;
  height: 32px;
  background: linear-gradient(135deg, #ff6b00, #ffd700);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  font-weight: 700;
`;

const TeamName = styled.span<{ $isWinner?: boolean }>`
  color: ${({ $isWinner }) => $isWinner ? '#ffd700' : '#ffffff'};
  font-weight: 600;
  font-size: 14px;
`;

const TeamScore = styled.span<{ $isWinner?: boolean }>`
  color: ${({ $isWinner }) => $isWinner ? '#ffd700' : '#ffffff'};
  font-weight: 700;
  font-size: 18px;
`;

const PlayerList = styled.div`
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid #333;
`;

const PlayerItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 4px 0;
  font-size: 12px;
  color: #cccccc;
`;

const PlayerName = styled.span`
  color: #ffffff;
  font-weight: 500;
`;

const PlayerStats = styled.div`
  display: flex;
  gap: 8px;
  font-size: 11px;
  color: #888;
`;

const ExpandButton = styled.button`
  background: #ff6b00;
  color: #000000;
  border: none;
  padding: 8px 16px;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
  margin-top: 12px;
  transition: background-color 0.3s ease;

  &:hover {
    background: #ff8533;
  }
`;

const MatchDetails = styled.div<{ $expanded: boolean }>`
  max-height: ${({ $expanded }) => $expanded ? '500px' : '0'};
  overflow: hidden;
  transition: max-height 0.3s ease;
  margin-top: 12px;
`;

const RoundTitle = styled.h3`
  color: #ff6b00;
  font-size: 18px;
  font-weight: 600;
  margin: 16px 0 8px 0;
  text-align: center;
`;

interface Player {
  id: number;
  name: string;
  kills: number;
  deaths: number;
  assists: number;
  kdRatio: number;
}

interface Team {
  id: number;
  name: string;
  logo: string;
  players: Player[];
  score: number;
}

interface Match {
  id: number;
  round: string;
  team1: Team;
  team2: Team;
  status: 'upcoming' | 'live' | 'completed';
  winner?: Team;
  date: string;
  duration?: string;
}

interface TournamentBracketProps {
  tournamentId: number;
  tournamentName: string;
}

const TournamentBracket: React.FC<TournamentBracketProps> = ({ tournamentId, tournamentName }) => {
  const [expandedMatch, setExpandedMatch] = useState<number | null>(null);

  // Пример данных турнирной сетки
  const bracketData = {
    quarterfinals: [
      {
        id: 1,
        round: "Quarterfinals",
        team1: {
          id: 1,
          name: "WAY Tigers",
          logo: "🐯",
          score: 16,
          players: [
            { id: 1, name: "Tiger_Pro", kills: 25, deaths: 12, assists: 8, kdRatio: 2.08 },
            { id: 2, name: "Sniper_Way", kills: 18, deaths: 15, assists: 12, kdRatio: 1.2 },
            { id: 3, name: "Rush_Master", kills: 22, deaths: 18, assists: 6, kdRatio: 1.22 },
            { id: 4, name: "Support_King", kills: 12, deaths: 20, assists: 25, kdRatio: 0.6 },
            { id: 5, name: "Entry_Fragger", kills: 20, deaths: 16, assists: 10, kdRatio: 1.25 }
          ]
        },
        team2: {
          id: 2,
          name: "Elite Warriors",
          logo: "⚔️",
          score: 14,
          players: [
            { id: 6, name: "Warrior_Elite", kills: 19, deaths: 16, assists: 9, kdRatio: 1.19 },
            { id: 7, name: "Tactical_Mind", kills: 16, deaths: 18, assists: 15, kdRatio: 0.89 },
            { id: 8, name: "Aim_God", kills: 24, deaths: 14, assists: 7, kdRatio: 1.71 },
            { id: 9, name: "Team_Player", kills: 11, deaths: 22, assists: 18, kdRatio: 0.5 },
            { id: 10, name: "Clutch_Master", kills: 17, deaths: 19, assists: 11, kdRatio: 0.89 }
          ]
        },
        status: "completed" as const,
        winner: { id: 1, name: "WAY Tigers", logo: "🐯", score: 16, players: [] },
        date: "March 15, 2024",
        duration: "45:32"
      },
      {
        id: 2,
        round: "Quarterfinals",
        team1: {
          id: 3,
          name: "Phoenix Rising",
          logo: "🔥",
          score: 16,
          players: [
            { id: 11, name: "Phoenix_Flame", kills: 28, deaths: 10, assists: 5, kdRatio: 2.8 },
            { id: 12, name: "Rising_Star", kills: 20, deaths: 14, assists: 12, kdRatio: 1.43 },
            { id: 13, name: "Fire_Starter", kills: 18, deaths: 16, assists: 15, kdRatio: 1.13 },
            { id: 14, name: "Heat_Wave", kills: 14, deaths: 18, assists: 20, kdRatio: 0.78 },
            { id: 15, name: "Blaze_Runner", kills: 16, deaths: 17, assists: 13, kdRatio: 0.94 }
          ]
        },
        team2: {
          id: 4,
          name: "Shadow Hunters",
          logo: "🌙",
          score: 12,
          players: [
            { id: 16, name: "Shadow_Stalker", kills: 21, deaths: 15, assists: 8, kdRatio: 1.4 },
            { id: 17, name: "Night_Hunter", kills: 17, deaths: 16, assists: 14, kdRatio: 1.06 },
            { id: 18, name: "Stealth_Master", kills: 15, deaths: 19, assists: 16, kdRatio: 0.79 },
            { id: 19, name: "Dark_Assassin", kills: 13, deaths: 20, assists: 18, kdRatio: 0.65 },
            { id: 20, name: "Silent_Killer", kills: 19, deaths: 17, assists: 10, kdRatio: 1.12 }
          ]
        },
        status: "completed" as const,
        winner: { id: 3, name: "Phoenix Rising", logo: "🔥", score: 16, players: [] },
        date: "March 15, 2024",
        duration: "38:45"
      }
    ],
    semifinals: [
      {
        id: 3,
        round: "Semifinals",
        team1: {
          id: 1,
          name: "WAY Tigers",
          logo: "🐯",
          score: 16,
          players: [
            { id: 1, name: "Tiger_Pro", kills: 30, deaths: 8, assists: 6, kdRatio: 3.75 },
            { id: 2, name: "Sniper_Way", kills: 22, deaths: 12, assists: 10, kdRatio: 1.83 },
            { id: 3, name: "Rush_Master", kills: 25, deaths: 15, assists: 8, kdRatio: 1.67 },
            { id: 4, name: "Support_King", kills: 15, deaths: 18, assists: 28, kdRatio: 0.83 },
            { id: 5, name: "Entry_Fragger", kills: 18, deaths: 14, assists: 12, kdRatio: 1.29 }
          ]
        },
        team2: {
          id: 5,
          name: "Thunder Storm",
          logo: "⚡",
          score: 14,
          players: [
            { id: 21, name: "Thunder_Bolt", kills: 26, deaths: 12, assists: 7, kdRatio: 2.17 },
            { id: 22, name: "Storm_Chaser", kills: 20, deaths: 14, assists: 11, kdRatio: 1.43 },
            { id: 23, name: "Lightning_Fast", kills: 19, deaths: 16, assists: 13, kdRatio: 1.19 },
            { id: 24, name: "Rain_Maker", kills: 12, deaths: 20, assists: 22, kdRatio: 0.6 },
            { id: 25, name: "Wind_Rider", kills: 16, deaths: 18, assists: 15, kdRatio: 0.89 }
          ]
        },
        status: "completed" as const,
        winner: { id: 1, name: "WAY Tigers", logo: "🐯", score: 16, players: [] },
        date: "March 16, 2024",
        duration: "52:18"
      }
    ],
    finals: [
      {
        id: 4,
        round: "Finals",
        team1: {
          id: 1,
          name: "WAY Tigers",
          logo: "🐯",
          score: 16,
          players: [
            { id: 1, name: "Tiger_Pro", kills: 35, deaths: 6, assists: 4, kdRatio: 5.83 },
            { id: 2, name: "Sniper_Way", kills: 28, deaths: 10, assists: 8, kdRatio: 2.8 },
            { id: 3, name: "Rush_Master", kills: 30, deaths: 12, assists: 6, kdRatio: 2.5 },
            { id: 4, name: "Support_King", kills: 18, deaths: 16, assists: 32, kdRatio: 1.13 },
            { id: 5, name: "Entry_Fragger", kills: 22, deaths: 14, assists: 10, kdRatio: 1.57 }
          ]
        },
        team2: {
          id: 3,
          name: "Phoenix Rising",
          logo: "🔥",
          score: 13,
          players: [
            { id: 11, name: "Phoenix_Flame", kills: 32, deaths: 8, assists: 3, kdRatio: 4.0 },
            { id: 12, name: "Rising_Star", kills: 25, deaths: 12, assists: 10, kdRatio: 2.08 },
            { id: 13, name: "Fire_Starter", kills: 20, deaths: 16, assists: 18, kdRatio: 1.25 },
            { id: 14, name: "Heat_Wave", kills: 16, deaths: 18, assists: 24, kdRatio: 0.89 },
            { id: 15, name: "Blaze_Runner", kills: 18, deaths: 17, assists: 15, kdRatio: 1.06 }
          ]
        },
        status: "completed" as const,
        winner: { id: 1, name: "WAY Tigers", logo: "🐯", score: 16, players: [] },
        date: "March 17, 2024",
        duration: "1:05:42"
      }
    ]
  };

  const toggleMatchExpansion = (matchId: number) => {
    setExpandedMatch(expandedMatch === matchId ? null : matchId);
  };

  const renderMatch = (match: Match) => (
    <MatchCard key={match.id} $isWinner={match.status === 'completed'}>
      <MatchHeader>
        <MatchNumber>Match #{match.id}</MatchNumber>
        <MatchScore>{match.team1.score} - {match.team2.score}</MatchScore>
        <MatchStatus $status={match.status}>
          {match.status === 'completed' ? 'COMPLETED' : 
           match.status === 'live' ? 'LIVE' : 'UPCOMING'}
        </MatchStatus>
      </MatchHeader>

      <TeamContainer $isWinner={match.winner?.id === match.team1.id}>
        <TeamInfo>
          <TeamLogo>{match.team1.logo}</TeamLogo>
          <TeamName $isWinner={match.winner?.id === match.team1.id}>
            {match.team1.name}
          </TeamName>
        </TeamInfo>
        <TeamScore $isWinner={match.winner?.id === match.team1.id}>
          {match.team1.score}
        </TeamScore>
      </TeamContainer>

      <TeamContainer $isWinner={match.winner?.id === match.team2.id}>
        <TeamInfo>
          <TeamLogo>{match.team2.logo}</TeamLogo>
          <TeamName $isWinner={match.winner?.id === match.team2.id}>
            {match.team2.name}
          </TeamName>
        </TeamInfo>
        <TeamScore $isWinner={match.winner?.id === match.team2.id}>
          {match.team2.score}
        </TeamScore>
      </TeamContainer>

      <ExpandButton onClick={() => toggleMatchExpansion(match.id)}>
        {expandedMatch === match.id ? 'Hide Details' : 'Show Player Stats'}
      </ExpandButton>

      <MatchDetails $expanded={expandedMatch === match.id}>
        <div style={{ marginBottom: '16px' }}>
          <strong>Date:</strong> {match.date} | <strong>Duration:</strong> {match.duration}
        </div>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div>
            <h4 style={{ color: '#ff6b00', marginBottom: '8px' }}>{match.team1.name} Players</h4>
            {match.team1.players.map(player => (
              <PlayerItem key={player.id}>
                <PlayerName>{player.name}</PlayerName>
                <PlayerStats>
                  <span>K: {player.kills}</span>
                  <span>D: {player.deaths}</span>
                  <span>A: {player.assists}</span>
                  <span>K/D: {player.kdRatio.toFixed(2)}</span>
                </PlayerStats>
              </PlayerItem>
            ))}
          </div>
          
          <div>
            <h4 style={{ color: '#ff6b00', marginBottom: '8px' }}>{match.team2.name} Players</h4>
            {match.team2.players.map(player => (
              <PlayerItem key={player.id}>
                <PlayerName>{player.name}</PlayerName>
                <PlayerStats>
                  <span>K: {player.kills}</span>
                  <span>D: {player.deaths}</span>
                  <span>A: {player.assists}</span>
                  <span>K/D: {player.kdRatio.toFixed(2)}</span>
                </PlayerStats>
              </PlayerItem>
            ))}
          </div>
        </div>
      </MatchDetails>
    </MatchCard>
  );

  return (
    <BracketContainer>
      <BracketHeader>
        <BracketTitle>{tournamentName} - Tournament Bracket</BracketTitle>
        <BracketStage>Champion: WAY Tigers 🏆</BracketStage>
      </BracketHeader>

      <RoundTitle>🏆 Finals</RoundTitle>
      <BracketGrid>
        {bracketData.finals.map(renderMatch)}
      </BracketGrid>

      <RoundTitle>🥈 Semifinals</RoundTitle>
      <BracketGrid>
        {bracketData.semifinals.map(renderMatch)}
      </BracketGrid>

      <RoundTitle>🥉 Quarterfinals</RoundTitle>
      <BracketGrid>
        {bracketData.quarterfinals.map(renderMatch)}
      </BracketGrid>
    </BracketContainer>
  );
};

export default TournamentBracket; 