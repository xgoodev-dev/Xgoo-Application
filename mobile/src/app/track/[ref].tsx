import { Redirect, useLocalSearchParams } from 'expo-router';
import { trackTabHref } from '@/lib/track-links';

export default function WebsiteTrackDeepLink() {
  const { ref } = useLocalSearchParams<{ ref?: string }>();
  return <Redirect href={trackTabHref(ref)} />;
}
