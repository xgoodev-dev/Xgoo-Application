'use strict';

function identity(value) {
  return value;
}

function callNow(fn, ...args) {
  return typeof fn === 'function' ? fn(...args) : undefined;
}

export const WorkletsModule = {
  createSerializableImport: identity,
  createSerializableString: identity,
  createSerializableNumber: identity,
  createSerializableBoolean: identity,
  createSerializableBigInt: identity,
  createSerializableUndefined: () => undefined,
  createSerializableNull: () => null,
  createSerializableTurboModuleLike: identity,
  createSerializableObject: identity,
  createSerializableHostObject: identity,
  createSerializableArray: identity,
  createSerializableArrayBuffer: identity,
  createSerializableMap: identity,
  createSerializableSet: identity,
  createSerializableError: identity,
  createSerializableRegExp: identity,
  createSerializableArrayBufferView: identity,
  createSerializableInitializer: identity,
  createSerializableNonWorkletFunction: identity,
  createSerializableWorklet: identity,
  createCustomSerializable: identity,
  registerCustomSerializable() {},
  createShareable: identity,
  scheduleOnRN: (fn, args) => callNow(fn, ...(args || [])),
  scheduleOnUI() {},
  runOnUISync: (worklet) => callNow(worklet),
  createWorkletRuntime: () => ({}),
  scheduleOnRuntime() {},
  scheduleOnRuntimeWithId() {},
  runOnRuntimeSync: (_runtime, worklet) => callNow(worklet),
  runOnRuntimeSyncWithId: (_id, worklet) => callNow(worklet),
  handlePromise() {},
  createSynchronizable: identity,
  synchronizableGetDirty: identity,
  synchronizableGetBlocking: identity,
  synchronizableSetBlocking() {},
  synchronizableLock() {},
  synchronizableUnlock() {},
  reportFatalErrorOnJS() {},
  getStaticFeatureFlag: () => false,
  setDynamicFeatureFlag() {},
  getUIRuntimeHolder: () => ({}),
  getUISchedulerHolder: () => ({}),
  toggleSlowAnimationsOnUIRuntime: () => false,
};
