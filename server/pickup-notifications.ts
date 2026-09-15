import { storage } from "./storage";

type NotificationData = Record<string, string | number | boolean | null>;

export async function notifyPickupPartner(
  partnerId: string,
  title: string,
  body: string,
  data: NotificationData = {},
) {
  const tokens = await storage.getPickupPartnerPushTokens(partnerId);
  const messages = tokens
    .filter(({ token }) => /^ExponentPushToken\[.+\]$|^ExpoPushToken\[.+\]$/.test(token))
    .map(({ token }) => ({
      to: token,
      sound: "default",
      title,
      body,
      data,
      priority: "high",
      channelId: "pickup-jobs",
    }));

  if (!messages.length) return;
  const response = await fetch("https://exp.host/--/api/v2/push/send", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(messages),
  });
  if (!response.ok) {
    console.error("[Pickup push] Expo rejected notification batch", response.status);
  }
}

export function triggerPickupPartnerNotification(
  partnerId: string | null | undefined,
  title: string,
  body: string,
  data: NotificationData = {},
) {
  if (!partnerId) return;
  void notifyPickupPartner(partnerId, title, body, data).catch((error) => {
    console.error("[Pickup notification] Failed", error);
  });
}
