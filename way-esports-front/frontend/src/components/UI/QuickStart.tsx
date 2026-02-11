import React from 'react';
import styled from 'styled-components';
import Card from './Card';
import Button from './Button';

interface QuickStartAction {
  id: string;
  title: string;
  description: string;
  icon: string;
  buttonText: string;
  onClick: () => void;
  completed?: boolean;
}

interface QuickStartProps {
  actions: QuickStartAction[];
}

const Container = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.lg};
`;

const Header = styled.div`
  text-align: center;
  margin-bottom: ${({ theme }) => theme.spacing.xl};
`;

const Title = styled.h2`
  color: ${({ theme }) => theme.colors.text.primary};
  margin-bottom: ${({ theme }) => theme.spacing.sm};
`;

const Description = styled.p`
  color: ${({ theme }) => theme.colors.text.secondary};
  font-size: ${({ theme }) => theme.typography.body1.fontSize};
`;

const Progress = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: ${({ theme }) => theme.spacing.md};
  margin-top: ${({ theme }) => theme.spacing.lg};
`;

const ProgressText = styled.span`
  color: ${({ theme }) => theme.colors.accent};
  font-size: ${({ theme }) => theme.typography.body2.fontSize};
`;

const ProgressBar = styled.div`
  width: 200px;
  height: 4px;
  background: ${({ theme }) => theme.colors.surface};
  border-radius: ${({ theme }) => theme.borderRadius.small};
  overflow: hidden;
`;

const ProgressFill = styled.div<{ percentage: number }>`
  width: ${({ percentage }) => `${percentage}%`};
  height: 100%;
  background: ${({ theme }) => theme.colors.accent};
  box-shadow: 0 0 10px ${({ theme }) => theme.colors.accent};
  transition: width 0.3s ease;
`;

const ActionCard = styled(Card)<{ completed?: boolean }>`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.lg};
  padding: ${({ theme }) => theme.spacing.lg};
  border: 2px solid transparent;
  
  ${({ completed, theme }) => completed && `
    border-color: ${theme.colors.success};
    &::after {
      content: '\\2713';
      color: ${theme.colors.success};
      font-size: 1.5rem;
      margin-left: auto;
    }
  `}
`;

const ActionIcon = styled.div`
  font-size: 2rem;
  color: ${({ theme }) => theme.colors.accent};
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const ActionContent = styled.div`
  flex: 1;
`;

const ActionTitle = styled.h3`
  color: ${({ theme }) => theme.colors.text.primary};
  margin-bottom: ${({ theme }) => theme.spacing.xs};
`;

const ActionDescription = styled.p`
  color: ${({ theme }) => theme.colors.text.secondary};
  font-size: ${({ theme }) => theme.typography.body2.fontSize};
  margin-bottom: ${({ theme }) => theme.spacing.sm};
`;

const QuickStart: React.FC<QuickStartProps> = ({ actions }) => {
  const completedCount = actions.filter(action => action.completed).length;
  const progressPercentage = (completedCount / actions.length) * 100;

  return (
    <Container>
      <Header>
        <Title>Quick Start Guide</Title>
        <Description>
          Complete these steps to get the most out of WAY Esports
        </Description>
        <Progress>
          <ProgressText>
            {completedCount} of {actions.length} completed
          </ProgressText>
          <ProgressBar>
            <ProgressFill percentage={progressPercentage} />
          </ProgressBar>
        </Progress>
      </Header>

      {actions.map((action) => (
        <ActionCard key={action.id} variant="elevated" completed={action.completed}>
          <ActionIcon>{action.icon}</ActionIcon>
          <ActionContent>
            <ActionTitle>{action.title}</ActionTitle>
            <ActionDescription>{action.description}</ActionDescription>
            <Button
              variant={action.completed ? 'outline' : 'primary'}
              size="small"
              onClick={action.onClick}
              disabled={action.completed}
            >
              {action.completed ? 'Completed' : action.buttonText}
            </Button>
          </ActionContent>
        </ActionCard>
      ))}
    </Container>
  );
};

export default QuickStart; 
