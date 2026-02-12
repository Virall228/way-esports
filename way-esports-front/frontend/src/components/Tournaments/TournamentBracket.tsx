import React, { useMemo, useState } from 'react';
import styled from 'styled-components';
import { useQuery } from '@tanstack/react-query';
import { tournamentService } from '../../services/tournamentService';

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
  const { data: matchesRaw = [], isLoading, error } = useQuery({
    queryKey: ['tournament', tournamentId, 'bracket'],
    queryFn: async () => {
      if (!tournamentId) return [];
      const res: any = await tournamentService.getMatches(String(tournamentId));
      return res?.data || res || [];
    },
    enabled: Boolean(tournamentId),
    staleTime: 15000,
    refetchOnWindowFocus: false
  });

  const { finals, semifinals, quarterfinals, otherRounds } = useMemo(() => {
    const list: any[] = Array.isArray(matchesRaw) ? matchesRaw : [];

    const buildTeam = (team: any, score: number): Team => {
      if (!team) {
        return { id: 0, name: 'TBD', logo: '?', players: [], score };
      }
      if (typeof team === 'string') {
        const safeName = team || 'TBD';
        return { id: 0, name: safeName, logo: safeName.charAt(0).toUpperCase(), players: [], score };
      }
      const id = Number(team.id || team._id || 0);
      const name = String(team.name || team.tag || team.username || 'TBD');
      const logo = String(team.logo || name.charAt(0).toUpperCase());
      return { id, name, logo, players: [], score };
    };

    const normalizeMatch = (match: any, fallbackIndex: number): Match => {
      const score1 = Number(match.score?.team1 ?? 0);
      const score2 = Number(match.score?.team2 ?? 0);
      const team1 = buildTeam(match.team1, score1);
      const team2 = buildTeam(match.team2, score2);
      const status = (match.status || '').toString().toLowerCase();
      const isCompleted = status === 'completed' || status === 'finished';
      const winnerId = match.winner?.id || match.winner?._id || (typeof match.winner === 'string' ? match.winner : '');
      const winner =
        winnerId
          ? (String(winnerId) === String(match.team1?.id || match.team1?._id) ? team1 : team2)
          : (isCompleted ? (score1 >= score2 ? team1 : team2) : undefined);

      const rawId = match.id || match._id;
      const numericId = Number(rawId);
      const safeId = Number.isFinite(numericId) ? numericId : (fallbackIndex + 1);

      return {
        id: safeId,
        round: match.round || 'Round',
        team1,
        team2,
        status: (status === 'live' || status === 'ongoing' || status === 'in_progress') ? 'live' :
          (status === 'completed' || status === 'finished') ? 'completed' : 'upcoming',
        winner,
        date: match.startTime ? new Date(match.startTime).toLocaleDateString() : 'TBD',
        duration: match.endTime && match.startTime
          ? `${Math.max(1, Math.round((new Date(match.endTime).getTime() - new Date(match.startTime).getTime()) / 60000))} min`
          : undefined
      };
    };

    const finals: Match[] = [];
    const semifinals: Match[] = [];
    const quarterfinals: Match[] = [];
    const otherRounds: Match[] = [];

    list.forEach((match, index) => {
      const round = (match.round || '').toString().toLowerCase();
      const normalized = normalizeMatch(match, index);
      if (round.includes('semi')) {
        semifinals.push(normalized);
      } else if (round.includes('quarter')) {
        quarterfinals.push(normalized);
      } else if (round.includes('final')) {
        finals.push(normalized);
      } else {
        otherRounds.push(normalized);
      }
    });

    return { finals, semifinals, quarterfinals, otherRounds };
  }, [matchesRaw]);

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
        <BracketStage>Champion: TBD {'\u{1F3C6}'}</BracketStage>
      </BracketHeader>

      {isLoading && (
        <RoundTitle>Loading bracket...</RoundTitle>
      )}
      {!isLoading && error && (
        <RoundTitle>Failed to load bracket</RoundTitle>
      )}
      {!isLoading && !error && finals.length === 0 && semifinals.length === 0 && quarterfinals.length === 0 && otherRounds.length === 0 && (
        <RoundTitle>No bracket data yet</RoundTitle>
      )}

      {!isLoading && !error && finals.length > 0 && (
        <>
          <RoundTitle>{'\u{1F3C6}'} Finals</RoundTitle>
          <BracketGrid>
            {finals.map(renderMatch)}
          </BracketGrid>
        </>
      )}

      {!isLoading && !error && semifinals.length > 0 && (
        <>
          <RoundTitle>{'\u{1F948}'} Semifinals</RoundTitle>
          <BracketGrid>
            {semifinals.map(renderMatch)}
          </BracketGrid>
        </>
      )}

      {!isLoading && !error && quarterfinals.length > 0 && (
        <>
          <RoundTitle>{'\u{1F949}'} Quarterfinals</RoundTitle>
          <BracketGrid>
            {quarterfinals.map(renderMatch)}
          </BracketGrid>
        </>
      )}

      {!isLoading && !error && otherRounds.length > 0 && (
        <>
          <RoundTitle>Other Rounds</RoundTitle>
          <BracketGrid>
            {otherRounds.map(renderMatch)}
          </BracketGrid>
        </>
      )}
    </BracketContainer>
  );
};

export default TournamentBracket; 
