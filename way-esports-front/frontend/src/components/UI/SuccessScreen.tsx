import React from 'react';
import styled, { keyframes } from 'styled-components';
import Card from './Card';
import NextStepsGuide from './NextStepsGuide';
import navigationService from '../../services/NavigationService';

interface SuccessScreenProps {
  username: string;
  game: 'CS2' | 'CriticalOps' | 'PUBG';
  onContinue: () => void;
}

const fadeIn = keyframes`
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

const Container = styled.div`
  width: 100%;
  max-width: 100%;
  margin: 0;
  padding: ${({ theme }) => theme.spacing.xl};
  animation: ${fadeIn} 0.6s ease-out;
`;

const WelcomeCard = styled(Card)`
  text-align: center;
  padding: ${({ theme }) => theme.spacing.xl};
  margin-bottom: ${({ theme }) => theme.spacing.xl};
  background: linear-gradient(
    135deg,
    ${({ theme }) => theme.colors.primary} 0%,
    ${({ theme }) => theme.colors.surface} 100%
  );
`;

const IconContainer = styled.div`
  width: 80px;
  height: 80px;
  margin: 0 auto ${({ theme }) => theme.spacing.xl};
  background: ${({ theme }) => `${theme.colors.accent}22`};
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2.5rem;
  color: ${({ theme }) => theme.colors.accent};
  box-shadow: 0 0 20px ${({ theme }) => theme.colors.accent}33;
`;

const Title = styled.h2`
  color: ${({ theme }) => theme.colors.text.primary};
  margin-bottom: ${({ theme }) => theme.spacing.md};
`;

const Message = styled.p`
  color: ${({ theme }) => theme.colors.text.secondary};
  margin-bottom: ${({ theme }) => theme.spacing.xl};
  font-size: ${({ theme }) => theme.typography.body1.fontSize};
`;

const ContinueButton = styled.button`
  margin-top: ${({ theme }) => theme.spacing.xl};
  padding: 12px 20px;
  border-radius: 10px;
  border: 1px solid rgba(255, 255, 255, 0.15);
  background: linear-gradient(135deg, #3a3a3a, #2a2a2a);
  color: #ffffff;
  font-weight: 600;
  cursor: pointer;
`;
const SuccessScreen: React.FC<SuccessScreenProps> = ({
  username,
  game,
  onContinue
}) => {
  const handleActionClick = (actionId: string) => {
    // Handle action clicks using NavigationService
    switch (actionId) {
      // Tournament Actions
      case 'browse_tournaments':
        navigationService.goToTournaments({ game });
        break;
      case 'join_tournament':
        navigationService.goToTournaments({ game });
        break;
      case 'practice_match':
        navigationService.goToPracticeHub(game);
        break;

      // Team Actions
      case 'browse_teams':
        navigationService.goToTeams({ game });
        break;
      case 'create_team':
        navigationService.goToCreateTeam();
        break;
      case 'team_practice':
        navigationService.goToPracticeHub(game);
        break;

      // Profile Actions
      case 'upload_avatar':
        navigationService.goToProfileEdit();
        break;
      case 'link_accounts':
        navigationService.goToProfileSettings();
        break;
      case 'set_availability':
        navigationService.goToAvailability();
        break;

      // Community Actions
      case 'join_discord':
        navigationService.goToDiscord();
        break;
      case 'follow_players':
        navigationService.goToLeaderboards(game);
        break;
      case 'share_profile':
        navigationService.goToProfile(username);
        break;

      default:
        // Default to dashboard
        navigationService.goToDashboard();
    }
  };

  return (
    <Container>
      <WelcomeCard>
        <IconContainer>{'\u2728'}</IconContainer>
        <Title>Welcome Aboard, {username}!</Title>
        <Message>
          Your WAY Esports profile is ready. Get ready to compete in {game} and climb
          the rankings! Here's what you can do next:
        </Message>
      </WelcomeCard>

      <NextStepsGuide
        username={username}
        game={game}
        onActionClick={handleActionClick}
      />
      <ContinueButton onClick={onContinue}>
        Continue
      </ContinueButton>
    </Container>
  );
};

export default SuccessScreen; 
