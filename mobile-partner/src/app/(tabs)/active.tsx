import { useQuery } from '@tanstack/react-query';
import { JobList } from '@/components/job-list';
import { pickupApi } from '@/lib/api';
import { useAuth } from '@/lib/auth';

export default function ActiveScreen() {
  const { token } = useAuth();
  const jobs = useQuery({
    queryKey: ['pickup-jobs', 'active', token],
    enabled: Boolean(token),
    queryFn: () => pickupApi.jobs(token!, 'active'),
    refetchInterval: 15_000,
  });

  return (
    <JobList
      title="Active pickups"
      jobs={jobs.data || []}
      refreshing={jobs.isFetching}
      onRefresh={() => void jobs.refetch()}
      empty="No active pickups. Accept a new job to start collecting."
    />
  );
}
