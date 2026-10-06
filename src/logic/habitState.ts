import { Habit, HabitCompletion } from '../storage/types';

/*
 * Pure transitions over the persisted habit data. Each returns a new object
 * and never mutates its input; a no-op returns `data` itself.
 */

export interface HabitData {
  habits: Habit[];
  completions: HabitCompletion[];
}

export function addHabit(data: HabitData, habit: Habit): HabitData {
  return { ...data, habits: [...data.habits, habit] };
}

/** Replaces the habit with the same id in place, keeping its `createdAt` and its completions. */
export function updateHabit(data: HabitData, habit: Habit): HabitData {
  if (!data.habits.some(h => h.id === habit.id)) {
    return data;
  }
  return {
    ...data,
    habits: data.habits.map(h =>
      h.id === habit.id ? { ...habit, createdAt: h.createdAt } : h,
    ),
  };
}

/** Removes the habit together with its completions. */
export function deleteHabit(data: HabitData, id: string): HabitData {
  return {
    habits: data.habits.filter(h => h.id !== id),
    completions: data.completions.filter(c => c.habitId !== id),
  };
}

/** Adds the completion unless the habit is already done that day or no longer exists. */
export function recordCompletion(
  data: HabitData,
  completion: HabitCompletion,
): HabitData {
  const habitExists = data.habits.some(h => h.id === completion.habitId);
  const alreadyDone = data.completions.some(
    c => c.habitId === completion.habitId && c.date === completion.date,
  );
  if (!habitExists || alreadyDone) {
    return data;
  }
  return { ...data, completions: [...data.completions, completion] };
}
