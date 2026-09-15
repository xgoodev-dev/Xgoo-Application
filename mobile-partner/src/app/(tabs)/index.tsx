import { useQuery } from '@tanstack/react-query';
import { JobList } from '@/components/job-list';
import { pickupApi } from '@/lib/api';
import { useAuth } from '@/lib/auth';

export default function JobsScreen() {
  const { token } = useAuth();
  const jobs = useQuery({
    queryKey: ['pickup-jobs', 'new', token],
    enabled: Boolean(token),
    queryFn: () => pickupApi.jobs(token!, 'new'),
    refetchInterval: 15_000,
  });

  return (
    <JobList
      title="New jobs"
      jobs={jobs.data || []}
      refreshing={jobs.isFetching}
      onRefresh={() => void jobs.refetch()}
      empty="No new doorstep assignments. Stay available to receive the next pickup."
    />
  );
}
