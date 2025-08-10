import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { subscriptionService, SubscriptionPlan, Subscription } from '../../services/subscriptionService';
import { useNotifications } from '../../contexts/NotificationContext';

const Container = styled.div`
  min-height: 100vh;
  background: linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 100%);
  padding: 80px 20px 40px;
`;

const Header = styled.div`
  text-align: center;
  margin-bottom: 60px;
`;

const Title = styled.h1`
  font-size: 48px;
  font-weight: 700;
  color: #ffffff;
  margin: 0 0 16px 0;
  background: linear-gradient(135deg, #c0c0c0, #808080);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
`;

const Subtitle = styled.p`
  font-size: 20px;
  color: #999999;
  margin: 0;
  max-width: 600px;
  margin: 0 auto;
  line-height: 1.6;
`;

const Disclaimer = styled.p`
  font-size: 14px;
  color: #999999;
  margin: 20px auto 0;
  max-width: 600px;
  text-align: center;
  line-height: 1.5;
  font-style: italic;
  background: rgba(255, 255, 255, 0.05);
  padding: 12px 20px;
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.1);
`;

const PlansContainer = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
  gap: 32px;
  margin-bottom: 60px;
`;

const PlanCard = styled.div<{ $color: string; $popular?: boolean }>`
  background: linear-gradient(145deg, rgba(42, 42, 42, 0.9), rgba(26, 26, 26, 0.9));
  border-radius: 16px;
  padding: 32px;
  border: 2px solid ${({ $color }) => $color}40;
  position: relative;
  transition: all 0.3s ease;
  transform: ${({ $popular }) => $popular ? 'scale(1.05)' : 'scale(1)'};
  backdrop-filter: blur(10px);

  &:hover {
    transform: ${({ $popular }) => $popular ? 'scale(1.08)' : 'scale(1.03)'};
    border-color: ${({ $color }) => $color}80;
    box-shadow: 0 12px 40px ${({ $color }) => $color}30;
  }

  ${({ $popular }) => $popular && `
    &::before {
      content: 'MOST POPULAR';
      position: absolute;
      top: -12px;
      left: 50%;
      transform: translateX(-50%);
      background: linear-gradient(135deg, #c0c0c0, #808080);
      color: #000000;
      padding: 6px 20px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 700;
      letter-spacing: 1px;
      box-shadow: 0 4px 12px rgba(192, 192, 192, 0.4);
    }
  `}
`;

const PlanName = styled.h3<{ $color: string }>`
  color: ${({ $color }) => $color};
  font-size: 28px;
  font-weight: 700;
  margin: 0 0 8px 0;
  text-align: center;
`;

const PlanDescription = styled.p`
  color: #999999;
  font-size: 16px;
  text-align: center;
  margin: 0 0 24px 0;
  line-height: 1.5;
`;

const PlanPrice = styled.div`
  text-align: center;
  margin-bottom: 32px;
`;

const Price = styled.div<{ $color: string }>`
  font-size: 48px;
  font-weight: 700;
  color: ${({ $color }) => $color};
  margin-bottom: 8px;
  display: flex;
  align-items: baseline;
  justify-content: center;
  gap: 4px;
`;

const Currency = styled.span`
  font-size: 24px;
`;

const PriceLabel = styled.div`
  color: #888888;
  font-size: 16px;
  font-weight: 500;
`;

const FeaturesList = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0 0 32px 0;
`;

const FeatureItem = styled.li<{ $color: string }>`
  color: #ffffff;
  font-size: 16px;
  margin-bottom: 12px;
  padding-left: 28px;
  position: relative;
  line-height: 1.4;

  &::before {
    content: '✓';
    position: absolute;
    left: 0;
    color: ${({ $color }) => $color};
    font-weight: 700;
    font-size: 18px;
  }
`;

const SubscribeButton = styled.button<{ $color: string; $disabled?: boolean }>`
  width: 100%;
  padding: 16px 32px;
  border-radius: 12px;
  font-weight: 700;
  cursor: ${({ $disabled }) => $disabled ? 'not-allowed' : 'pointer'};
  transition: all 0.3s ease;
  border: none;
  font-size: 16px;
  text-transform: uppercase;
  letter-spacing: 1px;
  opacity: ${({ $disabled }) => $disabled ? 0.6 : 1};
  position: relative;
  overflow: hidden;

  background: ${({ $disabled, $color }) => 
    $disabled ? '#666666' : `linear-gradient(135deg, ${$color}, ${$color}CC)`};
  color: ${({ $color }) => $color === '#ffd700' ? '#000000' : '#ffffff'};

  &:hover:not(:disabled) {
    transform: translateY(-3px);
    box-shadow: 0 8px 25px ${({ $color }) => $color}50;
  }

  &:active:not(:disabled) {
    transform: translateY(-1px);
  }

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
    transition: left 0.5s;
  }

  &:hover::before {
    left: 100%;
  }
`;

const CurrentSubscriptionSection = styled.div`
  max-width: 800px;
  margin: 0 auto 60px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 16px;
  padding: 32px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
`;

const CurrentSubscriptionTitle = styled.h2`
  color: #ffffff;
  font-size: 24px;
  font-weight: 700;
  margin: 0 0 24px 0;
  text-align: center;
`;

const SubscriptionInfo = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 24px;
  margin-bottom: 24px;
`;

const InfoItem = styled.div`
  text-align: center;
  padding: 16px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 12px;
`;

const InfoLabel = styled.div`
  color: #888888;
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 1px;
  margin-bottom: 8px;
  font-weight: 600;
`;

const InfoValue = styled.div<{ $color?: string }>`
  color: ${({ $color }) => $color || '#ffffff'};
  font-size: 18px;
  font-weight: 700;
`;

const ActionButtons = styled.div`
  display: flex;
  gap: 16px;
  justify-content: center;
`;

const ActionButton = styled.button<{ $variant?: 'danger' | 'secondary' }>`
  padding: 12px 24px;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  border: none;
  font-size: 14px;
  text-transform: uppercase;
  letter-spacing: 0.5px;

  ${({ $variant }) => $variant === 'danger' ? `
    background: linear-gradient(135deg, #ff4757, #ff6b7a);
    color: #ffffff;
    &:hover {
      background: linear-gradient(135deg, #ff6b7a, #ff8a94);
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(255, 71, 87, 0.4);
    }
  ` : `
    background: transparent;
    color: #ffffff;
    border: 2px solid rgba(255, 255, 255, 0.3);
    &:hover {
      border-color: #c0c0c0;
      color: #c0c0c0;
      transform: translateY(-2px);
    }
  `}
`;

const LoadingSpinner = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 200px;
  color: #ffffff;
  font-size: 18px;
`;

const PaymentInfo = styled.div`
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(192, 192, 192, 0.2);
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 16px;
`;

const PaymentTitle = styled.h4`
  color: #c0c0c0;
  font-size: 16px;
  font-weight: 600;
  margin: 0 0 12px 0;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const PaymentAddress = styled.div`
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(192, 192, 192, 0.3);
  border-radius: 8px;
  padding: 12px;
  font-family: 'Courier New', monospace;
  font-size: 14px;
  color: #ffffff;
  word-break: break-all;
  margin-bottom: 8px;
  position: relative;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    border-color: rgba(192, 192, 192, 0.5);
    background: rgba(0, 0, 0, 0.5);
  }
`;

const PaymentNote = styled.p`
  color: #999999;
  font-size: 12px;
  margin: 8px 0 0 0;
  line-height: 1.4;
`;

const CopyButton = styled.button`
  position: absolute;
  top: 8px;
  right: 8px;
  background: rgba(192, 192, 192, 0.2);
  border: 1px solid rgba(192, 192, 192, 0.3);
  border-radius: 4px;
  color: #c0c0c0;
  padding: 4px 8px;
  font-size: 10px;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    background: rgba(192, 192, 192, 0.3);
    border-color: rgba(192, 192, 192, 0.5);
  }
`;

const PaymentMethodSelect = styled.select`
  width: 100%;
  padding: 12px 16px;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.1);
  border: 2px solid rgba(255, 255, 255, 0.2);
  color: #ffffff;
  font-size: 16px;
  margin-bottom: 16px;
  transition: border-color 0.3s ease;

  &:focus {
    outline: none;
    border-color: #c0c0c0;
  }

  option {
    background: #2a2a2a;
    color: #ffffff;
  }
`;

const SubscriptionPage: React.FC = () => {
  const [plans, setPlans] = useState<{ [key: string]: SubscriptionPlan }>({});
  const [currentSubscription, setCurrentSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [subscribing, setSubscribing] = useState<string | null>(null);
  const [paymentMethods, setPaymentMethods] = useState<{ [key: string]: string }>({});
  const { addNotification } = useNotifications();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [plansData, subscriptionData] = await Promise.all([
        subscriptionService.getPlans(),
        subscriptionService.getCurrentSubscription()
      ]);
      
      setPlans(plansData);
      setCurrentSubscription(subscriptionData);
    } catch (error) {
      console.error('Error loading subscription data:', error);
      addNotification({
        type: 'error',
        title: 'Error',
        message: 'Failed to load subscription data'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubscribe = async (planKey: string) => {
    try {
      setSubscribing(planKey);
      const paymentMethod = paymentMethods[planKey] || 'card';
      
      await subscriptionService.createSubscription(planKey, paymentMethod);
      
      addNotification({
        type: 'success',
        title: 'Subscription Successful',
        message: `You have successfully subscribed to the ${plans[planKey].name} plan!`
      });
      
      await loadData(); // Refresh data
    } catch (error: any) {
      addNotification({
        type: 'error',
        title: 'Subscription Failed',
        message: error.message || 'Failed to create subscription'
      });
    } finally {
      setSubscribing(null);
    }
  };

  const handleCancelSubscription = async () => {
    try {
      await subscriptionService.cancelSubscription('User requested cancellation');
      
      addNotification({
        type: 'success',
        title: 'Subscription Cancelled',
        message: 'Your subscription has been cancelled successfully'
      });
      
      await loadData(); // Refresh data
    } catch (error: any) {
      addNotification({
        type: 'error',
        title: 'Cancellation Failed',
        message: error.message || 'Failed to cancel subscription'
      });
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      addNotification({
        type: 'success',
        title: 'Copied!',
        message: 'Payment address copied to clipboard'
      });
    } catch (error) {
      console.error('Failed to copy:', error);
      addNotification({
        type: 'error',
        title: 'Copy Failed',
        message: 'Failed to copy address to clipboard'
      });
    }
  };

  if (loading) {
    return (
      <Container>
        <LoadingSpinner>Loading subscription plans...</LoadingSpinner>
      </Container>
    );
  }

  console.log('Rendering SubscriptionPage with plans:', plans); // Debug log
  
  // Debug: Check if plans have USDT data
  Object.entries(plans).forEach(([key, plan]) => {
    console.log(`Plan ${key}:`, {
      name: plan.name,
      price: plan.price,
      paymentMethod: plan.paymentMethod,
      paymentAddress: plan.paymentAddress
    });
  });

  return (
    <Container>
      <Header>
        <Title>Choose Your Plan</Title>
        <Subtitle>
          Unlock premium features and take your gaming experience to the next level
        </Subtitle>
        <Disclaimer>
          All proceeds from subscription purchases go towards project development and tournament prize pools
        </Disclaimer>
      </Header>

      {currentSubscription && (
        <CurrentSubscriptionSection>
          <CurrentSubscriptionTitle>Your Current Subscription</CurrentSubscriptionTitle>
          <SubscriptionInfo>
            <InfoItem>
              <InfoLabel>Plan</InfoLabel>
              <InfoValue $color={plans[currentSubscription.plan]?.color}>
                {plans[currentSubscription.plan]?.name}
              </InfoValue>
            </InfoItem>
            <InfoItem>
              <InfoLabel>Status</InfoLabel>
              <InfoValue $color={currentSubscription.status === 'active' ? '#2ed573' : '#ff4757'}>
                {currentSubscription.status.toUpperCase()}
              </InfoValue>
            </InfoItem>
            <InfoItem>
              <InfoLabel>End Date</InfoLabel>
              <InfoValue>{formatDate(currentSubscription.endDate)}</InfoValue>
            </InfoItem>
            <InfoItem>
              <InfoLabel>Auto Renew</InfoLabel>
              <InfoValue $color={currentSubscription.autoRenew ? '#2ed573' : '#ff4757'}>
                {currentSubscription.autoRenew ? 'ON' : 'OFF'}
              </InfoValue>
            </InfoItem>
          </SubscriptionInfo>
          <ActionButtons>
            <ActionButton $variant="secondary">
              Manage Settings
            </ActionButton>
            <ActionButton $variant="danger" onClick={handleCancelSubscription}>
              Cancel Subscription
            </ActionButton>
          </ActionButtons>
        </CurrentSubscriptionSection>
      )}

      <PlansContainer>
        {Object.entries(plans).map(([key, plan]) => (
          <PlanCard key={key} $color={plan.color} $popular={plan.popular}>
            <PlanName $color={plan.color}>{plan.name}</PlanName>
            <PlanDescription>{plan.description}</PlanDescription>
            
            <PlanPrice>
              <Price $color={plan.color}>
                <Currency>$</Currency>
                {plan.price}
              </Price>
              <PriceLabel>per month</PriceLabel>
            </PlanPrice>

            <FeaturesList>
              {plan.features.map((feature, index) => (
                <FeatureItem key={index} $color={plan.color}>
                  {feature}
                </FeatureItem>
              ))}
            </FeaturesList>

            {!currentSubscription && (
              <>
                {plan.paymentMethod && plan.paymentAddress ? (
                  <PaymentInfo>
                    <PaymentTitle>
                      💰 {plan.paymentMethod}
                    </PaymentTitle>
                    <PaymentAddress onClick={() => copyToClipboard(plan.paymentAddress)}>
                      {plan.paymentAddress}
                      <CopyButton onClick={(e) => {
                        e.stopPropagation();
                        copyToClipboard(plan.paymentAddress);
                      }}>
                        Copy
                      </CopyButton>
                    </PaymentAddress>
                    <PaymentNote>{plan.paymentNote}</PaymentNote>
                  </PaymentInfo>
                ) : (
                  <div style={{ color: 'red', padding: '10px' }}>
                    Payment info missing for {plan.name}
                  </div>
                )}

                <SubscribeButton
                  $color={plan.color}
                  $disabled={subscribing === key}
                  onClick={() => handleSubscribe(key)}
                >
                  {subscribing === key ? 'Processing...' : 'I have sent the payment'}
                </SubscribeButton>
              </>
            )}

            {currentSubscription && currentSubscription.plan === key && (
              <SubscribeButton $color={plan.color} $disabled>
                Current Plan
              </SubscribeButton>
            )}

            {currentSubscription && currentSubscription.plan !== key && (
              <SubscribeButton
                $color={plan.color}
                onClick={() => handleSubscribe(key)}
                $disabled={subscribing === key}
              >
                {subscribing === key ? 'Processing...' : 'Upgrade Plan'}
              </SubscribeButton>
            )}
          </PlanCard>
        ))}
      </PlansContainer>
    </Container>
  );
};

export default SubscriptionPage;