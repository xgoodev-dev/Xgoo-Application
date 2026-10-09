import { useQuery } from '@tanstack/react-query';
import { proApi, proAccessState } from '@/lib/api';
import { useAuth } from '@/lib/auth';

export function useProProfile() {
  const { token } = useAuth();
  const query = useQuery({
    queryKey: ['pro-profile', token],
    enabled: Boolean(token),
    queryFn: () => proApi.profile(token!),
  });
  const coverage = useQuery({
    queryKey: ['pro-coverage', token],
    enabled: Boolean(token),
    queryFn: () => proApi.coverage(token!),
  });
  const access = proAccessState(query.data);
  return {
    token: token!,
    profile: query.data,
    access,
    coverage: coverage.data,
    coverageLocked: Boolean(coverage.data?.configured && coverage.data.served === false),
    loading: query.isLoading,
    refresh: query.refetch,
  };
}
