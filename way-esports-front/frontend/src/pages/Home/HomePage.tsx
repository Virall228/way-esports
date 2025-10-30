import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';

const Container = styled.div`
  padding: 40px;
  max-width: 1400px;
  margin: 0 auto;
  color: #ffffff;
`;

const HeroSection = styled.section`
  background: linear-gradient(135deg, rgba(255, 107, 0, 0.1), rgba(255, 71, 87, 0.1));
  border: 2px solid rgba(255, 107, 0, 0.3);
  border-radius: 20px;
  padding: 80px 40px;
  text-align: center;
  margin-bottom: 60px;
  position: relative;
  overflow: hidden;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: url('/images/way-logo-bg.png') center/cover;
    opacity: 0.1;
    z-index: 0;
  }
  
  > * {
    position: relative;
    z-index: 1;
  }
`;

const Logo = styled.div`
  width: 120px;
  height: 120px;
  background: #ff6b00;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 30px;
  font-size: 2rem;
  font-weight: bold;
  color: #ffffff;
`;

const HeroTitle = styled.h1`
  font-size: 4rem;
  font-weight: 900;
  color: #ffffff;
  margin-bottom: 20px;
  letter-spacing: 4px;
  text-shadow: 0 0 30px rgba(255, 107, 0, 0.5);
`;

const HeroSubtitle = styled.p`
  font-size: 1.3rem;
  color: #cccccc;
  margin-bottom: 40px;
  max-width: 800px;
  margin-left: auto;
  margin-right: auto;
  line-height: 1.6;
`;

const CTAButton = styled.button`
  background: #ffffff;
  color: #333333;
  border: none;
  padding: 18px 40px;
  border-radius: 8px;
  font-size: 1.1rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.3s ease;
  text-transform: uppercase;
  letter-spacing: 1px;

  &:hover {
    transform: translateY(-3px);
    box-shadow: 0 10px 30px rgba(255, 255, 255, 0.3);
  }
`;

const SectionTitle = styled.h2`
  font-size: 2.5rem;
  font-weight: 700;
  color: #ffffff;
  text-align: center;
  margin-bottom: 60px;
  letter-spacing: 2px;
`;

const FeaturesGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
  gap: 40px;
  margin-bottom: 80px;
`;

const FeatureCard = styled.div`
  background: #2a2a2a;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  padding: 40px;
  text-align: center;
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-10px);
    border-color: rgba(255, 107, 0, 0.5);
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
  }
`;

const FeatureIcon = styled.div`
  width: 80px;
  height: 80px;
  background: linear-gradient(135deg, #ff6b00, #ff4757);
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2rem;
  margin: 0 auto 25px;
  color: #ffffff;
`;

const FeatureTitle = styled.h3`
  font-size: 1.5rem;
  font-weight: 700;
  color: #ffffff;
  margin-bottom: 15px;
`;

const FeatureDescription = styled.p`
  color: #cccccc;
  line-height: 1.6;
  font-size: 1rem;
`;

const StatsSection = styled.section`
  background: #2a2a2a;
  border-radius: 20px;
  padding: 60px 40px;
  margin-bottom: 80px;
`;

const StatsTitle = styled.h2`
  font-size: 2.5rem;
  font-weight: 700;
  color: #ffffff;
  text-align: center;
  margin-bottom: 50px;
  letter-spacing: 2px;
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 40px;
`;

const StatCard = styled.div`
  text-align: center;
  padding: 30px;
  background: rgba(255, 107, 0, 0.1);
  border-radius: 16px;
  border: 1px solid rgba(255, 107, 0, 0.3);
`;

const StatNumber = styled.div`
  font-size: 3rem;
  font-weight: 900;
  color: #ff6b00;
  margin-bottom: 10px;
`;

const StatLabel = styled.div`
  color: #cccccc;
  font-size: 1.1rem;
  font-weight: 500;
`;

const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const [isBooting, setIsBooting] = useState(true);
  const [status, setStatus] = useState('Initializing...');

  useEffect(() => {
    let isMounted = true;
    const stages = [
      'Connecting to Telegram WebApp...',
      'Loading user authentication...',
      'Fetching platform data...',
      'Preparing interface...',
      'System ready...'
    ];

    const run = async () => {
      for (const s of stages) {
        if (!isMounted) return;
        setStatus(s);
        await new Promise(r => setTimeout(r, 800));
      }
      if (window.Telegram?.WebApp) {
        window.Telegram.WebApp.ready();
        window.Telegram.WebApp.expand();
      }
      if (isMounted) setIsBooting(false);
    };
    run();
    return () => { isMounted = false; };
  }, []);

  if (isBooting) {
    return (
      <Container>
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          minHeight: '60vh'
        }}>
          <h2 style={{ marginBottom: 16 }}>{status}</h2>
        </div>
      </Container>
    );
  }

  return (
    <Container>
      <HeroSection>
        <Logo>WAY</Logo>
        <HeroTitle>WAY ESPORTS</HeroTitle>
        <HeroSubtitle>
          Your ultimate destination for competitive gaming tournaments, team management, and esports excellence.
        </HeroSubtitle>
        <CTAButton onClick={() => navigate('/tournaments')}>
          JOIN TOURNAMENT
        </CTAButton>
      </HeroSection>

      <SectionTitle>WHY CHOOSE WAY ESPORTS?</SectionTitle>

      <FeaturesGrid>
        <FeatureCard>
          <FeatureIcon>🏆</FeatureIcon>
          <FeatureTitle>Professional Tournaments</FeatureTitle>
          <FeatureDescription>
            Compete in high-stakes tournaments with substantial prize pools and professional organization.
          </FeatureDescription>
        </FeatureCard>
        
        <FeatureCard>
          <FeatureIcon>👥</FeatureIcon>
          <FeatureTitle>Team Management</FeatureTitle>
          <FeatureDescription>
            Create, manage, and lead your esports team with advanced tools and analytics.
          </FeatureDescription>
        </FeatureCard>
        
        <FeatureCard>
          <FeatureIcon>🎮</FeatureIcon>
          <FeatureTitle>Multi-Platform Gaming</FeatureTitle>
          <FeatureDescription>
            Participate in tournaments across various popular esports titles and genres.
          </FeatureDescription>
        </FeatureCard>
        
        <FeatureCard>
          <FeatureIcon>📊</FeatureIcon>
          <FeatureTitle>Advanced Analytics</FeatureTitle>
          <FeatureDescription>
            Track your performance with detailed statistics and insights to improve your game.
          </FeatureDescription>
        </FeatureCard>
        
        <FeatureCard>
          <FeatureIcon>🏅</FeatureIcon>
          <FeatureTitle>Rewards System</FeatureTitle>
          <FeatureDescription>
            Earn points, badges, and rewards for your achievements and participation.
          </FeatureDescription>
        </FeatureCard>
        
        <FeatureCard>
          <FeatureIcon>🌐</FeatureIcon>
          <FeatureTitle>Global Community</FeatureTitle>
          <FeatureDescription>
            Connect with players from around the world and build lasting friendships.
          </FeatureDescription>
        </FeatureCard>
      </FeaturesGrid>

      <StatsSection>
        <StatsTitle>PLATFORM STATISTICS</StatsTitle>
        <StatsGrid>
          <StatCard>
            <StatNumber>25+</StatNumber>
            <StatLabel>Active Tournaments</StatLabel>
          </StatCard>
          <StatCard>
            <StatNumber>1500+</StatNumber>
            <StatLabel>Registered Players</StatLabel>
          </StatCard>
          <StatCard>
            <StatNumber>120+</StatNumber>
            <StatLabel>Active Teams</StatLabel>
          </StatCard>
          <StatCard>
            <StatNumber>$50 000</StatNumber>
            <StatLabel>Total Prize Pool</StatLabel>
          </StatCard>
        </StatsGrid>
      </StatsSection>
    </Container>
  );
};

export default HomePage;