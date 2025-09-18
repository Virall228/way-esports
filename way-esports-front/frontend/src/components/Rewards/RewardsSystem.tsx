import React, { useState, useEffect } from 'react';
import styled, { keyframes } from 'styled-components';
import { useNotifications } from '../../contexts/NotificationContext';
import { profileService } from '../../services/profileService';

const Container = styled.div`
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
`;

const Header = styled.div`
  background: linear-gradient(135deg, #1a1a1a, #2a2a2a);
  border-radius: 12px;
  padding: 24px;
  margin-bottom: 24px;
  border: 2px solid #ff0000;
`;

const Title = styled.h1`
  color: #ffffff;
  margin: 0;
  font-size: 32px;
  background: linear-gradient(135deg, #ff0000, #ff69b4);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
`;

const TabContainer = styled.div`
  display: flex;
  justify-content: center;
  margin-bottom: 30px;
  gap: 10px;
  flex-wrap: wrap;
`;

const Tab = styled.button<{ $active: boolean }>`
  background: ${({ $active }) => 
    $active ? 'linear-gradient(135deg, #ff0000, #ff69b4)' : 'rgba(42, 42, 42, 0.8)'};
  color: ${({ $active }) => $active ? '#000000' : '#ffffff'};
  border: 1px solid ${({ $active }) => $active ? '#ff0000' : 'rgba(255, 0, 0, 0.3)'};
  padding: 12px 24px;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  backdrop-filter: blur(10px);

  &:hover {
    background: ${({ $active }) => 
      $active ? 'linear-gradient(135deg, #ff69b4, #ff1493)' : 'rgba(255, 0, 0, 0.1)'};
    transform: translateY(-2px);
  }
`;

const RewardsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 24px;
`;

const RewardCard = styled.div<{ $rarity: string; $unlocked?: boolean }>`
  background: linear-gradient(145deg, rgba(42, 42, 42, 0.9), rgba(26, 26, 26, 0.9));
  border-radius: 12px;
  padding: 20px;
  border: 2px solid ${({ $rarity, $unlocked }) => 
    $unlocked ? 
      ($rarity === 'legendary' ? 'rgba(255, 215, 0, 0.5)' :
       $rarity === 'epic' ? 'rgba(147, 112, 219, 0.5)' :
       $rarity === 'rare' ? 'rgba(0, 191, 255, 0.5)' :
       'rgba(255, 107, 0, 0.5)') :
    'rgba(128, 128, 128, 0.3)'};
  transition: all 0.3s ease;
  backdrop-filter: blur(10px);
  position: relative;
  overflow: hidden;
  opacity: ${({ $unlocked }) => $unlocked ? 1 : 0.7};

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 12px 40px rgba(0, 0, 0, 0.3);
  }

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 4px;
    background: ${({ $rarity, $unlocked }) => 
      $unlocked ? 
        ($rarity === 'legendary' ? 'linear-gradient(90deg, #ffd700, #ffed4e)' :
         $rarity === 'epic' ? 'linear-gradient(90deg, #9370db, #8a2be2)' :
         $rarity === 'rare' ? 'linear-gradient(90deg, #00bfff, #1e90ff)' :
         'linear-gradient(90deg, #ff6b00, #ff8533)') :
      'linear-gradient(90deg, #808080, #a0a0a0)'};
  }
`;

const RewardIcon = styled.div<{ $icon?: string; $rarity: string }>`
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: ${({ $icon, $rarity }) => 
    $icon ? `url(${$icon})` :
    $rarity === 'legendary' ? 'linear-gradient(135deg, #ffd700, #ffed4e)' :
    $rarity === 'epic' ? 'linear-gradient(135deg, #9370db, #8a2be2)' :
    $rarity === 'rare' ? 'linear-gradient(135deg, #00bfff, #1e90ff)' :
    'linear-gradient(135deg, #ff6b00, #ff8533)'};
  background-size: cover;
  background-position: center;
  margin-bottom: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  border: 3px solid ${({ $rarity }) => 
    $rarity === 'legendary' ? 'rgba(255, 215, 0, 0.5)' :
    $rarity === 'epic' ? 'rgba(147, 112, 219, 0.5)' :
    $rarity === 'rare' ? 'rgba(0, 191, 255, 0.5)' :
    'rgba(255, 107, 0, 0.5)'};
`;

const RewardName = styled.h3`
  color: #ffffff;
  font-size: 18px;
  font-weight: 600;
  margin: 0 0 8px 0;
`;

const RewardDescription = styled.p`
  color: #cccccc;
  font-size: 14px;
  line-height: 1.5;
  margin: 0 0 16px 0;
`;

const RewardStats = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
`;

const RewardRarity = styled.div<{ $rarity: string }>`
  color: ${({ $rarity }) => 
    $rarity === 'legendary' ? '#ffd700' :
    $rarity === 'epic' ? '#9370db' :
    $rarity === 'rare' ? '#00bfff' :
    '#ff6b00'};
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 1px;
`;

const RewardValue = styled.div`
  color: #ffffff;
  font-size: 16px;
  font-weight: 600;
`;

const ProgressBar = styled.div`
  width: 100%;
  height: 8px;
  background: rgba(128, 128, 128, 0.3);
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 12px;
`;

const ProgressFill = styled.div<{ $percentage: number; $rarity: string }>`
  height: 100%;
  background: linear-gradient(90deg, #ff6b00, #ff8533);
  width: ${({ $percentage }) => Math.min($percentage, 100)}%;
  transition: width 0.3s ease;
`;

const RewardActions = styled.div`
  display: flex;
  gap: 8px;
`;

const ActionButton = styled.button<{ $variant?: 'primary' | 'secondary' | 'success' | 'danger' }>`
  background: ${({ $variant }) => 
    $variant === 'danger' ? 'linear-gradient(135deg, #ff4757, #ff6b7a)' :
    $variant === 'success' ? 'linear-gradient(135deg, #2ed573, #3ddb7f)' :
    $variant === 'secondary' ? 'rgba(255, 255, 255, 0.1)' :
    'linear-gradient(135deg, #ff6b00, #ff8533)'};
  color: #ffffff;
  border: none;
  padding: 8px 16px;
  border-radius: 6px;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(255, 107, 0, 0.3);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
  }
`;

const StatsContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
`;

const StatCard = styled.div`
  background: linear-gradient(145deg, rgba(42, 42, 42, 0.9), rgba(26, 26, 26, 0.9));
  border-radius: 12px;
  padding: 20px;
  border: 1px solid rgba(255, 107, 0, 0.2);
  text-align: center;
`;

const StatValue = styled.div`
  font-size: 32px;
  font-weight: 700;
  color: #ff6b00;
  margin-bottom: 8px;
`;

const StatLabel = styled.div`
  color: #cccccc;
  font-size: 14px;
`;

const Modal = styled.div<{ $isOpen: boolean }>`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  display: ${({ $isOpen }) => $isOpen ? 'flex' : 'none'};
  align-items: center;
  justify-content: center;
  z-index: 1000;
  backdrop-filter: blur(5px);
`;

const ModalContent = styled.div`
  background: linear-gradient(145deg, rgba(42, 42, 42, 0.95), rgba(26, 26, 26, 0.95));
  border-radius: 16px;
  padding: 32px;
  max-width: 600px;
  width: 90%;
  max-height: 80vh;
  overflow-y: auto;
  border: 2px solid #ff6b00;
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const Label = styled.label`
  color: #ffffff;
  font-weight: 500;
  font-size: 14px;
`;

const Input = styled.input`
  background: rgba(26, 26, 26, 0.8);
  border: 1px solid rgba(255, 107, 0, 0.3);
  padding: 12px;
  border-radius: 8px;
  color: #ffffff;
  font-size: 14px;

  &:focus {
    outline: none;
    border-color: #ff6b00;
    box-shadow: 0 0 0 2px rgba(255, 107, 0, 0.2);
  }
`;

const TextArea = styled.textarea`
  background: rgba(26, 26, 26, 0.8);
  border: 1px solid rgba(255, 107, 0, 0.3);
  padding: 12px;
  border-radius: 8px;
  color: #ffffff;
  font-size: 14px;
  min-height: 100px;
  resize: vertical;

  &:focus {
    outline: none;
    border-color: #ff6b00;
    box-shadow: 0 0 0 2px rgba(255, 107, 0, 0.2);
  }
`;

const Select = styled.select`
  background: rgba(26, 26, 26, 0.8);
  border: 1px solid rgba(255, 107, 0, 0.3);
  padding: 12px;
  border-radius: 8px;
  color: #ffffff;
  font-size: 14px;

  &:focus {
    outline: none;
    border-color: #ff6b00;
    box-shadow: 0 0 0 2px rgba(255, 107, 0, 0.2);
  }

  option {
    background: #1a1a1a;
    color: #ffffff;
  }
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 12px;
  margin-top: 24px;
`;

const Button = styled.button<{ $variant?: 'primary' | 'secondary' | 'danger' }>`
  background: ${({ $variant }) => 
    $variant === 'danger' ? 'linear-gradient(135deg, #ff4757, #ff6b7a)' :
    $variant === 'secondary' ? 'rgba(255, 255, 255, 0.1)' :
    'linear-gradient(135deg, #ff6b00, #ff8533)'};
  color: #ffffff;
  border: none;
  padding: 12px 24px;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(255, 107, 0, 0.3);
  }
`;

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

  // Mock data
  useEffect(() => {
    const mockRewards: Reward[] = [
      {
        id: '1',
        name: 'Tournament Champion',
        description: 'Win your first tournament',
        type: 'achievement',
        rarity: 'legendary',
        value: 1000,
        icon: '🏆',
        requirements: {
          type: 'tournament_wins',
          value: 1,
          current: 0
        },
        unlocked: false
      },
      {
        id: '2',
        name: 'Victory Streak',
        description: 'Win 5 matches in a row',
        type: 'achievement',
        rarity: 'epic',
        value: 500,
        icon: '🔥',
        requirements: {
          type: 'win_streak',
          value: 5,
          current: 3
        },
        unlocked: false
      },
      {
        id: '3',
        name: 'Team Player',
        description: 'Join a team and participate in 10 matches',
        type: 'achievement',
        rarity: 'rare',
        value: 250,
        icon: '👥',
        requirements: {
          type: 'team_matches',
          value: 10,
          current: 8
        },
        unlocked: false
      },
      {
        id: '4',
        name: 'First Blood',
        description: 'Win your first match',
        type: 'achievement',
        rarity: 'common',
        value: 100,
        icon: '⚔️',
        requirements: {
          type: 'first_win',
          value: 1,
          current: 1
        },
        unlocked: true,
        unlockedAt: '2024-01-10T15:30:00Z'
      },
      {
        id: '5',
        name: 'Triple Crown',
        description: 'Win 3 tournaments in a row',
        type: 'achievement',
        rarity: 'legendary',
        value: 100,
        icon: '👑',
        requirements: {
          type: 'consecutive_tournament_wins',
          value: 3,
          current: 0
        },
        unlocked: false
      },
      {
        id: '6',
        name: 'Loyal Member',
        description: 'Stay with organization for 30 days',
        type: 'achievement',
        rarity: 'common',
        value: 10,
        icon: '⏰',
        requirements: {
          type: 'days_with_organization',
          value: 30,
          current: 15
        },
        unlocked: false
      },
      {
        id: '7',
        name: 'Veteran Member',
        description: 'Stay with organization for 90 days',
        type: 'achievement',
        rarity: 'rare',
        value: 20,
        icon: '🕐',
        requirements: {
          type: 'days_with_organization',
          value: 90,
          current: 45
        },
        unlocked: false
      },
      {
        id: '8',
        name: 'Elite Member',
        description: 'Stay with organization for 180 days',
        type: 'achievement',
        rarity: 'epic',
        value: 50,
        icon: '⭐',
        requirements: {
          type: 'days_with_organization',
          value: 180,
          current: 90
        },
        unlocked: false
      },
      {
        id: '9',
        name: 'Sharpshooter',
        description: 'Maintain K/D ratio of 1.5+ for 60 days',
        type: 'achievement',
        rarity: 'epic',
        value: 25,
        icon: '🎯',
        requirements: {
          type: 'kd_ratio_streak',
          value: 60,
          current: 30
        },
        unlocked: false
      },
      {
        id: '10',
        name: 'Early Bird',
        description: 'Register within first 10 days of app launch - Get 1 free tournament entry!',
        type: 'achievement',
        rarity: 'rare',
        value: 0,
        icon: '🐦',
        requirements: {
          type: 'early_registration',
          value: 1,
          current: 1
        },
        unlocked: true,
        unlockedAt: '2024-01-01T10:00:00Z'
      }
    ];

    setRewards(mockRewards);
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
    if (reward.unlocked) {
      try {
        // Если это достижение, добавляем его в профиль пользователя
        if (reward.type === 'achievement') {
          await profileService.addAchievement(reward.name);
          
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
          addNotification({
            type: 'success',
            title: 'Reward Claimed',
            message: `You have claimed ${reward.name}!`
          });
        }
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
        {reward.unlocked ? (
          <ActionButton 
            $variant="success" 
            onClick={() => handleClaimReward(reward)}
          >
            Claim
          </ActionButton>
        ) : (
          <ActionButton disabled>
            Locked
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