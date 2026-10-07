import { Habit, HabitCompletion } from '../storage/types';
import {
  addDays,
  compareDateStrings,
  dayOfWeek,
  parseDateString,
  toDateString,
} from './dateUtils';
import { byStartTime, isScheduledOn } from './schedule';

interface YearMonth {
  year: number;
  /** 0-based, like `Date#getMonth`. */
  month: number;
}

/**
 * Completions per day for every date from `startDateStr` to `endDateStr`
 * inclusive (zero-filled), counting at most one per existing habit per day.
 */
export function countCompletionsByDate(
  habits: Habit[],
  completions: HabitCompletion[],
  startDateStr: string,
  endDateStr: string,
): Record<string, number> {
  const counts: Record<string, number> = {};
  for (
    let cursor = startDateStr;
    compareDateStrings(cursor, endDateStr) <= 0;
    cursor = addDays(cursor, 1)
  ) {
    counts[cursor] = 0;
  }

  const habitIds = new Set(habits.map(h => h.id));
  const counted = new Set<string>();
  for (const { habitId, date } of completions) {
    const key = `${habitId}|${date}`;
    if (date in counts && habitIds.has(habitId) && !counted.has(key)) {
      counted.add(key);
      counts[date] += 1;
    }
  }
  return counts;
}

/** Colour step for a day's completion count: 0 for none, 4 for four or more. */
export function intensityStep(count: number): 0 | 1 | 2 | 3 | 4 {
  if (!(count > 0)) {
    return 0;
  }
  return Math.min(Math.ceil(count), 4) as 1 | 2 | 3 | 4;
}

/** Calendar cells for a month (`month0` is 0-based), padded to whole Sunday-first weeks. */
export function buildMonthGrid(
  year: number,
  month0: number,
): { dateStr: string; inMonth: boolean }[] {
  const next = shiftMonth({ year, month: month0 }, 1);
  const firstDay = toDateString(year, month0 + 1, 1);
  const lastDay = addDays(toDateString(next.year, next.month + 1, 1), -1);
  const gridStart = addDays(firstDay, -dayOfWeek(firstDay));
  const gridEnd = addDays(lastDay, 6 - dayOfWeek(lastDay));

  const cells: { dateStr: string; inMonth: boolean }[] = [];
  for (
    let cursor = gridStart;
    compareDateStrings(cursor, gridEnd) <= 0;
    cursor = addDays(cursor, 1)
  ) {
    const date = parseDateString(cursor);
    cells.push({
      dateStr: cursor,
      inMonth: date.year === year && date.month === month0 + 1,
    });
  }
  return cells;
}

/**
 * The habits completed on `dateStr`, plus those scheduled but not completed:
 * `missed` before `todayStr`, `inProgress` on it, `upcoming` after it.
 */
export function dayDetails(
  habits: Habit[],
  completions: HabitCompletion[],
  dateStr: string,
  todayStr: string,
): {
  completed: Habit[];
  missed: Habit[];
  inProgress: Habit[];
  upcoming: Habit[];
} {
  const completedIds = new Set(
    completions.filter(c => c.date === dateStr).map(c => c.habitId),
  );
  const sorted = [...habits].sort(byStartTime);
  const completed = sorted.filter(h => completedIds.has(h.id));
  const pending = sorted.filter(
    h => !completedIds.has(h.id) && isScheduledOn(h, dateStr),
  );
  const order = compareDateStrings(dateStr, todayStr);
  return {
    completed,
    missed: order < 0 ? pending : [],
    inProgress: order === 0 ? pending : [],
    upcoming: order > 0 ? pending : [],
  };
}

/** The day to select after jumping to a month: today if the month contains it, else the 1st. */
export function selectionForMonth(
  { year, month }: YearMonth,
  todayStr: string,
): string {
  const today = parseDateString(todayStr);
  return today.year === year && today.month === month + 1
    ? todayStr
    : toDateString(year, month + 1, 1);
}

/** Moves a month by `delta` months, carrying across year boundaries. */
export function shiftMonth(
  { year, month }: YearMonth,
  delta: number,
): YearMonth {
  const total = year * 12 + month + delta;
  const nextYear = Math.floor(total / 12);
  return { year: nextYear, month: total - nextYear * 12 };
}
