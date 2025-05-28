import React from 'react';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';
import { ChevronRight } from 'react-feather';

const HomeContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.xl};
`;

const Section = styled.section`
  background: ${({ theme }) => theme.colors.surface};
  border-radius: ${({ theme }) => theme.borderRadius.lg};
  padding: ${({ theme }) => theme.spacing.lg};
  box-shadow: ${({ theme }) => theme.shadows.md};
`;

const SectionHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: ${({ theme }) => theme.spacing.lg};
`;

const Title = styled.h2`
  color: ${({ theme }) => theme.colors.text.primary};
  font-size: ${({ theme }) => theme.typography.h2.fontSize};
  font-weight: ${({ theme }) => theme.typography.h2.fontWeight};
`;

const ViewAll = styled.button`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.xs};
  color: ${({ theme }) => theme.colors.primary};
  background: none;
  font-size: ${({ theme }) => theme.typography.button.fontSize};
  font-weight: ${({ theme }) => theme.typography.button.fontWeight};

  &:hover {
    color: ${({ theme }) => theme.colors.secondary};
  }
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: ${({ theme }) => theme.spacing.lg};
`;

const Card = styled.div`
  background: ${({ theme }) => theme.colors.background};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  overflow: hidden;
  cursor: pointer;
  transition: transform ${({ theme }) => theme.transitions.fast};

  &:hover {
    transform: translateY(-4px);
  }
`;

const CardImage = styled.div<{ bgImage: string }>`
  height: 160px;
  background-image: url(\${({ bgImage }) => bgImage});
  background-size: cover;
  background-position: center;
`;

const CardContent = styled.div`
  padding: ${({ theme }) => theme.spacing.md};
`;

const CardTitle = styled.h3`
  color: ${({ theme }) => theme.colors.text.primary};
  margin-bottom: ${({ theme }) => theme.spacing.xs};
  font-size: ${({ theme }) => theme.typography.h3.fontSize};
`;

const CardDescription = styled.p`
  color: ${({ theme }) => theme.colors.text.secondary};
  font-size: ${({ theme }) => theme.typography.body2.fontSize};
`;

const Home: React.FC = () => {
  const navigate = useNavigate();

  const featuredTournaments = [
    {
      id: 1,
      title: 'CS:GO Championship',
      description: 'Prize pool: $10,000',
      image: 'https://example.com/csgo.jpg',
    },
    {
      id: 2,
      title: 'Dota 2 Masters',
      description: 'Prize pool: $15,000',
      image: 'https://example.com/dota2.jpg',
    },
  ];

  const latestNews = [
    {
      id: 1,
      title: 'New Tournament Format',
      description: 'Introducing double elimination brackets',
      image: 'https://example.com/news1.jpg',
    },
    {
      id: 2,
      title: 'Partnership Announcement',
      description: 'WAY Esports teams up with major sponsors',
      image: 'https://example.com/news2.jpg',
    },
  ];

  return (
    <HomeContainer>
      <Section>
        <SectionHeader>
          <Title>Featured Tournaments</Title>
          <ViewAll onClick={() => navigate('/tournaments')}>
            View All <ChevronRight size={20} />
          </ViewAll>
        </SectionHeader>
        <Grid>
          {featuredTournaments.map((tournament) => (
            <Card key={tournament.id} onClick={() => navigate(\`/tournaments/\${tournament.id}\`)}>
              <CardImage bgImage={tournament.image} />
              <CardContent>
                <CardTitle>{tournament.title}</CardTitle>
                <CardDescription>{tournament.description}</CardDescription>
              </CardContent>
            </Card>
          ))}
        </Grid>
      </Section>

      <Section>
        <SectionHeader>
          <Title>Latest News</Title>
          <ViewAll onClick={() => navigate('/news')}>
            View All <ChevronRight size={20} />
          </ViewAll>
        </SectionHeader>
        <Grid>
          {latestNews.map((news) => (
            <Card key={news.id} onClick={() => navigate(\`/news/\${news.id}\`)}>
              <CardImage bgImage={news.image} />
              <CardContent>
                <CardTitle>{news.title}</CardTitle>
                <CardDescription>{news.description}</CardDescription>
              </CardContent>
            </Card>
          ))}
        </Grid>
      </Section>
    </HomeContainer>
  );
};

export default Home; 