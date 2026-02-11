import React, { useState } from 'react';
import styled, { keyframes } from 'styled-components';
import Card from './Card';
import Button from './Button';

interface NextStepsGuideProps {
  game: 'CS2' | 'CriticalOps' | 'PUBG';
  username: string;
  onActionClick: (action: string) => void;
}

const slideIn = keyframes`
  from {
    opacity: 0;
    transform: translateX(-20px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
`;

const Container = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: ${({ theme }) => theme.spacing.xl};
`;

const Header = styled.div`
  text-align: center;
  margin-bottom: ${({ theme }) => theme.spacing.xl};
`;

const Title = styled.h2`
  color: ${({ theme }) => theme.colors.text.primary};
  margin-bottom: ${({ theme }) => theme.spacing.md};
`;

const Subtitle = styled.p`
  color: ${({ theme }) => theme.colors.text.secondary};
  font-size: ${({ theme }) => theme.typography.body1.fontSize};
`;

const GuideGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: ${({ theme }) => theme.spacing.xl};
`;

const CategoryCard = styled(Card)<{ active?: boolean }>`
  padding: ${({ theme }) => theme.spacing.lg};
  background: ${({ theme }) => theme.colors.surface};
  border: 2px solid transparent;
  cursor: pointer;
  transition: all ${({ theme }) => theme.transitions.fast};

  ${({ active, theme }) => active && `
    border-color: ${theme.colors.accent};
    box-shadow: 0 0 20px ${theme.colors.accent}33;
  `}

  &:hover {
    transform: translateY(-4px);
  }
`;

const CategoryIcon = styled.div`
  font-size: 2.5rem;
  margin-bottom: ${({ theme }) => theme.spacing.md};
  color: ${({ theme }) => theme.colors.accent};
`;

const CategoryTitle = styled.h3`
  color: ${({ theme }) => theme.colors.text.primary};
  margin-bottom: ${({ theme }) => theme.spacing.sm};
`;

const ActionsList = styled.div`
  margin-top: ${({ theme }) => theme.spacing.md};
`;

const ActionItem = styled.div<{ completed?: boolean }>`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.md};
  padding: ${({ theme }) => theme.spacing.sm};
  margin-bottom: ${({ theme }) => theme.spacing.sm};
  border-radius: ${({ theme }) => theme.borderRadius.small};
  background: ${({ theme }) => `${theme.colors.primary}99`};
  animation: ${slideIn} 0.3s ease-out;
  cursor: pointer;
  transition: all ${({ theme }) => theme.transitions.fast};

  ${({ completed, theme }) => completed && `
    background: ${theme.colors.success}22;
    border-left: 4px solid ${theme.colors.success};
  `}

  &:hover {
    background: ${({ theme }) => `${theme.colors.primary}cc`};
  }
`;

const ActionIcon = styled.div`
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.25rem;
  color: ${({ theme }) => theme.colors.accent};
`;

const ActionContent = styled.div`
  flex: 1;
`;

const ActionTitle = styled.h4`
  color: ${({ theme }) => theme.colors.text.primary};
  margin-bottom: ${({ theme }) => theme.spacing.xs};
  font-size: ${({ theme }) => theme.typography.body1.fontSize};
`;

const ActionDescription = styled.p`
  color: ${({ theme }) => theme.colors.text.secondary};
  font-size: ${({ theme }) => theme.typography.body2.fontSize};
`;

const RewardBadge = styled.span`
  display: inline-flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.xs};
  padding: ${({ theme }) => `${theme.spacing.xs} ${theme.spacing.sm}`};
  background: ${({ theme }) => `${theme.colors.accent}22`};
  color: ${({ theme }) => theme.colors.accent};
  border-radius: ${({ theme }) => theme.borderRadius.full};
  font-size: ${({ theme }) => theme.typography.body2.fontSize};
`;

const categories = {
  tournaments: {
    icon: '\u{1F3C6}',
    title: 'Tournaments',
    actions: [
      {
        id: 'browse_tournaments',
        icon: '\u{1F50D}',
        title: 'Browse Tournaments',
        description: 'Find tournaments matching your skill level',
        reward: '50 XP'
      },
      {
        id: 'join_tournament',
        icon: '\u270D',
        title: 'Join Your First Tournament',
        description: 'Register for an upcoming tournament',
        reward: '100 XP'
      },
      {
        id: 'practice_match',
        icon: '\u{1F3AE}',
        title: 'Play Practice Match',
        description: 'Warm up with a practice match',
        reward: '30 XP'
      }
    ]
  },
  team: {
    icon: '\u{1F465}',
    title: 'Team Building',
    actions: [
      {
        id: 'browse_teams',
        icon: '\u{1F50D}',
        title: 'Browse Teams',
        description: 'Explore teams looking for players',
        reward: '30 XP'
      },
      {
        id: 'create_team',
        icon: '\u2B50',
        title: 'Create Your Team',
        description: 'Start your own competitive team',
        reward: '150 XP'
      },
      {
        id: 'team_practice',
        icon: '\u{1F3AF}',
        title: 'Schedule Team Practice',
        description: 'Set up your first team practice session',
        reward: '50 XP'
      }
    ]
  },
  profile: {
    icon: '\u{1F464}',
    title: 'Profile Setup',
    actions: [
      {
        id: 'upload_avatar',
        icon: '\u{1F4F7}',
        title: 'Upload Avatar',
        description: 'Add a profile picture to stand out',
        reward: '20 XP'
      },
      {
        id: 'link_accounts',
        icon: '\u{1F517}',
        title: 'Link Game Accounts',
        description: 'Connect your game accounts for stats tracking',
        reward: '40 XP'
      },
      {
        id: 'set_availability',
        icon: '\u{1F4C5}',
        title: 'Set Availability',
        description: 'Add your playing schedule',
        reward: '30 XP'
      }
    ]
  },
  community: {
    icon: '\u{1F31F}',
    title: 'Community',
    actions: [
      {
        id: 'join_discord',
        icon: '\u{1F4AC}',
        title: 'Join Discord',
        description: 'Connect with the WAY Esports community',
        reward: '40 XP'
      },
      {
        id: 'follow_players',
        icon: '\u{1F44B}',
        title: 'Follow Players',
        description: 'Follow top players in your game',
        reward: '20 XP'
      },
      {
        id: 'share_profile',
        icon: '\u{1F4E2}',
        title: 'Share Your Profile',
        description: 'Let others know you\'ve joined',
        reward: '30 XP'
      }
    ]
  }
};

const NextStepsGuide: React.FC<NextStepsGuideProps> = ({
  game,
  username,
  onActionClick
}) => {
  const [completedActions, setCompletedActions] = useState<string[]>([]);
  const [activeCategory, setActiveCategory] = useState<keyof typeof categories>('tournaments');

  const handleActionClick = (actionId: string) => {
    if (!completedActions.includes(actionId)) {
      setCompletedActions([...completedActions, actionId]);
    }
    onActionClick(actionId);
  };

  const totalXP = completedActions.reduce((total, actionId) => {
    const action = Object.values(categories)
      .flatMap(cat => cat.actions)
      .find(a => a.id === actionId);
    return total + (action ? parseInt(action.reward) : 0);
  }, 0);

  return (
    <Container>
      <Header>
        <Title>Your Next Steps, {username}</Title>
        <Subtitle>
          Complete these actions to get started with {game} and earn {totalXP} XP!
        </Subtitle>
      </Header>

      <GuideGrid>
        {Object.entries(categories).map(([key, category]) => (
          <CategoryCard
            key={key}
            active={key === activeCategory}
            onClick={() => setActiveCategory(key as keyof typeof categories)}
          >
            <CategoryIcon>{category.icon}</CategoryIcon>
            <CategoryTitle>{category.title}</CategoryTitle>
            
            <ActionsList>
              {category.actions.map((action) => (
                <ActionItem
                  key={action.id}
                  completed={completedActions.includes(action.id)}
                  onClick={() => handleActionClick(action.id)}
                >
                  <ActionIcon>{action.icon}</ActionIcon>
                  <ActionContent>
                    <ActionTitle>{action.title}</ActionTitle>
                    <ActionDescription>{action.description}</ActionDescription>
                  </ActionContent>
                  <RewardBadge>
                    {'\u2B50'} {action.reward}
                  </RewardBadge>
                </ActionItem>
              ))}
            </ActionsList>
          </CategoryCard>
        ))}
      </GuideGrid>
    </Container>
  );
};

export default NextStepsGuide; 
