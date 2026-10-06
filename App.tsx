import { AppShell } from './src/app/AppShell';
import { ProviderTree } from './src/context/ProviderTree';

export default function App() {
  return (
    <ProviderTree>
      <AppShell />
    </ProviderTree>
  );
}
