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

const Container = styled.div<{ theme: string }>`
  padding: ${({ theme }) => theme.spacing.xl};
  max-width: 1200px;
  margin: 0 auto;
  background-color: ${({ theme: themeName }) => themes[themeName].background};
  min-height: 100vh;
`;

const HeroBanner = styled.div<{ theme: string }>`
  position: relative;
  height: ${({ theme: themeName }) => themeName === 'minimal' ? '500px' : '400px'};
  margin: -${({ theme }) => theme.spacing.xl};
  margin-bottom: ${({ theme }) => theme.spacing.xxl};
  background: linear-gradient(${({ theme: themeName }) => themes[themeName].overlay}, ${({ theme: themeName }) => themes[themeName].overlay}),
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
    background: ${({ theme: themeName }) => 
      themeName === 'gradient' 
        ? `linear-gradient(45deg, ${themes[themeName].primary}33, ${themes[themeName].secondary}33)`
        : `linear-gradient(45deg, ${themes[themeName].primary}22, transparent)`
    };
    animation: ${gradientAnimation} 15s ease infinite;
    background-size: 200% 200%;
  }

  ${({ theme: themeName }) => themeName === 'cyber' && css`
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

const HeroContent = styled.div<{ theme: string }>`
  position: relative;
  z-index: 1;
  animation: ${fadeIn} 1s ease-out;
  
  ${({ theme: themeName }) => themeName === 'minimal' && css`
    border: 2px solid ${themes.minimal.primary};
    padding: 3rem;
    background: rgba(0, 0, 0, 0.7);
  `}
`;

const Header = styled.div<{ theme: string }>`
  text-align: center;
  margin-bottom: ${({ theme }) => theme.spacing.xxl};
  animation: ${fadeIn} 1s ease-out;
`;

const Title = styled.h1<{ theme: string }>`
  color: ${({ theme: themeName }) => themes[themeName].primary};
  font-size: ${({ theme: themeName }) => themeName === 'minimal' ? '5rem' : '4rem'};
  margin-bottom: ${({ theme }) => theme.spacing.md};
  text-transform: uppercase;
  letter-spacing: ${({ theme: themeName }) => themeName === 'cyber' ? '4px' : '2px'};
  font-weight: 900;

  ${({ theme: themeName }) => {
    switch (themeName) {
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

const Subtitle = styled.p<{ theme: string }>`
  color: ${({ theme: themeName }) => themeName === 'minimal' ? themes.minimal.secondary : themes.neon.secondary};
  font-size: ${({ theme }) => theme.typography.h4.fontSize};
  max-width: 800px;
  margin: 0 auto;
  line-height: 1.6;
`;

const Grid = styled.div<{ theme: string }>`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: ${({ theme }) => theme.spacing.xl};
  margin-bottom: ${({ theme }) => theme.spacing.xxl};

  ${({ theme: themeName }) => themeName === 'minimal' && css`
    grid-template-columns: repeat(2, 1fr);
    @media (max-width: 768px) {
      grid-template-columns: 1fr;
    }
  `}
`;

const FeatureCard = styled(Card)<{ theme: string }>`
  padding: ${({ theme }) => theme.spacing.xl};
  text-align: center;
  background: ${({ theme: themeName }) => themes[themeName].cardBg};
  backdrop-filter: blur(10px);
  border: ${({ theme: themeName }) => {
    switch (themeName) {
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

  ${({ theme: themeName }) => {
    switch (themeName) {
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

const Icon = styled.div<{ theme: string }>`
  font-size: 3.5rem;
  margin-bottom: ${({ theme }) => theme.spacing.md};
  color: ${({ theme: themeName }) => themes[themeName].accent};
  transition: transform 0.3s ease;

  ${({ theme: themeName }) => {
    switch (themeName) {
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

const FeatureTitle = styled.h3<{ theme: string }>`
  color: ${({ theme: themeName }) => themes[themeName].primary};
  margin-bottom: ${({ theme }) => theme.spacing.sm};
  font-size: ${({ theme }) => theme.typography.h4.fontSize};
`;

const FeatureDescription = styled.p<{ theme: string }>`
  color: ${({ theme: themeName }) => themeName === 'minimal' ? themes.minimal.secondary : themes.neon.secondary};
  font-size: ${({ theme }) => theme.typography.body1.fontSize};
  line-height: 1.6;
`;

const ComingSoonCard = styled(Card)<{ theme: string }>`
  padding: ${({ theme }) => theme.spacing.xxl};
  text-align: center;
  background: ${({ theme: themeName }) => themes[themeName].cardBg};
  backdrop-filter: blur(10px);
  border: ${({ theme: themeName }) => {
    switch (themeName) {
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

const ComingSoonTitle = styled.h2<{ theme: string }>`
  color: ${({ theme: themeName }) => themes[themeName].primary};
  font-size: 3rem;
  margin-bottom: ${({ theme }) => theme.spacing.lg};
  text-transform: uppercase;
  letter-spacing: 2px;
  font-weight: 900;
`;

const ComingSoonDescription = styled.p<{ theme: string }>`
  color: ${({ theme: themeName }) => themeName === 'minimal' ? themes.minimal.secondary : themes.neon.secondary};
  font-size: ${({ theme }) => theme.typography.h5.fontSize};
  margin-bottom: ${({ theme }) => theme.spacing.xl};
  max-width: 800px;
  margin-left: auto;
  margin-right: auto;
  line-height: 1.8;
`;

const ButtonGroup = styled.div<{ theme: string }>`
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

const TimeValue = styled.div<{ theme: string }>`
  font-size: 3rem;
  font-weight: bold;
  color: ${({ theme: themeName }) => themes[themeName].accent};
  margin-bottom: ${({ theme }) => theme.spacing.xs};
`;

const TimeLabel = styled.div<{ theme: string }>`
  color: ${({ theme: themeName }) => themeName === 'minimal' ? themes.minimal.secondary : themes.neon.secondary};
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
  const [currentTheme, setCurrentTheme] = useState('neon');

  const calculateTimeLeft = () => {
    const launchDate = new Date('2024-07-01').getTime();
    const now = new Date().getTime();
    const difference = launchDate - now;

    return {
      days: Math.floor(difference / (1000 * 60 * 60 * 24)),
      hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
      minutes: Math.floor((difference / 1000 / 60) % 60),
      seconds: Math.floor((difference / 1000) % 60)
    };
  };

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
            active={currentTheme === name}
            themeColor={theme.primary}
            onClick={() => setCurrentTheme(name)}
          />
        ))}
      </ThemeSelector>

      <HeroBanner theme={currentTheme}>
        <HeroContent theme={currentTheme}>
          <Title theme={currentTheme}>Valorant Mobile</Title>
          <Subtitle theme={currentTheme}>
            The Next Evolution of Mobile Esports
          </Subtitle>
        </HeroContent>
      </HeroBanner>

      <Container theme={currentTheme}>
        <Header theme={currentTheme}>
          <Title theme={currentTheme}>Valorant Mobile Tournaments</Title>
          <Subtitle theme={currentTheme}>
            Get ready for the next evolution of mobile esports. Join the most
            competitive Valorant Mobile tournaments platform.
          </Subtitle>
        </Header>

        <Grid theme={currentTheme}>
          {features.map((feature, index) => (
            <FeatureCard key={index} theme={currentTheme}>
              <Icon theme={currentTheme}>{feature.icon}</Icon>
              <FeatureTitle theme={currentTheme}>{feature.title}</FeatureTitle>
              <FeatureDescription theme={currentTheme}>
                {feature.description}
              </FeatureDescription>
            </FeatureCard>
          ))}
        </Grid>

        <ComingSoonCard theme={currentTheme}>
          <ComingSoonTitle theme={currentTheme}>Coming Q3 2024</ComingSoonTitle>
          <CountdownTimer>
            <TimeUnit>
              <TimeValue theme={currentTheme}>{calculateTimeLeft().days}</TimeValue>
              <TimeLabel theme={currentTheme}>Days</TimeLabel>
            </TimeUnit>
            <TimeUnit>
              <TimeValue theme={currentTheme}>{calculateTimeLeft().hours}</TimeValue>
              <TimeLabel theme={currentTheme}>Hours</TimeLabel>
            </TimeUnit>
            <TimeUnit>
              <TimeValue theme={currentTheme}>{calculateTimeLeft().minutes}</TimeValue>
              <TimeLabel theme={currentTheme}>Minutes</TimeLabel>
            </TimeUnit>
            <TimeUnit>
              <TimeValue theme={currentTheme}>{calculateTimeLeft().seconds}</TimeValue>
              <TimeLabel theme={currentTheme}>Seconds</TimeLabel>
            </TimeUnit>
          </CountdownTimer>
          <ComingSoonDescription theme={currentTheme}>
            Valorant Mobile tournaments are coming to WAY Esports! Be among the first
            to compete in official tournaments when the game launches. Register now
            for early access and exclusive rewards.
          </ComingSoonDescription>
          <ButtonGroup theme={currentTheme}>
            <Button 
              variant={currentTheme === 'minimal' ? 'outline' : 'primary'}
              onClick={handlePreRegister}
            >
              Pre-Register Now
            </Button>
            <Button 
              variant={currentTheme === 'minimal' ? 'primary' : 'outline'}
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