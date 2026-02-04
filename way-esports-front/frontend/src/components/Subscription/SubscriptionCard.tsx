import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { api } from '../../services/api';

const Container = styled.div`
  background: rgba(255, 255, 255, 0.06);
  border-radius: 16px;
  padding: 25px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  margin-bottom: 20px;
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  gap: 15px;
  margin-bottom: 20px;
`;

const Icon = styled.div`
  font-size: 2rem;
`;

const Title = styled.h3`
  color: #ffffff;
  margin: 0;
  font-size: 1.3rem;
`;

const StatusBadge = styled.div<{ $active: boolean }>`
  background: ${({ $active }) => $active ? 'rgba(76, 175, 80, 0.2)' : 'rgba(244, 67, 54, 0.2)'};
  color: ${({ $active }) => $active ? '#4CAF50' : '#F44336'};
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: 600;
  border: 1px solid ${({ $active }) => $active ? 'rgba(76, 175, 80, 0.3)' : 'rgba(244, 67, 54, 0.3)'};
`;

const SubscriptionInfo = styled.div`
  background: rgba(255, 255, 255, 0.03);
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 20px;
`;

const InfoRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;

  &:last-child {
    margin-bottom: 0;
  }
`;

const InfoLabel = styled.div`
  color: #cccccc;
  font-size: 0.9rem;
`;

const InfoValue = styled.div`
  color: #ffffff;
  font-weight: 600;
`;

const ActionButton = styled.button<{ $variant: 'primary' | 'secondary' }>`
  width: 100%;
  padding: 14px;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  border: none;
  margin-bottom: 10px;

  ${({ $variant }) => $variant === 'primary' ? `
    background: linear-gradient(135deg, #ff6b00, #ff8533);
    color: white;
    
    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 25px rgba(255, 107, 0, 0.3);
    }
  ` : `
    background: rgba(255, 255, 255, 0.1);
    color: white;
    border: 1px solid rgba(255, 255, 255, 0.2);
    
    &:hover {
      background: rgba(255, 255, 255, 0.2);
    }
  `}

  &:last-child {
    margin-bottom: 0;
  }
`;

const BenefitsList = styled.div`
  margin-top: 20px;
`;

const BenefitItem = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;
  color: #cccccc;
  font-size: 0.9rem;

  &:last-child {
    margin-bottom: 0;
  }
`;

const CheckIcon = styled.div`
  color: #4CAF50;
  font-weight: bold;
`;

const LoadingState = styled.div`
  text-align: center;
  padding: 40px;
  color: #cccccc;
`;

interface SubscriptionData {
  isSubscribed: boolean;
  subscriptionExpiresAt?: string;
  freeEntriesCount: number;
  subscriptionPrice: number;
}

const SubscriptionCard: React.FC = () => {
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSubscriptionData();
  }, []);

  const loadSubscriptionData = async () => {
    try {
      setLoading(true);
      const [referralResponse] = await Promise.all([
        api.get('/api/referrals/stats')
      ]);
      
      const stats = referralResponse.data;
      
      // Get subscription settings
      const settingsResponse = await api.get('/api/referrals/settings');
      const settings = settingsResponse.data;

      setSubscription({
        isSubscribed: stats.isSubscribed,
        subscriptionExpiresAt: stats.subscriptionExpiresAt,
        freeEntriesCount: stats.freeEntriesCount,
        subscriptionPrice: settings.subscriptionPrice
      });
    } catch (error) {
      console.error('Failed to load subscription data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubscribe = () => {
    // Redirect to checkout/billing page
    window.location.href = '/billing';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <Container>
        <LoadingState>Loading subscription information...</LoadingState>
      </Container>
    );
  }

  if (!subscription) {
    return (
      <Container>
        <LoadingState>Unable to load subscription information</LoadingState>
      </Container>
    );
  }

  const isExpired = subscription.subscriptionExpiresAt && 
    new Date(subscription.subscriptionExpiresAt) < new Date();

  return (
    <Container>
      <Header>
        <Icon>💎</Icon>
        <Title>Subscription</Title>
        <StatusBadge $active={subscription.isSubscribed && !isExpired}>
          {subscription.isSubscribed && !isExpired ? 'Active' : 'Inactive'}
        </StatusBadge>
      </Header>

      <SubscriptionInfo>
        <InfoRow>
          <InfoLabel>Status:</InfoLabel>
          <InfoValue>
            {subscription.isSubscribed && !isExpired ? 'Active' : 'Inactive'}
          </InfoValue>
        </InfoRow>
        
        {subscription.subscriptionExpiresAt && (
          <InfoRow>
            <InfoLabel>Expires:</InfoLabel>
            <InfoValue>
              {isExpired ? 'Expired' : formatDate(subscription.subscriptionExpiresAt)}
            </InfoValue>
          </InfoRow>
        )}
        
        <InfoRow>
          <InfoLabel>Free Entries:</InfoLabel>
          <InfoValue>{subscription.freeEntriesCount}</InfoValue>
        </InfoRow>
        
        <InfoRow>
          <InfoLabel>Price:</InfoLabel>
          <InfoValue>${subscription.subscriptionPrice}/month</InfoValue>
        </InfoRow>
      </SubscriptionInfo>

      {!subscription.isSubscribed || isExpired ? (
        <>
          <ActionButton $variant="primary" onClick={handleSubscribe}>
            Subscribe Now - ${subscription.subscriptionPrice}/month
          </ActionButton>
          
          <BenefitsList>
            <BenefitItem>
              <CheckIcon>✓</CheckIcon>
              Unlimited tournament registrations
            </BenefitItem>
            <BenefitItem>
              <CheckIcon>✓</CheckIcon>
              Priority support
            </BenefitItem>
            <BenefitItem>
              <CheckIcon>✓</CheckIcon>
              Exclusive tournaments
            </BenefitItem>
            <BenefitItem>
              <CheckIcon>✓</CheckIcon>
              Advanced statistics tracking
            </BenefitItem>
          </BenefitsList>
        </>
      ) : (
        <>
          <ActionButton $variant="secondary">
            Manage Subscription
          </ActionButton>
          
          <BenefitsList>
            <BenefitItem>
              <CheckIcon>✓</CheckIcon>
              Unlimited tournament access
            </BenefitItem>
            <BenefitItem>
              <CheckIcon>✓</CheckIcon>
              {subscription.freeEntriesCount} free entries available
            </BenefitItem>
          </BenefitsList>
        </>
      )}
    </Container>
  );
};

export default SubscriptionCard;
