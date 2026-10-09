'use strict';

import { Platform } from 'react-native';

function isWindowAvailable() {
  return typeof window !== 'undefined';
}

export const IS_ANDROID = Platform.OS === 'android';
export const IS_IOS = Platform.OS === 'ios';
export const IS_WEB = Platform.OS === 'web';
export const IS_JEST =
  typeof globalThis.jest !== 'undefined' || process.env.NODE_ENV === 'test';
export const IS_WINDOWS = Platform.OS === 'windows';
export const IS_WINDOW_AVAILABLE = isWindowAvailable();

// Use Reanimated's JS backend in Expo Go. Native installTurboModule()
// SIGSEGVs in Expo Go SDK 57's bundled libworklets.so.
export const SHOULD_BE_USE_WEB = true;
