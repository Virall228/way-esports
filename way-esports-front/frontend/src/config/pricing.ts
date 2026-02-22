export type PlanId = 'player_pro' | 'elite_team';
export type BillingCycle = 'monthly' | 'yearly';

export type PlanUi = {
  planId: PlanId;
  title: string;
  seats: number;
  cta: string;
  badgeMonthly?: string;
  badgeYearly?: string;
  monthly: { amount: number; priceId: string };
  yearly: { amount: number; priceId: string };
  features: string[];
  highlight?: boolean;
};

const PLAYER_MONTHLY_PRICE_ID = (import.meta as any)?.env?.VITE_STRIPE_PRICE_PLAYER_MONTHLY || 'price_player_monthly';
const PLAYER_YEARLY_PRICE_ID = (import.meta as any)?.env?.VITE_STRIPE_PRICE_PLAYER_YEARLY || 'price_player_yearly';
const TEAM_MONTHLY_PRICE_ID = (import.meta as any)?.env?.VITE_STRIPE_PRICE_TEAM_MONTHLY || 'price_team_monthly';
const TEAM_YEARLY_PRICE_ID = (import.meta as any)?.env?.VITE_STRIPE_PRICE_TEAM_YEARLY || 'price_team_yearly';

export const PRICING_PLANS: PlanUi[] = [
  {
    planId: 'player_pro',
    title: 'PLAYER PRO',
    seats: 1,
    cta: 'GET STARTED',
    badgeYearly: 'Save 16%',
    monthly: { amount: 4.99, priceId: PLAYER_MONTHLY_PRICE_ID },
    yearly: { amount: 49.99, priceId: PLAYER_YEARLY_PRICE_ID },
    features: [
      'Priority tournament registration',
      'Full match history & advanced personal stats',
      'AI performance insights (weekly)',
      'Custom profile theme + pro badge',
      'Extended highlight storage',
      'Priority support (24h response)'
    ]
  },
  {
    planId: 'elite_team',
    title: 'ELITE TEAM',
    seats: 5,
    cta: 'UPGRADE TEAM',
    badgeYearly: 'Save $40',
    monthly: { amount: 19.99, priceId: TEAM_MONTHLY_PRICE_ID },
    yearly: { amount: 199.99, priceId: TEAM_YEARLY_PRICE_ID },
    highlight: true,
    features: [
      'Everything in PLAYER PRO for all 5 members',
      'Team dashboard with role balance analytics',
      'Shared team stats: win-rate, map pool, streaks',
      'Team watchlist + scouting recommendations',
      'Private team management tools',
      'Priority dispute handling & admin queue'
    ]
  }
];

export const getPlanCycle = (plan: PlanUi, billingCycle: BillingCycle) =>
  billingCycle === 'yearly' ? plan.yearly : plan.monthly;

export const equivalentMonthly = (annualAmount: number) => Number((annualAmount / 12).toFixed(2));
