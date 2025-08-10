import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { TournamentBracket, Match, SwissStanding } from '../../types/match';
import { matchService } from '../../services/matchService';
import { useNotifications } from '../../contexts/NotificationContext';
import MatchCard from './MatchCard';
import SwissStandingsTable from './SwissStandingsTable';

interface TournamentBracketProps {
  tournamentId: string;
  isAdmin?: boolean;
}

const Container = styled.div`
  padding: 24px;
  background: linear-gradient(145deg, rgba(20, 20, 20, 0.95), rgba(40, 40, 40, 0.95));
  border-radius: 16px;
  border: 2px solid rgba(128, 128, 128, 0.3);
  margin: 24px 0;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  flex-wrap: wrap;
  gap: 16px;
`;

const Title = styled.h2`
  color: #ffffff;
  margin: 0;
  font-size: 24px;
  background: linear-gradient(135deg, #c0c0c0, #808080);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
`;

const PhaseIndicator = styled.div<{ $phase: 'swiss' | 'playoffs' }>`
  background: ${({ $phase }) => 
    $phase === 'playoffs' 
      ? 'linear-gradient(135deg, #ff1493, #ff69b4)' 
      : 'linear-gradient(135deg, #808080, #c0c0c0)'
  };
  color: ${({ $phase }) => $phase === 'playoffs' ? '#ffffff' : '#000000'};
  padding: 8px 16px;
  border-radius: 20px;
  font-weight: 600;
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 1px;
`;

const TabContainer = styled.div`
  display: flex;
  gap: 8px;
  margin-bottom: 24px;
  flex-wrap: wrap;
`;

const Tab = styled.button<{ $active: boolean }>`
  background: ${({ $active }) => 
    $active ? 'linear-gradient(135deg, #c0c0c0, #808080)' : 'rgba(128, 128, 128, 0.2)'};
  color: ${({ $active }) => $active ? '#000000' : '#c0c0c0'};
  border: 1px solid ${({ $active }) => $active ? '#c0c0c0' : 'rgba(128, 128, 128, 0.3)'};
  padding: 10px 20px;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    background: ${({ $active }) => 
      $active ? 'linear-gradient(135deg, #808080, #c0c0c0)' : 'rgba(192, 192, 192, 0.1)'};
  }
`;

const RoundContainer = styled.div`
  margin-bottom: 32px;
`;

const RoundHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding: 12px 16px;
  background: rgba(128, 128, 128, 0.1);
  border-radius: 8px;
  border-left: 4px solid #808080;
`;

const RoundTitle = styled.h3`
  color: #ffffff;
  margin: 0;
  font-size: 18px;
`;

const RoundInfo = styled.div`
  color: rgba(255, 255, 255, 0.7);
  font-size: 14px;
`;

const MatchesGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: 16px;
`;

const AdminControls = styled.div`
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
`;

const AdminButton = styled.button<{ $variant?: 'primary' | 'success' | 'danger' }>`
  background: ${({ $variant }) => 
    $variant === 'success' ? 'linear-gradient(135deg, #2ed573, #3ddb7f)' :
    $variant === 'danger' ? 'linear-gradient(135deg, #ff4757, #ff6b7a)' :
    'linear-gradient(135deg, #c0c0c0, #808080)'};
  color: #000000;
  border: none;
  padding: 8px 16px;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 12px;

  &:hover:not(:disabled) {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(255, 107, 0, 0.3);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const LoadingContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 40px;
  color: rgba(255, 255, 255, 0.7);
`;

const ErrorContainer = styled.div`
  background: rgba(255, 71, 87, 0.1);
  border: 1px solid rgba(255, 71, 87, 0.3);
  border-radius: 8px;
  padding: 16px;
  color: #ff4757;
  text-align: center;
`;

const TournamentBracketComponent: React.FC<TournamentBracketProps> = ({ 
  tournamentId, 
  isAdmin = false 
}) => {
  const [bracket, setBracket] = useState<TournamentBracket | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'matches' | 'standings'>('matches');
  const [selectedRound, setSelectedRound] = useState<number>(1);
  const { addNotification } = useNotifications();

  useEffect(() => {
    loadBracket();
  }, [tournamentId]);

  const loadBracket = async () => {
    try {
      setLoading(true);
      setError(null);
      const bracketData = await matchService.getTournamentBracket(tournamentId);
      setBracket(bracketData);
      setSelectedRound(bracketData.currentSwissRound);
    } catch (err: any) {
      setError(err.message || 'Failed to load tournament bracket');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateNextRound = async () => {
    if (!bracket) return;

    try {
      const newMatches = await matchService.generateNextRound(tournamentId);
      setBracket(prev => prev ? {
        ...prev,
        currentSwissRound: prev.currentSwissRound + 1,
        matches: [...prev.matches, ...newMatches]
      } : null);

      addNotification({
        type: 'success',
        title: 'Round Generated',
        message: `Round ${bracket.currentSwissRound + 1} has been generated successfully.`
      });
    } catch (err: any) {
      addNotification({
        type: 'error',
        title: 'Generation Failed',
        message: err.message || 'Failed to generate next round'
      });
    }
  };

  const handleStartPlayoffs = async () => {
    if (!bracket) return;

    try {
      const updatedBracket = await matchService.startPlayoffs(tournamentId);
      setBracket(updatedBracket);

      addNotification({
        type: 'success',
        title: 'Playoffs Started',
        message: 'Playoff stage has been initiated successfully.'
      });
    } catch (err: any) {
      addNotification({
        type: 'error',
        title: 'Playoffs Failed',
        message: err.message || 'Failed to start playoffs'
      });
    }
  };

  const getMatchesForRound = (round: number): Match[] => {
    if (!bracket) return [];
    return bracket.matches.filter(match => match.swissRound === round);
  };

  const getAvailableRounds = (): number[] => {
    if (!bracket) return [];
    const rounds = new Set(bracket.matches.map(match => match.swissRound));
    return Array.from(rounds).sort((a, b) => a - b);
  };

  const canGenerateNextRound = (): boolean => {
    if (!bracket || bracket.playoffStarted) return false;
    
    const currentRoundMatches = getMatchesForRound(bracket.currentSwissRound);
    const allCompleted = currentRoundMatches.every(match => match.status === 'completed');
    
    return allCompleted && bracket.currentSwissRound < bracket.swissRounds;
  };

  const canStartPlayoffs = (): boolean => {
    if (!bracket || bracket.playoffStarted) return false;
    
    const qualifiedCount = bracket.swissStandings.filter(s => s.isQualified).length;
    return qualifiedCount >= bracket.qualificationSpots && bracket.currentSwissRound >= bracket.swissRounds;
  };

  if (loading) {
    return (
      <Container>
        <LoadingContainer>
          Loading tournament bracket...
        </LoadingContainer>
      </Container>
    );
  }

  if (error) {
    return (
      <Container>
        <ErrorContainer>
          {error}
        </ErrorContainer>
      </Container>
    );
  }

  if (!bracket) {
    return (
      <Container>
        <ErrorContainer>
          Tournament bracket not found
        </ErrorContainer>
      </Container>
    );
  }

  return (
    <Container>
      <Header>
        <div>
          <Title>Tournament Bracket</Title>
          <PhaseIndicator $phase={bracket.playoffStarted ? 'playoffs' : 'swiss'}>
            {bracket.playoffStarted ? 'Playoffs' : `Swiss Round ${bracket.currentSwissRound}/${bracket.swissRounds}`}
          </PhaseIndicator>
        </div>
        
        {isAdmin && (
          <AdminControls>
            <AdminButton 
              onClick={handleGenerateNextRound}
              disabled={!canGenerateNextRound()}
            >
              Generate Next Round
            </AdminButton>
            <AdminButton 
              $variant="success"
              onClick={handleStartPlayoffs}
              disabled={!canStartPlayoffs()}
            >
              Start Playoffs
            </AdminButton>
          </AdminControls>
        )}
      </Header>

      <TabContainer>
        <Tab 
          $active={activeTab === 'matches'} 
          onClick={() => setActiveTab('matches')}
        >
          Matches
        </Tab>
        <Tab 
          $active={activeTab === 'standings'} 
          onClick={() => setActiveTab('standings')}
        >
          Standings
        </Tab>
      </TabContainer>

      {activeTab === 'matches' && (
        <>
          {!bracket.playoffStarted && (
            <TabContainer>
              {getAvailableRounds().map(round => (
                <Tab
                  key={round}
                  $active={selectedRound === round}
                  onClick={() => setSelectedRound(round)}
                >
                  Round {round}
                </Tab>
              ))}
            </TabContainer>
          )}

          <RoundContainer>
            <RoundHeader>
              <RoundTitle>
                {bracket.playoffStarted ? 'Playoff Matches' : `Swiss Round ${selectedRound}`}
              </RoundTitle>
              <RoundInfo>
                {bracket.playoffStarted 
                  ? `${bracket.playoffMatches.length} matches`
                  : `${getMatchesForRound(selectedRound).length} matches`
                }
              </RoundInfo>
            </RoundHeader>

            <MatchesGrid>
              {(bracket.playoffStarted ? bracket.playoffMatches : getMatchesForRound(selectedRound))
                .map(match => (
                  <MatchCard 
                    key={match.id} 
                    match={match} 
                    isAdmin={isAdmin}
                    onMatchUpdate={loadBracket}
                  />
                ))
              }
            </MatchesGrid>
          </RoundContainer>
        </>
      )}

      {activeTab === 'standings' && (
        <SwissStandingsTable 
          standings={bracket.swissStandings}
          qualificationSpots={bracket.qualificationSpots}
          eliminationThreshold={bracket.eliminationThreshold}
        />
      )}
    </Container>
  );
};

export default TournamentBracketComponent;