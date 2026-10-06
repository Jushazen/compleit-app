import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { createSerialQueue } from '../logic/serialQueue';
import { DEFAULT_SETTINGS, getSettings, setSettings } from '../storage/storage';
import type { Settings, ThemeMode } from '../storage/types';

interface SettingsContextValue {
  theme: ThemeMode;
  isLoading: boolean;
  setTheme: (theme: ThemeMode) => Promise<void>;
}

const SettingsContext = createContext<SettingsContextValue | undefined>(
  undefined,
);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettingsState] = useState<Settings>(DEFAULT_SETTINGS);
  const [isLoading, setIsLoading] = useState(true);
  // Queued writes read the latest settings from here, never from a render closure.
  const settingsRef = useRef(settings);
  const [enqueue] = useState(createSerialQueue);
  const hydrationRef = useRef<Promise<void> | null>(null);

  const commit = useCallback((next: Settings) => {
    settingsRef.current = next;
    setSettingsState(next);
  }, []);

  /** Queues the one-time load ahead of any write, so a late load cannot overwrite the user's choice. */
  const hydrate = useCallback(() => {
    hydrationRef.current ??= enqueue(async () => {
      try {
        commit(await getSettings());
      } catch (err) {
        console.warn('[settings] hydration failed, using defaults', err);
      } finally {
        setIsLoading(false);
      }
    });
    return hydrationRef.current;
  }, [enqueue, commit]);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  // Committed after the write succeeds (not optimistically): the UI never shows
  // a theme that was not saved, and a failed write rejects for the caller.
  const setTheme = useCallback(
    (theme: ThemeMode): Promise<void> => {
      hydrate();
      return enqueue(async () => {
        const next: Settings = { ...settingsRef.current, theme };
        await setSettings(next);
        commit(next);
      });
    },
    [hydrate, enqueue, commit],
  );

  const value: SettingsContextValue = useMemo(
    () => ({ theme: settings.theme, isLoading, setTheme }),
    [settings.theme, isLoading, setTheme],
  );

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings(): SettingsContextValue {
  const ctx = useContext(SettingsContext);
  if (!ctx) {
    throw new Error('useSettings() must be called inside a SettingsProvider');
  }
  return ctx;
}
