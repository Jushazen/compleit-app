/**
 * All AsyncStorage keys are namespaced `compleit:<domain>:<version>` so a
 * future schema change can detect and migrate an older shape instead of
 * silently misreading it.
 */

export type StorageDomain =
  | 'habits'
  | 'settings'
  | 'completions';

// Bump the version for a given domain when its persisted shape changes in a
// way that isn't backward-compatible. This is the current version per
// domain, not a global app version.
const CURRENT_VERSION: Record<StorageDomain, number> = {
  habits: 1,
  settings: 1,
  completions: 1,
};

export function storageKey(domain: StorageDomain): string {
  return `compleit:${domain}:v${CURRENT_VERSION[domain]}`;
}

export function currentVersion(domain: StorageDomain): number {
  return CURRENT_VERSION[domain];
}
