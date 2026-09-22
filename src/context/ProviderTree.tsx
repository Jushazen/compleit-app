import React, { ReactNode } from 'react';
import { SettingsProvider } from './SettingsContext';
import { HabitProvider } from './HabitContext';

export function ProviderTree({ children }: { children: ReactNode }) {
  return (
    <SettingsProvider>
      <HabitProvider>{children}</HabitProvider>
    </SettingsProvider>
  );
}
