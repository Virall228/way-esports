import { useState, useEffect } from 'react';
import { api } from '../services/api';

interface AccessStatus {
  canJoin: boolean;
  isSubscribed: boolean;
  freeEntriesCount: number;
  subscriptionExpiresAt?: string;
  requiresSubscription: boolean;
  redirectTo?: string;
}

export const useTournamentAccess = () => {
  const [accessStatus, setAccessStatus] = useState<AccessStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const checkAccess = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await api.get('/api/referrals/stats');
      const stats = response.data;

      const canJoin = stats.isSubscribed || stats.freeEntriesCount > 0;
      const isExpired = stats.subscriptionExpiresAt && 
        new Date(stats.subscriptionExpiresAt) < new Date();

      setAccessStatus({
        canJoin,
        isSubscribed: stats.isSubscribed && !isExpired,
        freeEntriesCount: stats.freeEntriesCount,
        subscriptionExpiresAt: stats.subscriptionExpiresAt,
        requiresSubscription: !canJoin,
        redirectTo: !canJoin ? '/billing' : undefined
      });
    } catch (err: any) {
      console.error('Failed to check tournament access:', err);
      setError(err?.message || 'Failed to check access status');
    } finally {
      setLoading(false);
    }
  };

  const joinTournament = async (tournamentId: string, teamId?: string) => {
    try {
      setError(null);
      
      const response = await api.post(`/api/tournaments/${tournamentId}/register`, {
        teamId
      });

      return response.data;
    } catch (err: any) {
      console.error('Failed to join tournament:', err);
      
      // Handle specific access errors
      if (err.response?.status === 402) {
        const errorData = err.response.data;
        if (errorData.redirectTo) {
          // Redirect to billing page
          window.location.href = errorData.redirectTo;
        }
        throw new Error(errorData.error || 'Subscription required');
      }
      
      throw new Error(err?.message || 'Failed to join tournament');
    }
  };

  useEffect(() => {
    checkAccess();
  }, []);

  return {
    accessStatus,
    loading,
    error,
    checkAccess,
    joinTournament
  };
};
