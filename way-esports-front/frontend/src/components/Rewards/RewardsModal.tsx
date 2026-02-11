import React, { useEffect, useMemo, useState } from 'react';
import styled from 'styled-components';
import { api } from '../../services/api';

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
  padding: calc(16px + var(--sat, 0px)) calc(16px + var(--sar, 0px)) calc(16px + var(--sab, 0px)) calc(16px + var(--sal, 0px));
`;

const ModalContent = styled.div`
  background: #1a1a1a;
  border-radius: 16px;
  padding: 0;
  width: 92%;
  max-width: 800px;
  position: relative;
  max-height: 90vh;
  overflow-y: auto;
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
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  
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

const NoResults = styled.div`
  text-align: center;
  padding: 20px;
  font-size: 1rem;
  color: #cccccc;
`;

interface RewardsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface UiReward {
  id: string;
  title: string;
  description: string;
  rarity: 'LEGENDARY' | 'EPIC' | 'RARE' | 'COMMON';
  value: string;
  icon: string;
  locked: boolean;
}

const RewardsModal: React.FC<RewardsModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'available' | 'unlocked' | 'achievements'>('available');
  const [rewards, setRewards] = useState<UiReward[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const res: any = await api.get('/api/rewards');
        const items: any[] = (res && res.data) || [];

        let claimedIds = new Set<string>();
        try {
          const claimedRes: any = await api.get('/api/rewards/me/claimed');
          const claimed: any[] = (claimedRes && claimedRes.data) || [];
          claimed.forEach((c: any) => {
            const rewardDoc = c.rewardId && typeof c.rewardId === 'object' ? c.rewardId : null;
            const rid = (rewardDoc?._id || c.rewardId || '').toString();
            if (rid) claimedIds.add(rid);
          });
        } catch {
          // ignore if not authenticated
        }

        const mapped: UiReward[] = items.map((r: any) => {
          const id = (r._id || r.id || '').toString();
          const rarity = ((r.rarity || 'common') as string).toUpperCase();
          const valueNum = Number(r.value ?? r.points ?? 0);
          return {
            id,
            title: r.name || '',
            description: r.description || '',
            rarity: (rarity === 'LEGENDARY' ? 'LEGENDARY' : rarity === 'EPIC' ? 'EPIC' : rarity === 'RARE' ? 'RARE' : 'COMMON'),
            value: valueNum === 0 ? 'Free Tournament Entry' : `$${valueNum}`,
            icon: r.icon || '\u{1F3C6}',
            locked: !claimedIds.has(id)
          };
        });

        if (!mounted) return;
        setRewards(mapped);
      } catch (e: any) {
        if (!mounted) return;
        setError(e?.message || 'Failed to load rewards');
        setRewards([]);
      } finally {
        if (!mounted) return;
        setLoading(false);
      }
    };

    load();
    return () => {
      mounted = false;
    };
  }, [isOpen]);

  const stats = useMemo(() => {
    const unlockedCount = rewards.filter((r) => !r.locked).length;
    const total = rewards.length;
    return { unlockedCount, total };
  }, [rewards]);

  const visibleRewards = useMemo(() => {
    if (activeTab === 'unlocked') return rewards.filter((r) => !r.locked);
    if (activeTab === 'available') return rewards.filter((r) => r.locked);
    return rewards;
  }, [activeTab, rewards]);

  const handleClaim = async (reward: UiReward) => {
    if (!reward.locked) return;
    try {
      await api.post(`/api/rewards/${reward.id}/claim`, {});
      setRewards((prev) => prev.map((r) => (r.id === reward.id ? { ...r, locked: false } : r)));
    } catch (e: any) {
      setError(e?.message || 'Failed to claim reward');
    }
  };

  return (
    <ModalOverlay onClick={onClose}>
      <ModalContent onClick={(e) => e.stopPropagation()}>
        <CloseButton onClick={onClose}>
          {'\u2715'}
        </CloseButton>
        
        <Header>
          <Title>Rewards & Achievements</Title>
          <Subtitle>Complete challenges, earn rewards, and unlock achievements</Subtitle>
        </Header>

        <StatsGrid>
          <StatCard>
            <StatNumber>{stats.unlockedCount}</StatNumber>
            <StatLabel>Unlocked Rewards</StatLabel>
          </StatCard>
          <StatCard>
            <StatNumber>{stats.total}</StatNumber>
            <StatLabel>Total Rewards</StatLabel>
          </StatCard>
          <StatCard>
            <StatNumber>{'\u2014'}</StatNumber>
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
          {loading ? (
            <NoResults>Loading...</NoResults>
          ) : error ? (
            <NoResults>{error}</NoResults>
          ) : visibleRewards.length === 0 ? (
            <NoResults>No rewards</NoResults>
          ) : visibleRewards.map(reward => (
            <RewardCard key={reward.id} $locked={reward.locked}>
              <RewardIcon>{reward.icon}</RewardIcon>
              <RewardTitle>{reward.title}</RewardTitle>
              <RewardDescription>{reward.description}</RewardDescription>

              <RewardStats>
                <RewardRarity $rarity={reward.rarity}>{reward.rarity}</RewardRarity>
                <RewardValue>{reward.value}</RewardValue>
              </RewardStats>

              <RewardButton $locked={reward.locked} onClick={() => reward.locked && handleClaim(reward)}>
                {reward.locked ? 'Claim Reward' : 'Claimed'}
              </RewardButton>
            </RewardCard>
          ))}
        </RewardsGrid>
      </ModalContent>
    </ModalOverlay>
  );
};

export default RewardsModal;
