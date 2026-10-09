const path = require('path');
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Expo Go SDK 57 SIGSEGVs in libworklets.so if Worklets or Reanimated
// initialize native TurboModules. EAS/dev-client builds keep the real modules.
if (process.env.EAS_BUILD !== 'true') {
  const workletsStub = path.resolve(__dirname, 'stubs/react-native-worklets.js');
  const reanimatedJsStub = path.resolve(__dirname, 'stubs/reanimated-js-module.js');
  const emptyStub = path.resolve(__dirname, 'stubs/empty-module.js');
  const logged = new Set();
  const baseResolveRequest = config.resolver.resolveRequest;

  const logStub = (label) => {
    if (logged.has(label)) return;
    logged.add(label);
    console.log(`[expo-go stub] ${label}`);
  };

  const toPosix = (filePath) => filePath.replace(/\\/g, '/');

  config.resolver.resolveRequest = (context, moduleName, platform) => {
    if (
      moduleName === 'react-native-worklets' ||
      moduleName.startsWith('react-native-worklets/')
    ) {
      logStub('react-native-worklets');
      return { type: 'sourceFile', filePath: workletsStub };
    }

    if (
      moduleName === 'expo-notifications' ||
      moduleName.startsWith('expo-notifications/')
    ) {
      logStub('expo-notifications');
      return { type: 'sourceFile', filePath: emptyStub };
    }

    const resolved = baseResolveRequest
      ? baseResolveRequest(context, moduleName, platform)
      : context.resolveRequest(context, moduleName, platform);

    if (resolved?.type !== 'sourceFile' || !resolved.filePath) {
      return resolved;
    }

    const filePath = toPosix(resolved.filePath);

    if (filePath.includes('/react-native-worklets/')) {
      logStub('react-native-worklets');
      return { type: 'sourceFile', filePath: workletsStub };
    }

    if (filePath.includes('/expo-notifications/')) {
      logStub('expo-notifications');
      return { type: 'sourceFile', filePath: emptyStub };
    }

    if (filePath.includes('/react-native-reanimated/')) {
      if (
        /\/ReanimatedModule\/(NativeReanimated|reanimatedModuleInstance)\.(ts|js)$/.test(
          filePath,
        )
      ) {
        logStub('reanimated JS backend');
        return { type: 'sourceFile', filePath: reanimatedJsStub };
      }

      if (/\/specs\/NativeReanimatedModule\.(ts|js)$/.test(filePath)) {
        logStub('reanimated native specs');
        return { type: 'sourceFile', filePath: emptyStub };
      }
    }

    return resolved;
  };
}

module.exports = config;
