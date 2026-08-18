import { Alert, Linking } from 'react-native';

/** Customer-facing support contacts for the XGoo mobile app. */
export const XGOO_SUPPORT = {
  phoneDisplay: '+91 93471 38235',
  phoneTel: 'tel:+919347138235',
  hours: 'Mon–Sat, 9 AM–7 PM IST',
  whatsappUrl: 'https://wa.me/15559529213',
  email: 'connect@xgoo.in',
  website: 'https://www.xgoo.in',
} as const;

export async function callXgooSupport(purpose: 'book' | 'support' = 'support') {
  try {
    const canOpen = await Linking.canOpenURL(XGOO_SUPPORT.phoneTel);
    if (!canOpen) {
      Alert.alert(
        'Calling unavailable',
        `Please dial ${XGOO_SUPPORT.phoneDisplay} from your phone.`,
      );
      return;
    }
    await Linking.openURL(XGOO_SUPPORT.phoneTel);
  } catch {
    Alert.alert(
      purpose === 'book' ? 'Unable to start call' : 'Unable to call support',
      `Please dial ${XGOO_SUPPORT.phoneDisplay} to reach XGoo.`,
    );
  }
}
