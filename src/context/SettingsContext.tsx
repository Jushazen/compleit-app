import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from 'react';
import { getSettings, setSettings as persistSettings, DEFAULT_SETTINGS } from '../storage/storage';
import { Settings, ThemeMode } from '../storage/types';

interface SettingsContextValue {
  theme: ThemeMode;
  heatmapPalette: string;
  isLoading: boolean;
  setTheme: (theme: ThemeMode) => Promise<void>;
  setHeatmapPalette: (palette: string) => Promise<void>;
}

const SettingsContext = createContext<SettingsContextValue | undefined>(
  undefined
);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettingsState] = useState<Settings>(DEFAULT_SETTINGS);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const stored = await getSettings();
      if (!cancelled) {
        setSettingsState(stored);
        setIsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const persistAndSet = useCallback(async (next: Settings) => {
    await persistSettings(next);
    setSettingsState(next);
  }, []);

  const setTheme = useCallback(
    (theme: ThemeMode) => persistAndSet({ ...settings, theme }),
    [settings, persistAndSet]
  );

  const setHeatmapPalette = useCallback(
    (heatmapPalette: string) => persistAndSet({ ...settings, heatmapPalette }),
    [settings, persistAndSet]
  );

  return (
    <SettingsContext.Provider
      value={{
        theme: settings.theme,
        heatmapPalette: settings.heatmapPalette,
        isLoading,
        setTheme,
        setHeatmapPalette,
      }}
    >
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
