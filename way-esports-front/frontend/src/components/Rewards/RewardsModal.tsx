import React, { useState } from 'react';
import styled from 'styled-components';

const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
`;

const ModalContent = styled.div`
  background: #1a1a1a;
  border-radius: 16px;
  padding: 0;
  width: 90%;
  max-width: 800px;
  position: relative;
  overflow: hidden;
`;

const CloseButton = styled.button`
  position: absolute;
  top: 15px;
  right: 15px;
  background: none;
  border: none;
  color: #ffffff;
  font-size: 24px;
  cursor: pointer;
  z-index: 10;
  
  &:hover {
  color: ${({ theme }) => theme.colors.text.primary};
  }
`;

const Header = styled.div`
  background: #1a1a1a;
  border: 2px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  padding: 30px;
  margin-bottom: 30px;
`;

const Title = styled.h2`
  color: #ffffff;
  margin: 0 0 10px 0;
  font-size: 1.8rem;
`;

const Subtitle = styled.p`
  color: #cccccc;
  margin: 0;
  font-size: 1rem;
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
  margin-bottom: 30px;
  padding: 0 30px;
`;

const StatCard = styled.div`
  background: #2a2a2a;
  border-radius: 12px;
  padding: 20px;
  text-align: center;
  border: 1px solid rgba(255, 255, 255, 0.1);
`;

const StatNumber = styled.div`
  font-size: 2rem;
  font-weight: bold;
  color: #ffffff;
  margin-bottom: 5px;
`;

const StatLabel = styled.div`
  color: #cccccc;
  font-size: 0.9rem;
`;

const TabsContainer = styled.div`
  display: flex;
  justify-content: center;
  margin-bottom: 30px;
  padding: 0 30px;
`;

const Tab = styled.button<{ $active: boolean }>`
  background: ${({ $active }) => $active ? 'rgba(255, 255, 255, 0.2)' : 'transparent'};
  color: ${({ $active }) => $active ? '#ffffff' : '#cccccc'};
  border: 1px solid rgba(255, 255, 255, 0.2);
  padding: 12px 24px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  
  &:first-child {
    border-radius: 8px 0 0 8px;
  }
  
  &:last-child {
    border-radius: 0 8px 8px 0;
  }
  
  &:not(:first-child) {
    border-left: none;
  }

  &:hover {
    background: rgba(255, 255, 255, 0.1);
  }
`;

const RewardsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
  padding: 0 30px 30px 30px;
`;

const RewardCard = styled.div<{ $locked?: boolean }>`
  background: #2a2a2a;
  border-radius: 12px;
  padding: 20px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  transition: all 0.3s ease;
  opacity: ${({ $locked }) => $locked ? 0.6 : 1};

  &:hover {
    transform: translateY(-3px);
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.3);
  }
`;

const RewardIcon = styled.div`
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2rem;
  margin-bottom: 15px;
`;

const RewardTitle = styled.h3`
  color: #ffffff;
  margin-bottom: 8px;
  font-size: 1.1rem;
`;

const RewardDescription = styled.p`
  color: #cccccc;
  font-size: 0.9rem;
  margin-bottom: 15px;
  line-height: 1.4;
`;

const RewardStats = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
`;

const RewardRarity = styled.div<{ $rarity: string }>`
  color: ${({ $rarity }) => 
    $rarity === 'LEGENDARY' ? '#e5e5e5' :
    $rarity === 'EPIC' ? '#9370db' :
    $rarity === 'RARE' ? '#00bfff' :
    '#cccccc'};
  font-size: 0.8rem;
  font-weight: 600;
  text-transform: uppercase;
`;

const RewardValue = styled.div`
  color: #ffffff;
  font-weight: 600;
`;

const ProgressContainer = styled.div`
  margin-bottom: 15px;
`;

const ProgressLabel = styled.div`
  color: #cccccc;
  font-size: 0.8rem;
  margin-bottom: 5px;
`;

const ProgressBar = styled.div`
  width: 100%;
  height: 6px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 3px;
  overflow: hidden;
`;

const ProgressFill = styled.div<{ $percentage: number }>`
  height: 100%;
  background: linear-gradient(90deg, #3a3a3a, #2a2a2a);
  width: ${({ $percentage }) => Math.min($percentage, 100)}%;
  transition: width 0.3s ease;
`;

const RewardButton = styled.button<{ $locked?: boolean }>`
  width: 100%;
  background: ${({ $locked }) => $locked ? 'rgba(255, 255, 255, 0.08)' : 'linear-gradient(135deg, #3a3a3a, #2a2a2a)'};
  color: ${({ $locked }) => $locked ? '#cccccc' : '#ffffff'};
  border: none;
  padding: 10px;
  border-radius: 6px;
  font-weight: 600;
  cursor: ${({ $locked }) => $locked ? 'not-allowed' : 'pointer'};
  transition: all 0.3s ease;

  &:hover {
    ${({ $locked }) => !$locked && `
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    `}
  }
`;

interface RewardsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const RewardsModal: React.FC<RewardsModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'available' | 'unlocked' | 'achievements'>('available');

  if (!isOpen) return null;

  const mockRewards = [
    {
      id: 1,
      title: 'Tournament Champion',
      description: 'Win your first tournament',
      rarity: 'LEGENDARY',
      value: '$1000',
      icon: '🏆',
      progress: { current: 0, total: 1 },
      locked: true
    },
    {
      id: 2,
      title: 'Victory Streak',
      description: 'Win 5 matches in a row',
      rarity: 'EPIC',
      value: '$500',
      icon: '🔥',
      progress: { current: 3, total: 5 },
      locked: true
    },
    {
      id: 3,
      title: 'Team Player',
      description: 'Join a team and participate in 10 matches',
      rarity: 'RARE',
      value: '$250',
      icon: '👥',
      progress: { current: 8, total: 10 },
      locked: true
    }
  ];

  return (
    <ModalOverlay onClick={onClose}>
      <ModalContent onClick={(e) => e.stopPropagation()}>
        <CloseButton onClick={onClose}>×</CloseButton>
        
        <Header>
          <Title>Rewards & Achievements</Title>
          <Subtitle>Complete challenges, earn rewards, and unlock achievements</Subtitle>
        </Header>

        <StatsGrid>
          <StatCard>
            <StatNumber>2</StatNumber>
            <StatLabel>Unlocked Rewards</StatLabel>
          </StatCard>
          <StatCard>
            <StatNumber>10</StatNumber>
            <StatLabel>Total Rewards</StatLabel>
          </StatCard>
          <StatCard>
            <StatNumber>$100 + 1 Free Entry</StatNumber>
            <StatLabel>Total Value</StatLabel>
          </StatCard>
          <StatCard>
            <StatNumber>0</StatNumber>
            <StatLabel>Legendary Achievements</StatLabel>
          </StatCard>
        </StatsGrid>

        <TabsContainer>
          <Tab 
            $active={activeTab === 'available'} 
            onClick={() => setActiveTab('available')}
          >
            Available
          </Tab>
          <Tab 
            $active={activeTab === 'unlocked'} 
            onClick={() => setActiveTab('unlocked')}
          >
            Unlocked
          </Tab>
          <Tab 
            $active={activeTab === 'achievements'} 
            onClick={() => setActiveTab('achievements')}
          >
            Achievements
          </Tab>
        </TabsContainer>

        <RewardsGrid>
          {mockRewards.map(reward => (
            <RewardCard key={reward.id} $locked={reward.locked}>
              <RewardIcon>{reward.icon}</RewardIcon>
              <RewardTitle>{reward.title}</RewardTitle>
              <RewardDescription>{reward.description}</RewardDescription>
              
              <RewardStats>
                <RewardRarity $rarity={reward.rarity}>{reward.rarity}</RewardRarity>
                <RewardValue>{reward.value}</RewardValue>
              </RewardStats>

              <ProgressContainer>
                <ProgressLabel>Progress: {reward.progress.current}/{reward.progress.total}</ProgressLabel>
                <ProgressBar>
                  <ProgressFill $percentage={(reward.progress.current / reward.progress.total) * 100} />
                </ProgressBar>
              </ProgressContainer>

              <RewardButton $locked={reward.locked}>
                {reward.locked ? 'Locked' : 'Claim Reward'}
              </RewardButton>
            </RewardCard>
          ))}
        </RewardsGrid>
      </ModalContent>
    </ModalOverlay>
  );
};

export default RewardsModal;