import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { subscriptionService, SubscriptionPlan, Subscription } from '../../services/subscriptionService';
import { useNotifications } from '../../contexts/NotificationContext';

interface SubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

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
  max-width: 1000px;
  width: 90%;
  max-height: 90vh;
  border: 2px solid rgba(255, 107, 0, 0.3);
  backdrop-filter: blur(10px);
  position: relative;
  overflow-y: auto;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 4px;
    background: linear-gradient(90deg, #ff6b00, #ffd700, #ff1493);
  }
`;

const CloseButton = styled.button`
  position: absolute;
  top: 16px;
  right: 16px;
  background: none;
  border: none;
  color: #cccccc;
  font-size: 24px;
  cursor: pointer;
  transition: color 0.3s ease;

  &:hover {
    color: #ffffff;
  }
`;

const ModalHeader = styled.div`
  text-align: center;
  margin-bottom: 32px;
`;

const ModalTitle = styled.h2`
  color: #ffffff;
  margin: 0 0 8px 0;
  font-size: 28px;
  font-weight: 700;
`;

const ModalSubtitle = styled.p`
  color: #cccccc;
  margin: 0;
  font-size: 16px;
`;

const PlansContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 24px;
  margin-bottom: 32px;
`;

const PlanCard = styled.div<{ $color: string; $popular?: boolean }>`
  background: linear-gradient(145deg, rgba(42, 42, 42, 0.9), rgba(26, 26, 26, 0.9));
  border-radius: 12px;
  padding: 24px;
  border: 2px solid ${({ $color }) => $color}40;
  position: relative;
  transition: all 0.3s ease;
  transform: ${({ $popular }) => $popular ? 'scale(1.05)' : 'scale(1)'};

  &:hover {
    transform: ${({ $popular }) => $popular ? 'scale(1.08)' : 'scale(1.03)'};
    border-color: ${({ $color }) => $color}80;
    box-shadow: 0 8px 32px ${({ $color }) => $color}20;
  }

  ${({ $popular }) => $popular && `
    &::before {
      content: 'MOST POPULAR';
      position: absolute;
      top: -10px;
      left: 50%;
      transform: translateX(-50%);
      background: linear-gradient(135deg, #ffd700, #ffed4e);
      color: #000000;
      padding: 4px 16px;
      border-radius: 12px;
      font-size: 12px;
      font-weight: 700;
      letter-spacing: 1px;
    }
  `}
`;

const PlanName = styled.h3<{ $color: string }>`
  color: ${({ $color }) => $color};
  font-size: 24px;
  font-weight: 700;
  margin: 0 0 8px 0;
  text-align: center;
`;

const PlanDescription = styled.p`
  color: #cccccc;
  font-size: 14px;
  text-align: center;
  margin: 0 0 16px 0;
`;

const PlanPrice = styled.div`
  text-align: center;
  margin-bottom: 24px;
`;

const Price = styled.div<{ $color: string }>`
  font-size: 36px;
  font-weight: 700;
  color: ${({ $color }) => $color};
  margin-bottom: 4px;
`;

const PriceLabel = styled.div`
  color: #888888;
  font-size: 14px;
`;

const FeaturesList = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0 0 24px 0;
`;

const FeatureItem = styled.li<{ $color: string }>`
  color: #ffffff;
  font-size: 14px;
  margin-bottom: 8px;
  padding-left: 20px;
  position: relative;

  &::before {
    content: '✓';
    position: absolute;
    left: 0;
    color: ${({ $color }) => $color};
    font-weight: 700;
  }
`;

const SubscribeButton = styled.button<{ $color: string; $disabled?: boolean }>`
  width: 100%;
  padding: 12px 24px;
  border-radius: 8px;
  font-weight: 600;
  cursor: ${({ $disabled }) => $disabled ? 'not-allowed' : 'pointer'};
  transition: all 0.3s ease;
  border: none;
  font-size: 14px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  opacity: ${({ $disabled }) => $disabled ? 0.6 : 1};

  background: ${({ $disabled, $color }) => 
    $disabled ? '#666666' : `linear-gradient(135deg, ${$color}, ${$color}CC)`};
  color: ${({ $color }) => $color === '#ffd700' ? '#000000' : '#ffffff'};

  &:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 4px 16px ${({ $color }) => $color}40;
  }
`;

const CurrentSubscriptionSection = styled.div`
  background: rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  padding: 24px;
  margin-bottom: 32px;
  border: 1px solid rgba(255, 255, 255, 0.1);
`;

const CurrentSubscriptionTitle = styled.h3`
  color: #ffffff;
  font-size: 18px;
  font-weight: 600;
  margin: 0 0 16px 0;
`;

const SubscriptionInfo = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
`;

const InfoItem = styled.div`
  text-align: center;
`;

const InfoLabel = styled.div`
  color: #888888;
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 1px;
  margin-bottom: 4px;
`;

const InfoValue = styled.div<{ $color?: string }>`
  color: ${({ $color }) => $color || '#ffffff'};
  font-size: 16px;
  font-weight: 600;
`;

const ActionButtons = styled.div`
  display: flex;
  gap: 12px;
  margin-top: 16px;
`;

const ActionButton = styled.button<{ $variant?: 'danger' | 'secondary' }>`
  flex: 1;
  padding: 8px 16px;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  border: none;
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.5px;

  ${({ $variant }) => $variant === 'danger' ? `
    background: linear-gradient(135deg, #ff4757, #ff6b7a);
    color: #ffffff;
    &:hover {
      background: linear-gradient(135deg, #ff6b7a, #ff8a94);
    }
  ` : `
    background: transparent;
    color: #ffffff;
    border: 1px solid rgba(255, 255, 255, 0.3);
    &:hover {
      border-color: #ff6b00;
      color: #ff6b00;
    }
  `}
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
  padding: 8px 12px;
  border-radius: 6px;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.3);
  color: #ffffff;
  font-size: 14px;
  margin-top: 8px;

  option {
    background: #2a2a2a;
    color: #ffffff;
  }
`;

const SubscriptionModal: React.FC<SubscriptionModalProps> = ({ isOpen, onClose }) => {
  const [plans, setPlans] = useState<{ [key: string]: SubscriptionPlan }>({});
  const [currentSubscription, setCurrentSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [subscribing, setSubscribing] = useState<string | null>(null);
  const [paymentMethods, setPaymentMethods] = useState<{ [key: string]: string }>({});
  const { addNotification } = useNotifications();

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen]);

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
      <Modal $isOpen={isOpen} onClick={onClose}>
        <ModalContent onClick={(e) => e.stopPropagation()}>
          <CloseButton onClick={onClose}>×</CloseButton>
          <div style={{ textAlign: 'center', padding: '40px', color: '#ffffff' }}>
            Loading subscription data...
          </div>
        </ModalContent>
      </Modal>
    );
  }

  return (
    <Modal $isOpen={isOpen} onClick={onClose}>
      <ModalContent onClick={(e) => e.stopPropagation()}>
        <CloseButton onClick={onClose}>×</CloseButton>
        
        <ModalHeader>
          <ModalTitle>Subscription Plans</ModalTitle>
          <ModalSubtitle>Choose the perfect plan for your gaming journey</ModalSubtitle>
        </ModalHeader>

        {currentSubscription && (
          <CurrentSubscriptionSection>
            <CurrentSubscriptionTitle>Current Subscription</CurrentSubscriptionTitle>
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
                <Price $color={plan.color}>${plan.price}</Price>
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
                    <div style={{ color: 'red', padding: '10px', fontSize: '12px' }}>
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
                <>
                  {plan.paymentMethod && plan.paymentAddress && (
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
                  )}
                  
                  <SubscribeButton
                    $color={plan.color}
                    onClick={() => handleSubscribe(key)}
                    $disabled={subscribing === key}
                  >
                    {subscribing === key ? 'Processing...' : 'I have sent the payment'}
                  </SubscribeButton>
                </>
              )}
            </PlanCard>
          ))}
        </PlansContainer>
      </ModalContent>
    </Modal>
  );
};

export default SubscriptionModal;