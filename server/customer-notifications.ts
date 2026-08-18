import { storage } from "./storage";

type NotificationData = Record<string, string | number | boolean | null>;

export async function notifyCustomer(
  customerUserId: string,
  title: string,
  body: string,
  type: string,
  data: NotificationData = {},
) {
  const notification = await storage.createCustomerNotification({
    customerUserId,
    title,
    body,
    type,
    data,
    readAt: null,
  });

  const tokens = await storage.getCustomerPushTokens(customerUserId);
  const messages = tokens
    .filter(({ token }) => /^ExponentPushToken\[.+\]$|^ExpoPushToken\[.+\]$/.test(token))
    .map(({ token }) => ({
      to: token,
      sound: "default",
      title,
      body,
      data: { ...data, notificationId: notification.id, type },
      priority: "high",
      channelId: "booking-updates",
    }));

  if (messages.length) {
    const response = await fetch("https://exp.host/--/api/v2/push/send", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(messages),
    });
    if (!response.ok) {
      console.error("[Customer push] Expo rejected notification batch", response.status);
    }
  }

  return notification;
}

export function triggerCustomerNotification(
  customerUserId: string | null | undefined,
  title: string,
  body: string,
  type: string,
  data: NotificationData = {},
) {
  if (!customerUserId) return;
  void notifyCustomer(customerUserId, title, body, type, data).catch((error) => {
    console.error("[Customer notification] Failed", error);
  });
}

