import { useState, useEffect } from 'react';
import subscriptionService, { Subscription } from '../services/subscriptionService';

export const useSubscription = () => {
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [hasActiveSubscription, setHasActiveSubscription] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);

  const checkSubscription = async () => {
    try {
      setLoading(true);
      const [currentSub, hasActive] = await Promise.all([
        subscriptionService.getCurrentSubscription(),
        subscriptionService.hasActiveSubscription()
      ]);
      
      setSubscription(currentSub);
      setHasActiveSubscription(hasActive);
    } catch (error) {
      console.error('Error checking subscription:', error);
      setSubscription(null);
      setHasActiveSubscription(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkSubscription();
  }, []);

  const refreshSubscription = () => {
    checkSubscription();
  };

  return {
    subscription,
    hasActiveSubscription,
    loading,
    refreshSubscription
  };
};