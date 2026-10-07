import AsyncStorage from '@react-native-async-storage/async-storage';
import { currentVersion, StorageDomain, storageKey } from './keys';
import { Habit, HabitCompletion, Settings } from './types';

interface Envelope<T> {
  version: number;
  data: T;
}

function isEnvelope(value: unknown): value is Envelope<unknown> {
  return (
    typeof value === 'object' &&
    value !== null &&
    'version' in value &&
    'data' in value &&
    typeof (value as { version: unknown }).version === 'number'
  );
}

/** Reads a domain; any failure (I/O, corrupt JSON, version mismatch) yields the default. */
async function readDomain<T>(
  domain: StorageDomain,
  defaultValue: T,
): Promise<T> {
  let raw: string | null;
  try {
    raw = await AsyncStorage.getItem(storageKey(domain));
  } catch (err) {
    console.warn(`[storage] read failed for "${domain}", using default`, err);
    return defaultValue;
  }

  if (raw === null) {
    return defaultValue;
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch (err) {
    console.warn(
      `[storage] corrupt JSON for "${domain}", falling back to default`,
      err,
    );
    return defaultValue;
  }

  if (!isEnvelope(parsed)) {
    console.warn(
      `[storage] "${domain}" value is not a recognizable envelope, falling back to default`,
    );
    return defaultValue;
  }

  if (parsed.version !== currentVersion(domain)) {
    console.warn(
      `[storage] "${domain}" stored version ${
        parsed.version
      } does not match current ${currentVersion(
        domain,
      )}, falling back to default`,
    );
    return defaultValue;
  }

  return parsed.data as T;
}

async function writeDomain<T>(domain: StorageDomain, value: T): Promise<void> {
  const envelope: Envelope<T> = {
    version: currentVersion(domain),
    data: value,
  };
  await AsyncStorage.setItem(storageKey(domain), JSON.stringify(envelope));
}

export const DEFAULT_SETTINGS: Settings = { theme: 'light' };

export async function getHabits(): Promise<Habit[]> {
  const value = await readDomain<unknown>('habits', []);
  return Array.isArray(value) ? value : [];
}

export function setHabits(habits: Habit[]): Promise<void> {
  return writeDomain('habits', habits);
}

export async function getSettings(): Promise<Settings> {
  const value = await readDomain<unknown>('settings', null);
  const theme = (value as { theme?: unknown } | null)?.theme;
  return {
    ...DEFAULT_SETTINGS,
    ...(theme === 'light' || theme === 'dark' ? { theme } : {}),
  };
}

export function setSettings(settings: Settings): Promise<void> {
  return writeDomain('settings', settings);
}

export async function getCompletions(): Promise<HabitCompletion[]> {
  const value = await readDomain<unknown>('completions', []);
  return Array.isArray(value) ? value : [];
}

export function setCompletions(completions: HabitCompletion[]): Promise<void> {
  return writeDomain('completions', completions);
}

/** One-time UI flags (e.g. prompts already shown), kept apart from settings. */
interface Flags {
  exactAlarmPrompted?: boolean;
}

async function getFlags(): Promise<Flags> {
  const value = await readDomain<unknown>('flags', null);
  return typeof value === 'object' && value !== null ? (value as Flags) : {};
}

/** Whether the exact-alarm (on-time reminders) prompt was already shown. */
export async function getExactAlarmPrompted(): Promise<boolean> {
  return (await getFlags()).exactAlarmPrompted === true;
}

export async function setExactAlarmPrompted(): Promise<void> {
  const flags = await getFlags();
  await writeDomain<Flags>('flags', { ...flags, exactAlarmPrompted: true });
}
