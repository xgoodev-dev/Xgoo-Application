import type { ConfigContext, ExpoConfig } from 'expo/config';

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  android: {
    ...config.android,
    usesCleartextTraffic: true,
  },
});
