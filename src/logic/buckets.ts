import { Habit, HabitCompletion } from '../storage/types';
import { localDateToString } from './dateUtils';
import { byStartTime, habitsScheduledOn } from './schedule';
import { minutesSinceMidnight } from './time';

export type HabitBucket = 'missed' | 'due' | 'upcoming' | 'completed';

/**
 * Splits the habits scheduled today into Home's sections: completed, missed
 * (window already closed), due (window open now) and upcoming. Each list is
 * sorted by start time.
 */
export function groupTodaysHabits(
  habits: Habit[],
  completions: HabitCompletion[],
  now: Date,
): Record<HabitBucket, Habit[]> {
  const todayStr = localDateToString(now);
  const completedToday = new Set(
    completions.filter(c => c.date === todayStr).map(c => c.habitId),
  );
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  const groups: Record<HabitBucket, Habit[]> = {
    missed: [],
    due: [],
    upcoming: [],
    completed: [],
  };
  for (const habit of habitsScheduledOn(habits, todayStr)) {
    groups[bucketFor(habit, completedToday.has(habit.id), currentMinutes)].push(
      habit,
    );
  }
  for (const list of Object.values(groups)) {
    list.sort(byStartTime);
  }
  return groups;
}

function bucketFor(
  habit: Habit,
  completed: boolean,
  currentMinutes: number,
): HabitBucket {
  if (completed) {
    return 'completed';
  }
  if (currentMinutes > minutesSinceMidnight(habit.schedule.endTime)) {
    return 'missed';
  }
  if (currentMinutes >= minutesSinceMidnight(habit.schedule.startTime)) {
    return 'due';
  }
  return 'upcoming';
}
