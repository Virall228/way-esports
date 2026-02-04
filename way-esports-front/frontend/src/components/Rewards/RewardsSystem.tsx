import React, { useState, useEffect } from 'react';
import styled, { keyframes } from 'styled-components';
import { useNotifications } from '../../contexts/NotificationContext';
import { profileService } from '../../services/profileService';
import { api } from '../../services/api';

const Container = styled.div`
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
`;

// ... (rest of the styled components)

interface Reward {
  id: string;
  name: string;
  description: string;
  type: 'currency' | 'badge' | 'item' | 'achievement';
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  value: number;
  icon?: string;
  requirements: {
    type: string;
    value: number;
    current: number;
  };
  unlocked: boolean;
  unlockedAt?: string;
  expiresAt?: string;
  gameId?: string;
}

type RewardsTab = 'available' | 'unlocked' | 'achievements' | 'admin';

const RewardsSystem: React.FC = () => {
  const [activeTab, setActiveTab] = useState<RewardsTab>('available');
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingReward, setEditingReward] = useState<Reward | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const { addNotification } = useNotifications();

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const res: any = await api.get('/api/rewards');
        const items: any[] = (res && res.data) || [];

        let claimedIds = new Set<string>();
        try {
          const claimedRes: any = await api.get('/api/rewards/me/claimed');
          const claimed: any[] = (claimedRes && claimedRes.data) || [];
          claimed.forEach((c: any) => {
            const rewardDoc = c.rewardId && typeof c.rewardId === 'object' ? c.rewardId : null;
            const rid = (rewardDoc?._id || c.rewardId || c.reward || c.reward_id || '').toString();
            if (rid) claimedIds.add(rid);
          });
        } catch {
          // ignore if not authenticated
        }

        const mapped: Reward[] = items.map((r: any) => {
          const id = (r._id || r.id || '').toString();
          const unlocked = claimedIds.has(id);
          return {
            id,
            name: r.name || '',
            description: r.description || '',
            type: (r.type || 'achievement') as any,
            rarity: (r.rarity || 'common') as any,
            value: Number(r.value ?? r.points ?? 0),
            icon: r.icon,
            requirements: {
              type: r.requirements?.type || r.requirementType || 'unknown',
              value: Number(r.requirements?.value ?? r.requirementValue ?? 1),
              current: 0
            },
            unlocked,
            unlockedAt: unlocked ? new Date().toISOString() : undefined
          };
        });

        if (!mounted) return;
        setRewards(mapped);
      } catch (err: any) {
        if (!mounted) return;
        addNotification({
          type: 'error',
          title: 'Error',
          message: err?.message || 'Failed to load rewards'
        });
      }
    };

    load();
    return () => {
      mounted = false;
    };
  }, []);

  const handleCreateReward = () => {
    setEditingReward(null);
    setIsModalOpen(true);
  };

  const handleEditReward = (reward: Reward) => {
    setEditingReward(reward);
    setIsModalOpen(true);
  };

  const handleDeleteReward = (id: string) => {
    if (window.confirm('Are you sure you want to delete this reward?')) {
      setRewards(prev => prev.filter(reward => reward.id !== id));
      addNotification({
        type: 'success',
        title: 'Reward Deleted',
        message: 'The reward has been successfully deleted.'
      });
    }
  };

  const handleClaimReward = async (reward: Reward) => {
    if (!reward.unlocked) {
      try {
        // Если это достижение, добавляем его в профиль пользователя
        if (reward.type === 'achievement') {
          await api.post(`/api/rewards/${reward.id}/claim`, {});
          try {
            await profileService.addAchievement(reward.name);
          } catch {
            // ignore profile sync errors
          }
          
          let message = `${reward.name} has been added to your profile!`;
          
          // Специальные сообщения для особых достижений
          if (reward.value === 0) {
            message = `${reward.name} unlocked! You now have 1 free tournament entry!`;
          } else if (reward.value > 0) {
            message = `${reward.name} unlocked! You earned $${reward.value}!`;
          }
          
          addNotification({
            type: 'success',
            title: 'Achievement Unlocked!',
            message: message
          });
        } else {
          await api.post(`/api/rewards/${reward.id}/claim`, {});
          addNotification({
            type: 'success',
            title: 'Reward Claimed',
            message: `You have claimed ${reward.name}!`
          });
        }

        setRewards((prev) => prev.map((r) => (r.id === reward.id ? { ...r, unlocked: true, unlockedAt: new Date().toISOString() } : r)));
      } catch (error) {
        console.error('Error claiming reward:', error);
        addNotification({
          type: 'error',
          title: 'Error',
          message: 'Failed to claim reward. Please try again.'
        });
      }
    }
  };

  const handleSaveReward = (formData: any) => {
    if (editingReward) {
      // Update existing reward
      setRewards(prev => prev.map(reward =>
        reward.id === editingReward.id
          ? { ...reward, ...formData, id: reward.id }
          : reward
      ));
      addNotification({
        type: 'success',
        title: 'Reward Updated',
        message: 'The reward has been successfully updated.'
      });
    } else {
      // Create new reward
      const newReward: Reward = {
        ...formData,
        id: Date.now().toString(),
        unlocked: false,
        requirements: {
          type: formData.requirementType,
          value: parseInt(formData.requirementValue),
          current: 0
        }
      };
      setRewards(prev => [newReward, ...prev]);
      addNotification({
        type: 'success',
        title: 'Reward Created',
        message: 'The reward has been successfully created.'
      });
    }
    setIsModalOpen(false);
  };

  const getProgressPercentage = (reward: Reward) => {
    return (reward.requirements.current / reward.requirements.value) * 100;
  };

  const renderRewardCard = (reward: Reward) => (
    <RewardCard key={reward.id} $rarity={reward.rarity} $unlocked={reward.unlocked}>
      <RewardIcon $icon={reward.icon} $rarity={reward.rarity}>
        {reward.icon}
      </RewardIcon>
      
      <RewardName>{reward.name}</RewardName>
      <RewardDescription>{reward.description}</RewardDescription>
      
      <RewardStats>
        <RewardRarity $rarity={reward.rarity}>
          {reward.rarity}
        </RewardRarity>
        <RewardValue>
          {reward.value === 0 ? 'Free Tournament Entry' : `$${reward.value}`}
        </RewardValue>
      </RewardStats>
      
      {!reward.unlocked && (
        <div style={{ marginBottom: '12px' }}>
          <div style={{ color: '#cccccc', fontSize: '12px', marginBottom: '4px' }}>
            Progress: {reward.requirements.current}/{reward.requirements.value}
          </div>
          <ProgressBar>
            <ProgressFill 
              $percentage={getProgressPercentage(reward)} 
              $rarity={reward.rarity}
            />
          </ProgressBar>
        </div>
      )}
      
      <RewardActions>
        {!reward.unlocked ? (
          <ActionButton 
            $variant="success" 
            onClick={() => handleClaimReward(reward)}
          >
            Claim
          </ActionButton>
        ) : (
          <ActionButton disabled>
            Claimed
          </ActionButton>
        )}
        
        {isAdmin && (
          <>
            <ActionButton onClick={() => handleEditReward(reward)}>
              Edit
            </ActionButton>
            <ActionButton $variant="danger" onClick={() => handleDeleteReward(reward.id)}>
              Delete
            </ActionButton>
          </>
        )}
      </RewardActions>
    </RewardCard>
  );

  const renderStats = () => (
    <StatsContainer>
      <StatCard>
        <StatValue>{rewards.filter(r => r.unlocked).length}</StatValue>
        <StatLabel>Unlocked Rewards</StatLabel>
      </StatCard>
      <StatCard>
        <StatValue>{rewards.length}</StatValue>
        <StatLabel>Total Rewards</StatLabel>
      </StatCard>
      <StatCard>
        <StatValue>
          ${rewards.filter(r => r.unlocked).reduce((sum, r) => sum + r.value, 0)}
          {rewards.filter(r => r.unlocked && r.value === 0).length > 0 && 
            ` + ${rewards.filter(r => r.unlocked && r.value === 0).length} Free Entry`}
        </StatValue>
        <StatLabel>Total Value</StatLabel>
      </StatCard>
      <StatCard>
        <StatValue>{rewards.filter(r => r.rarity === 'legendary' && r.unlocked).length}</StatValue>
        <StatLabel>Legendary Achievements</StatLabel>
      </StatCard>
    </StatsContainer>
  );

  const renderContent = () => {
    const filteredRewards = rewards.filter(reward => {
      switch (activeTab) {
        case 'available':
          return !reward.unlocked;
        case 'unlocked':
          return reward.unlocked;
        case 'achievements':
          return reward.type === 'achievement';
        default:
          return true;
      }
    });

    return (
      <RewardsGrid>
        {filteredRewards.map(renderRewardCard)}
      </RewardsGrid>
    );
  };

  return (
    <Container>
      <Header>
        <Title>Rewards & Achievements</Title>
        <p style={{ color: '#cccccc', margin: '8px 0 0 0' }}>
          Complete challenges, earn rewards, and unlock achievements
        </p>
      </Header>

      {renderStats()}

      <TabContainer>
        <Tab $active={activeTab === 'available'} onClick={() => setActiveTab('available')}>
          Available
        </Tab>
        <Tab $active={activeTab === 'unlocked'} onClick={() => setActiveTab('unlocked')}>
          Unlocked
        </Tab>
        <Tab $active={activeTab === 'achievements'} onClick={() => setActiveTab('achievements')}>
          Achievements
        </Tab>
        {isAdmin && (
          <Tab $active={activeTab === 'admin'} onClick={() => setActiveTab('admin')}>
            Admin
          </Tab>
        )}
      </TabContainer>

      {isAdmin && activeTab === 'admin' && (
        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <ActionButton onClick={handleCreateReward}>
            Create New Reward
          </ActionButton>
        </div>
      )}

      {renderContent()}

      <Modal $isOpen={isModalOpen} onClick={() => setIsModalOpen(false)}>
        <ModalContent onClick={(e) => e.stopPropagation()}>
          <h2 style={{ color: '#ffffff', marginBottom: '24px' }}>
            {editingReward ? 'Edit Reward' : 'Create New Reward'}
          </h2>
          <Form onSubmit={(e) => {
            e.preventDefault();
            const formData = new FormData(e.currentTarget);
            handleSaveReward({
              name: formData.get('name'),
              description: formData.get('description'),
              type: formData.get('type'),
              rarity: formData.get('rarity'),
              value: parseInt(formData.get('value')?.toString() || '0'),
              icon: formData.get('icon'),
              requirementType: formData.get('requirementType'),
              requirementValue: formData.get('requirementValue'),
              gameId: formData.get('gameId')
            });
          }}>
            <FormGroup>
              <Label>Reward Name</Label>
              <Input
                name="name"
                defaultValue={editingReward?.name}
                required
              />
            </FormGroup>
            
            <FormGroup>
              <Label>Description</Label>
              <TextArea
                name="description"
                defaultValue={editingReward?.description}
                required
              />
            </FormGroup>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <FormGroup>
                <Label>Type</Label>
                <Select name="type" defaultValue={editingReward?.type || 'achievement'}>
                  <option value="achievement">Achievement</option>
                  <option value="currency">Currency</option>
                  <option value="badge">Badge</option>
                  <option value="item">Item</option>
                </Select>
              </FormGroup>
              
              <FormGroup>
                <Label>Rarity</Label>
                <Select name="rarity" defaultValue={editingReward?.rarity || 'common'}>
                  <option value="common">Common</option>
                  <option value="rare">Rare</option>
                  <option value="epic">Epic</option>
                  <option value="legendary">Legendary</option>
                </Select>
              </FormGroup>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <FormGroup>
                <Label>Value</Label>
                <Input
                  name="value"
                  type="number"
                  min="0"
                  defaultValue={editingReward?.value || 0}
                  required
                />
              </FormGroup>
              
              <FormGroup>
                <Label>Icon (emoji or URL)</Label>
                <Input
                  name="icon"
                  defaultValue={editingReward?.icon}
                  placeholder="🏆 or https://..."
                />
              </FormGroup>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <FormGroup>
                <Label>Requirement Type</Label>
                <Select name="requirementType" defaultValue={editingReward?.requirements?.type || 'tournament_wins'}>
                  <option value="tournament_wins">Tournament Wins</option>
                  <option value="win_streak">Win Streak</option>
                  <option value="team_matches">Team Matches</option>
                  <option value="first_win">First Win</option>
                  <option value="matches_played">Matches Played</option>
                </Select>
              </FormGroup>
              
              <FormGroup>
                <Label>Requirement Value</Label>
                <Input
                  name="requirementValue"
                  type="number"
                  min="1"
                  defaultValue={editingReward?.requirements?.value || 1}
                  required
                />
              </FormGroup>
            </div>
            
            <FormGroup>
              <Label>Game (optional)</Label>
              <Select name="gameId" defaultValue={editingReward?.gameId || 'all'}>
                <option value="all">All Games</option>
                <option value="valorant">Valorant</option>
                <option value="csgo">CS:GO</option>
                <option value="criticalops">Critical Ops</option>
              </Select>
            </FormGroup>
            
            <ButtonGroup>
              <Button type="submit">
                {editingReward ? 'Update Reward' : 'Create Reward'}
              </Button>
              <Button type="button" $variant="secondary" onClick={() => setIsModalOpen(false)}>
                Cancel
              </Button>
            </ButtonGroup>
          </Form>
        </ModalContent>
      </Modal>
    </Container>
  );
};

export default RewardsSystem; 