import ApiService from './api';

export interface SubscriptionPlan {
  name: string;
  price: number;
  duration: number;
  features: string[];
  color: string;
  popular?: boolean;
  description: string;
  paymentAddress: string;
  paymentMethod: string;
  paymentNote: string;
}

export interface Subscription {
  _id: string;
  user: string;
  plan: 'premium' | 'pro';
  status: 'active' | 'cancelled' | 'expired' | 'pending';
  startDate: string;
  endDate: string;
  price: number;
  currency: string;
  paymentMethod: 'card' | 'paypal' | 'crypto' | 'wallet';
  transactionId?: string;
  features: string[];
  autoRenew: boolean;
  cancelledAt?: string;
  cancelReason?: string;
  createdAt: string;
  updatedAt: string;
}

export const subscriptionService = {
  // Get all subscription plans
  async getPlans(): Promise<{ [key: string]: SubscriptionPlan }> {
    // Always return mock data for demo (since backend is not running)
    console.log('Returning mock subscription data with USDT payment info');
    return {
      premium: {
        name: 'Premium',
        price: 9.99,
        duration: 1,
        features: [
          'Priority tournament registration',
          'Advanced statistics',
          'Custom profile themes',
          'Exclusive tournaments',
          'Discord VIP access',
          'Community support'
        ],
        color: '#c0c0c0',
        popular: true,
        description: 'Most popular choice for competitive players',
        paymentAddress: 'TAoLXyWNAZoxYCkYu4iEuk6N6jUhhDyXHU',
        paymentMethod: 'USDT TRC20',
        paymentNote: 'Send exact amount to this USDT TRC20 address. Include your username in transaction memo.'
      },
      pro: {
        name: 'Pro',
        price: 39.99,
        duration: 1,
        features: [
          'All Premium features',
          'Tournament creation',
          'Team management tools',
          'Advanced analytics',
          'Priority support',
          'Custom branding',
          'API access',
          'Dedicated account manager'
        ],
        color: '#a0a0a0',
        description: 'For professional teams and organizers',
        paymentAddress: 'TAoLXyWNAZoxYCkYu4iEuk6N6jUhhDyXHU',
        paymentMethod: 'USDT TRC20',
        paymentNote: 'Send exact amount to this USDT TRC20 address. Include your username in transaction memo.'
      }
    };
  },

  // Get current user's subscription
  async getCurrentSubscription(): Promise<Subscription | null> {
    // Return null for demo (no active subscription)
    console.log('Returning null for current subscription (demo mode)');
    return null;
  },

  // Get subscription history
  async getSubscriptionHistory(page: number = 1, limit: number = 10): Promise<{
    subscriptions: Subscription[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
  }> {
    try {
      const response = await ApiService.request(`/api/subscriptions/history?page=${page}&limit=${limit}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching subscription history:', error);
      return {
        subscriptions: [],
        pagination: { page: 1, limit: 10, total: 0, pages: 0 }
      };
    }
  },

  // Create new subscription
  async createSubscription(plan: string, paymentMethod: string, transactionId?: string): Promise<Subscription> {
    try {
      const response = await ApiService.request('/api/subscriptions', {
        method: 'POST',
        body: JSON.stringify({
          plan,
          paymentMethod,
          transactionId
        })
      });
      return response.data;
    } catch (error) {
      console.error('Error creating subscription:', error);
      throw error;
    }
  },

  // Cancel subscription
  async cancelSubscription(reason?: string): Promise<Subscription> {
    try {
      const response = await ApiService.request('/api/subscriptions/cancel', {
        method: 'POST',
        body: JSON.stringify({ reason })
      });
      return response.data;
    } catch (error) {
      console.error('Error cancelling subscription:', error);
      throw error;
    }
  },

  // Update subscription settings
  async updateSubscriptionSettings(autoRenew: boolean): Promise<Subscription> {
    try {
      const response = await ApiService.request('/api/subscriptions/settings', {
        method: 'PUT',
        body: JSON.stringify({ autoRenew })
      });
      return response.data;
    } catch (error) {
      console.error('Error updating subscription settings:', error);
      throw error;
    }
  },

  // Check if user has active subscription
  async hasActiveSubscription(): Promise<boolean> {
    try {
      const subscription = await this.getCurrentSubscription();
      if (!subscription) return false;
      
      const now = new Date();
      const endDate = new Date(subscription.endDate);
      
      return subscription.status === 'active' && endDate > now;
    } catch (error) {
      console.error('Error checking subscription status:', error);
      return false;
    }
  }
};

export default subscriptionService;