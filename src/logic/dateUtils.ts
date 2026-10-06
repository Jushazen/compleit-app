import { DayOfWeek } from '../storage/types';

/*
 * Calendar dates are handled as zero-padded "YYYY-MM-DD" strings. Arithmetic
 * runs in UTC so it never crosses a DST transition; only `localDateToString`
 * reads the device's local time zone.
 */

const MS_PER_DAY = 86_400_000;

/** `month` is 1-based. */
export function toDateString(year: number, month: number, day: number): string {
  const mm = String(month).padStart(2, '0');
  const dd = String(day).padStart(2, '0');
  return `${year}-${mm}-${dd}`;
}

/** Inverse of `toDateString`; `month` is 1-based. */
export function parseDateString(dateStr: string): {
  year: number;
  month: number;
  day: number;
} {
  const [year, month, day] = dateStr.split('-').map(Number);
  return { year, month, day };
}

/** The local calendar date of `date`. */
export function localDateToString(date: Date): string {
  return toDateString(date.getFullYear(), date.getMonth() + 1, date.getDate());
}

export function addDays(dateStr: string, n: number): string {
  const { year, month, day } = parseDateString(dateStr);
  const d = new Date(Date.UTC(year, month - 1, day) + n * MS_PER_DAY);
  return toDateString(d.getUTCFullYear(), d.getUTCMonth() + 1, d.getUTCDate());
}

/** 0 = Sunday .. 6 = Saturday. */
export function dayOfWeek(dateStr: string): DayOfWeek {
  const { year, month, day } = parseDateString(dateStr);
  return new Date(Date.UTC(year, month - 1, day)).getUTCDay() as DayOfWeek;
}

/** Negative, zero or positive, like a sort comparator. */
export function compareDateStrings(a: string, b: string): number {
  if (a < b) {
    return -1;
  }
  return a > b ? 1 : 0;
}
