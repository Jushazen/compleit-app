export function toDateString(year: number, month: number, day: number): string {
  const mm = String(month).padStart(2, '0');
  const dd = String(day).padStart(2, '0');
  return `${year}-${mm}-${dd}`;
}

export function parseDateString(dateStr: string): { year: number; month: number; day: number } {
  const [year, month, day] = dateStr.split('-').map(Number);
  return { year, month, day };
}

/** Local calendar date -> "YYYY-MM-DD". The one place local time is deliberately used; everything downstream works on the resulting string. */
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
