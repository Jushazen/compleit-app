export type RepeatMode = 'daily' | 'weekly' | 'custom';

export type DayOfWeek = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export interface HabitSchedule {
  repeat: RepeatMode;
  /** Only meaningful when repeat === 'custom'. Empty array otherwise. */
  days: DayOfWeek[];
  /** 24h "HH:mm" local time. */
  startTime: string;
  endTime: string;
}

/** An optional measurable goal for a habit, e.g. { unit: 'pages', amount: 20 }. */
export interface HabitTarget {
  unit: string;
  amount: number;
}

export interface Habit {
  id: string;
  title: string;
  notes: string;
  schedule: HabitSchedule;
  target?: HabitTarget;
  createdAt: string;
}

export type ThemeMode = 'light' | 'dark';

export interface Settings {
  theme: ThemeMode;
  heatmapPalette: string;
}

export interface HabitCompletion {
  habitId: string;
  date: string; // "YYYY-MM-DD", local calendar date
  completedAt: string;
}
