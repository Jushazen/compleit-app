import { Habit, HabitCompletion } from '../storage/types';
import { addDays, compareDateStrings, localDateToString } from './dateUtils';
import { habitStartDate, isScheduledOn } from './schedule';

/**
 * Consecutive scheduled days completed, counting back from today. Today only
 * counts once completed; leaving it open does not break the streak.
 */
export function calculateStreak(
  habit: Habit,
  completions: HabitCompletion[],
  now: Date,
): number {
  const completedDates = new Set(
    completions.filter(c => c.habitId === habit.id).map(c => c.date),
  );
  const todayStr = localDateToString(now);
  const startDate = habitStartDate(habit);

  let streak = 0;
  for (
    let cursor = todayStr;
    compareDateStrings(cursor, startDate) >= 0;
    cursor = addDays(cursor, -1)
  ) {
    if (!isScheduledOn(habit, cursor)) {
      continue;
    }
    if (completedDates.has(cursor)) {
      streak += 1;
    } else if (cursor !== todayStr) {
      break;
    }
  }
  return streak;
}
