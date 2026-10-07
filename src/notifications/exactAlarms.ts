import { isRunningInExpoGo } from 'expo';
import { NativeModules, Platform } from 'react-native';

interface ExactAlarmNativeModule {
  canScheduleExactAlarms(): Promise<boolean>;
  openSettings(): Promise<boolean>;
}

/** The app's own ExactAlarm module, or null where it is not built in (Expo Go, iOS). */
function nativeModule(): ExactAlarmNativeModule | null {
  if (Platform.OS !== 'android' || isRunningInExpoGo()) {
    return null;
  }
  return (
    (NativeModules.ExactAlarm as ExactAlarmNativeModule | undefined) ?? null
  );
}

/**
 * Whether reminders can be scheduled as exact alarms. True wherever there is
 * nothing to ask for (no native module, Android < 12) and, so the user is not
 * nagged, when the check itself fails.
 */
export async function canScheduleExactAlarms(): Promise<boolean> {
  const native = nativeModule();
  if (!native) {
    return true;
  }
  try {
    return await native.canScheduleExactAlarms();
  } catch (err) {
    console.warn('Exact alarm check failed:', err);
    return true;
  }
}

/** Opens this app's "Alarms & reminders" settings page, where available. */
export async function openExactAlarmSettings(): Promise<void> {
  const native = nativeModule();
  if (!native) {
    return;
  }
  try {
    await native.openSettings();
  } catch (err) {
    console.warn('Opening exact alarm settings failed:', err);
  }
}
