import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { Link } from 'react-router-dom';

const HomeContainer = styled.div`
  padding: 1rem;
  max-width: 1200px;
  margin: 0 auto;
  background: url('/images/Global1.jpg') center/cover no-repeat fixed;
  min-height: 100vh;
  position: relative;
  z-index: 0;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(10, 10, 10, 0.9); /* darker overlay for minimal distraction */
    z-index: 1;
    pointer-events: none;
  }

  > * {
    position: relative;
    z-index: 2;
  }
`;

const LogoContainer = styled.div`
  display: flex;
  align-items: center;
  padding: 12px 0 24px 0;
`;

const HeroSection = styled.section`
  text-align: center;
  margin-bottom: 3rem;
  padding: 3rem 2rem;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.05) 0%, rgba(240, 240, 240, 0.05) 100%);
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse"><path d="M 10 0 L 0 0 0 10" fill="none" stroke="rgba(128,128,128,0.1)" stroke-width="0.5"/></pattern></defs><rect width="100" height="100" fill="url(%23grid)"/></svg>');
    opacity: 0.1;
  }
`;

const Title = styled.h1`
  font-family: 'Orbitron', monospace;
  font-size: 2.8rem;
  font-weight: 700;
  background: linear-gradient(135deg, #c0c0c0 0%, #808080 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin-bottom: 1rem;
  text-transform: uppercase;
  letter-spacing: 3px;
  position: relative;
  z-index: 1;
`;

const Subtitle = styled.p`
  font-family: 'Exo 2', sans-serif;
  font-size: 1.3rem;
  color: #999999;
  margin-bottom: 2rem;
  position: relative;
  z-index: 1;
`;

const CTAButton = styled(Link)`
  display: inline-block;
  padding: 1rem 2rem;
  background: linear-gradient(135deg, #c0c0c0 0%, #808080 100%);
  color: #000000;
  text-decoration: none;
  border-radius: 8px;
  font-family: 'Exo 2', sans-serif;
  font-weight: 600;
  font-size: 1.1rem;
  transition: all 0.3s ease;
  position: relative;
  z-index: 1;
  text-transform: uppercase;
  letter-spacing: 1px;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(128, 128, 128, 0.2);
  }
`;

const FeaturesSection = styled.section`
  margin-bottom: 3rem;
`;

const SectionTitle = styled.h2`
  font-family: 'Orbitron', monospace;
  font-size: 2rem;
  color: #c0c0c0;
  text-align: center;
  margin-bottom: 2rem;
  text-transform: uppercase;
  letter-spacing: 2px;
`;

const FeaturesGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 2rem;
  margin-bottom: 2rem;
`;

const FeatureCard = styled.div`
  background: rgba(20, 20, 20, 0.8);
  border: 1px solid rgba(128, 128, 128, 0.1);
  border-radius: 12px;
  padding: 2rem;
  text-align: center;
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 10px 30px rgba(128, 128, 128, 0.1);
    border-color: rgba(192, 192, 192, 0.2);
  }
`;

const FeatureIcon = styled.div`
  font-size: 3rem;
  margin-bottom: 1rem;
  color: #c0c0c0;
`;

const FeatureTitle = styled.h3`
  font-family: 'Exo 2', sans-serif;
  font-size: 1.5rem;
  color: #e0e0e0;
  margin-bottom: 1rem;
`;

const FeatureDescription = styled.p`
  font-family: 'Exo 2', sans-serif;
  color: #999999;
  line-height: 1.6;
`;

const StatsSection = styled.section`
  margin-bottom: 3rem;
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 2rem;
`;

const StatCard = styled.div`
  background: linear-gradient(135deg, rgba(128, 128, 128, 0.1) 0%, rgba(192, 192, 192, 0.1) 100%);
  border: 1px solid rgba(128, 128, 128, 0.1);
  border-radius: 12px;
  padding: 2rem;
  text-align: center;
`;

const StatNumber = styled.div`
  font-family: 'Orbitron', monospace;
  font-size: 2rem;
  font-weight: 700;
  color: #c0c0c0;
  margin-bottom: 0.5rem;
`;

const StatLabel = styled.div`
  font-family: 'Exo 2', sans-serif;
  color: #999999;
  font-size: 1.1rem;
`;

const NewsSection = styled.section`
  margin-bottom: 3rem;
`;

const NewsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
  gap: 2rem;
`;

const NewsCard = styled.div`
  background: rgba(20, 20, 20, 0.8);
  border: 1px solid rgba(128, 128, 128, 0.1);
  border-radius: 12px;
  padding: 1.5rem;
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-3px);
    box-shadow: 0 8px 25px rgba(128, 128, 128, 0.1);
  }
`;

const NewsTitle = styled.h3`
  font-family: 'Exo 2', sans-serif;
  font-size: 1.3rem;
  color: #e0e0e0;
  margin-bottom: 1rem;
`;

const NewsDate = styled.div`
  font-family: 'Exo 2', sans-serif;
  color: #c0c0c0;
  font-size: 0.9rem;
  margin-bottom: 1rem;
`;

const NewsExcerpt = styled.p`
  font-family: 'Exo 2', sans-serif;
  color: #999999;
  line-height: 1.6;
`;

const HomePage: React.FC = () => {
  const [stats, setStats] = useState({
    tournaments: 0,
    players: 0,
    teams: 0,
    prizePool: 0
  });

  useEffect(() => {
    // Simulate loading stats
    const timer = setTimeout(() => {
      setStats({
        tournaments: 25,
        players: 1500,
        teams: 120,
        prizePool: 50000
      });
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <HomeContainer>
      <LogoContainer>
        <img src="/images/way-esports-logo.png.jpg" alt="WAY Esports Logo" style={{ height: 56, width: 'auto', borderRadius: 8 }} />
      </LogoContainer>
      <HeroSection>
        <Title>WAY Esports</Title>
        <Subtitle>
          Your ultimate destination for competitive gaming tournaments, team management, and esports excellence.
        </Subtitle>
        <CTAButton to="/tournaments">Join Tournament</CTAButton>
      </HeroSection>

      <FeaturesSection>
        <SectionTitle>Why Choose WAY Esports?</SectionTitle>
        <FeaturesGrid>
          <FeatureCard>
            <FeatureIcon>🏆</FeatureIcon>
            <FeatureTitle>Premium Tournaments</FeatureTitle>
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
            <FeatureTitle>Multiple Games</FeatureTitle>
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
      </FeaturesSection>

      <StatsSection>
        <SectionTitle>Platform Statistics</SectionTitle>
        <StatsGrid>
          <StatCard>
            <StatNumber>{stats.tournaments}+</StatNumber>
            <StatLabel>Active Tournaments</StatLabel>
          </StatCard>
          <StatCard>
            <StatNumber>{stats.players}+</StatNumber>
            <StatLabel>Registered Players</StatLabel>
          </StatCard>
          <StatCard>
            <StatNumber>{stats.teams}+</StatNumber>
            <StatLabel>Active Teams</StatLabel>
          </StatCard>
          <StatCard>
            <StatNumber>${stats.prizePool.toLocaleString()}</StatNumber>
            <StatLabel>Total Prize Pool</StatLabel>
          </StatCard>
        </StatsGrid>
      </StatsSection>

      <NewsSection>
        <SectionTitle>Latest News</SectionTitle>
        <NewsGrid>
          <NewsCard>
            <NewsDate>December 15, 2024</NewsDate>
            <NewsTitle>Major Tournament Announcement</NewsTitle>
            <NewsExcerpt>
              We're excited to announce our biggest tournament yet! Join us for the Winter Championship with a prize pool of $25,000.
            </NewsExcerpt>
          </NewsCard>
          <NewsCard>
            <NewsDate>December 10, 2024</NewsDate>
            <NewsTitle>New Features Released</NewsTitle>
            <NewsExcerpt>
              Check out our latest platform updates including improved team management tools and enhanced analytics.
            </NewsExcerpt>
          </NewsCard>
          <NewsCard>
            <NewsDate>December 5, 2024</NewsDate>
            <NewsTitle>Community Spotlight</NewsTitle>
            <NewsExcerpt>
              Meet our featured team of the month and learn about their journey to becoming top competitors.
            </NewsExcerpt>
          </NewsCard>
        </NewsGrid>
      </NewsSection>
    </HomeContainer>
  );
};

export default HomePage; 