import { useState, useEffect } from 'react';
import { api, ApiError } from '../services/api';

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

      const response: any = await api.get('/api/referrals/stats');
      const stats = response?.data ?? response ?? {};

      const canJoin = Boolean(stats.isSubscribed) || Number(stats.freeEntriesCount || 0) > 0 || Number(stats.bonusEntries || 0) > 0;
      const isExpired = stats.subscriptionExpiresAt && 
        new Date(stats.subscriptionExpiresAt) < new Date();

      setAccessStatus({
        canJoin,
        isSubscribed: stats.isSubscribed && !isExpired,
        freeEntriesCount: Number(stats.freeEntriesCount || 0),
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
      
      if (err instanceof ApiError) {
        if (err.status === 402) {
          const payload = err.payload || {};
          const redirectTo = payload.redirectTo || '/billing';
          if (redirectTo) {
            window.location.href = redirectTo;
          }
          throw new Error(payload.error || payload.message || 'Subscription required');
        }
        throw new Error(err.message || 'Failed to join tournament');
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
