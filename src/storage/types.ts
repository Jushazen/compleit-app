/**
 * Domain types persisted by the storage layer. These are the exact shapes
 * the app still persists today: HabitContext, SettingsContext, and
 * HabitCompletion are the active domains in the current product.
 */

export type RepeatMode = 'daily' | 'weekly' | 'custom';

// 0 = Sunday .. 6 = Saturday, matching JS Date#getDay() so no translation
// layer is needed when checking "is this habit scheduled today".
export type DayOfWeek = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export interface HabitSchedule {
  repeat: RepeatMode;
  /** Only meaningful when repeat === 'custom'. Empty array otherwise. */
  days: DayOfWeek[];
  /** 24h "HH:mm" local time. */
  startTime: string;
  endTime: string;
}

export interface Habit {
  id: string;
  title: string;
  notes: string;
  schedule: HabitSchedule;
  createdAt: string; // ISO 8601
}

export type ThemeMode = 'light' | 'dark';

export interface Settings {
  theme: ThemeMode;
  heatmapPalette: string;
}

/** A completed occurrence of a habit, keyed by local calendar date. */
export interface HabitCompletion {
  habitId: string;
  date: string; // "YYYY-MM-DD", local calendar date
  completedAt: string; // ISO 8601 timestamp
}
