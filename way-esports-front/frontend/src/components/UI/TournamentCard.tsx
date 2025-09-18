import React from 'react';
import styled from 'styled-components';
import Card from './Card';
import Button from './Button';

interface TournamentCardProps {
  id: string;
  title: string;
  game: 'CS2' | 'CriticalOps' | 'PUBG';
  prizePool: number;
  startDate: Date;
  status: 'upcoming' | 'registration' | 'inProgress' | 'completed';
  participantsCount: number;
  maxParticipants: number;
  onClick?: () => void;
}

const StyledCard = styled(Card)`
  position: relative;
  overflow: hidden;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 4px;
    background: ${({ theme }) => theme.colors.accent};
    box-shadow: 0 0 15px ${({ theme }) => theme.colors.accent};
  }
`;

const GameBadge = styled.div`
  position: absolute;
  top: 1rem;
  right: 1rem;
  background: ${({ theme }) => `${theme.colors.primary}cc`};
  padding: ${({ theme }) => `${theme.spacing.xs} ${theme.spacing.sm}`};
  border-radius: ${({ theme }) => theme.borderRadius.small};
  font-size: ${({ theme }) => theme.typography.body2.fontSize};
  color: ${({ theme }) => theme.colors.accent};
  backdrop-filter: blur(4px);
`;

const Content = styled.div`
  padding: ${({ theme }) => theme.spacing.md};
`;

const Title = styled.h3`
  color: ${({ theme }) => theme.colors.text.primary};
  margin-bottom: ${({ theme }) => theme.spacing.sm};
  font-size: ${({ theme }) => theme.typography.h3.fontSize};
`;

const PrizePool = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
  margin-bottom: ${({ theme }) => theme.spacing.sm};
  font-size: ${({ theme }) => theme.typography.h2.fontSize};
  color: ${({ theme }) => theme.colors.accent};
  
  &::before {
    content: '🏆';
  }
`;

const InfoGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: ${({ theme }) => theme.spacing.sm};
  margin-bottom: ${({ theme }) => theme.spacing.md};
`;

const InfoItem = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.xs};
`;

const InfoLabel = styled.span`
  color: ${({ theme }) => theme.colors.text.secondary};
  font-size: ${({ theme }) => theme.typography.body2.fontSize};
`;

const InfoValue = styled.span`
  color: ${({ theme }) => theme.colors.text.primary};
  font-size: ${({ theme }) => theme.typography.body1.fontSize};
`;

const StatusBadge = styled.div<{ status: TournamentCardProps['status'] }>`
  display: inline-flex;
  align-items: center;
  padding: ${({ theme }) => `${theme.spacing.xs} ${theme.spacing.sm}`};
  border-radius: ${({ theme }) => theme.borderRadius.full};
  font-size: ${({ theme }) => theme.typography.body2.fontSize};
  margin-bottom: ${({ theme }) => theme.spacing.md};

  ${({ status, theme }) => {
    switch (status) {
      case 'upcoming':
        return `
          background: ${theme.colors.primary};
          color: ${theme.colors.warning};
          border: 1px solid ${theme.colors.warning};
        `;
      case 'registration':
        return `
          background: ${theme.colors.primary};
          color: ${theme.colors.accent};
          border: 1px solid ${theme.colors.accent};
        `;
      case 'inProgress':
        return `
          background: ${theme.colors.primary};
          color: ${theme.colors.secondary};
          border: 1px solid ${theme.colors.secondary};
        `;
      case 'completed':
        return `
          background: ${theme.colors.primary};
          color: ${theme.colors.text.disabled};
          border: 1px solid ${theme.colors.text.disabled};
        `;
    }
  }}
`;

const getStatusText = (status: TournamentCardProps['status']) => {
  switch (status) {
    case 'upcoming':
      return '⏳ Coming Soon';
    case 'registration':
      return '📝 Registration Open';
    case 'inProgress':
      return '🎮 In Progress';
    case 'completed':
      return '🏆 Completed';
  }
};

const TournamentCard: React.FC<TournamentCardProps> = ({
  title,
  game,
  prizePool,
  startDate,
  status,
  participantsCount,
  maxParticipants,
  onClick,
}) => {
  return (
    <StyledCard variant="elevated" clickable onClick={onClick}>
      <GameBadge>{game}</GameBadge>
      <Content>
        <StatusBadge status={status}>
          {getStatusText(status)}
        </StatusBadge>
        <Title>{title}</Title>
        <PrizePool>${prizePool.toLocaleString()}</PrizePool>
        <InfoGrid>
          <InfoItem>
            <InfoLabel>Start Date</InfoLabel>
            <InfoValue>
              {startDate.toLocaleDateString(undefined, {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </InfoValue>
          </InfoItem>
          <InfoItem>
            <InfoLabel>Participants</InfoLabel>
            <InfoValue>
              {participantsCount}/{maxParticipants}
            </InfoValue>
          </InfoItem>
        </InfoGrid>
        <Button 
          fullWidth 
          variant={status === 'registration' ? 'primary' : 'outline'}
          disabled={status !== 'registration'}
        >
          {status === 'registration' ? 'Join Tournament' : 'View Details'}
        </Button>
      </Content>
    </StyledCard>
  );
};

export default TournamentCard; 