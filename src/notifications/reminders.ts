import { isRunningInExpoGo } from 'expo';
import type * as NotificationsModule from 'expo-notifications';
import { MAX_REMINDERS, type Reminder } from '../logic/reminders';

const CHANNEL_ID = 'habit-reminders';

let loaded: typeof NotificationsModule | null | undefined;

/**
 * expo-notifications, or null in Expo Go. Since SDK 53 merely importing it in
 * Expo Go on Android throws (its push-token auto-registration runs on load), so
 * it is required lazily and only outside Expo Go. Reminders then work in
 * run-android, development and release builds, and are skipped in Expo Go.
 */
function notifications(): typeof NotificationsModule | null {
  if (loaded === undefined) {
    loaded = isRunningInExpoGo()
      ? null
      : (require('expo-notifications') as typeof NotificationsModule);
  }
  return loaded;
}

/** Whether reminders can be scheduled in this runtime (false in Expo Go). */
export function remindersSupported(): boolean {
  return notifications() !== null;
}

let configured: Promise<void> | null = null;

async function configure(): Promise<void> {
  const Notifications = notifications();
  if (!Notifications) {
    return;
  }
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
  await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
    name: 'Habit reminders',
    importance: Notifications.AndroidImportance.HIGH,
  });
}

/**
 * Sets the foreground handler and creates the Android channel, once (retried
 * after a failure). The channel must exist before Android 13 can prompt.
 */
export function configureNotifications(): Promise<void> {
  configured ??= configure().catch(err => {
    configured = null;
    throw err;
  });
  return configured;
}

/** Whether notifications may be shown, without prompting. */
export async function hasReminderPermission(): Promise<boolean> {
  const Notifications = notifications();
  if (!Notifications) {
    return false;
  }
  const { granted } = await Notifications.getPermissionsAsync();
  return granted;
}

/** Prompts for notification permission unless granted or permanently denied. */
export async function requestReminderPermission(): Promise<boolean> {
  const Notifications = notifications();
  if (!Notifications) {
    return false;
  }
  await configureNotifications();
  const current = await Notifications.getPermissionsAsync();
  if (current.granted || !current.canAskAgain) {
    return current.granted;
  }
  const { granted } = await Notifications.requestPermissionsAsync();
  return granted;
}

/**
 * Replaces every scheduled notification with one-off reminders, at most
 * MAX_REMINDERS of them to stay clear of Android's pending-alarm cap.
 */
export async function syncReminders(reminders: Reminder[]): Promise<void> {
  const Notifications = notifications();
  if (!Notifications) {
    return;
  }
  await configureNotifications();
  await Notifications.cancelAllScheduledNotificationsAsync();
  for (const reminder of reminders.slice(0, MAX_REMINDERS)) {
    await Notifications.scheduleNotificationAsync({
      identifier: reminder.id,
      content: {
        title: reminder.title,
        body: reminder.body,
        data: { habitId: reminder.habitId },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: reminder.fireAt,
        channelId: CHANNEL_ID,
      },
    });
  }
}
