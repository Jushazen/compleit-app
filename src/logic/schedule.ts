import { Habit } from '../storage/types';
import { compareDateStrings, dayOfWeek, localDateToString } from './dateUtils';
import { minutesSinceMidnight } from './time';

/** The local calendar date the habit was created on; nothing is due before it. */
export function habitStartDate(habit: Habit): string {
  return localDateToString(new Date(habit.createdAt));
}

/** Whether `habit` is due on the "YYYY-MM-DD" date `dateStr`. Weekly habits repeat on their start date's weekday. */
export function isScheduledOn(habit: Habit, dateStr: string): boolean {
  const startDate = habitStartDate(habit);
  if (compareDateStrings(dateStr, startDate) < 0) {
    return false;
  }
  const { repeat, days } = habit.schedule;
  switch (repeat) {
    case 'daily':
      return true;
    case 'weekly':
      return dayOfWeek(dateStr) === dayOfWeek(startDate);
    case 'custom':
      return days.includes(dayOfWeek(dateStr));
  }
}

export function habitsScheduledOn(habits: Habit[], dateStr: string): Habit[] {
  return habits.filter(habit => isScheduledOn(habit, dateStr));
}

/** Sort comparator: earliest start time first. */
export function byStartTime(a: Habit, b: Habit): number {
  return (
    minutesSinceMidnight(a.schedule.startTime) -
    minutesSinceMidnight(b.schedule.startTime)
  );
}

const WEEKDAY_NAMES = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
] as const;

/** Human-readable schedule, e.g. "Daily", "Weekly on Friday", "Mon, Wed, Fri". */
export function describeSchedule(habit: Habit): string {
  const { repeat, days } = habit.schedule;
  switch (repeat) {
    case 'daily':
      return 'Daily';
    case 'weekly':
      return `Weekly on ${WEEKDAY_NAMES[dayOfWeek(habitStartDate(habit))]}`;
    case 'custom': {
      const unique = [...new Set(days)].sort((a, b) => a - b);
      if (unique.length === WEEKDAY_NAMES.length) {
        return 'Every day';
      }
      if (unique.length === 0) {
        return 'No days selected';
      }
      return unique.map(day => WEEKDAY_NAMES[day].slice(0, 3)).join(', ');
    }
  }
}
