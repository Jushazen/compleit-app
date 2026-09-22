import { Habit, HabitCompletion } from '../../storage/types';
import { isScheduledOn } from '../isScheduledOn';
import { localDateToString, addDays, compareDateStrings } from '../dateUtils';

const MAX_WALK_DAYS = 3650; // 10 years — a safety cap, not a real limit

export function calculateStreak(
  habit: Habit,
  completions: HabitCompletion[],
  now: Date
): number {
  const completedDates = new Set(
    completions.filter((c) => c.habitId === habit.id).map((c) => c.date)
  );
  const todayStr = localDateToString(now);
  const createdAtStr = habit.createdAt.slice(0, 10); // createdAt is ISO 8601; the date portion is what bounds the walk

  let streak = 0;
  let cursor = todayStr;
  let steps = 0;

  while (compareDateStrings(cursor, createdAtStr) >= 0 && steps < MAX_WALK_DAYS) {
    if (isScheduledOn(habit.schedule, cursor, createdAtStr)) {
      const completedThatDay = completedDates.has(cursor);
      if (completedThatDay) {
        streak += 1;
      } else if (cursor !== todayStr) {
        // A past scheduled day with no completion ends the streak.
        break;
      }
      // else: today, not yet completed — don't break, don't count, keep walking backward.
    }
    cursor = addDays(cursor, -1);
    steps += 1;
  }

  return streak;
}
