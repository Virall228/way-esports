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
  background: ${({ theme }) => theme.colors.surface};
  border-radius: 16px;
  padding: 30px;
  width: 90%;
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
  
  &:hover {
    color: #ff6b00;
  }
`;

const Header = styled.div`
  text-align: center;
  margin-bottom: 40px;
`;

const Title = styled.h2`
  color: #ffffff;
  font-size: 2rem;
  margin-bottom: 10px;
`;

const Subtitle = styled.p`
  color: #cccccc;
  font-size: 1.1rem;
`;

const PlansContainer = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 30px;
  margin-bottom: 30px;
`;

const PlanCard = styled.div<{ $popular?: boolean }>`
  background: ${({ theme }) => theme.colors.background};
  border: 2px solid ${({ $popular }) => $popular ? '#ffd700' : 'rgba(255, 107, 0, 0.3)'};
  border-radius: 16px;
  padding: 30px;
  position: relative;
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 15px 40px rgba(255, 107, 0, 0.2);
  }
`;

const PopularBadge = styled.div`
  position: absolute;
  top: -12px;
  left: 50%;
  transform: translateX(-50%);
  background: #ffd700;
  color: #000000;
  padding: 6px 20px;
  border-radius: 20px;
  font-size: 0.9rem;
  font-weight: bold;
  text-transform: uppercase;
`;

const PlanName = styled.h3`
  color: #ffffff;
  font-size: 1.8rem;
  margin-bottom: 10px;
  text-align: center;
`;

const PlanDescription = styled.p`
  color: #cccccc;
  text-align: center;
  margin-bottom: 20px;
`;

const PlanPrice = styled.div`
  text-align: center;
  margin-bottom: 30px;
`;

const Price = styled.div`
  font-size: 2.5rem;
  font-weight: bold;
  color: #ffffff;
  margin-bottom: 5px;
`;

const PriceLabel = styled.div`
  color: #cccccc;
  font-size: 0.9rem;
`;

const FeaturesList = styled.ul`
  list-style: none;
  padding: 0;
  margin-bottom: 30px;
`;

const Feature = styled.li`
  color: #cccccc;
  margin-bottom: 12px;
  display: flex;
  align-items: center;
  gap: 10px;

  &::before {
    content: '✓';
    color: #4CAF50;
    font-weight: bold;
  }
`;

const PaymentSection = styled.div`
  background: ${({ theme }) => theme.colors.background};
  border-radius: 12px;
  padding: 25px;
  margin-bottom: 20px;
`;

const PaymentTitle = styled.h4`
  color: #ffd700;
  margin-bottom: 15px;
  display: flex;
  align-items: center;
  gap: 10px;
`;

const CryptoAddress = styled.div`
  background: ${({ theme }) => theme.colors.surface};
  border: 1px solid rgba(255, 107, 0, 0.3);
  border-radius: 8px;
  padding: 15px;
  font-family: monospace;
  color: #ffffff;
  word-break: break-all;
  margin-bottom: 15px;
  position: relative;
`;

const CopyButton = styled.button`
  position: absolute;
  top: 10px;
  right: 10px;
  background: #ff6b00;
  color: white;
  border: none;
  padding: 5px 10px;
  border-radius: 4px;
  font-size: 0.8rem;
  cursor: pointer;

  &:hover {
    background: #E55A00;
  }
`;

const PaymentInstructions = styled.p`
  color: #cccccc;
  font-size: 0.9rem;
  margin-bottom: 15px;
`;

const ConfirmButton = styled.button`
  width: 100%;
  background: rgba(255, 255, 255, 0.1);
  color: #ffffff;
  border: 1px solid rgba(255, 255, 255, 0.3);
  padding: 15px;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  text-transform: uppercase;

  &:hover {
    background: rgba(255, 255, 255, 0.2);
  }
`;

interface SubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SubscriptionModal: React.FC<SubscriptionModalProps> = ({ isOpen, onClose }) => {
  const [selectedPlan, setSelectedPlan] = useState<'premium' | 'pro' | null>(null);

  if (!isOpen) return null;

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    // You could add a toast notification here
  };

  return (
    <ModalOverlay onClick={onClose}>
      <ModalContent onClick={(e) => e.stopPropagation()}>
        <CloseButton onClick={onClose}>×</CloseButton>
        
        <Header>
          <Title>Subscription Plans</Title>
          <Subtitle>Choose the perfect plan for your gaming journey</Subtitle>
        </Header>

        <PlansContainer>
          <PlanCard $popular>
            <PopularBadge>Most Popular</PopularBadge>
            <PlanName>Premium</PlanName>
            <PlanDescription>Most popular choice for competitive players</PlanDescription>
            <PlanPrice>
              <Price>$9.99</Price>
              <PriceLabel>per month</PriceLabel>
            </PlanPrice>
            <FeaturesList>
              <Feature>Priority tournament registration</Feature>
              <Feature>Advanced statistics</Feature>
              <Feature>Custom profile themes</Feature>
              <Feature>Exclusive tournaments</Feature>
              <Feature>Discord VIP access</Feature>
              <Feature>Community support</Feature>
            </FeaturesList>
            {selectedPlan !== 'premium' && (
              <ConfirmButton onClick={() => setSelectedPlan('premium')}>
                Select Premium
              </ConfirmButton>
            )}
          </PlanCard>

          <PlanCard>
            <PlanName>Pro</PlanName>
            <PlanDescription>For professional teams and organizers</PlanDescription>
            <PlanPrice>
              <Price>$39.99</Price>
              <PriceLabel>per month</PriceLabel>
            </PlanPrice>
            <FeaturesList>
              <Feature>All Premium features</Feature>
              <Feature>Tournament creation</Feature>
              <Feature>Team management tools</Feature>
              <Feature>Advanced analytics</Feature>
              <Feature>Priority support</Feature>
              <Feature>Custom branding</Feature>
              <Feature>API access</Feature>
              <Feature>Dedicated account manager</Feature>
            </FeaturesList>
            {selectedPlan !== 'pro' && (
              <ConfirmButton onClick={() => setSelectedPlan('pro')}>
                Select Pro
              </ConfirmButton>
            )}
          </PlanCard>
        </PlansContainer>

        {selectedPlan && (
          <PaymentSection>
            <PaymentTitle>
              💰 USDT TRC20
            </PaymentTitle>
            <CryptoAddress>
              TAoLXyWNA2oXCkYu4iEuk6N6jUhDyXHU
              <CopyButton onClick={() => copyToClipboard('TAoLXyWNA2oXCkYu4iEuk6N6jUhDyXHU')}>
                Copy
              </CopyButton>
            </CryptoAddress>
            <PaymentInstructions>
              Send exact amount to this USDT TRC20 address. Include your username in transaction memo.
            </PaymentInstructions>
            <ConfirmButton>
              I Have Sent The Payment
            </ConfirmButton>
          </PaymentSection>
        )}
      </ModalContent>
    </ModalOverlay>
  );
};

export default SubscriptionModal;