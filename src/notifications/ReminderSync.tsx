import { useEffect, useRef, useState } from 'react';
import { Alert, AppState } from 'react-native';
import { useHabits } from '../context/HabitContext';
import { planReminders } from '../logic/reminders';
import {
  getExactAlarmPrompted,
  setExactAlarmPrompted,
} from '../storage/storage';
import type { Habit, HabitCompletion } from '../storage/types';
import { canScheduleExactAlarms, openExactAlarmSettings } from './exactAlarms';
import {
  configureNotifications,
  hasReminderPermission,
  remindersSupported,
  requestReminderPermission,
  syncReminders,
} from './reminders';

const SYNC_DELAY_MS = 500;

const warn = (err: unknown) => console.warn('Habit reminders failed:', err);

/**
 * Asks once, ever, for the Alarms & reminders access that lets reminders fire
 * on time. The flag is saved before the Alert so it is never shown twice.
 */
async function promptForExactAlarms(): Promise<void> {
  if ((await canScheduleExactAlarms()) || (await getExactAlarmPrompted())) {
    return;
  }
  await setExactAlarmPrompted();
  Alert.alert(
    'Get reminders on time?',
    'Android may deliver reminders up to an hour late unless Compleit is allowed to schedule exact alarms. You can allow it under Alarms & reminders.',
    [
      { text: 'Not now', style: 'cancel' },
      { text: 'Open settings', onPress: () => openExactAlarmSettings() },
    ],
  );
}

/**
 * Keeps scheduled reminders in step with habit data: re-plans after every
 * change and whenever the app returns to the foreground. Renders nothing.
 */
export function ReminderSync() {
  const { habits, completions, isLoading } = useHabits();
  const [resumes, setResumes] = useState(0);
  const queue = useRef<Promise<void>>(Promise.resolve());
  const askedPermission = useRef(false);
  const askedExactAlarms = useRef(false);

  useEffect(() => {
    if (!remindersSupported()) {
      console.info(
        'Habit reminders are off in Expo Go; use run-android or a development build.',
      );
      return;
    }
    configureNotifications().catch(warn);
  }, []);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', state => {
      if (state === 'active') {
        setResumes(n => n + 1);
      }
    });
    return () => subscription.remove();
  }, []);

  useEffect(() => {
    if (isLoading || !remindersSupported()) {
      return;
    }
    const sync = async (snapshot: Habit[], done: HabitCompletion[]) => {
      if (snapshot.length > 0) {
        // Prompt at most once per session; afterwards only re-check.
        const granted = askedPermission.current
          ? await hasReminderPermission()
          : await requestReminderPermission();
        askedPermission.current = true;
        if (!granted) {
          return;
        }
      }
      await syncReminders(planReminders(snapshot, done, new Date()));
      if (snapshot.length > 0 && !askedExactAlarms.current) {
        // Once notifications are allowed; returning from settings re-syncs.
        askedExactAlarms.current = true;
        await promptForExactAlarms().catch(warn);
      }
    };
    const timer = setTimeout(() => {
      // Chain so two syncs never interleave their cancel/schedule calls.
      queue.current = queue.current
        .then(() => sync(habits, completions))
        .catch(warn);
    }, SYNC_DELAY_MS);
    return () => clearTimeout(timer);
  }, [habits, completions, isLoading, resumes]);

  return null;
}
