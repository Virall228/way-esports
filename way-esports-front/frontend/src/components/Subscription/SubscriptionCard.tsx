import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { api } from '../../services/api';
import { PRICING_PLANS } from '../../config/pricing';

const Container = styled.div`
  background:
    linear-gradient(180deg, rgba(13, 14, 17, 0.97) 0%, rgba(7, 8, 10, 0.995) 100%),
    #050607;
  border-radius: 16px;
  padding: 18px;
  border: 1px solid rgba(95, 102, 114, 0.14);
  margin-bottom: 20px;
  box-shadow: inset 0 1px 0 rgba(255,255,255,0.03), 0 8px 24px rgba(0,0,0,0.28);
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  gap: 15px;
  margin-bottom: 20px;
`;

const Icon = styled.div`
  font-size: 1.4rem;
  color: #ff7d24;
`;

const Title = styled.h3`
  color: #f3f5f7;
  margin: 0;
  font-size: 1.3rem;
`;

const StatusBadge = styled.div<{ $active: boolean }>`
  background: ${({ $active }) => $active ? 'rgba(122, 216, 159, 0.18)' : 'rgba(255, 139, 139, 0.18)'};
  color: ${({ $active }) => $active ? '#7ad89f' : '#ff8b8b'};
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: 600;
  border: 1px solid ${({ $active }) => $active ? 'rgba(122, 216, 159, 0.34)' : 'rgba(255, 139, 139, 0.34)'};
`;

const SubscriptionInfo = styled.div`
  background: rgba(12, 14, 18, 0.94);
  border: 1px solid rgba(92, 99, 110, 0.16);
  border-radius: 12px;
  padding: 14px;
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
  color: #8e96a3;
  font-size: 0.9rem;
`;

const InfoValue = styled.div`
  color: #ecf1f6;
  font-weight: 600;
`;

const ActionButton = styled.button<{ $variant: 'primary' | 'secondary' }>`
  width: 100%;
  padding: 14px;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  border: 1px solid transparent;
  margin-bottom: 10px;

  ${({ $variant }) => $variant === 'primary' ? `
    background: linear-gradient(180deg, #ff7d24 0%, #ff6b00 100%);
    color: #111;
    border-color: rgba(255,145,72,0.65);
    
    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 25px rgba(255, 107, 0, 0.3);
    }
  ` : `
    background: linear-gradient(180deg, #373b43 0%, #2a2f37 100%);
    color: #eef2f7;
    border-color: rgba(160,168,180,0.25);
    
    &:hover {
      filter: brightness(1.05);
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
  color: #bcc5d0;
  font-size: 0.9rem;

  &:last-child {
    margin-bottom: 0;
  }
`;

const CheckIcon = styled.div`
  color: #7ad89f;
  font-weight: bold;
`;

const LoadingState = styled.div`
  text-align: center;
  padding: 40px;
  color: #8e96a3;
`;

interface SubscriptionData {
  isSubscribed: boolean;
  subscriptionExpiresAt?: string;
  freeEntriesCount: number;
}

interface SubscriptionCardProps {
  onManageSubscription?: () => void;
}

const SubscriptionCard: React.FC<SubscriptionCardProps> = ({ onManageSubscription }) => {
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSubscriptionData();
  }, []);

  const loadSubscriptionData = async () => {
    if (!api.hasToken()) {
      setSubscription({
        isSubscribed: false,
        freeEntriesCount: 0
      });
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const referralResponse: any = await api.get('/api/referrals/stats');
      const stats = referralResponse?.data || referralResponse || {};

      setSubscription({
        isSubscribed: Boolean(stats.isSubscribed),
        subscriptionExpiresAt: stats.subscriptionExpiresAt,
        freeEntriesCount: Number(stats.freeEntriesCount || 0)
      });
    } catch (error: any) {
      if (error?.status === 401) {
        setSubscription({
          isSubscribed: false,
          freeEntriesCount: 0
        });
        return;
      }
      console.error('Failed to load subscription data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubscribe = () => {
    window.location.href = '/billing';
  };

  const playerPlan = PRICING_PLANS.find((p) => p.planId === 'player_pro');
  const teamPlan = PRICING_PLANS.find((p) => p.planId === 'elite_team');

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
        <Icon>◆</Icon>
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
          <InfoLabel>Plans:</InfoLabel>
          <InfoValue>
            Player ${playerPlan?.monthly.amount.toFixed(2)}/mo · Team ${teamPlan?.monthly.amount.toFixed(2)}/mo
          </InfoValue>
        </InfoRow>
      </SubscriptionInfo>

      {!subscription.isSubscribed || isExpired ? (
        <>
          <ActionButton $variant="primary" onClick={handleSubscribe}>
            Manage Subscription Plans
          </ActionButton>
          
          <BenefitsList>
            <BenefitItem>
              <CheckIcon>{'\u2713'}</CheckIcon>
              Unlimited tournament registrations
            </BenefitItem>
            <BenefitItem>
              <CheckIcon>{'\u2713'}</CheckIcon>
              Priority support
            </BenefitItem>
            <BenefitItem>
              <CheckIcon>{'\u2713'}</CheckIcon>
              Exclusive tournaments
            </BenefitItem>
            <BenefitItem>
              <CheckIcon>{'\u2713'}</CheckIcon>
              Advanced statistics tracking
            </BenefitItem>
          </BenefitsList>
        </>
      ) : (
        <>
          <ActionButton $variant="secondary" onClick={onManageSubscription}>
            Manage Subscription
          </ActionButton>
          
          <BenefitsList>
            <BenefitItem>
              <CheckIcon>{'\u2713'}</CheckIcon>
              Unlimited tournament access
            </BenefitItem>
            <BenefitItem>
              <CheckIcon>{'\u2713'}</CheckIcon>
              {subscription.freeEntriesCount} free entries available
            </BenefitItem>
          </BenefitsList>
        </>
      )}
    </Container>
  );
};

export default SubscriptionCard;
