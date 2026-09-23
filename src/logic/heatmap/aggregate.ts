import { HabitCompletion } from '../../storage/types';
import { addDays, toMonthString, compareDateStrings } from '../dateUtils';

export interface HeatmapDay {
  date: string; // "YYYY-MM-DD"
  intensity: 0 | 1; // single-habit heatmap: completed or not, no partial values
}

export type HeatmapByMonth = Record<string, HeatmapDay[]>; // key: "YYYY-MM"

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
