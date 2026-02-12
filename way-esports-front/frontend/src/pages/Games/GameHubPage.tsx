import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import styled from 'styled-components';
import Card from '../../components/UI/Card';
import Button from '../../components/UI/Button';
import ValorantMobileTournaments from '../Tournaments/ValorantMobile/ValorantMobileTournaments';

const Container = styled.div`
  padding: 1rem;
  width: 100%;
  max-width: 100%;
  margin: 0;
  color: ${({ theme }) => theme.colors.text.primary};
`;

const Header = styled(Card).attrs({ variant: 'elevated' })`
  border-radius: 16px;
  padding: 2rem;
  text-align: center;
`;

const Title = styled.h1`
  margin-bottom: 0.75rem;
  color: ${({ theme }) => theme.colors.text.primary};
`;

const SubTitle = styled.p`
  color: ${({ theme }) => theme.colors.text.secondary};
  margin-bottom: 1.5rem;
`;

const GameHubPage: React.FC = () => {
  const { game } = useParams<{ game: string }>();
  const navigate = useNavigate();
  const slug = (game || '').toLowerCase();

  if (slug === 'valorantmobile' || slug === 'valorant-mobile') {
    return <ValorantMobileTournaments />;
  }

  const title = (game || 'Game Hub')
    .replace(/[-_]/g, ' ')
    .replace(/([a-z])([A-Z])/g, '$1 $2');

  return (
    <Container>
      <Header>
        <Title>{title} Hub</Title>
        <SubTitle>Game hub is coming soon. Meanwhile, explore active tournaments.</SubTitle>
        <Button variant="brand" onClick={() => navigate('/tournaments')}>
          Browse Tournaments
        </Button>
      </Header>
    </Container>
  );
};

export default GameHubPage;
