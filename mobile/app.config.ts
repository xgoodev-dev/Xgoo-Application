import type { ConfigContext, ExpoConfig } from 'expo/config';

export default ({ config }: ConfigContext): ExpoConfig => {
  const apiKey = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY?.trim();

  return {
    ...config,
    android: {
      ...config.android,
      usesCleartextTraffic: true,
      ...(apiKey
        ? {
            config: {
              ...config.android?.config,
              googleMaps: { apiKey },
            },
          }
        : {}),
    },
    ios: {
      ...config.ios,
      ...(apiKey
        ? {
            config: {
              ...config.ios?.config,
              googleMapsApiKey: apiKey,
            },
          }
        : {}),
    },
  } as ExpoConfig;
};

