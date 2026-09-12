import { router } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Bell, CheckCheck, PackageCheck } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { Alert, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { AppButton, Card, EmptyState, Screen } from '@/components/ui';
import { customerApi, type CustomerNotification } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import {
  addNotificationReceivedListener,
  canUseRemotePush,
  getNotificationPermissionStatus,
  isExpoGoClient,
  registerForPushNotifications,
} from '@/lib/notifications';
import { useAppTheme } from '@/lib/theme';

export default function NotificationsScreen() {
  const { token } = useAuth();
  const { colors } = useAppTheme();
  const queryClient = useQueryClient();
  const [permission, setPermission] = useState<string | null>(null);
  const queryKey = ['customer-notifications', token];
  const notifications = useQuery({
    queryKey,
    queryFn: () => customerApi.notifications(token!),
    enabled: !!token,
    refetchInterval: 15_000,
  });
  const markRead = useMutation({
    mutationFn: (id?: string) => customerApi.markNotificationsRead(token!, id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey }),
  });

  useEffect(() => {
    void getNotificationPermissionStatus().then((status) => setPermission(status));
    const subscription = addNotificationReceivedListener(() => {
      void queryClient.invalidateQueries({
        queryKey: ['customer-notifications', token],
      });
    });
    return () => subscription.remove();
  }, [queryClient, token]);

  const enablePush = async () => {
    try {
      if (!canUseRemotePush()) {
        Alert.alert(
          isExpoGoClient() ? 'Development build required' : 'Notifications unavailable',
          isExpoGoClient()
            ? 'Android push alerts need an EAS development/preview build. In-app notifications still work here.'
            : 'Push notifications need a physical device with a development or preview build.',
        );
        return;
      }
      const pushToken = await registerForPushNotifications();
      setPermission(await getNotificationPermissionStatus());
      if (!pushToken) {
        Alert.alert(
          'Notifications are disabled',
          'Enable notifications for XGoo Go in your phone settings.',
        );
        return;
      }
      const platform = Platform.OS === 'ios' ? 'ios' : 'android';
      await customerApi.registerPushToken(token!, {
        token: pushToken,
        platform,
      });
      Alert.alert('Notifications enabled', 'Booking updates will appear on this device.');
    } catch (error) {
      Alert.alert('Could not enable notifications', error instanceof Error ? error.message : 'Try again.');
    }
  };

  const openNotification = (notification: CustomerNotification) => {
    if (!notification.readAt) markRead.mutate(notification.id);
    const shipmentId = notification.data?.shipmentId;
    if (typeof shipmentId === 'string' && shipmentId) {
      router.push(`/shipment/${shipmentId}`);
      return;
    }
    router.push('/(tabs)/shipments');
  };

  const items = notifications.data || [];
  const unread = items.filter((item) => !item.readAt).length;

  return (
    <Screen
      refreshControl={undefined}
    >
      <View style={styles.header}>
        <Pressable
          onPress={() =>
            router.canGoBack() ? router.back() : router.replace('/(tabs)')
          }
          style={styles.back}
        >
          <ArrowLeft size={21} color={colors.text} />
        </Pressable>
        <View style={styles.headerCopy}>
          <Text style={[styles.title, { color: colors.text }]}>Notifications</Text>
          <Text style={[styles.subtitle, { color: colors.textMuted }]}>
            {unread ? `${unread} unread update${unread === 1 ? '' : 's'}` : 'You are all caught up'}
          </Text>
        </View>
        {unread ? (
          <Pressable
            onPress={() => markRead.mutate(undefined)}
            style={[styles.markAll, { backgroundColor: colors.surfaceMuted }]}
          >
            <CheckCheck size={18} color={colors.accent} />
          </Pressable>
        ) : null}
      </View>

      {permission && permission !== 'granted' && canUseRemotePush() ? (
        <Card style={[styles.permission, { backgroundColor: colors.accentSoft }]}>
          <View style={styles.flex}>
            <Text style={[styles.itemTitle, { color: colors.text }]}>Enable device notifications</Text>
            <Text style={[styles.body, { color: colors.textMuted }]}>
              Receive booking and shipment updates in your phone’s notification panel.
            </Text>
          </View>
          <AppButton title="Enable" onPress={() => void enablePush()} />
        </Card>
      ) : null}

      {isExpoGoClient() ? (
        <Card style={[styles.permission, { backgroundColor: colors.surfaceMuted }]}>
          <View style={styles.flex}>
            <Text style={[styles.itemTitle, { color: colors.text }]}>In-app updates only</Text>
            <Text style={[styles.body, { color: colors.textMuted }]}>
              Expo Go cannot show Android push alerts. Install the preview APK for notification-panel alerts.
            </Text>
          </View>
        </Card>
      ) : null}

      {notifications.isLoading ? (
        <Text style={[styles.loading, { color: colors.textMuted }]}>Loading updates…</Text>
      ) : items.length ? (
        <View style={styles.list}>
          {items.map((item) => (
            <Card
              key={item.id}
              onPress={() => openNotification(item)}
              style={[
                styles.notification,
                !item.readAt && {
                  borderColor: colors.accent,
                  backgroundColor: colors.accentSoft,
                },
              ]}
            >
              <View style={[styles.icon, { backgroundColor: colors.surfaceMuted }]}>
                <PackageCheck size={20} color={colors.accent} />
              </View>
              <View style={styles.flex}>
                <View style={styles.titleRow}>
                  <Text style={[styles.itemTitle, { color: colors.text }]}>{item.title}</Text>
                  {!item.readAt ? <View style={[styles.dot, { backgroundColor: colors.accent }]} /> : null}
                </View>
                <Text style={[styles.body, { color: colors.textMuted }]}>{item.body}</Text>
                <Text style={[styles.time, { color: colors.textMuted }]}>
                  {new Date(item.createdAt).toLocaleString()}
                </Text>
              </View>
            </Card>
          ))}
        </View>
      ) : (
        <EmptyState
          icon={Bell}
          title="No notifications yet"
          description="Booking confirmations and shipment updates will appear here."
          action={
            <AppButton
              title="View shipments"
              variant="secondary"
              onPress={() => router.push('/(tabs)/shipments')}
            />
          }
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 20 },
  back: { width: 42, height: 42, alignItems: 'center', justifyContent: 'center' },
  headerCopy: { flex: 1 },
  title: { fontSize: 23, fontWeight: '800' },
  subtitle: { fontSize: 12, marginTop: 2 },
  markAll: { width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  loading: { textAlign: 'center', paddingVertical: 40 },
  permission: { gap: 12, marginBottom: 16, elevation: 0, shadowOpacity: 0 },
  list: { gap: 10 },
  notification: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, padding: 13 },
  icon: { width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  flex: { flex: 1 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  itemTitle: { flex: 1, fontSize: 14, fontWeight: '800' },
  dot: { width: 7, height: 7, borderRadius: 4 },
  body: { fontSize: 11, lineHeight: 17, marginTop: 3 },
  time: { fontSize: 9, marginTop: 7 },
});

