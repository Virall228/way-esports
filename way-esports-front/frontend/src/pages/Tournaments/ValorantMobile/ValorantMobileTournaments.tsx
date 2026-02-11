import React, { useEffect, useState } from 'react';
import styled, { keyframes, css } from 'styled-components';
import Card from '../../../components/UI/Card';
import Button from '../../../components/UI/Button';
import navigationService from '../../../services/NavigationService';

// Theme variations
const themes = {
  neon: {
    primary: '#FF4655',
    secondary: '#0FF',
    accent: '#FF4655',
    background: '#0A0A0A',
    overlay: 'rgba(0, 0, 0, 0.7)',
    cardBg: 'rgba(16, 16, 16, 0.9)',
  },
  cyber: {
    primary: '#00F2FF',
    secondary: '#FF00E5',
    accent: '#00F2FF',
    background: '#090B10',
    overlay: 'rgba(9, 11, 16, 0.8)',
    cardBg: 'rgba(13, 17, 23, 0.9)',
  },
  minimal: {
    primary: '#FFFFFF',
    secondary: '#FF4655',
    accent: '#FF4655',
    background: '#000000',
    overlay: 'rgba(0, 0, 0, 0.85)',
    cardBg: 'rgba(10, 10, 10, 0.95)',
  },
  gradient: {
    primary: '#FF4655',
    secondary: '#7000FF',
    accent: '#FF4655',
    background: '#0A0A0A',
    overlay: 'rgba(0, 0, 0, 0.6)',
    cardBg: 'rgba(16, 16, 16, 0.8)',
  }
};

type ThemeName = keyof typeof themes;

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

const gradientAnimation = keyframes`
  0% {
    background-position: 0% 50%;
  }
  50% {
    background-position: 100% 50%;
  }
  100% {
    background-position: 0% 50%;
  }
`;

const glowAnimation = keyframes`
  0% {
    box-shadow: 0 0 5px ${({ theme }) => theme.colors.accent}66;
  }
  50% {
    box-shadow: 0 0 20px ${({ theme }) => theme.colors.accent}99;
  }
  100% {
    box-shadow: 0 0 5px ${({ theme }) => theme.colors.accent}66;
  }
`;

const Container = styled.div<{ $themeName: ThemeName }>`
  padding: ${({ theme }) => theme.spacing.xl};
  max-width: 1200px;
  margin: 0 auto;
  background-color: ${({ $themeName }) => themes[$themeName].background};
  min-height: var(--app-height, 100vh);
`;

const HeroBanner = styled.div<{ $themeName: ThemeName }>`
  position: relative;
  height: ${({ $themeName }) => $themeName === 'minimal' ? '500px' : '400px'};
  margin: -${({ theme }) => theme.spacing.xl};
  margin-bottom: ${({ theme }) => theme.spacing.xxl};
  background: linear-gradient(${({ $themeName }) => themes[$themeName].overlay}, ${({ $themeName }) => themes[$themeName].overlay}),
    url('/images/valorant-mobile-banner.jpg') center/cover;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: ${({ $themeName }) => 
      $themeName === 'gradient' 
        ? `linear-gradient(45deg, ${themes[$themeName].primary}33, ${themes[$themeName].secondary}33)`
        : `linear-gradient(45deg, ${themes[$themeName].primary}22, transparent)`
    };
    animation: ${gradientAnimation} 15s ease infinite;
    background-size: 200% 200%;
  }

  ${({ $themeName }) => $themeName === 'cyber' && css`
    &::after {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 2px;
      background: ${themes.cyber.primary};
      box-shadow: 0 0 15px ${themes.cyber.primary};
    }
  `}
`;

const HeroContent = styled.div<{ $themeName: ThemeName }>`
  position: relative;
  z-index: 1;
  animation: ${fadeIn} 1s ease-out;
  
  ${({ $themeName }) => $themeName === 'minimal' && css`
    border: 2px solid ${themes.minimal.primary};
    padding: 3rem;
    background: rgba(0, 0, 0, 0.7);
  `}
`;

const Header = styled.div<{ $themeName: ThemeName }>`
  text-align: center;
  margin-bottom: ${({ theme }) => theme.spacing.xxl};
  animation: ${fadeIn} 1s ease-out;
`;

const Title = styled.h1<{ $themeName: ThemeName }>`
  color: ${({ $themeName }) => themes[$themeName].primary};
  font-size: ${({ $themeName }) => $themeName === 'minimal' ? '5rem' : '4rem'};
  margin-bottom: ${({ theme }) => theme.spacing.md};
  text-transform: uppercase;
  letter-spacing: ${({ $themeName }) => $themeName === 'cyber' ? '4px' : '2px'};
  font-weight: 900;

  ${({ $themeName }) => {
    switch ($themeName) {
      case 'neon':
        return css`
          text-shadow: 0 0 10px ${themes.neon.primary};
          animation: ${glowAnimation} 2s infinite;
        `;
      case 'cyber':
        return css`
          -webkit-text-stroke: 1px ${themes.cyber.primary};
          color: transparent;
        `;
      case 'gradient':
        return css`
          background: linear-gradient(45deg, ${themes.gradient.primary}, ${themes.gradient.secondary});
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        `;
      default:
        return '';
    }
  }}
`;

const Subtitle = styled.p<{ $themeName: ThemeName }>`
  color: ${({ $themeName }) => $themeName === 'minimal' ? themes.minimal.secondary : themes.neon.secondary};
  font-size: ${({ theme }) => theme.typography.h4.fontSize};
  max-width: 800px;
  margin: 0 auto;
  line-height: 1.6;
`;

const Grid = styled.div<{ $themeName: ThemeName }>`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: ${({ theme }) => theme.spacing.xl};
  margin-bottom: ${({ theme }) => theme.spacing.xxl};

  ${({ $themeName }) => $themeName === 'minimal' && css`
    grid-template-columns: repeat(2, 1fr);
    @media (max-width: 768px) {
      grid-template-columns: 1fr;
    }
  `}
`;

const FeatureCard = styled(Card)<{ $themeName: ThemeName }>`
  padding: ${({ theme }) => theme.spacing.xl};
  text-align: center;
  background: ${({ $themeName }) => themes[$themeName].cardBg};
  backdrop-filter: blur(10px);
  border: ${({ $themeName }) => {
    switch ($themeName) {
      case 'cyber':
        return `1px solid ${themes.cyber.primary}`;
      case 'minimal':
        return `1px solid ${themes.minimal.primary}`;
      case 'gradient':
        return 'none';
      default:
        return `1px solid ${themes.neon.primary}33`;
    }
  }};
  transition: all 0.3s ease;

  ${({ $themeName }) => {
    switch ($themeName) {
      case 'neon':
        return css`
          &:hover {
            transform: translateY(-4px);
            box-shadow: 0 0 20px ${themes.neon.primary}66;
          }
        `;
      case 'cyber':
        return css`
          position: relative;
          &:hover {
            transform: scale(1.02);
            &::before {
              content: '';
              position: absolute;
              top: -2px;
              left: -2px;
              right: -2px;
              bottom: -2px;
              border: 2px solid ${themes.cyber.primary};
              animation: ${glowAnimation} 2s infinite;
            }
          }
        `;
      case 'minimal':
        return css`
          &:hover {
            background: ${themes.minimal.primary}11;
          }
        `;
      case 'gradient':
        return css`
          background: linear-gradient(135deg, ${themes.gradient.primary}11, ${themes.gradient.secondary}11);
          &:hover {
            background: linear-gradient(135deg, ${themes.gradient.primary}22, ${themes.gradient.secondary}22);
          }
        `;
      default:
        return '';
    }
  }}
`;

const Icon = styled.div<{ $themeName: ThemeName }>`
  font-size: 3.5rem;
  margin-bottom: ${({ theme }) => theme.spacing.md};
  color: ${({ $themeName }) => themes[$themeName].accent};
  transition: transform 0.3s ease;

  ${({ $themeName }) => {
    switch ($themeName) {
      case 'cyber':
        return css`
          position: relative;
          &:hover {
            transform: scale(1.1);
          }
        `;
      default:
        return '';
    }
  }}
`;

const FeatureTitle = styled.h3<{ $themeName: ThemeName }>`
  color: ${({ $themeName }) => themes[$themeName].primary};
  margin-bottom: ${({ theme }) => theme.spacing.sm};
  font-size: ${({ theme }) => theme.typography.h4.fontSize};
`;

const FeatureDescription = styled.p<{ $themeName: ThemeName }>`
  color: ${({ $themeName }) => $themeName === 'minimal' ? themes.minimal.secondary : themes.neon.secondary};
  font-size: ${({ theme }) => theme.typography.body1.fontSize};
  line-height: 1.6;
`;

const ComingSoonCard = styled(Card)<{ $themeName: ThemeName }>`
  padding: ${({ theme }) => theme.spacing.xxl};
  text-align: center;
  background: ${({ $themeName }) => themes[$themeName].cardBg};
  backdrop-filter: blur(10px);
  border: ${({ $themeName }) => {
    switch ($themeName) {
      case 'cyber':
        return `2px solid ${themes.cyber.primary}`;
      case 'minimal':
        return `2px solid ${themes.minimal.primary}`;
      case 'gradient':
        return 'none';
      default:
        return `2px solid ${themes.neon.primary}`;
    }
  }};
  animation: ${fadeIn} 1s ease-out, ${glowAnimation} 3s infinite;
`;

const ComingSoonTitle = styled.h2<{ $themeName: ThemeName }>`
  color: ${({ $themeName }) => themes[$themeName].primary};
  font-size: 3rem;
  margin-bottom: ${({ theme }) => theme.spacing.lg};
  text-transform: uppercase;
  letter-spacing: 2px;
  font-weight: 900;
`;

const ComingSoonDescription = styled.p<{ $themeName: ThemeName }>`
  color: ${({ $themeName }) => $themeName === 'minimal' ? themes.minimal.secondary : themes.neon.secondary};
  font-size: ${({ theme }) => theme.typography.h5.fontSize};
  margin-bottom: ${({ theme }) => theme.spacing.xl};
  max-width: 800px;
  margin-left: auto;
  margin-right: auto;
  line-height: 1.8;
`;

const ButtonGroup = styled.div<{ $themeName: ThemeName }>`
  display: flex;
  gap: ${({ theme }) => theme.spacing.md};
  justify-content: center;
  flex-wrap: wrap;

  button {
    min-width: 200px;
    height: 50px;
    font-size: ${({ theme }) => theme.typography.h6.fontSize};
    text-transform: uppercase;
    letter-spacing: 1px;
  }
`;

const CountdownTimer = styled.div`
  display: flex;
  justify-content: center;
  gap: ${({ theme }) => theme.spacing.xl};
  margin: ${({ theme }) => theme.spacing.xl} 0;
`;

const TimeUnit = styled.div`
  text-align: center;
`;

const TimeValue = styled.div<{ $themeName: ThemeName }>`
  font-size: 3rem;
  font-weight: bold;
  color: ${({ $themeName }) => themes[$themeName].accent};
  margin-bottom: ${({ theme }) => theme.spacing.xs};
`;

const TimeLabel = styled.div<{ $themeName: ThemeName }>`
  color: ${({ $themeName }) => $themeName === 'minimal' ? themes.minimal.secondary : themes.neon.secondary};
  text-transform: uppercase;
  letter-spacing: 1px;
`;

const features = [
  {
    icon: '🎮',
    title: 'Mobile-First Experience',
    description: 'Tournaments optimized for mobile gameplay with custom lobbies and spectator mode'
  },
  {
    icon: '🏆',
    title: 'Exclusive Rewards',
    description: 'Win Valorant Points, exclusive skins, and real money prizes'
  },
  {
    icon: '🏆',
    title: 'Ranked Divisions',
    description: 'Compete in tournaments matched to your skill level'
  },
  {
    icon: '🌟',
    title: 'Pro Path',
    description: 'Path to pro system with official Riot Games support'
  },
  {
    icon: '🤝',
    title: 'Team Formation',
    description: 'Find teammates or compete with your existing squad'
  },
  {
    icon: '📊',
    title: 'Stats & Analytics',
    description: 'Detailed performance tracking and improvement insights'
  }
];

const ThemeSelector = styled.div`
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 1000;
  display: flex;
  gap: 10px;
`;

const ThemeButton = styled.button<{ active: boolean; themeColor: string }>`
  width: 40px;
  height: 40px;
  border: none;
  border-radius: 50%;
  background: ${({ themeColor }) => themeColor};
  cursor: pointer;
  opacity: ${({ active }) => active ? 1 : 0.5};
  transition: all 0.3s ease;
  
  &:hover {
    transform: scale(1.1);
    opacity: 1;
  }
`;

const ValorantMobileTournaments: React.FC = () => {
  const [currentTheme, setCurrentTheme] = useState<ThemeName>('neon');
  const launchDate = new Date('2024-07-01T00:00:00Z');
  const isLaunchPast = Date.now() >= launchDate.getTime();

  const calculateTimeLeft = () => {
    const difference = Math.max(0, launchDate.getTime() - Date.now());

    return {
      days: Math.floor(difference / (1000 * 60 * 60 * 24)),
      hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
      minutes: Math.floor((difference / 1000 / 60) % 60),
      seconds: Math.floor((difference / 1000) % 60)
    };
  };

  const [timeLeft, setTimeLeft] = useState(calculateTimeLeft());

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const handlePreRegister = () => {
    // Handle pre-registration logic
  };

  const handleJoinDiscord = () => {
    navigationService.goToDiscord();
  };

  return (
    <>
      <ThemeSelector>
        {Object.entries(themes).map(([name, theme]) => (
          <ThemeButton
            key={name}
            active={currentTheme === (name as ThemeName)}
            themeColor={theme.primary}
            onClick={() => setCurrentTheme(name as ThemeName)}
          />
        ))}
      </ThemeSelector>

      <HeroBanner $themeName={currentTheme}>
        <HeroContent $themeName={currentTheme}>
          <Title $themeName={currentTheme}>Valorant Mobile</Title>
          <Subtitle $themeName={currentTheme}>
            The Next Evolution of Mobile Esports
          </Subtitle>
        </HeroContent>
      </HeroBanner>

      <Container $themeName={currentTheme}>
        <Header $themeName={currentTheme}>
          <Title $themeName={currentTheme}>Valorant Mobile Tournaments</Title>
          <Subtitle $themeName={currentTheme}>
            Get ready for the next evolution of mobile esports. Join the most
            competitive Valorant Mobile tournaments platform.
          </Subtitle>
        </Header>

        <Grid $themeName={currentTheme}>
          {features.map((feature, index) => (
            <FeatureCard key={index} $themeName={currentTheme}>
              <Icon $themeName={currentTheme}>{feature.icon}</Icon>
              <FeatureTitle $themeName={currentTheme}>{feature.title}</FeatureTitle>
              <FeatureDescription $themeName={currentTheme}>
                {feature.description}
              </FeatureDescription>
            </FeatureCard>
          ))}
        </Grid>

        <ComingSoonCard $themeName={currentTheme}>
          <ComingSoonTitle $themeName={currentTheme}>
            {isLaunchPast ? 'Launching Soon' : 'Coming Q3 2024'}
          </ComingSoonTitle>
          {!isLaunchPast && (
            <CountdownTimer>
              <TimeUnit>
                <TimeValue $themeName={currentTheme}>{timeLeft.days}</TimeValue>
                <TimeLabel $themeName={currentTheme}>Days</TimeLabel>
              </TimeUnit>
              <TimeUnit>
                <TimeValue $themeName={currentTheme}>{timeLeft.hours}</TimeValue>
                <TimeLabel $themeName={currentTheme}>Hours</TimeLabel>
              </TimeUnit>
              <TimeUnit>
                <TimeValue $themeName={currentTheme}>{timeLeft.minutes}</TimeValue>
                <TimeLabel $themeName={currentTheme}>Minutes</TimeLabel>
              </TimeUnit>
              <TimeUnit>
                <TimeValue $themeName={currentTheme}>{timeLeft.seconds}</TimeValue>
                <TimeLabel $themeName={currentTheme}>Seconds</TimeLabel>
              </TimeUnit>
            </CountdownTimer>
          )}
          <ComingSoonDescription $themeName={currentTheme}>
            Valorant Mobile tournaments are coming to WAY Esports! Be among the first
            to compete in official tournaments when the game launches. Register now
            for early access and exclusive rewards.
          </ComingSoonDescription>
          <ButtonGroup $themeName={currentTheme}>
            <Button 
              variant={currentTheme === 'minimal' ? 'outline' : 'brand'}
              onClick={handlePreRegister}
            >
              Pre-Register Now
            </Button>
            <Button 
              variant={currentTheme === 'minimal' ? 'brand' : 'outline'}
              onClick={handleJoinDiscord}
            >
              Join Discord Community
            </Button>
          </ButtonGroup>
        </ComingSoonCard>
      </Container>
    </>
  );
};

export default ValorantMobileTournaments; 
