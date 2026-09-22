import AsyncStorage from '@react-native-async-storage/async-storage';
import { storageKey, currentVersion, StorageDomain } from './keys';
import {
  Habit,
  Settings,
  HabitCompletion,
} from './types';

/**
 * Every value on disk is wrapped in a version envelope so a future
 * migration can tell an old shape apart from the current one.
 */
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

export async function readDomain<T>(
  domain: StorageDomain,
  defaultValue: T
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
      err
    );
    return defaultValue;
  }

  if (!isEnvelope(parsed)) {
    console.warn(
      `[storage] "${domain}" value is not a recognizable envelope, falling back to default`
    );
    return defaultValue;
  }

  if (parsed.version !== currentVersion(domain)) {
    console.warn(
      `[storage] "${domain}" stored version ${parsed.version} does not match current ${currentVersion(
        domain
      )}, falling back to default`
    );
    return defaultValue;
  }

  return parsed.data as T;
}

export async function writeDomain<T>(
  domain: StorageDomain,
  value: T
): Promise<void> {
  const envelope: Envelope<T> = { version: currentVersion(domain), data: value };
  await AsyncStorage.setItem(storageKey(domain), JSON.stringify(envelope));
}

export const DEFAULT_SETTINGS: Settings = {
  theme: 'light',
  heatmapPalette: 'default',
};

export async function getHabits(): Promise<Habit[]> {
  const value = await readDomain<Habit[]>('habits', []);
  return Array.isArray(value) ? value : [];
}
export function setHabits(habits: Habit[]): Promise<void> {
  return writeDomain('habits', habits);
}

export async function getSettings(): Promise<Settings> {
  const value = await readDomain<Settings | null>('settings', DEFAULT_SETTINGS);
  return value ?? DEFAULT_SETTINGS;
}
export function setSettings(settings: Settings): Promise<void> {
  return writeDomain('settings', settings);
}

export async function getCompletions(): Promise<HabitCompletion[]> {
  const value = await readDomain<HabitCompletion[]>('completions', []);
  return Array.isArray(value) ? value : [];
}
export function setCompletions(
  completions: HabitCompletion[]
): Promise<void> {
  return writeDomain('completions', completions);
}
