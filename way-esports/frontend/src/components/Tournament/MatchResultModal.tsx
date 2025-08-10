import React, { useState } from 'react';
import styled from 'styled-components';
import { Match, MatchResult } from '../../types/match';

interface MatchResultModalProps {
  match: Match;
  onClose: () => void;
  onSubmit: (results: MatchResult[], screenshots: string[]) => void;
}

const Modal = styled.div<{ $isOpen: boolean }>`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  display: ${({ $isOpen }) => $isOpen ? 'flex' : 'none'};
  align-items: center;
  justify-content: center;
  z-index: 9999;
  backdrop-filter: blur(8px);
  padding: 20px;
`;

const ModalContent = styled.div`
  background: linear-gradient(145deg, rgba(42, 42, 42, 0.95), rgba(26, 26, 26, 0.95));
  border-radius: 16px;
  padding: 32px;
  max-width: 600px;
  width: 100%;
  max-height: 80vh;
  overflow-y: auto;
  border: 2px solid rgba(255, 107, 0, 0.3);
  backdrop-filter: blur(15px);
  position: relative;
`;

const CloseButton = styled.button`
  position: absolute;
  top: 16px;
  right: 16px;
  background: none;
  border: none;
  color: rgba(255, 255, 255, 0.7);
  font-size: 24px;
  cursor: pointer;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: all 0.3s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.1);
    color: #ffffff;
  }
`;

const Title = styled.h2`
  color: #ffffff;
  margin: 0 0 24px 0;
  font-size: 24px;
  background: linear-gradient(135deg, #c0c0c0, #808080);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
`;

const MatchInfo = styled.div`
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 24px;
`;

const MatchTitle = styled.div`
  color: #ffffff;
  font-weight: 600;
  font-size: 16px;
  margin-bottom: 8px;
`;

const MatchDetails = styled.div`
  color: rgba(255, 255, 255, 0.7);
  font-size: 14px;
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 20px;
`;

const MapResultsContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const MapResult = styled.div`
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  padding: 16px;
  border: 1px solid rgba(255, 255, 255, 0.1);
`;

const MapHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
`;

const MapName = styled.div`
  color: #ff6b00;
  font-weight: 600;
  font-size: 16px;
`;

const MapNumber = styled.div`
  color: rgba(255, 255, 255, 0.7);
  font-size: 12px;
`;

const ScoreInputs = styled.div`
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  gap: 16px;
  align-items: center;
`;

const TeamScore = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const TeamLabel = styled.label`
  color: #ffffff;
  font-weight: 500;
  font-size: 14px;
`;

const ScoreInput = styled.input`
  background: rgba(26, 26, 26, 0.8);
  border: 1px solid rgba(255, 107, 0, 0.3);
  padding: 8px 12px;
  border-radius: 6px;
  color: #ffffff;
  font-size: 16px;
  text-align: center;
  width: 60px;

  &:focus {
    outline: none;
    border-color: #ff6b00;
    box-shadow: 0 0 0 2px rgba(255, 107, 0, 0.2);
  }
`;

const VS = styled.div`
  color: #ff6b00;
  font-weight: 700;
  font-size: 14px;
  text-align: center;
`;

const WinnerIndicator = styled.div<{ $winner?: string }>`
  color: ${({ $winner }) => $winner ? '#2ed573' : 'rgba(255, 255, 255, 0.5)'};
  font-size: 12px;
  font-weight: 600;
  text-align: center;
  margin-top: 4px;
  min-height: 16px;
`;

const ScreenshotsSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const SectionTitle = styled.h3`
  color: #ffffff;
  margin: 0;
  font-size: 16px;
`;

const FileInput = styled.input`
  background: rgba(26, 26, 26, 0.8);
  border: 1px solid rgba(255, 107, 0, 0.3);
  padding: 8px 12px;
  border-radius: 6px;
  color: #ffffff;
  font-size: 14px;

  &:focus {
    outline: none;
    border-color: #ff6b00;
    box-shadow: 0 0 0 2px rgba(255, 107, 0, 0.2);
  }
`;

const ButtonContainer = styled.div`
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  margin-top: 24px;
`;

const Button = styled.button<{ $variant?: 'primary' | 'secondary' }>`
  background: ${({ $variant }) => 
    $variant === 'secondary' ? 'rgba(128, 128, 128, 0.2)' : 'linear-gradient(135deg, #c0c0c0, #808080)'};
  color: ${({ $variant }) => $variant === 'secondary' ? '#c0c0c0' : '#000000'};
  border: none;
  padding: 12px 24px;
  border-radius: 8px;
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

const ErrorMessage = styled.div`
  color: #ff4757;
  font-size: 14px;
  margin-top: 8px;
`;

const MatchResultModal: React.FC<MatchResultModalProps> = ({ match, onClose, onSubmit }) => {
  const [results, setResults] = useState<MatchResult[]>(
    match.maps.map(map => ({
      mapId: map.id,
      mapName: map.name,
      team1Score: 0,
      team2Score: 0,
      winner: 'team1',
      duration: 0
    }))
  );
  const [screenshots, setScreenshots] = useState<string[]>([]);
  const [error, setError] = useState<string>('');

  const getParticipantName = (isFirst: boolean): string => {
    if (match.team1 && match.team2) {
      return isFirst ? match.team1.name : match.team2.name;
    }
    return isFirst ? match.player1?.username || 'Player 1' : match.player2?.username || 'Player 2';
  };

  const updateResult = (mapIndex: number, field: keyof MatchResult, value: any) => {
    setResults(prev => prev.map((result, index) => {
      if (index === mapIndex) {
        const updated = { ...result, [field]: value };
        
        // Автоматически определяем победителя по счету
        if (field === 'team1Score' || field === 'team2Score') {
          if (updated.team1Score > updated.team2Score) {
            updated.winner = match.team1 ? 'team1' : 'player1';
          } else if (updated.team2Score > updated.team1Score) {
            updated.winner = match.team2 ? 'team2' : 'player2';
          }
        }
        
        return updated;
      }
      return result;
    }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    // В реальном приложении здесь была бы загрузка файлов
    const fileUrls = files.map(file => URL.createObjectURL(file));
    setScreenshots(fileUrls);
  };

  const validateResults = (): boolean => {
    setError('');

    // Проверяем, что все карты имеют результаты
    for (const result of results) {
      if (result.team1Score === 0 && result.team2Score === 0) {
        setError('Please enter scores for all maps');
        return false;
      }
    }

    // Для BO3 проверяем, что есть победитель серии
    if (match.format === 'bo3') {
      const team1Wins = results.filter(r => r.winner === 'team1' || r.winner === 'player1').length;
      const team2Wins = results.filter(r => r.winner === 'team2' || r.winner === 'player2').length;
      
      if (team1Wins < 2 && team2Wins < 2) {
        setError('For BO3 format, one team must win at least 2 maps');
        return false;
      }
    }

    return true;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateResults()) return;

    onSubmit(results, screenshots);
    onClose();
  };

  const getWinnerText = (result: MatchResult): string => {
    if (result.team1Score === result.team2Score) return 'Draw';
    
    const winnerName = result.winner === 'team1' || result.winner === 'player1' 
      ? getParticipantName(true) 
      : getParticipantName(false);
    
    return `${winnerName} wins`;
  };

  return (
    <Modal $isOpen={true} onClick={onClose}>
      <ModalContent onClick={(e) => e.stopPropagation()}>
        <CloseButton onClick={onClose}>×</CloseButton>
        
        <Title>Report Match Result</Title>
        
        <MatchInfo>
          <MatchTitle>
            {getParticipantName(true)} vs {getParticipantName(false)}
          </MatchTitle>
          <MatchDetails>
            {match.format.toUpperCase()} • {match.maps.length} map{match.maps.length > 1 ? 's' : ''}
          </MatchDetails>
        </MatchInfo>

        <Form onSubmit={handleSubmit}>
          <MapResultsContainer>
            {results.map((result, index) => (
              <MapResult key={result.mapId}>
                <MapHeader>
                  <MapName>{result.mapName}</MapName>
                  <MapNumber>Map {index + 1}</MapNumber>
                </MapHeader>
                
                <ScoreInputs>
                  <TeamScore>
                    <TeamLabel>{getParticipantName(true)}</TeamLabel>
                    <ScoreInput
                      type="number"
                      min="0"
                      max="30"
                      value={result.team1Score}
                      onChange={(e) => updateResult(index, 'team1Score', parseInt(e.target.value) || 0)}
                      required
                    />
                  </TeamScore>
                  
                  <VS>VS</VS>
                  
                  <TeamScore>
                    <TeamLabel>{getParticipantName(false)}</TeamLabel>
                    <ScoreInput
                      type="number"
                      min="0"
                      max="30"
                      value={result.team2Score}
                      onChange={(e) => updateResult(index, 'team2Score', parseInt(e.target.value) || 0)}
                      required
                    />
                  </TeamScore>
                </ScoreInputs>
                
                <WinnerIndicator $winner={result.winner}>
                  {getWinnerText(result)}
                </WinnerIndicator>
              </MapResult>
            ))}
          </MapResultsContainer>

          <ScreenshotsSection>
            <SectionTitle>Screenshots (Optional)</SectionTitle>
            <FileInput
              type="file"
              multiple
              accept="image/*"
              onChange={handleFileChange}
            />
          </ScreenshotsSection>

          {error && <ErrorMessage>{error}</ErrorMessage>}

          <ButtonContainer>
            <Button type="button" $variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">
              Submit Result
            </Button>
          </ButtonContainer>
        </Form>
      </ModalContent>
    </Modal>
  );
};

export default MatchResultModal;