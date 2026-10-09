import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'xgoo-pro-onboarding-seen';

export async function hasSeenOnboarding() {
  try {
    return (await AsyncStorage.getItem(STORAGE_KEY)) === '1';
  } catch {
    return false;
  }
}

export async function markOnboardingSeen() {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, '1');
  } catch (error) {
    console.warn('Could not save onboarding state', error);
  }
}
