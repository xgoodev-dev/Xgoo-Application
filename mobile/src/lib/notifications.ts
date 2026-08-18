import Constants, { ExecutionEnvironment } from 'expo-constants';
import * as Device from 'expo-device';
import { Platform } from 'react-native';

type NotificationsModule = typeof import('expo-notifications');

let notificationsModule: NotificationsModule | null | undefined;
let handlerReady = false;

/** Expo Go on Android cannot use remote push (removed in SDK 53+). */
export function isExpoGoClient() {
  return (
    Constants.appOwnership === 'expo' ||
    Constants.executionEnvironment === ExecutionEnvironment.StoreClient
  );
}

export function canUseRemotePush() {
  return (
    Platform.OS !== 'web' &&
    Device.isDevice &&
    !isExpoGoClient()
  );
}

function getNotifications(): NotificationsModule | null {
  if (notificationsModule !== undefined) return notificationsModule;

  // Android Expo Go: importing expo-notifications runs auto push registration
  // that throws (remote push removed in SDK 53+). Skip the module entirely.
  if (isExpoGoClient() && Platform.OS === 'android') {
    notificationsModule = null;
    return null;
  }

  try {
    // Lazy require so Expo Go / unsupported runtimes can still boot.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    notificationsModule = require('expo-notifications') as NotificationsModule;
  } catch (error) {
    console.warn('expo-notifications unavailable', error);
    notificationsModule = null;
  }
  return notificationsModule;
}

export function ensureNotificationHandler() {
  if (handlerReady) return;
  const Notifications = getNotifications();
  if (!Notifications) return;
  try {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
      }),
    });
    handlerReady = true;
  } catch (error) {
    console.warn('Could not set notification handler', error);
  }
}

export async function getNotificationPermissionStatus() {
  const Notifications = getNotifications();
  if (!Notifications) return null;
  try {
    const result = await Notifications.getPermissionsAsync();
    return result.status;
  } catch {
    return null;
  }
}

export function addNotificationReceivedListener(
  listener: Parameters<NotificationsModule['addNotificationReceivedListener']>[0],
) {
  ensureNotificationHandler();
  const Notifications = getNotifications();
  if (!Notifications) return { remove: () => undefined };
  try {
    return Notifications.addNotificationReceivedListener(listener);
  } catch {
    return { remove: () => undefined };
  }
}

export function addNotificationResponseReceivedListener(
  listener: Parameters<NotificationsModule['addNotificationResponseReceivedListener']>[0],
) {
  ensureNotificationHandler();
  const Notifications = getNotifications();
  if (!Notifications) return { remove: () => undefined };
  try {
    return Notifications.addNotificationResponseReceivedListener(listener);
  } catch {
    return { remove: () => undefined };
  }
}

export async function registerForPushNotifications() {
  if (!canUseRemotePush()) return null;

  const Notifications = getNotifications();
  if (!Notifications) return null;
  ensureNotificationHandler();

  try {
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('booking-updates', {
        name: 'Booking updates',
        description: 'Booking, pickup, and shipment status updates from XGoo',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 150, 250],
        lightColor: '#FF4907',
        sound: 'default',
      });
    }

    const current = await Notifications.getPermissionsAsync();
    const permission =
      current.status === 'granted'
        ? current
        : await Notifications.requestPermissionsAsync();
    if (permission.status !== 'granted') return null;

    const projectId =
      Constants.easConfig?.projectId ||
      (Constants.expoConfig?.extra?.eas?.projectId as string | undefined);
    if (!projectId) {
      console.warn('EAS project ID is missing; skip push token registration');
      return null;
    }

    const result = await Notifications.getExpoPushTokenAsync({ projectId });
    return result.data;
  } catch (error) {
    console.warn('Push notification registration skipped', error);
    return null;
  }
}
