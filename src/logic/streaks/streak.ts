import { Habit, HabitCompletion } from '../../storage/types';
import { isScheduledOn } from '../isScheduledOn';
import { localDateToString, addDays, compareDateStrings } from '../dateUtils';

const MAX_WALK_DAYS = 3650; // 10 years — a safety cap, not a real limit

/**
 * Current streak for `habit`, as of `now`. `now` must be passed in
 * explicitly (gate G3: no internal `new Date()`/`Date.now()` call) — this
 * function converts it to a local calendar-day string exactly once, at
 * the top, then does every subsequent day-walk in pure UTC-string space
 * via dateUtils (see that file's header comment for why).
 *
 * Rule: walking backward one calendar day at a time from today,
 * - a day the habit isn't scheduled on (per isScheduledOn) is skipped —
 *   it neither extends nor breaks the streak
 * - a scheduled day that WAS completed extends the streak
 * - a scheduled day that was NOT completed breaks the streak, with one
 *   exception: if that day is today itself, it doesn't break anything —
 *   there's still time left today, so the streak so far still counts as
 *   "current," it's just not incremented for a day not yet done
 * - the walk never goes earlier than the habit's own createdAt date
 */
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
