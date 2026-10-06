/* Helpers for the "HH:mm" 24-hour local times stored on a habit schedule. */

const CLOCK_TIME = /^([01]\d|2[0-3]):([0-5]\d)$/;

function parseClockTime(
  hhmm: string,
): { hours: number; minutes: number } | null {
  const match = CLOCK_TIME.exec(hhmm);
  return match ? { hours: Number(match[1]), minutes: Number(match[2]) } : null;
}

const pad2 = (n: number) => String(n).padStart(2, '0');

/** Minutes from 00:00 to `hhmm`; NaN if `hhmm` is not a valid "HH:mm" time. */
export function minutesSinceMidnight(hhmm: string): number {
  const time = parseClockTime(hhmm);
  return time ? time.hours * 60 + time.minutes : NaN;
}

/** "13:30" -> "1:30 PM". Malformed input is returned unchanged. */
export function formatClockTime(hhmm: string): string {
  const time = parseClockTime(hhmm);
  if (!time) {
    return hhmm;
  }
  const period = time.hours >= 12 ? 'PM' : 'AM';
  const hour12 = time.hours % 12 || 12;
  return `${hour12}:${pad2(time.minutes)} ${period}`;
}

/**
 * A Date carrying `hhmm` as its local time of day, for time pickers. Uses a
 * fixed reference day so no time falls in a DST gap; malformed input -> 09:00.
 */
export function timeToDate(hhmm: string): Date {
  const time = parseClockTime(hhmm) ?? { hours: 9, minutes: 0 };
  return new Date(2000, 0, 1, time.hours, time.minutes);
}

/** The local time of day of `date` as "HH:mm". */
export function dateToTime(date: Date): string {
  return `${pad2(date.getHours())}:${pad2(date.getMinutes())}`;
}
