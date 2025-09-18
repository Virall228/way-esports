import React, { useState } from 'react';
import styled from 'styled-components';
import Card from '../../components/UI/Card';
import Button from '../../components/UI/Button';
import navigationService from '../../services/NavigationService';

const Container = styled.div`
  padding: ${({ theme }) => theme.spacing.xl};
  max-width: 1400px;
  margin: 0 auto;
`;

const Header = styled.div`
  text-align: center;
  margin-bottom: ${({ theme }) => theme.spacing.xl};
`;

const Title = styled.h1`
  color: ${({ theme }) => theme.colors.text.primary};
  font-size: 3rem;
  margin-bottom: ${({ theme }) => theme.spacing.md};
`;

const Subtitle = styled.p`
  color: ${({ theme }) => theme.colors.text.secondary};
  font-size: ${({ theme }) => theme.typography.h5.fontSize};
  max-width: 800px;
  margin: 0 auto;
`;

const GameTabs = styled.div`
  display: flex;
  justify-content: center;
  gap: ${({ theme }) => theme.spacing.md};
  margin-bottom: ${({ theme }) => theme.spacing.xl};
  flex-wrap: wrap;
`;

const GameTab = styled(Button)<{ active?: boolean }>`
  min-width: 150px;
  background: ${({ theme, active }) =>
    active ? theme.colors.accent : `${theme.colors.primary}99`};
  color: ${({ theme }) => theme.colors.text.primary};
  
  &:hover {
    background: ${({ theme, active }) =>
      active ? theme.colors.accent : `${theme.colors.primary}cc`};
  }
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: ${({ theme }) => theme.spacing.xl};
`;

const TournamentCard = styled(Card)<{ status: 'upcoming' | 'live' | 'completed' | 'comingSoon' }>`
  padding: ${({ theme }) => theme.spacing.xl};
  background: linear-gradient(
    135deg,
    ${({ theme }) => `${theme.colors.primary}99`} 0%,
    ${({ theme }) => `${theme.colors.surface}99`} 100%
  );
  backdrop-filter: blur(10px);
  border: 1px solid ${({ theme, status }) => {
    switch (status) {
      case 'live':
        return theme.colors.success;
      case 'upcoming':
        return theme.colors.accent;
      case 'completed':
        return theme.colors.text.disabled;
      case 'comingSoon':
        return theme.colors.warning;
      default:
        return theme.colors.border;
    }
  }};
  transition: all ${({ theme }) => theme.transitions.fast};

  &:hover {
    transform: translateY(-4px);
  }
`;

const GameIcon = styled.img`
  width: 48px;
  height: 48px;
  margin-bottom: ${({ theme }) => theme.spacing.md};
  border-radius: ${({ theme }) => theme.borderRadius.small};
`;

const TournamentTitle = styled.h3`
  color: ${({ theme }) => theme.colors.text.primary};
  margin-bottom: ${({ theme }) => theme.spacing.sm};
`;

const TournamentInfo = styled.div`
  margin-bottom: ${({ theme }) => theme.spacing.md};
`;

const InfoRow = styled.div`
  display: flex;
  justify-content: space-between;
  color: ${({ theme }) => theme.colors.text.secondary};
  font-size: ${({ theme }) => theme.typography.body2.fontSize};
  margin-bottom: ${({ theme }) => theme.spacing.xs};
`;

const StatusBadge = styled.span<{ status: 'upcoming' | 'live' | 'completed' | 'comingSoon' }>`
  display: inline-block;
  padding: ${({ theme }) => `${theme.spacing.xs} ${theme.spacing.sm}`};
  border-radius: ${({ theme }) => theme.borderRadius.small};
  font-size: ${({ theme }) => theme.typography.caption.fontSize};
  font-weight: 500;
  background: ${({ theme, status }) => {
    switch (status) {
      case 'live':
        return `${theme.colors.success}22`;
      case 'upcoming':
        return `${theme.colors.accent}22`;
      case 'completed':
        return `${theme.colors.text.disabled}22`;
      case 'comingSoon':
        return `${theme.colors.warning}22`;
      default:
        return theme.colors.surface;
    }
  }};
  color: ${({ theme, status }) => {
    switch (status) {
      case 'live':
        return theme.colors.success;
      case 'upcoming':
        return theme.colors.accent;
      case 'completed':
        return theme.colors.text.disabled;
      case 'comingSoon':
        return theme.colors.warning;
      default:
        return theme.colors.text.primary;
    }
  }};
`;

const PrizePool = styled.div`
  font-size: ${({ theme }) => theme.typography.h6.fontSize};
  color: ${({ theme }) => theme.colors.accent};
  margin-bottom: ${({ theme }) => theme.spacing.md};
`;

interface Tournament {
  id: string;
  title: string;
  game: 'CS2' | 'CriticalOps' | 'PUBG' | 'ValorantMobile';
  status: 'upcoming' | 'live' | 'completed' | 'comingSoon';
  date: string;
  prizePool: string;
  participants: number;
  maxParticipants: number;
  skillLevel: string;
}

const games = [
  { id: 'all', name: 'All Games' },
  { id: 'CS2', name: 'CS2' },
  { id: 'CriticalOps', name: 'Critical Ops' },
  { id: 'PUBG', name: 'PUBG' },
  { id: 'ValorantMobile', name: 'Valorant Mobile' }
];

const mockTournaments: Tournament[] = [
  {
    id: '1',
    title: 'CS2 Pro League Season 1',
    game: 'CS2',
    status: 'live',
    date: '2024-02-20',
    prizePool: '$10,000',
    participants: 64,
    maxParticipants: 128,
    skillLevel: 'Professional'
  },
  {
    id: '2',
    title: 'Critical Ops Championship',
    game: 'CriticalOps',
    status: 'upcoming',
    date: '2024-02-25',
    prizePool: '$5,000',
    participants: 32,
    maxParticipants: 64,
    skillLevel: 'Advanced'
  },
  {
    id: '3',
    title: 'PUBG Mobile Masters',
    game: 'PUBG',
    status: 'upcoming',
    date: '2024-03-01',
    prizePool: '$7,500',
    participants: 48,
    maxParticipants: 100,
    skillLevel: 'Professional'
  },
  {
    id: '4',
    title: 'Valorant Mobile Launch Tournament',
    game: 'ValorantMobile',
    status: 'comingSoon',
    date: '2024-Q3',
    prizePool: '$15,000',
    participants: 0,
    maxParticipants: 256,
    skillLevel: 'All Levels'
  }
];

const AllTournaments: React.FC = () => {
  const [selectedGame, setSelectedGame] = useState('all');

  const filteredTournaments = mockTournaments.filter(
    tournament => selectedGame === 'all' || tournament.game === selectedGame
  );

  const handleGameChange = (gameId: string) => {
    setSelectedGame(gameId);
  };

  const handleTournamentClick = (tournament: Tournament) => {
    if (tournament.status === 'comingSoon') {
      navigationService.goToGameHub(tournament.game);
    } else {
      navigationService.goToTournamentDetails(tournament.id, tournament.title);
    }
  };

  return (
    <Container>
      <Header>
        <Title>Tournaments</Title>
        <Subtitle>
          Compete in tournaments across multiple games, win prizes, and climb the
          rankings. From amateur to professional levels, find the perfect
          competition for you.
        </Subtitle>
      </Header>

      <GameTabs>
        {games.map(game => (
          <GameTab
            key={game.id}
            active={selectedGame === game.id}
            onClick={() => handleGameChange(game.id)}
            variant={selectedGame === game.id ? 'primary' : 'outline'}
          >
            {game.name}
          </GameTab>
        ))}
      </GameTabs>

      <Grid>
        {filteredTournaments.map(tournament => (
          <TournamentCard
            key={tournament.id}
            status={tournament.status}
            onClick={() => handleTournamentClick(tournament)}
          >
            <GameIcon src={`/images/games/${tournament.game.toLowerCase()}.png`} alt={tournament.game} />
            <TournamentTitle>{tournament.title}</TournamentTitle>
            <StatusBadge status={tournament.status}>
              {tournament.status.charAt(0).toUpperCase() + tournament.status.slice(1)}
            </StatusBadge>
            <TournamentInfo>
              <InfoRow>
                <span>Date:</span>
                <span>{tournament.date}</span>
              </InfoRow>
              <InfoRow>
                <span>Participants:</span>
                <span>{tournament.participants}/{tournament.maxParticipants}</span>
              </InfoRow>
              <InfoRow>
                <span>Skill Level:</span>
                <span>{tournament.skillLevel}</span>
              </InfoRow>
            </TournamentInfo>
            <PrizePool>{tournament.prizePool}</PrizePool>
            <Button
              variant={tournament.status === 'comingSoon' ? 'outline' : 'primary'}
              fullWidth
            >
              {tournament.status === 'comingSoon'
                ? 'Learn More'
                : tournament.status === 'completed'
                ? 'View Results'
                : 'Join Tournament'}
            </Button>
          </TournamentCard>
        ))}
      </Grid>
    </Container>
  );
};

export default AllTournaments; 