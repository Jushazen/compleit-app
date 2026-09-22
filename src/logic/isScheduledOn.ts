import { HabitSchedule } from '../storage/types';
import { dayOfWeek } from './dateUtils';

/**
 * Whether `habit` is scheduled on `dateStr`. This is the one place that
 * interprets `repeat` — streaks and heatmap calculations should call this
 * rather than re-deriving scheduling logic themselves.
 *
 * Interpretation decisions worth flagging:
 * - 'daily': every day is scheduled.
 * - 'weekly': recurs on the same day-of-week as `createdAtDateStr`.
 * - 'custom': scheduled on exactly the days listed in `schedule.days`.
 */
export function isScheduledOn(
  schedule: HabitSchedule,
  dateStr: string,
  createdAtDateStr: string
): boolean {
  switch (schedule.repeat) {
    case 'daily':
      return true;
    case 'weekly':
      return dayOfWeek(dateStr) === dayOfWeek(createdAtDateStr);
    case 'custom':
      return schedule.days.includes(dayOfWeek(dateStr) as HabitSchedule['days'][number]);
  }
}
