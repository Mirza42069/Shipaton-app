import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

const CHANNEL_ID = "document-expiry";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

export async function configureNotifications() {
  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
      name: "Document expiry",
      importance: Notifications.AndroidImportance.DEFAULT,
      vibrationPattern: [0, 180, 120, 180],
      lightColor: "#214D3A",
    });
  }
}

export async function scheduleExpiryReminder(_title: string, expiresAt: string | null) {
  if (!expiresAt) return null;

  const permissions = await Notifications.requestPermissionsAsync();
  if (!permissions.granted) return null;

  const expiry = new Date(`${expiresAt}T09:00:00`);
  const reminder = new Date(expiry);
  reminder.setDate(reminder.getDate() - 30);

  if (reminder.getTime() <= Date.now()) {
    reminder.setTime(Date.now() + 60 * 1000);
  }

  return Notifications.scheduleNotificationAsync({
    content: {
      title: "Document needs attention",
      body: "One saved document expires soon. Open Berkas to check it.",
      data: { type: "document-expiry" },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: reminder,
      channelId: CHANNEL_ID,
    },
  });
}

export async function cancelExpiryReminder(notificationId: string | null) {
  if (notificationId) await Notifications.cancelScheduledNotificationAsync(notificationId);
}
