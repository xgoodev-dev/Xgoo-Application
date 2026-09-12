const path = require('path');
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Expo Go SDK 57 SIGSEGVs in libworklets.so. Standalone APKs ship matching
// native worklets, so only stub that module for local Expo Go bundles.
if (process.env.EAS_BUILD !== 'true') {
  const nativeWorkletsStub = path.resolve(__dirname, 'stubs/NativeWorklets.native.js');
  const baseResolveRequest = config.resolver.resolveRequest;
  config.resolver.resolveRequest = (context, moduleName, platform) => {
    const resolved = baseResolveRequest
      ? baseResolveRequest(context, moduleName, platform)
      : context.resolveRequest(context, moduleName, platform);

    if (
      resolved?.type === 'sourceFile' &&
      /[/\\]NativeWorklets\.native\.(js|ts)$/.test(resolved.filePath)
    ) {
      return { type: 'sourceFile', filePath: nativeWorkletsStub };
    }

    return resolved;
  };
}

module.exports = config;
