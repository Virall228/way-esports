import React, { useEffect, useMemo, useState } from 'react';
import styled from 'styled-components';
import { api } from '../../services/api';
import { BillingCycle, PlanId, PRICING_PLANS, equivalentMonthly, getPlanCycle } from '../../config/pricing';

const Container = styled.div`
  min-height: 100vh;
  background: #000000;
  padding: 20px;
  width: 100%;
  max-width: 100%;
`;

const Header = styled.div`
  text-align: center;
  margin-bottom: 28px;
`;

const Title = styled.h1`
  color: #ffffff;
  font-size: clamp(1.6rem, 5vw, 2.5rem);
  margin-bottom: 6px;
  text-transform: uppercase;
  letter-spacing: 1px;
`;

const Subtitle = styled.p`
  color: #9ca3af;
  margin: 0;
`;

const ToggleWrap = styled.div`
  display: flex;
  justify-content: center;
  margin: 12px 0 24px;
`;

const Toggle = styled.div`
  display: inline-flex;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.14);
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
  color: ${({ $active }) => ($active ? '#000' : '#fff')};
  background: ${({ $active }) => ($active ? '#FF6B00' : 'transparent')};
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
  background: #0a0a0a;
  border: 1px solid ${({ $highlight }) => ($highlight ? 'rgba(255,107,0,0.8)' : 'rgba(148,163,184,0.35)')};
  border-radius: 14px;
  padding: 18px;
  color: #fff;
  transition: border-color 220ms ease, box-shadow 220ms ease;
  box-shadow: ${({ $highlight }) => ($highlight ? '0 0 22px rgba(255,107,0,0.2)' : 'none')};
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
  border: 1px solid rgba(255, 107, 0, 0.7);
  color: #ffb280;
  padding: 4px 8px;
`;

const Price = styled.div`
  margin-top: 14px;
  font-size: 2rem;
  font-weight: 700;
  color: #fff;
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
  color: #cbd5e1;
  font-size: 13px;
  margin-top: 4px;
  min-height: 18px;
`;

const Features = styled.ul`
  margin: 14px 0;
  padding-left: 18px;
  color: #e5e7eb;
  display: grid;
  gap: 6px;
`;

const Cta = styled.button`
  width: 100%;
  min-height: 44px;
  border: none;
  border-radius: 10px;
  background: #FF6B00;
  color: #000;
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
  margin-top: 14px;
  color: ${({ $error }) => ($error ? '#f87171' : '#86efac')};
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
