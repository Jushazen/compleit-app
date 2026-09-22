import { HabitCompletion } from '../../storage/types';
import { addDays, toMonthString, compareDateStrings } from '../dateUtils';

export interface HeatmapDay {
  date: string; // "YYYY-MM-DD"
  intensity: 0 | 1; // single-habit heatmap: completed or not, no partial values
}

export type HeatmapByMonth = Record<string, HeatmapDay[]>; // key: "YYYY-MM"

/**
 * Builds a GitHub-style, month-grouped completion grid for one habit
 * between `startDateStr` and `endDateStr` (inclusive, both "YYYY-MM-DD").
 * Pure: takes its date range as explicit strings, never touches the
 * system clock — the caller decides what range "now" maps to.
 */
export function aggregateHeatmap(
  habitId: string,
  completions: HabitCompletion[],
  startDateStr: string,
  endDateStr: string
): HeatmapByMonth {
  const completedDates = new Set(
    completions.filter((c) => c.habitId === habitId).map((c) => c.date)
  );

  const result: HeatmapByMonth = {};
  let cursor = startDateStr;

  while (compareDateStrings(cursor, endDateStr) <= 0) {
    const month = toMonthString(cursor);
    if (!result[month]) result[month] = [];
    result[month].push({
      date: cursor,
      intensity: completedDates.has(cursor) ? 1 : 0,
    });
    cursor = addDays(cursor, 1);
  }

  return result;
}
