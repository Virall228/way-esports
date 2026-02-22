export type PlanId = 'player_pro' | 'elite_team';
export type BillingCycle = 'monthly' | 'yearly';

type CycleConfig = {
  amount: number;
  priceId: string;
};

type PlanConfig = {
  planId: PlanId;
  seats: number;
  label: string;
  monthly: CycleConfig;
  yearly: CycleConfig;
};

const config: Record<PlanId, PlanConfig> = {
  player_pro: {
    planId: 'player_pro',
    seats: 1,
    label: 'PLAYER PRO',
    monthly: {
      amount: 4.99,
      priceId: process.env.STRIPE_PRICE_PLAYER_MONTHLY || 'price_player_monthly'
    },
    yearly: {
      amount: 49.99,
      priceId: process.env.STRIPE_PRICE_PLAYER_YEARLY || 'price_player_yearly'
    }
  },
  elite_team: {
    planId: 'elite_team',
    seats: 5,
    label: 'ELITE TEAM',
    monthly: {
      amount: 19.99,
      priceId: process.env.STRIPE_PRICE_TEAM_MONTHLY || 'price_team_monthly'
    },
    yearly: {
      amount: 199.99,
      priceId: process.env.STRIPE_PRICE_TEAM_YEARLY || 'price_team_yearly'
    }
  }
};

export const getPlanPricing = (planId: PlanId, billingCycle: BillingCycle) => {
  const plan = config[planId];
  if (!plan) return null;
  const cycle = plan[billingCycle];
  if (!cycle) return null;
  return {
    planId,
    billingCycle,
    seats: plan.seats,
    label: plan.label,
    amount: cycle.amount,
    priceId: cycle.priceId
  };
};

export const pricingConfig = config;

