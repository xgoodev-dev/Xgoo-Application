'use strict';

import { createJSReanimatedModule } from 'react-native-reanimated/src/ReanimatedModule/js-reanimated';

export function createNativeReanimatedModule() {
  return createJSReanimatedModule();
}

export const ReanimatedModule = createJSReanimatedModule();
