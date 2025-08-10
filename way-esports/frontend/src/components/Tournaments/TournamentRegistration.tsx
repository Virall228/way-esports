import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { Tournament, RegistrationStatus, Team } from '../../types';
import { tournamentService } from '../../services/tournamentService';
import { useNotifications } from '../../contexts/NotificationContext';
import { useSubscription } from '../../hooks/useSubscription';
import SubscriptionRequiredModal from '../Tournament/SubscriptionRequiredModal';

const RegistrationContainer = styled.div`
  background: linear-gradient(145deg, rgba(42, 42, 42, 0.9), rgba(26, 26, 26, 0.9));
  border-radius: 12px;
  padding: 24px;
  margin: 16px 0;
  border: 1px solid rgba(255, 107, 0, 0.2);
`;

const RegistrationTitle = styled.h3`
  color: #ffffff;
  margin: 0 0 16px 0;
  font-size: 18px;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const TournamentTypeTag = styled.span<{ $type: string }>`
  background: ${({ $type }) => 
    $type === 'team' ? 'linear-gradient(135deg, #3498db, #2980b9)' :
    $type === 'solo' ? 'linear-gradient(135deg, #e74c3c, #c0392b)' :
    'linear-gradient(135deg, #f39c12, #e67e22)'};
  color: #ffffff;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
`;

const RegistrationInfo = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 16px;
  margin-bottom: 20px;
`;

const InfoItem = styled.div`
  text-align: center;
`;

const InfoValue = styled.div`
  font-size: 20px;
  font-weight: 700;
  color: #ff6b00;
  margin-bottom: 4px;
`;

const InfoLabel = styled.div`
  color: #cccccc;
  font-size: 12px;
`;

const RegistrationStatus = styled.div<{ $status: string }>`
  padding: 12px;
  border-radius: 8px;
  margin-bottom: 16px;
  background: ${({ $status }) => 
    $status === 'registered' ? 'rgba(46, 213, 115, 0.1)' :
    $status === 'open' ? 'rgba(255, 107, 0, 0.1)' :
    'rgba(255, 71, 87, 0.1)'};
  border: 1px solid ${({ $status }) => 
    $status === 'registered' ? 'rgba(46, 213, 115, 0.3)' :
    $status === 'open' ? 'rgba(255, 107, 0, 0.3)' :
    'rgba(255, 71, 87, 0.3)'};
  color: ${({ $status }) => 
    $status === 'registered' ? '#2ed573' :
    $status === 'open' ? '#ff6b00' :
    '#ff4757'};
  font-weight: 600;
  text-align: center;
`;

const RegistrationOptions = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const RegistrationButton = styled.button<{ $variant?: 'primary' | 'secondary' | 'danger' }>`
  background: ${({ $variant }) => 
    $variant === 'danger' ? 'linear-gradient(135deg, #ff4757, #ff6b7a)' :
    $variant === 'secondary' ? 'rgba(255, 255, 255, 0.1)' :
    'linear-gradient(135deg, #ff6b00, #ff8533)'};
  color: #ffffff;
  border: none;
  padding: 12px 20px;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 15px rgba(255, 107, 0, 0.4);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
  }
`;

const TeamSelector = styled.select`
  background: rgba(26, 26, 26, 0.8);
  color: #ffffff;
  border: 1px solid rgba(255, 107, 0, 0.3);
  padding: 12px;
  border-radius: 8px;
  cursor: pointer;
  margin-bottom: 12px;
  width: 100%;

  &:focus {
    outline: none;
    border-color: #ff6b00;
    box-shadow: 0 0 0 2px rgba(255, 107, 0, 0.2);
  }

  option {
    background: #1a1a1a;
    color: #ffffff;
  }
`;

const ParticipantsList = styled.div`
  margin-top: 20px;
`;

const ParticipantsTitle = styled.h4`
  color: #ffffff;
  margin: 0 0 12px 0;
  font-size: 16px;
`;

const ParticipantsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 12px;
`;

const ParticipantCard = styled.div`
  background: rgba(42, 42, 42, 0.6);
  border-radius: 8px;
  padding: 12px;
  border: 1px solid rgba(255, 107, 0, 0.1);
  display: flex;
  align-items: center;
  gap: 8px;
`;

const ParticipantAvatar = styled.div`
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: linear-gradient(135deg, #ff6b00, #ff8533);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #ffffff;
  font-weight: 600;
  font-size: 14px;
`;

const ParticipantInfo = styled.div`
  flex: 1;
`;

const ParticipantName = styled.div`
  color: #ffffff;
  font-weight: 600;
  font-size: 14px;
`;

const ParticipantType = styled.div`
  color: #cccccc;
  font-size: 12px;
`;

interface TournamentRegistrationProps {
  tournament: Tournament;
  userTeams?: Team[];
  onRegistrationChange?: () => void;
}

const TournamentRegistration: React.FC<TournamentRegistrationProps> = ({
  tournament,
  userTeams = [],
  onRegistrationChange
}) => {
  const [registrationStatus, setRegistrationStatus] = useState<RegistrationStatus | null>(null);
  const [selectedTeam, setSelectedTeam] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const { addNotification } = useNotifications();
  const { hasActiveSubscription } = useSubscription();

  useEffect(() => {
    fetchRegistrationStatus();
  }, [tournament.id]);

  const fetchRegistrationStatus = async () => {
    try {
      const status = await tournamentService.getRegistrationStatus(tournament.id);
      setRegistrationStatus(status);
    } catch (error) {
      console.error('Error fetching registration status:', error);
    }
  };

  const handlePlayerRegistration = async () => {
    // Check subscription first
    if (!hasActiveSubscription) {
      setShowSubscriptionModal(true);
      return;
    }

    setLoading(true);
    try {
      await tournamentService.registerAsPlayer(tournament.id);
      addNotification('Successfully registered as solo player!', 'success');
      await fetchRegistrationStatus();
      onRegistrationChange?.();
    } catch (error: any) {
      // Check if error is subscription-related
      if (error.requiresSubscription) {
        setShowSubscriptionModal(true);
      } else {
        addNotification(error.message || 'Failed to register as player', 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleTeamRegistration = async () => {
    if (!selectedTeam) {
      addNotification('Please select a team', 'error');
      return;
    }

    // Check subscription first
    if (!hasActiveSubscription) {
      setShowSubscriptionModal(true);
      return;
    }

    setLoading(true);
    try {
      await tournamentService.registerTeam(tournament.id, selectedTeam);
      addNotification('Successfully registered team!', 'success');
      await fetchRegistrationStatus();
      onRegistrationChange?.();
    } catch (error: any) {
      // Check if error is subscription-related
      if (error.requiresSubscription) {
        setShowSubscriptionModal(true);
      } else {
        addNotification(error.message || 'Failed to register team', 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleUnregister = async () => {
    setLoading(true);
    try {
      await tournamentService.unregister(tournament.id);
      addNotification('Successfully unregistered from tournament', 'success');
      await fetchRegistrationStatus();
      onRegistrationChange?.();
    } catch (error: any) {
      addNotification(error.message || 'Failed to unregister', 'error');
    } finally {
      setLoading(false);
    }
  };

  const getRegistrationStatusText = () => {
    if (!registrationStatus) return 'Loading...';
    
    if (registrationStatus.isRegistered) {
      return `✅ Registered as ${registrationStatus.registrationType}`;
    }
    
    if (tournament.status !== 'registration') {
      return '❌ Registration closed';
    }
    
    if (tournament.spotsRemaining <= 0) {
      return '❌ Tournament full';
    }
    
    return '🟡 Registration open';
  };

  const getRegistrationStatusType = () => {
    if (!registrationStatus) return 'loading';
    if (registrationStatus.isRegistered) return 'registered';
    if (tournament.status !== 'registration' || tournament.spotsRemaining <= 0) return 'closed';
    return 'open';
  };

  const getMaxParticipants = () => {
    if (tournament.type === 'team') return tournament.maxTeams;
    if (tournament.type === 'solo') return tournament.maxPlayers;
    return (tournament.maxTeams || 0) + (tournament.maxPlayers || 0);
  };

  return (
    <RegistrationContainer>
      <RegistrationTitle>
        Tournament Registration
        <TournamentTypeTag $type={tournament.type}>
          {tournament.type}
        </TournamentTypeTag>
      </RegistrationTitle>

      <RegistrationInfo>
        <InfoItem>
          <InfoValue>{tournament.participantCount}</InfoValue>
          <InfoLabel>Registered</InfoLabel>
        </InfoItem>
        <InfoItem>
          <InfoValue>{getMaxParticipants()}</InfoValue>
          <InfoLabel>Max Participants</InfoLabel>
        </InfoItem>
        <InfoItem>
          <InfoValue>{tournament.spotsRemaining}</InfoValue>
          <InfoLabel>Spots Left</InfoLabel>
        </InfoItem>
      </RegistrationInfo>

      <RegistrationStatus $status={getRegistrationStatusType()}>
        {getRegistrationStatusText()}
      </RegistrationStatus>

      {registrationStatus && (
        <RegistrationOptions>
          {registrationStatus.isRegistered ? (
            <RegistrationButton
              $variant="danger"
              onClick={handleUnregister}
              disabled={loading}
            >
              {loading ? 'Unregistering...' : 'Unregister'}
            </RegistrationButton>
          ) : (
            <>
              {registrationStatus.canRegisterAsPlayer && (
                <RegistrationButton
                  onClick={handlePlayerRegistration}
                  disabled={loading}
                >
                  {loading ? 'Registering...' : 'Register as Solo Player'}
                </RegistrationButton>
              )}

              {registrationStatus.canRegisterWithTeam && userTeams.length > 0 && (
                <>
                  <TeamSelector
                    value={selectedTeam}
                    onChange={(e) => setSelectedTeam(e.target.value)}
                  >
                    <option value="">Select a team...</option>
                    {userTeams.map((team) => (
                      <option key={team._id} value={team._id}>
                        {team.name} [{team.tag}]
                      </option>
                    ))}
                  </TeamSelector>
                  <RegistrationButton
                    onClick={handleTeamRegistration}
                    disabled={loading || !selectedTeam}
                  >
                    {loading ? 'Registering...' : 'Register Team'}
                  </RegistrationButton>
                </>
              )}
            </>
          )}
        </RegistrationOptions>
      )}

      {(tournament.registeredTeams.length > 0 || tournament.registeredPlayers.length > 0) && (
        <ParticipantsList>
          <ParticipantsTitle>Registered Participants</ParticipantsTitle>
          <ParticipantsGrid>
            {tournament.registeredTeams.map((team) => (
              <ParticipantCard key={team._id}>
                <ParticipantAvatar>
                  {team.tag || team.name.charAt(0)}
                </ParticipantAvatar>
                <ParticipantInfo>
                  <ParticipantName>{team.name}</ParticipantName>
                  <ParticipantType>Team</ParticipantType>
                </ParticipantInfo>
              </ParticipantCard>
            ))}
            {tournament.registeredPlayers.map((player) => (
              <ParticipantCard key={player._id}>
                <ParticipantAvatar>
                  {player.username.charAt(0).toUpperCase()}
                </ParticipantAvatar>
                <ParticipantInfo>
                  <ParticipantName>{player.username}</ParticipantName>
                  <ParticipantType>Solo Player</ParticipantType>
                </ParticipantInfo>
              </ParticipantCard>
            ))}
          </ParticipantsGrid>
        </ParticipantsList>
      )}

      <SubscriptionRequiredModal
        isOpen={showSubscriptionModal}
        onClose={() => setShowSubscriptionModal(false)}
        tournamentName={tournament.name}
      />
    </RegistrationContainer>
  );
};

export default TournamentRegistration;