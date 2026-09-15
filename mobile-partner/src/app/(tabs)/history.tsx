import { useQuery } from '@tanstack/react-query';
import { JobList } from '@/components/job-list';
import { pickupApi } from '@/lib/api';
import { useAuth } from '@/lib/auth';

export default function HistoryScreen() {
  const { token } = useAuth();
  const jobs = useQuery({
    queryKey: ['pickup-jobs', 'history', token],
    enabled: Boolean(token),
    queryFn: () => pickupApi.jobs(token!, 'history'),
  });

  return (
    <JobList
      title="History"
      jobs={jobs.data || []}
      refreshing={jobs.isFetching}
      onRefresh={() => void jobs.refetch()}
      empty="Completed and declined pickups will appear here."
    />
  );
}
