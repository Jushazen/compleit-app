import React, { ReactNode } from 'react';
import { SettingsProvider } from './SettingsContext';
import { HabitProvider, AddHabitGate } from './HabitContext';

export interface ProviderTreeGates {
  extraAddHabitGate?: AddHabitGate;
}

export function ProviderTree({
  children,
  gates = {},
}: {
  children: ReactNode;
  gates?: ProviderTreeGates;
}) {
  return (
    <SettingsProvider>
      <HabitProvider addHabitGate={gates.extraAddHabitGate}>
        {children}
      </HabitProvider>
    </SettingsProvider>
  );
}
