import { AppShell } from './src/app/AppShell';
import { ProviderTree } from './src/context/ProviderTree';
import { ReminderSync } from './src/notifications/ReminderSync';

export default function App() {
  return (
    <ProviderTree>
      <ReminderSync />
      <AppShell />
    </ProviderTree>
  );
}
