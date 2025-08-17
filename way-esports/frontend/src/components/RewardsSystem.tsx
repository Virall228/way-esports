import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { useAuth } from '../contexts/AuthContext';
import { useApi } from '../hooks/useApi';

const RewardsContainer = styled.div`
  max-width: 1000px;
  margin: 0 auto;
  padding: 2rem;
`;

const RewardsHeader = styled.div`
  margin-bottom: 2rem;
`;

const RewardsTitle = styled.h1`
  color: #ffffff;
  margin-bottom: 0.5rem;
`;

const PointsDisplay = styled.div`
  background: linear-gradient(135deg, #007bff, #0056b3);
  color: white;
  padding: 1.5rem;
  border-radius: 8px;
  text-align: center;
  margin-bottom: 2rem;
`;

const PointsValue = styled.div`
  font-size: 3rem;
  font-weight: bold;
`;

const PointsLabel = styled.div`
  font-size: 1.2rem;
  opacity: 0.9;
`;

const RewardsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1.5rem;
`;

const RewardCard = styled.div`
  background: #1a1a1a;
  border: 1px solid #333;
  border-radius: 8px;
  padding: 1.5rem;
  transition: transform 0.2s;
  
  &:hover {
    transform: translateY(-2px);
  }
`;

const RewardImage = styled.img`
  width: 100%;
  height: 150px;
  object-fit: cover;
  border-radius: 4px;
  margin-bottom: 1rem;
`;

const RewardTitle = styled.h3`
  color: #ffffff;
  margin: 0 0 0.5rem 0;
`;

const RewardDescription = styled.p`
  color: #cccccc;
  font-size: 0.9rem;
  margin-bottom: 1rem;
`;

const RewardCost = styled.div`
  color: #007bff;
  font-weight: bold;
  margin-bottom: 1rem;
`;

const RedeemButton = styled.button<{ disabled?: boolean }>`
  background: ${props => props.disabled ? '#666' : '#007bff'};
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 4px;
  cursor: ${props => props.disabled ? 'not-allowed' : 'pointer'};
  width: 100%;
`;

const AchievementList = styled.div`
  margin-top: 2rem;
`;

const AchievementItem = styled.div`
  display: flex;
  align-items: center;
  padding: 1rem;
  background: #1a1a1a;
  border-radius: 8px;
  margin-bottom: 1rem;
`;

const AchievementIcon = styled.div`
  width: 50px;
  height: 50px;
  background: #007bff;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 1rem;
`;

const AchievementInfo = styled.div`
  flex: 1;
`;

const AchievementTitle = styled.div`
  color: #ffffff;
  font-weight: bold;
`;

const AchievementDescription = styled.div`
  color: #cccccc;
  font-size: 0.9rem;
`;

interface Reward {
  id: string;
  title: string;
  description: string;
  cost: number;
  image: string;
  category: string;
}

interface UserRewards {
  points: number;
  achievements: Array<{
    id: string;
    title: string;
    description: string;
    earned: boolean;
    earnedDate?: string;
  }>;
}

export const RewardsSystem: React.FC = () => {
  const { user } = useAuth();
  const api = useApi();
  const [userRewards, setUserRewards] = useState<UserRewards | null>(null);
  const [rewards, setRewards] = useState<Reward[]>([]);

  useEffect(() => {
    if (user) {
      fetchUserRewards();
      fetchRewards();
    }
  }, [user]);

  const fetchUserRewards = async () => {
    try {
      const response = await api.request(`/api/users/${user?.id}/rewards`);
      setUserRewards(response.data);
    } catch (error) {
      console.error('Failed to fetch user rewards:', error);
    }
  };

  const fetchRewards = async () => {
    try {
      const response = await api.request('/api/rewards');
      setRewards(response.data);
    } catch (error) {
      console.error('Failed to fetch rewards:', error);
    }
  };

  const redeemReward = async (rewardId: string) => {
    try {
      await api.request('/api/rewards/redeem', {
        method: 'POST',
        data: { rewardId }
      });
      fetchUserRewards();
    } catch (error) {
      console.error('Failed to redeem reward:', error);
    }
  };

  if (!userRewards) return <div>Loading...</div>;

  return (
    <RewardsContainer>
      <RewardsHeader>
        <RewardsTitle>Rewards & Achievements</RewardsTitle>
      </RewardsHeader>

      <PointsDisplay>
        <PointsValue>{userRewards.points}</PointsValue>
        <PointsLabel>Total Points</PointsLabel>
      </PointsDisplay>

      <RewardsGrid>
        {rewards.map(reward => (
          <RewardCard key={reward.id}>
            <RewardImage src={reward.image} alt={reward.title} />
            <RewardTitle>{reward.title}</RewardTitle>
            <RewardDescription>{reward.description}</RewardDescription>
            <RewardCost>{reward.cost} Points</RewardCost>
            <RedeemButton 
              onClick={() => redeemReward(reward.id)}
              disabled={userRewards.points < reward.cost}
            >
              {userRewards.points >= reward.cost ? 'Redeem' : 'Not Enough Points'}
            </RedeemButton>
          </RewardCard>
        ))}
      </RewardsGrid>

      <AchievementList>
        <h2>Achievements</h2>
        {userRewards.achievements.map(achievement => (
          <AchievementItem key={achievement.id}>
            <AchievementIcon>
              {achievement.earned ? '✓' : '○'}
            </AchievementIcon>
            <AchievementInfo>
              <AchievementTitle>{achievement.title}</AchievementTitle>
              <AchievementDescription>{achievement.description}</AchievementDescription>
            </AchievementInfo>
          </AchievementItem>
        ))}
      </AchievementList>
    </RewardsContainer>
  );
};
