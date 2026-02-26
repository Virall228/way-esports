import React, { useEffect, useMemo, useState } from 'react';
import styled from 'styled-components';
import { api } from '../../services/api';
import { BillingCycle, PlanId, PRICING_PLANS, equivalentMonthly, getPlanCycle } from '../../config/pricing';

const Container = styled.div`
  min-height: 100vh;
  background: #0a0d12;
  padding: 24px;
  width: 100%;
  max-width: 100%;
  display: grid;
  gap: 14px;

  @media (max-width: 768px) {
    padding: 14px;
  }
`;

const Header = styled.div`
  text-align: center;
  background:
    linear-gradient(180deg, rgba(44, 48, 55, 0.75) 0%, rgba(23, 26, 32, 0.9) 100%),
    #171a20;
  border: 1px solid rgba(132, 139, 151, 0.2);
  border-radius: 16px;
  padding: 18px 16px;
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.04),
    0 8px 24px rgba(0, 0, 0, 0.28);
`;

const Title = styled.h1`
  color: #f3f5f7;
  font-size: clamp(1.6rem, 5vw, 2.5rem);
  margin: 0 0 6px 0;
  text-transform: uppercase;
  letter-spacing: 1px;
`;

const Subtitle = styled.p`
  color: #99a3af;
  margin: 0;
`;

const ToggleWrap = styled.div`
  display: flex;
  justify-content: center;
`;

const Toggle = styled.div`
  display: inline-flex;
  background: rgba(41, 46, 53, 0.72);
  border: 1px solid rgba(132, 139, 151, 0.26);
  border-radius: 999px;
  padding: 4px;
  gap: 4px;
`;

const ToggleButton = styled.button<{ $active: boolean }>`
  min-height: 40px;
  padding: 0 14px;
  border-radius: 999px;
  border: none;
  cursor: pointer;
  color: ${({ $active }) => ($active ? '#111' : '#edf1f6')};
  background: ${({ $active }) => ($active ? 'linear-gradient(180deg, #ff7d24 0%, #ff6b00 100%)' : 'transparent')};
  text-transform: uppercase;
  font-size: 12px;
  letter-spacing: 0.8px;
  transition: all 180ms ease;
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 16px;
`;

const Card = styled.div<{ $highlight?: boolean }>`
  background:
    linear-gradient(180deg, rgba(44, 48, 55, 0.78) 0%, rgba(24, 27, 32, 0.9) 100%),
    #171a20;
  border: 1px solid ${({ $highlight }) => ($highlight ? 'rgba(255,107,0,0.82)' : 'rgba(132, 139, 151, 0.24)')};
  border-radius: 16px;
  padding: 18px;
  color: #f4f7fb;
  transition: border-color 220ms ease, box-shadow 220ms ease;
  box-shadow: ${({ $highlight }) => ($highlight ? '0 0 24px rgba(255,107,0,0.18), inset 0 1px 0 rgba(255,255,255,0.04)' : 'inset 0 1px 0 rgba(255,255,255,0.03)')};
`;

const PlanTitle = styled.h3`
  margin: 0;
  text-transform: uppercase;
  letter-spacing: 1px;
`;

const Badge = styled.span`
  display: inline-block;
  margin-top: 8px;
  font-size: 11px;
  border-radius: 999px;
  border: 1px solid rgba(255, 107, 0, 0.75);
  color: #ffb280;
  padding: 4px 8px;
  background: rgba(255, 107, 0, 0.08);
`;

const Price = styled.div`
  margin-top: 14px;
  font-size: 2rem;
  font-weight: 700;
  color: #f2f6fa;
  animation: priceFade 220ms ease;

  @keyframes priceFade {
    from {
      opacity: 0;
      transform: translateY(4px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
`;

const Meta = styled.div`
  color: #aeb6c2;
  font-size: 13px;
  margin-top: 4px;
  min-height: 18px;
`;

const Features = styled.ul`
  margin: 14px 0;
  padding-left: 18px;
  color: #d7dde6;
  display: grid;
  gap: 6px;
`;

const Cta = styled.button`
  width: 100%;
  min-height: 44px;
  border: 1px solid rgba(255, 145, 72, 0.65);
  border-radius: 10px;
  background: linear-gradient(180deg, #ff7d24 0%, #ff6b00 100%);
  color: #111;
  font-weight: 800;
  letter-spacing: 0.8px;
  text-transform: uppercase;
  cursor: pointer;
  transition: transform 180ms ease, filter 180ms ease;

  &:hover {
    transform: translateY(-1px);
    filter: brightness(1.05);
  }

  &:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }
`;

const Message = styled.div<{ $error?: boolean }>`
  color: ${({ $error }) => ($error ? '#ff8b8b' : '#8fe2ad')};
  background: rgba(41, 46, 53, 0.62);
  border: 1px solid ${({ $error }) => ($error ? 'rgba(255,139,139,0.34)' : 'rgba(143,226,173,0.32)')};
  border-radius: 12px;
  padding: 10px 12px;
`;

type BillingData = {
  isSubscribed: boolean;
  pendingSubscriptionRequest?: boolean;
};

const BillingPage: React.FC = () => {
  const [billingCycle, setBillingCycle] = useState<BillingCycle>('monthly');
  const [billing, setBilling] = useState<BillingData | null>(null);
  const [processingPlan, setProcessingPlan] = useState<PlanId | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      if (!api.hasToken()) {
        setBilling({ isSubscribed: false, pendingSubscriptionRequest: false });
        return;
      }
      try {
        const [statsRes, txRes]: any[] = await Promise.all([
          api.get('/api/referrals/stats'),
          api.get('/api/wallet/transactions')
        ]);
        const stats = statsRes?.data || statsRes || {};
        const txList: any[] = Array.isArray(txRes?.data) ? txRes.data : (Array.isArray(txRes) ? txRes : []);
        const pending = txList.some((tx: any) => tx?.type === 'subscription' && tx?.status === 'pending');
        setBilling({
          isSubscribed: Boolean(stats.isSubscribed),
          pendingSubscriptionRequest: pending
        });
      } catch {
        setBilling({ isSubscribed: false, pendingSubscriptionRequest: false });
      }
    };
    void load();
  }, []);

  const helperTextByPlan = useMemo(() => ({
    player_pro: 'Equivalent: $4.16/mo, billed $49.99 yearly',
    elite_team: 'Equivalent: $16.66/mo, billed $199.99 yearly'
  }), []);

  const trackPricingEvent = async (payload: { plan_id: PlanId; billing_cycle: BillingCycle; price_id: string; seats: number }) => {
    try {
      await api.post('/api/analytics/track', {
        event: 'pricing_select_plan',
        userId: 'self',
        data: payload,
        source: 'billing_page'
      });
    } catch {
      // non-blocking
    }
  };

  const handleCheckout = async (planId: PlanId) => {
    try {
      setError(null);
      setSuccess(null);
      setProcessingPlan(planId);

      const plan = PRICING_PLANS.find((p) => p.planId === planId);
      if (!plan) throw new Error('Plan not found');
      const cycle = getPlanCycle(plan, billingCycle);
      const priceId = cycle.priceId;
      if (!priceId) throw new Error('Missing price_id');

      const payload = {
        plan_id: plan.planId,
        billing_cycle: billingCycle,
        price_id: priceId,
        seats: plan.seats
      };

      await trackPricingEvent(payload);

      const checkoutRes: any = await api.post('/api/billing/checkout-session', payload);
      const checkout = checkoutRes?.data || payload;

      const subscribeRes: any = await api.post('/api/wallet/subscribe', {
        paymentMethod: 'manual',
        plan_id: checkout.plan_id,
        billing_cycle: checkout.billing_cycle,
        price_id: checkout.price_id,
        seats: checkout.seats
      });

      const status = subscribeRes?.data?.status || 'pending';
      if (status === 'completed') {
        setSuccess('Subscription activated');
      } else {
        setSuccess('Subscription request created. Awaiting admin confirmation.');
      }
    } catch (e: any) {
      setError(e?.message || 'Failed to start checkout');
    } finally {
      setProcessingPlan(null);
    }
  };

  return (
    <Container>
      <Header>
        <Title>Pricing</Title>
        <Subtitle>Choose your competitive plan</Subtitle>
      </Header>

      <ToggleWrap>
        <Toggle>
          <ToggleButton $active={billingCycle === 'monthly'} onClick={() => setBillingCycle('monthly')}>
            Billed Monthly
          </ToggleButton>
          <ToggleButton $active={billingCycle === 'yearly'} onClick={() => setBillingCycle('yearly')}>
            Billed Yearly
          </ToggleButton>
        </Toggle>
      </ToggleWrap>

      <Grid>
        {PRICING_PLANS.map((plan) => {
          const cycle = getPlanCycle(plan, billingCycle);
          const monthlyEq = equivalentMonthly(plan.yearly.amount);
          const isYearly = billingCycle === 'yearly';
          const teamPerMember = isYearly && plan.planId === 'elite_team' ? equivalentMonthly(plan.yearly.amount / plan.seats) : null;
          const badge = isYearly ? plan.badgeYearly : plan.badgeMonthly;

          return (
            <Card key={plan.planId} $highlight={Boolean(plan.highlight)}>
              <PlanTitle>{plan.title}</PlanTitle>
              {badge ? <Badge>{badge}</Badge> : null}
              <Price key={`${plan.planId}-${billingCycle}`}>${cycle.amount.toFixed(2)}</Price>
              <Meta>
                {isYearly ? helperTextByPlan[plan.planId] : 'Billed monthly'}
              </Meta>
              {plan.planId === 'elite_team' && isYearly && (
                <Meta>Only ${teamPerMember?.toFixed(2)}/member per month on annual billing</Meta>
              )}
              {isYearly && (
                <Meta>Equivalent: ${monthlyEq.toFixed(2)}/mo</Meta>
              )}
              <Features>
                {plan.features.map((feature) => <li key={feature}>{feature}</li>)}
              </Features>
              <Cta
                onClick={() => handleCheckout(plan.planId)}
                disabled={Boolean(processingPlan) || Boolean(billing?.pendingSubscriptionRequest)}
              >
                {processingPlan === plan.planId ? 'Processing...' : plan.cta}
              </Cta>
            </Card>
          );
        })}
      </Grid>

      {billing?.pendingSubscriptionRequest && (
        <Message>Your previous subscription request is pending admin confirmation.</Message>
      )}
      {success && <Message>{success}</Message>}
      {error && <Message $error>{error}</Message>}
    </Container>
  );
};

export default BillingPage;
