import React from 'react';
import { ProviderTree } from './src/context/ProviderTree';
import { AppShell } from './src/app/AppShell';

export default function App() {
  return (
    <ProviderTree>
      <AppShell />
    </ProviderTree>
  );
}
