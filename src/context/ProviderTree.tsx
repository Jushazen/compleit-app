import type { ReactNode } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { HabitProvider } from './HabitContext';
import { SettingsProvider } from './SettingsContext';

export function ProviderTree({ children }: { children: ReactNode }) {
  return (
    <SafeAreaProvider>
      <SettingsProvider>
        <HabitProvider>{children}</HabitProvider>
      </SettingsProvider>
    </SafeAreaProvider>
  );
}
