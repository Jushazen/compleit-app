import { HabitSchedule } from '../storage/types';
import { dayOfWeek } from './dateUtils';

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
