import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import { api } from '../../services/api';
import { BillingCycle, PRICING_PLANS, equivalentMonthly, getPlanCycle } from '../../config/pricing';

const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(2, 3, 5, 0.9);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: calc(16px + var(--sat, 0px)) calc(16px + var(--sar, 0px)) calc(16px + var(--sab, 0px)) calc(16px + var(--sal, 0px));
`;

const ModalContent = styled.div`
  background:
    linear-gradient(180deg, rgba(22, 24, 28, 0.92) 0%, rgba(12, 13, 16, 0.97) 100%),
    #0b0c10;
  border: 1px solid rgba(110, 118, 130, 0.18);
  border-radius: 16px;
  padding: 30px;
  width: 90%;
  max-width: 100%;
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
  text-align: center;
  margin-bottom: 24px;
`;

const Title = styled.h2`
  color: #f3f5f7;
  font-size: 2rem;
  margin-bottom: 10px;
`;

const Subtitle = styled.p`
  color: #8e96a3;
  font-size: 1.1rem;
`;

const PlansContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 30px;
  margin-bottom: 30px;
`;

const PlanCard = styled.div<{ $popular?: boolean }>`
  background: rgba(20, 23, 29, 0.88);
  border: 1px solid ${({ $popular }) => $popular ? 'rgba(255,107,0,0.82)' : 'rgba(110,118,130,0.18)'};
  border-radius: 16px;
  padding: 30px;
  position: relative;
  transition: all 0.3s ease;
  box-shadow: ${({ $popular }) => $popular ? '0 0 24px rgba(255,107,0,0.18)' : 'none'};

  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 15px 40px rgba(0,0,0,0.3);
  }
`;

const PopularBadge = styled.div`
  position: absolute;
  top: -12px;
  left: 50%;
  transform: translateX(-50%);
  background: linear-gradient(180deg, #ff7d24 0%, #ff6b00 100%);
  color: #111;
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
  color: #8e97a4;
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
  color: #8e97a4;
  font-size: 0.9rem;
`;

const FeaturesList = styled.ul`
  list-style: none;
  padding: 0;
  margin-bottom: 30px;
`;

const Feature = styled.li`
  color: #bcc5d0;
  margin-bottom: 12px;
  display: flex;
  align-items: center;
  gap: 10px;

  &::before {
    content: '\\2713';
    color: #4CAF50;
    font-weight: bold;
  }
`;

const PaymentSection = styled.div`
  background: rgba(20, 23, 29, 0.88);
  border: 1px solid rgba(108, 116, 128, 0.18);
  border-radius: 12px;
  padding: 25px;
  margin-bottom: 20px;
`;

const PaymentTitle = styled.h4`
  color: #edf1f6;
  margin-bottom: 15px;
  display: flex;
  align-items: center;
  gap: 10px;
`;

const CryptoAddress = styled.div`
  background: #14171d;
  border: 1px solid rgba(108, 116, 128, 0.18);
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
  background: linear-gradient(180deg, #ff7d24 0%, #ff6b00 100%);
  color: #111;
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
  color: #8e96a3;
  font-size: 0.9rem;
  margin-bottom: 15px;
`;

const ConfirmButton = styled.button`
  width: 100%;
  background: linear-gradient(180deg, #373b43 0%, #2a2f37 100%);
  color: #eef2f7;
  border: 1px solid rgba(160,168,180,0.25);
  padding: 15px;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  text-transform: uppercase;

  &:hover {
    filter: brightness(1.05);
  }
`;

const ToggleWrap = styled.div`
  display: flex;
  justify-content: center;
  margin-bottom: 20px;
`;

const Toggle = styled.div`
  display: inline-flex;
  border: 1px solid rgba(110, 118, 130, 0.2);
  background: rgba(20, 23, 29, 0.88);
  border-radius: 999px;
  padding: 4px;
  gap: 4px;
`;

const ToggleButton = styled.button<{ $active: boolean }>`
  min-height: 38px;
  padding: 0 14px;
  border: none;
  border-radius: 999px;
  cursor: pointer;
  text-transform: uppercase;
  letter-spacing: 0.7px;
  color: ${({ $active }) => ($active ? '#111' : '#edf1f6')};
  background: ${({ $active }) => ($active ? 'linear-gradient(180deg, #ff7d24 0%, #ff6b00 100%)' : 'transparent')};
`;

interface SubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const FALLBACK_PAYMENT_ADDRESS =
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUBSCRIPTION_USDT_TRC20_ADDRESS)
    ? import.meta.env.VITE_SUBSCRIPTION_USDT_TRC20_ADDRESS
    : 'TAoLXyWNAZoxYCkYu4iEuk6N6jUhhDyXHU';

const SubscriptionModal: React.FC<SubscriptionModalProps> = ({ isOpen, onClose }) => {
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [billingCycle, setBillingCycle] = useState<BillingCycle>('monthly');
  const [paymentAddress, setPaymentAddress] = useState(FALLBACK_PAYMENT_ADDRESS);

  useEffect(() => {
    if (!isOpen) return;
    let active = true;
    (async () => {
      try {
        const settings: any = await api.get('/api/referrals/public-settings');
        const address = settings?.subscriptionPaymentAddress;
        if (active && typeof address === 'string' && address.trim()) {
          setPaymentAddress(address.trim());
        } else if (active) {
          setPaymentAddress(FALLBACK_PAYMENT_ADDRESS);
        }
      } catch {
        if (active) setPaymentAddress(FALLBACK_PAYMENT_ADDRESS);
      }
    })();
    return () => { active = false; };
  }, [isOpen]);

  if (!isOpen) return null;

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    // You could add a toast notification here
  };

  return (
    <ModalOverlay onClick={onClose}>
      <ModalContent onClick={(e) => e.stopPropagation()}>
        <CloseButton onClick={onClose}>
          {'\u2715'}
        </CloseButton>
        
        <Header>
          <Title>Subscription Plans</Title>
          <Subtitle>Choose billing cycle and plan</Subtitle>
        </Header>

        <ToggleWrap>
          <Toggle>
            <ToggleButton $active={billingCycle === 'monthly'} onClick={() => setBillingCycle('monthly')}>
              Monthly
            </ToggleButton>
            <ToggleButton $active={billingCycle === 'yearly'} onClick={() => setBillingCycle('yearly')}>
              Yearly
            </ToggleButton>
          </Toggle>
        </ToggleWrap>

        <PlansContainer>
          {PRICING_PLANS.map((plan) => {
            const cycle = getPlanCycle(plan, billingCycle);
            const monthlyEq = billingCycle === 'yearly' ? equivalentMonthly(plan.yearly.amount) : null;
            const teamEq =
              billingCycle === 'yearly' && plan.planId === 'elite_team'
                ? equivalentMonthly(plan.yearly.amount / plan.seats)
                : null;
            const badge = billingCycle === 'yearly' ? plan.badgeYearly : plan.badgeMonthly;

            return (
              <PlanCard key={plan.planId} $popular={Boolean(plan.highlight)}>
                {badge && <PopularBadge>{badge}</PopularBadge>}
                <PlanName>{plan.title}</PlanName>
                <PlanDescription>{plan.planId === 'elite_team' ? 'Up to 5 members' : 'Single player plan'}</PlanDescription>
                <PlanPrice>
                  <Price>${cycle.amount.toFixed(2)}</Price>
                  <PriceLabel>{billingCycle === 'yearly' ? 'billed yearly' : 'per month'}</PriceLabel>
                </PlanPrice>
                {monthlyEq !== null && <PriceLabel>Equivalent: ${monthlyEq.toFixed(2)}/mo</PriceLabel>}
                {teamEq !== null && <PriceLabel>Team benefit: ${teamEq.toFixed(2)}/member per month</PriceLabel>}
                <FeaturesList>
                  {plan.features.map((feature) => (
                    <Feature key={feature}>{feature}</Feature>
                  ))}
                </FeaturesList>
                {selectedPlan !== plan.planId && (
                  <ConfirmButton onClick={() => setSelectedPlan(plan.planId)}>
                    {plan.cta}
                  </ConfirmButton>
                )}
              </PlanCard>
            );
          })}
        </PlansContainer>

        {selectedPlan && (
          <PaymentSection>
            <PaymentTitle>
              {'\u{1F4B0}'} USDT TRC20
            </PaymentTitle>
            <CryptoAddress>
              {paymentAddress}
              <CopyButton onClick={() => copyToClipboard(paymentAddress)}>
                Copy
              </CopyButton>
            </CryptoAddress>
            <PaymentInstructions>
              Send exact amount to this USDT TRC20 address. Include your username in transaction memo.
            </PaymentInstructions>
            <ConfirmButton>
              I Have Sent The Payment
            </ConfirmButton>
            <div style={{ marginTop: 12 }}>
              <ConfirmButton onClick={() => { onClose(); window.location.href = '/billing'; }}>
                OPEN BILLING PAGE
              </ConfirmButton>
            </div>
          </PaymentSection>
        )}
      </ModalContent>
    </ModalOverlay>
  );
};

export default SubscriptionModal;
