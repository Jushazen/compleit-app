export type StorageDomain =
  | 'habits'
  | 'settings'
  | 'completions';


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
