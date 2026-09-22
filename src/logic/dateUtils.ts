/**
 * All arithmetic here runs through Date.UTC/getUTCX so that walking
 * backward or forward day-by-day can never be bitten by a DST transition
 * (UTC has none) — this is what keeps leaf 1.2.1's aggregator/streak
 * functions pure per gate G3 ("no hidden clock/timezone dependency").
 * Callers convert a real, local "now" into a "YYYY-MM-DD" string exactly
 * once, at the boundary (see streak.ts) — everything past that boundary
 * only ever touches date *strings*, never the system clock.
 */

export function toDateString(year: number, month: number, day: number): string {
  const mm = String(month).padStart(2, '0');
  const dd = String(day).padStart(2, '0');
  return `${year}-${mm}-${dd}`;
}

export function parseDateString(dateStr: string): { year: number; month: number; day: number } {
  const [year, month, day] = dateStr.split('-').map(Number);
  return { year, month, day };
}

/** Local calendar date -> "YYYY-MM-DD", using the Date's local getters (the one place local time is deliberately used — see streak.ts's doc comment on why). */
export function localDateToString(date: Date): string {
  return toDateString(date.getFullYear(), date.getMonth() + 1, date.getDate());
}

export function addDays(dateStr: string, n: number): string {
  const { year, month, day } = parseDateString(dateStr);
  const ms = Date.UTC(year, month - 1, day) + n * 86_400_000;
  const d = new Date(ms);
  return toDateString(d.getUTCFullYear(), d.getUTCMonth() + 1, d.getUTCDate());
}

/** 0 = Sunday .. 6 = Saturday, matching Habit['schedule']['days'] (DayOfWeek). */
export function dayOfWeek(dateStr: string): number {
  const { year, month, day } = parseDateString(dateStr);
  return new Date(Date.UTC(year, month - 1, day)).getUTCDay();
}

export function toMonthString(dateStr: string): string {
  const { year, month } = parseDateString(dateStr);
  return `${year}-${String(month).padStart(2, '0')}`;
}

/** -1 if a<b, 0 if equal, 1 if a>b. Plain string comparison works because the format is zero-padded and always YYYY-MM-DD. */
export function compareDateStrings(a: string, b: string): number {
  if (a < b) return -1;
  if (a > b) return 1;
  return 0;
}
