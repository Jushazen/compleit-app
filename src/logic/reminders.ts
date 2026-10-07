import type { Habit, HabitCompletion } from '../storage/types';
import { addDays, localDateToString, parseDateString } from './dateUtils';
import { isScheduledOn } from './schedule';
import { formatClockTime, minutesSinceMidnight } from './time';

/** Android caps pending alarms per app (~500); stay well below it. */
export const MAX_REMINDERS = 50;

export interface Reminder {
  /** "habitId|YYYY-MM-DD", unique per habit and day. */
  id: string;
  habitId: string;
  title: string;
  body: string;
  fireAt: Date;
}

/** Local Date for `dateStr` at the "HH:mm" time `hhmm`; null if `hhmm` is invalid. */
function localDateTime(dateStr: string, hhmm: string): Date | null {
  const minutes = minutesSinceMidnight(hhmm);
  if (Number.isNaN(minutes)) {
    return null;
  }
  const { year, month, day } = parseDateString(dateStr);
  return new Date(year, month - 1, day, Math.floor(minutes / 60), minutes % 60);
}

function reminderBody(habit: Habit): string {
  const { target, schedule } = habit;
  return [
    'Time to start',
    target && `${target.amount} ${target.unit}`,
    `until ${formatClockTime(schedule.endTime)}`,
  ]
    .filter(Boolean)
    .join(' · ');
}

/**
 * Start-time reminders for every habit due from today through the next
 * `horizonDays - 1` days, skipping times already past and days already done.
 * Sorted by fire time and capped at MAX_REMINDERS (earliest kept).
 */
export function planReminders(
  habits: Habit[],
  completions: HabitCompletion[],
  now: Date,
  horizonDays = 7,
): Reminder[] {
  const done = new Set(completions.map(c => `${c.habitId}|${c.date}`));
  const today = localDateToString(now);
  const reminders: Reminder[] = [];
  for (let offset = 0; offset < horizonDays; offset++) {
    const date = addDays(today, offset);
    for (const habit of habits) {
      const id = `${habit.id}|${date}`;
      if (done.has(id) || !isScheduledOn(habit, date)) {
        continue;
      }
      const fireAt = localDateTime(date, habit.schedule.startTime);
      if (fireAt && fireAt > now) {
        reminders.push({
          id,
          habitId: habit.id,
          title: habit.title,
          body: reminderBody(habit),
          fireAt,
        });
      }
    }
  }
  return reminders
    .sort(
      (a, b) =>
        a.fireAt.getTime() - b.fireAt.getTime() || (a.id < b.id ? -1 : 1),
    )
    .slice(0, MAX_REMINDERS);
}
