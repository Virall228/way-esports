import React, { useState } from 'react';
import styled from 'styled-components';
import { Match, MatchResult } from '../../types/match';
import { matchService } from '../../services/matchService';
import { useNotifications } from '../../contexts/NotificationContext';
import MatchResultModal from './MatchResultModal';

interface MatchCardProps {
  match: Match;
  isAdmin?: boolean;
  onMatchUpdate?: () => void;
}

const Card = styled.div<{ $status: string }>`
  background: linear-gradient(145deg, rgba(42, 42, 42, 0.9), rgba(26, 26, 26, 0.9));
  border-radius: 12px;
  padding: 20px;
  border: 1px solid ${({ $status }) => 
    $status === 'completed' ? 'rgba(46, 213, 115, 0.3)' :
    $status === 'in_progress' ? 'rgba(255, 105, 180, 0.3)' :
    $status === 'cancelled' ? 'rgba(255, 71, 87, 0.3)' :
    'rgba(128, 128, 128, 0.2)'};
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.3);
  }

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 3px;
    background: ${({ $status }) => 
      $status === 'completed' ? 'linear-gradient(90deg, #2ed573, #3ddb7f)' :
      $status === 'in_progress' ? 'linear-gradient(90deg, #c0c0c0, #808080)' :
      $status === 'cancelled' ? 'linear-gradient(90deg, #ff4757, #ff6b7a)' :
      'linear-gradient(90deg, #808080, #c0c0c0)'};
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
  align-items: center;
  gap: 12px;
`;

const MatchNumber = styled.div`
  background: rgba(255, 107, 0, 0.2);
  color: #ff6b00;
  padding: 4px 8px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 600;
`;

const Format = styled.div<{ $format: string }>`
  background: ${({ $format }) => 
    $format === 'bo3' ? 'rgba(192, 192, 192, 0.2)' : 'rgba(128, 128, 128, 0.2)'};
  color: ${({ $format }) => 
    $format === 'bo3' ? '#c0c0c0' : '#808080'};
  padding: 4px 8px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
`;

const Status = styled.div<{ $status: string }>`
  color: ${({ $status }) => 
    $status === 'completed' ? '#2ed573' :
    $status === 'in_progress' ? '#ff6b00' :
    $status === 'cancelled' ? '#ff4757' :
    '#cccccc'};
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 1px;
`;

const ParticipantsContainer = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin: 20px 0;
`;

const Participant = styled.div<{ $isWinner?: boolean }>`
  display: flex;
  flex-direction: column;
  align-items: center;
  flex: 1;
  opacity: ${({ $isWinner }) => $isWinner === false ? 0.6 : 1};
`;

const ParticipantName = styled.div<{ $isWinner?: boolean }>`
  color: ${({ $isWinner }) => $isWinner ? '#2ed573' : '#ffffff'};
  font-weight: 600;
  font-size: 16px;
  text-align: center;
  margin-bottom: 4px;
`;

const ParticipantTag = styled.div`
  color: rgba(255, 255, 255, 0.7);
  font-size: 12px;
  text-align: center;
`;

const VSContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  margin: 0 16px;
`;

const VS = styled.div`
  color: #ff6b00;
  font-weight: 700;
  font-size: 14px;
  margin-bottom: 4px;
`;

const Score = styled.div<{ $isWinner?: boolean }>`
  color: ${({ $isWinner }) => $isWinner ? '#2ed573' : '#ffffff'};
  font-weight: 700;
  font-size: 18px;
`;

const MapsContainer = styled.div`
  margin: 16px 0;
`;

const MapsTitle = styled.div`
  color: rgba(255, 255, 255, 0.8);
  font-size: 12px;
  font-weight: 600;
  margin-bottom: 8px;
  text-transform: uppercase;
  letter-spacing: 1px;
`;

const MapsList = styled.div`
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
`;

const MapChip = styled.div<{ $played?: boolean; $winner?: 'team1' | 'team2' | 'player1' | 'player2' }>`
  background: ${({ $played, $winner }) => 
    $played && $winner ? 'rgba(46, 213, 115, 0.2)' :
    $played ? 'rgba(255, 107, 0, 0.2)' :
    'rgba(255, 255, 255, 0.1)'};
  color: ${({ $played, $winner }) => 
    $played && $winner ? '#2ed573' :
    $played ? '#ff6b00' :
    'rgba(255, 255, 255, 0.7)'};
  padding: 4px 8px;
  border-radius: 6px;
  font-size: 11px;
  font-weight: 500;
  border: 1px solid ${({ $played, $winner }) => 
    $played && $winner ? 'rgba(46, 213, 115, 0.3)' :
    $played ? 'rgba(255, 107, 0, 0.3)' :
    'rgba(255, 255, 255, 0.2)'};
`;

const ResultsContainer = styled.div`
  margin: 16px 0;
`;

const ResultItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 6px;
  margin-bottom: 4px;
`;

const ResultMap = styled.div`
  color: #ffffff;
  font-weight: 500;
  font-size: 14px;
`;

const ResultScore = styled.div<{ $winner: string }>`
  color: ${({ $winner }) => $winner ? '#2ed573' : '#ffffff'};
  font-weight: 600;
  font-size: 14px;
`;

const TimeInfo = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin: 16px 0;
  padding: 8px 12px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 6px;
`;

const TimeLabel = styled.div`
  color: rgba(255, 255, 255, 0.7);
  font-size: 12px;
`;

const TimeValue = styled.div`
  color: #ffffff;
  font-size: 12px;
  font-weight: 500;
`;

const ActionsContainer = styled.div`
  display: flex;
  gap: 8px;
  margin-top: 16px;
  flex-wrap: wrap;
`;

const ActionButton = styled.button<{ $variant?: 'primary' | 'secondary' | 'success' | 'danger' }>`
  background: ${({ $variant }) => 
    $variant === 'success' ? 'linear-gradient(135deg, #2ed573, #3ddb7f)' :
    $variant === 'danger' ? 'linear-gradient(135deg, #ff4757, #ff6b7a)' :
    $variant === 'secondary' ? 'rgba(255, 255, 255, 0.1)' :
    'linear-gradient(135deg, #c0c0c0, #808080)'};
  color: #000000;
  border: none;
  padding: 8px 16px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover:not(:disabled) {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(255, 107, 0, 0.3);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const StreamLink = styled.a`
  color: #ff1493;
  text-decoration: none;
  font-size: 12px;
  font-weight: 600;
  
  &:hover {
    text-decoration: underline;
  }
`;

const MatchCard: React.FC<MatchCardProps> = ({ match, isAdmin = false, onMatchUpdate }) => {
  const [showResultModal, setShowResultModal] = useState(false);
  const { addNotification } = useNotifications();

  const getParticipantName = (isFirst: boolean) => {
    if (match.team1 && match.team2) {
      return isFirst ? match.team1.name : match.team2.name;
    }
    return isFirst ? match.player1?.username : match.player2?.username;
  };

  const getParticipantTag = (isFirst: boolean) => {
    if (match.team1 && match.team2) {
      return isFirst ? match.team1.tag : match.team2.tag;
    }
    return isFirst ? 'Solo' : 'Solo';
  };

  const isWinner = (isFirst: boolean) => {
    if (match.status !== 'completed' || !match.winner) return undefined;
    
    if (match.team1 && match.team2) {
      return isFirst ? match.winner === 'team1' : match.winner === 'team2';
    }
    return isFirst ? match.winner === 'player1' : match.winner === 'player2';
  };

  const getScore = () => {
    if (match.results.length === 0) return { team1: 0, team2: 0 };
    
    const team1Wins = match.results.filter(r => r.winner === 'team1' || r.winner === 'player1').length;
    const team2Wins = match.results.filter(r => r.winner === 'team2' || r.winner === 'player2').length;
    
    return { team1: team1Wins, team2: team2Wins };
  };

  const formatTime = (timeString: string) => {
    return new Date(timeString).toLocaleString();
  };

  const handleSubmitResult = async (results: MatchResult[], screenshots: string[]) => {
    try {
      await matchService.submitMatchResult(match.id, results, screenshots);
      addNotification({
        type: 'success',
        title: 'Result Submitted',
        message: 'Match result has been submitted for review.'
      });
      onMatchUpdate?.();
    } catch (error: any) {
      addNotification({
        type: 'error',
        title: 'Submission Failed',
        message: error.message || 'Failed to submit match result'
      });
    }
  };

  const handleCancelMatch = async () => {
    if (!window.confirm('Are you sure you want to cancel this match?')) return;

    try {
      await matchService.cancelMatch(match.id, 'Cancelled by admin');
      addNotification({
        type: 'success',
        title: 'Match Cancelled',
        message: 'Match has been cancelled successfully.'
      });
      onMatchUpdate?.();
    } catch (error: any) {
      addNotification({
        type: 'error',
        title: 'Cancellation Failed',
        message: error.message || 'Failed to cancel match'
      });
    }
  };

  const score = getScore();

  return (
    <>
      <Card $status={match.status}>
        <MatchHeader>
          <MatchInfo>
            <MatchNumber>Match #{match.matchNumber}</MatchNumber>
            <Format $format={match.format}>{match.format.toUpperCase()}</Format>
          </MatchInfo>
          <Status $status={match.status}>{match.status.replace('_', ' ')}</Status>
        </MatchHeader>

        <ParticipantsContainer>
          <Participant $isWinner={isWinner(true)}>
            <ParticipantName $isWinner={isWinner(true)}>
              {getParticipantName(true) || 'TBD'}
            </ParticipantName>
            <ParticipantTag>{getParticipantTag(true)}</ParticipantTag>
          </Participant>

          <VSContainer>
            <VS>VS</VS>
            {match.status === 'completed' && (
              <Score $isWinner={score.team1 > score.team2}>
                {score.team1} - {score.team2}
              </Score>
            )}
          </VSContainer>

          <Participant $isWinner={isWinner(false)}>
            <ParticipantName $isWinner={isWinner(false)}>
              {getParticipantName(false) || 'TBD'}
            </ParticipantName>
            <ParticipantTag>{getParticipantTag(false)}</ParticipantTag>
          </Participant>
        </ParticipantsContainer>

        <MapsContainer>
          <MapsTitle>Maps</MapsTitle>
          <MapsList>
            {match.maps.map((map, index) => {
              const result = match.results.find(r => r.mapId === map.id);
              return (
                <MapChip 
                  key={map.id} 
                  $played={!!result}
                  $winner={result?.winner}
                >
                  {map.name}
                  {result && ` (${result.team1Score}-${result.team2Score})`}
                </MapChip>
              );
            })}
          </MapsList>
        </MapsContainer>

        {match.results.length > 0 && (
          <ResultsContainer>
            {match.results.map((result, index) => (
              <ResultItem key={index}>
                <ResultMap>{result.mapName}</ResultMap>
                <ResultScore $winner={result.winner}>
                  {result.team1Score} - {result.team2Score}
                </ResultScore>
              </ResultItem>
            ))}
          </ResultsContainer>
        )}

        <TimeInfo>
          <div>
            <TimeLabel>Scheduled</TimeLabel>
            <TimeValue>{formatTime(match.scheduledTime)}</TimeValue>
          </div>
          {match.startTime && (
            <div>
              <TimeLabel>Started</TimeLabel>
              <TimeValue>{formatTime(match.startTime)}</TimeValue>
            </div>
          )}
          {match.endTime && (
            <div>
              <TimeLabel>Ended</TimeLabel>
              <TimeValue>{formatTime(match.endTime)}</TimeValue>
            </div>
          )}
        </TimeInfo>

        <ActionsContainer>
          {match.status === 'scheduled' && (
            <ActionButton onClick={() => setShowResultModal(true)}>
              Report Result
            </ActionButton>
          )}
          
          {match.streamUrl && (
            <StreamLink href={match.streamUrl} target="_blank" rel="noopener noreferrer">
              Watch Stream
            </StreamLink>
          )}

          {isAdmin && (
            <>
              {match.status !== 'completed' && match.status !== 'cancelled' && (
                <ActionButton $variant="danger" onClick={handleCancelMatch}>
                  Cancel Match
                </ActionButton>
              )}
            </>
          )}
        </ActionsContainer>
      </Card>

      {showResultModal && (
        <MatchResultModal
          match={match}
          onClose={() => setShowResultModal(false)}
          onSubmit={handleSubmitResult}
        />
      )}
    </>
  );
};

export default MatchCard;