'use strict';

/**
 * JS-only stand-in for react-native-worklets.
 * Expo Go SDK 57 SIGSEGVs in libworklets.so if the real package initializes
 * the native module. EAS / dev-client builds must keep using the real package.
 */

const RuntimeKind = {
  ReactNative: 1,
  UI: 2,
  Worker: 3,
};

const NOOP = () => {};
const NOOP_FACTORY = () => NOOP;
const ID = (value) => value;
const callNow = (fn, ...args) =>
  typeof fn === 'function' ? fn(...args) : undefined;

console.log('[xgoo] Expo Go worklets stub loaded');

if (globalThis._WORKLET === undefined) {
  globalThis._WORKLET = false;
}
if (globalThis.__RUNTIME_KIND === undefined) {
  globalThis.__RUNTIME_KIND = RuntimeKind.ReactNative;
}
globalThis._WORKLETS_BUNDLE_MODE_ENABLED = false;
globalThis._log = console.log;
globalThis._getAnimationTimestamp = () =>
  typeof performance !== 'undefined' ? performance.now() : Date.now();

function isWorkletFunction(value) {
  return typeof value === 'function' && !!value.__workletHash;
}

const WorkletsModule = {
  getUIRuntimeHolder() {
    throw new Error('Worklets native runtime is disabled in Expo Go');
  },
  getUISchedulerHolder() {
    throw new Error('Worklets native runtime is disabled in Expo Go');
  },
  toggleSlowAnimationsOnUIRuntime: () => false,
  getStaticFeatureFlag: () => false,
  setDynamicFeatureFlag: NOOP,
};

const api = {
  RuntimeKind,
  WorkletsModule,
  isBundleModeEnabled: () => false,
  toggleSlowAnimationsOnUIRuntime: () => false,
  callMicrotasks: NOOP,
  isShareableRef: () => false,
  makeShareable: ID,
  makeShareableCloneOnUIRecursive: ID,
  makeShareableCloneRecursive: ID,
  shareableMappingCache: new Map(),
  getDynamicFeatureFlag: () => false,
  getStaticFeatureFlag: () => false,
  setDynamicFeatureFlag: NOOP,
  isShareable: () => false,
  isSynchronizable: () => false,
  createSerializable: ID,
  isSerializableRef: () => false,
  registerCustomSerializable: NOOP,
  serializableMappingCache: new Map(),
  createShareable: ID,
  createSynchronizable: ID,
  getRuntimeKind: () => globalThis.__RUNTIME_KIND ?? RuntimeKind.ReactNative,
  isRNRuntime: () =>
    (globalThis.__RUNTIME_KIND ?? RuntimeKind.ReactNative) ===
    RuntimeKind.ReactNative,
  isUIRuntime: () => globalThis.__RUNTIME_KIND === RuntimeKind.UI,
  isWorkerRuntime: () => globalThis.__RUNTIME_KIND === RuntimeKind.Worker,
  isWorkletRuntime: () =>
    (globalThis.__RUNTIME_KIND ?? RuntimeKind.ReactNative) !==
    RuntimeKind.ReactNative,
  createWorkletRuntime: NOOP_FACTORY,
  getUIRuntimeHolder() {
    throw new Error('Worklets native runtime is disabled in Expo Go');
  },
  getUISchedulerHolder() {
    throw new Error('Worklets native runtime is disabled in Expo Go');
  },
  UIRuntimeId: RuntimeKind.UI,
  runOnRuntime: ID,
  runOnRuntimeAsync: (worklet, ...args) =>
    Promise.resolve(callNow(worklet, ...args)),
  runOnRuntimeAsyncWithId: (_id, worklet, ...args) =>
    Promise.resolve(callNow(worklet, ...args)),
  runOnRuntimeSync: (_runtime, worklet, ...args) => callNow(worklet, ...args),
  runOnRuntimeSyncWithId: (_id, worklet, ...args) => callNow(worklet, ...args),
  scheduleOnRuntime: (worklet, ...args) => {
    callNow(worklet, ...args);
  },
  scheduleOnRuntimeWithId: (_id, worklet, ...args) => {
    callNow(worklet, ...args);
  },
  executeOnUIRuntimeSync: (worklet, ...args) => callNow(worklet, ...args),
  runOnJS: (fn) => {
    return (...args) => {
      queueMicrotask(() => callNow(fn, ...args));
    };
  },
  runOnUI: (worklet) => {
    return (...args) => {
      queueMicrotask(() => callNow(worklet, ...args));
    };
  },
  runOnUIAsync: (worklet, ...args) =>
    Promise.resolve(callNow(worklet, ...args)),
  runOnUISync: (worklet, ...args) => callNow(worklet, ...args),
  scheduleOnRN: (fn, ...args) => {
    queueMicrotask(() => callNow(fn, ...args));
  },
  scheduleOnUI: (worklet, ...args) => {
    queueMicrotask(() => callNow(worklet, ...args));
  },
  isWorkletFunction,
};

module.exports = {
  __esModule: true,
  default: api,
  ...api,
};
