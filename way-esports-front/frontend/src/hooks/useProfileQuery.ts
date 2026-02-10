import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../contexts/AuthContext';

export const PROFILE_QUERY_KEY = ['profile', 'me'];

export const useProfileQuery = () => {
  const { fetchProfile, user } = useAuth();

  return useQuery({
    queryKey: PROFILE_QUERY_KEY,
    queryFn: async () => fetchProfile(),
    initialData: user ?? undefined,
    staleTime: 30000,
    refetchOnWindowFocus: false
  });
};
