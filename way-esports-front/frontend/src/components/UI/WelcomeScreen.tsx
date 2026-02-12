import React, { useState } from 'react';
import styled from 'styled-components';
import Button from './Button';
import Card from './Card';
import GameSelector from './GameSelector';
import ProfileSetup from './ProfileSetup';
import SuccessScreen from './SuccessScreen';

interface WelcomeScreenProps {
  onComplete: (data: {
    game: 'CS2' | 'CriticalOps' | 'PUBG';
    profile: {
      username: string;
      gameUsername: string;
      email: string;
      country: string;
      teamPreference: 'solo' | 'findTeam' | 'createTeam';
    };
  }) => void;
}

const Container = styled.div`
  width: 100%;
  max-width: 100%;
  margin: 0;
  padding: ${({ theme }) => theme.spacing.xl};
`;

const WelcomeCard = styled(Card)`
  text-align: center;
  padding: ${({ theme }) => theme.spacing.xl};
  background: linear-gradient(
    135deg,
    ${({ theme }) => theme.colors.primary} 0%,
    ${({ theme }) => theme.colors.surface} 100%
  );
`;

const Logo = styled.div`
  font-size: 3rem;
  margin-bottom: ${({ theme }) => theme.spacing.lg};
  color: ${({ theme }) => theme.colors.accent};
  text-shadow: 0 0 20px ${({ theme }) => theme.colors.accent}66;
`;

const Title = styled.h1`
  color: ${({ theme }) => theme.colors.text.primary};
  margin-bottom: ${({ theme }) => theme.spacing.md};
  font-size: ${({ theme }) => theme.typography.h1.fontSize};
`;

const Subtitle = styled.p`
  color: ${({ theme }) => theme.colors.text.secondary};
  margin-bottom: ${({ theme }) => theme.spacing.xl};
  font-size: ${({ theme }) => theme.typography.body1.fontSize};
`;

const FeaturesGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: ${({ theme }) => theme.spacing.lg};
  margin-bottom: ${({ theme }) => theme.spacing.xl};
`;

const FeatureCard = styled(Card)`
  text-align: center;
  padding: ${({ theme }) => theme.spacing.lg};
  background: ${({ theme }) => `${theme.colors.primary}99`};
  backdrop-filter: blur(10px);
`;

const FeatureIcon = styled.div`
  font-size: 2.5rem;
  margin-bottom: ${({ theme }) => theme.spacing.md};
  color: ${({ theme }) => theme.colors.accent};
`;

const FeatureTitle = styled.h3`
  color: ${({ theme }) => theme.colors.text.primary};
  margin-bottom: ${({ theme }) => theme.spacing.sm};
`;

const FeatureDescription = styled.p`
  color: ${({ theme }) => theme.colors.text.secondary};
  font-size: ${({ theme }) => theme.typography.body2.fontSize};
`;

const StepIndicator = styled.div`
  display: flex;
  justify-content: center;
  gap: ${({ theme }) => theme.spacing.sm};
  margin-bottom: ${({ theme }) => theme.spacing.xl};
`;

const StepDot = styled.div<{ $active: boolean }>`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: ${({ theme, $active }) => 
    $active ? theme.colors.accent : theme.colors.text.disabled};
  transition: all ${({ theme }) => theme.transitions.fast};
  
  ${({ $active, theme }) => $active && `
    box-shadow: 0 0 10px ${theme.colors.accent};
  `}
`;

const ButtonContainer = styled.div`
  display: flex;
  justify-content: center;
  gap: ${({ theme }) => theme.spacing.md};
  margin-top: ${({ theme }) => theme.spacing.xl};
`;

const features = [
  {
    icon: '\u{1F3AE}',
    title: 'Join Tournaments',
    description: 'Compete in daily tournaments across multiple games and win prizes'
  },
  {
    icon: '\u{1F465}',
    title: 'Find Your Team',
    description: 'Connect with players, form teams, and climb the rankings together'
  },
  {
    icon: '\u{1F3C6}',
    title: 'Track Progress',
    description: 'Monitor your performance, stats, and achievements in real-time'
  },
  {
    icon: '\u{1F3C6}',
    title: 'Win Rewards',
    description: 'Earn rewards, prizes, and exclusive perks as you compete'
  }
];

const steps = [
  {
    title: 'Welcome to WAY Esports',
    subtitle: 'Your journey to competitive gaming starts here. Join thousands of players competing in tournaments, forming teams, and winning prizes.',
    showFeatures: true
  },
  {
    title: 'Choose Your Game',
    subtitle: 'Select your primary game to personalize your experience. You can always change this later or add more games to your profile.',
    showGameSelector: true
  },
  {
    title: 'Complete Your Profile',
    subtitle: 'Set up your profile to start competing. Add your game username, join or create a team, and customize your preferences.',
    showProfileSetup: true
  }
];

const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onComplete }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedGame, setSelectedGame] = useState<'CS2' | 'CriticalOps' | 'PUBG'>();
  const [canProceed, setCanProceed] = useState(false);
  const [profileData, setProfileData] = useState<any>(null);
  const [showSuccess, setShowSuccess] = useState(false);

  const handleNext = () => {
    if (currentStep === 1 && !selectedGame) {
      return;
    }
    
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
      setCanProceed(false);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
      setCanProceed(true);
    }
  };

  const handleGameSelect = (game: 'CS2' | 'CriticalOps' | 'PUBG') => {
    setSelectedGame(game);
    setCanProceed(true);
  };

  const handleProfileComplete = (data: any) => {
    setProfileData(data);
    setShowSuccess(true);
    onComplete({
      game: selectedGame!,
      profile: data
    });
  };

  const handleSuccessContinue = () => {
    // Navigate to the main app or dashboard
    window.location.href = '/dashboard';
  };

  if (showSuccess && profileData && selectedGame) {
    return (
      <SuccessScreen
        username={profileData.username}
        game={selectedGame}
        onContinue={handleSuccessContinue}
      />
    );
  }

  return (
    <Container>
      <WelcomeCard>
        <Logo>{'\u{1F3C6}'}</Logo>
        <Title>{steps[currentStep].title}</Title>
        <Subtitle>{steps[currentStep].subtitle}</Subtitle>

        <StepIndicator>
          {steps.map((_, index) => (
            <StepDot key={index} $active={index === currentStep} />
          ))}
        </StepIndicator>

        {steps[currentStep].showFeatures && (
          <FeaturesGrid>
            {features.map((feature, index) => (
              <FeatureCard key={index}>
                <FeatureIcon>{feature.icon}</FeatureIcon>
                <FeatureTitle>{feature.title}</FeatureTitle>
                <FeatureDescription>{feature.description}</FeatureDescription>
              </FeatureCard>
            ))}
          </FeaturesGrid>
        )}

        {steps[currentStep].showGameSelector && (
          <GameSelector
            selectedGame={selectedGame}
            onSelect={handleGameSelect}
          />
        )}

        {steps[currentStep].showProfileSetup && selectedGame && (
          <ProfileSetup
            selectedGame={selectedGame}
            onComplete={handleProfileComplete}
          />
        )}

        <ButtonContainer>
          {currentStep > 0 && (
            <Button variant="outline" onClick={handleBack}>
              Back
            </Button>
          )}
          {currentStep < steps.length - 1 && (
            <Button 
              onClick={handleNext}
              disabled={currentStep === 1 && !canProceed}
            >
              Next
            </Button>
          )}
        </ButtonContainer>
      </WelcomeCard>
    </Container>
  );
};

export default WelcomeScreen; 
