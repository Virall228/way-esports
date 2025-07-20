import React from 'react';
import styled from 'styled-components';
import Card from './Card';

interface Game {
  id: 'CS2' | 'CriticalOps' | 'PUBG';
  name: string;
  description: string;
  icon: string;
  playerCount: string;
}

interface GameSelectorProps {
  selectedGame?: Game['id'];
  onSelect: (gameId: Game['id']) => void;
}

const GAMES: Game[] = [
  {
    id: 'CS2',
    name: 'Counter-Strike 2',
    description: 'Premier tactical shooter with competitive 5v5 matches',
    icon: '🎯',
    playerCount: '1M+ active players'
  },
  {
    id: 'CriticalOps',
    name: 'Critical Ops',
    description: 'Mobile tactical FPS with fast-paced action',
    icon: '📱',
    playerCount: '500K+ active players'
  },
  {
    id: 'PUBG',
    name: 'PUBG',
    description: 'Battle Royale with intense survival gameplay',
    icon: '🪂',
    playerCount: '750K+ active players'
  }
];

const Container = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.lg};
`;

const Title = styled.h2`
  color: ${({ theme }) => theme.colors.text.primary};
  text-align: center;
  margin-bottom: ${({ theme }) => theme.spacing.md};
`;

const Subtitle = styled.p`
  color: ${({ theme }) => theme.colors.text.secondary};
  text-align: center;
  margin-bottom: ${({ theme }) => theme.spacing.xl};
  font-size: ${({ theme }) => theme.typography.body1.fontSize};
`;

const GamesGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: ${({ theme }) => theme.spacing.lg};
`;

const GameCard = styled(Card)<{ selected?: boolean }>`
  cursor: pointer;
  transition: all ${({ theme }) => theme.transitions.fast};
  border: 2px solid transparent;
  
  ${({ selected, theme }) => selected && `
    border-color: ${theme.colors.accent};
    box-shadow: 0 0 20px ${theme.colors.accent}33;
    transform: translateY(-4px);
  `}

  &:hover {
    transform: translateY(-4px);
  }
`;

const GameIcon = styled.div`
  font-size: 3rem;
  margin-bottom: ${({ theme }) => theme.spacing.md};
  text-align: center;
`;

const GameName = styled.h3`
  color: ${({ theme }) => theme.colors.text.primary};
  margin-bottom: ${({ theme }) => theme.spacing.xs};
  text-align: center;
`;

const GameDescription = styled.p`
  color: ${({ theme }) => theme.colors.text.secondary};
  margin-bottom: ${({ theme }) => theme.spacing.md};
  text-align: center;
  font-size: ${({ theme }) => theme.typography.body2.fontSize};
`;

const PlayerCount = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: ${({ theme }) => theme.spacing.xs};
  color: ${({ theme }) => theme.colors.accent};
  font-size: ${({ theme }) => theme.typography.body2.fontSize};
  
  &::before {
    content: '👥';
  }
`;

const SelectIndicator = styled.div<{ selected?: boolean }>`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: ${({ theme }) => theme.spacing.xs};
  color: ${({ theme }) => theme.colors.accent};
  font-size: ${({ theme }) => theme.typography.body2.fontSize};
  margin-top: ${({ theme }) => theme.spacing.sm};
  opacity: ${({ selected }) => selected ? 1 : 0};
  transition: opacity ${({ theme }) => theme.transitions.fast};
  
  &::before {
    content: '✓';
  }
`;

const GameSelector: React.FC<GameSelectorProps> = ({ selectedGame, onSelect }) => {
  return (
    <Container>
      <Title>Choose Your Primary Game</Title>
      <Subtitle>
        Select the game you mainly play to personalize your experience
      </Subtitle>
      
      <GamesGrid>
        {GAMES.map((game) => (
          <GameCard
            key={game.id}
            variant="elevated"
            selected={selectedGame === game.id}
            onClick={() => onSelect(game.id)}
          >
            <GameIcon>{game.icon}</GameIcon>
            <GameName>{game.name}</GameName>
            <GameDescription>{game.description}</GameDescription>
            <PlayerCount>{game.playerCount}</PlayerCount>
            <SelectIndicator selected={selectedGame === game.id}>
              Selected
            </SelectIndicator>
          </GameCard>
        ))}
      </GamesGrid>
    </Container>
  );
};

export default GameSelector; 