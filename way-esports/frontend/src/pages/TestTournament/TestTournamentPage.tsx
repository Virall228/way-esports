import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { useSubscription } from '../../hooks/useSubscription';
import SubscriptionRequiredModal from '../../components/Tournament/SubscriptionRequiredModal';
import { useNotifications } from '../../contexts/NotificationContext';
import { testTournamentService } from '../../services/testTournamentService';

const Container = styled.div`
  min-height: 100vh;
  background: linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 100%);
  padding: 80px 20px 40px;
`;

const Header = styled.div`
  text-align: center;
  margin-bottom: 40px;
`;

const Title = styled.h1`
  font-size: 36px;
  font-weight: 700;
  color: #ffffff;
  margin: 0 0 16px 0;
`;

const TournamentCard = styled.div`
  max-width: 600px;
  margin: 0 auto;
  background: linear-gradient(145deg, rgba(42, 42, 42, 0.9), rgba(26, 26, 26, 0.9));
  border-radius: 16px;
  padding: 32px;
  border: 2px solid rgba(255, 107, 0, 0.3);
  backdrop-filter: blur(10px);
`;

const TournamentTitle = styled.h2`
  color: #ff6b00;
  font-size: 24px;
  font-weight: 700;
  margin: 0 0 16px 0;
  text-align: center;
`;

const TournamentInfo = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 16px;
  margin-bottom: 24px;
`;

const InfoItem = styled.div`
  text-align: center;
  padding: 16px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
`;

const InfoLabel = styled.div`
  color: #888888;
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 1px;
  margin-bottom: 8px;
`;

const InfoValue = styled.div`
  color: #ffffff;
  font-size: 16px;
  font-weight: 600;
`;

const RegisterButton = styled.button<{ $disabled?: boolean }>`
  width: 100%;
  padding: 16px 32px;
  border-radius: 12px;
  font-weight: 700;
  cursor: ${({ $disabled }) => $disabled ? 'not-allowed' : 'pointer'};
  transition: all 0.3s ease;
  border: none;
  font-size: 16px;
  text-transform: uppercase;
  letter-spacing: 1px;
  opacity: ${({ $disabled }) => $disabled ? 0.6 : 1};
  background: ${({ $disabled }) => 
    $disabled ? '#666666' : 'linear-gradient(135deg, #ff6b00, #ff8533)'};
  color: #ffffff;

  &:hover:not(:disabled) {
    transform: translateY(-3px);
    box-shadow: 0 8px 25px rgba(255, 107, 0, 0.5);
  }

  &:active:not(:disabled) {
    transform: translateY(-1px);
  }
`;

const SubscriptionStatus = styled.div<{ $hasSubscription: boolean }>`
  text-align: center;
  margin-bottom: 24px;
  padding: 16px;
  border-radius: 8px;
  background: ${({ $hasSubscription }) => 
    $hasSubscription ? 'rgba(46, 213, 115, 0.1)' : 'rgba(255, 107, 0, 0.1)'};
  border: 1px solid ${({ $hasSubscription }) => 
    $hasSubscription ? 'rgba(46, 213, 115, 0.3)' : 'rgba(255, 107, 0, 0.3)'};
`;

const StatusText = styled.div<{ $hasSubscription: boolean }>`
  color: ${({ $hasSubscription }) => $hasSubscription ? '#2ed573' : '#ff6b00'};
  font-weight: 600;
  font-size: 14px;
`;

const TestTournamentPage: React.FC = () => {
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const [registering, setRegistering] = useState(false);
  const [userStatus, setUserStatus] = useState<any>(null);
  const { hasActiveSubscription, loading, refreshSubscription } = useSubscription();
  const { addNotification } = useNotifications();

  useEffect(() => {
    loadUserStatus();
  }, []);

  const loadUserStatus = async () => {
    try {
      const status = await testTournamentService.getUserStatus();
      setUserStatus(status);
    } catch (error) {
      console.error('Error loading user status:', error);
    }
  };

  const handleRegister = async () => {
    setRegistering(true);
    try {
      await testTournamentService.registerForTournament('test-tournament');
      addNotification({
        type: 'success',
        title: 'Registration Successful',
        message: 'You have been registered for the tournament!'
      });
    } catch (error: any) {
      if (error.requiresSubscription) {
        setShowSubscriptionModal(true);
      } else {
        addNotification({
          type: 'error',
          title: 'Registration Failed',
          message: error.message || 'Failed to register for tournament'
        });
      }
    } finally {
      setRegistering(false);
    }
  };

  const handleToggleSubscription = async () => {
    try {
      const result = await testTournamentService.toggleSubscription();
      await loadUserStatus();
      await refreshSubscription();
      
      addNotification({
        type: 'info',
        title: 'Subscription Status Changed',
        message: result.message
      });
    } catch (error: any) {
      addNotification({
        type: 'error',
        title: 'Error',
        message: 'Failed to toggle subscription status'
      });
    }
  };

  if (loading) {
    return (
      <Container>
        <Header>
          <Title>Loading...</Title>
        </Header>
      </Container>
    );
  }

  return (
    <Container>
      <Header>
        <Title>Tournament Registration Test</Title>
      </Header>

      <TournamentCard>
        <TournamentTitle>Valorant Championship</TournamentTitle>
        
        <SubscriptionStatus $hasSubscription={hasActiveSubscription}>
          <StatusText $hasSubscription={hasActiveSubscription}>
            {hasActiveSubscription 
              ? '✅ You have an active subscription - Ready to register!' 
              : '⚠️ Active subscription required to register for tournaments'
            }
          </StatusText>
          {userStatus && (
            <div style={{ marginTop: '12px', fontSize: '12px', color: '#888' }}>
              User: {userStatus.user} | Backend Status: {userStatus.hasActiveSubscription ? 'Active' : 'Inactive'}
            </div>
          )}
        </SubscriptionStatus>

        <TournamentInfo>
          <InfoItem>
            <InfoLabel>Prize Pool</InfoLabel>
            <InfoValue>$5,000</InfoValue>
          </InfoItem>
          <InfoItem>
            <InfoLabel>Players</InfoLabel>
            <InfoValue>32/64</InfoValue>
          </InfoItem>
          <InfoItem>
            <InfoLabel>Entry Fee</InfoLabel>
            <InfoValue>Free</InfoValue>
          </InfoItem>
          <InfoItem>
            <InfoLabel>Start Date</InfoLabel>
            <InfoValue>Dec 25</InfoValue>
          </InfoItem>
        </TournamentInfo>

        <RegisterButton
          onClick={handleRegister}
          $disabled={registering}
        >
          {registering ? 'Registering...' : 'Register for Tournament'}
        </RegisterButton>

        <div style={{ marginTop: '16px', textAlign: 'center' }}>
          <RegisterButton
            onClick={handleToggleSubscription}
            style={{ 
              background: 'linear-gradient(135deg, #6c5ce7, #a29bfe)',
              fontSize: '14px',
              padding: '12px 24px'
            }}
          >
            Toggle Subscription (Test)
          </RegisterButton>
        </div>
      </TournamentCard>

      <SubscriptionRequiredModal
        isOpen={showSubscriptionModal}
        onClose={() => setShowSubscriptionModal(false)}
        tournamentName="Valorant Championship"
      />
    </Container>
  );
};

export default TestTournamentPage;