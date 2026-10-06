import { useMemo } from 'react';
import { useSettings } from '../context/SettingsContext';
import { getTokens, type Tokens } from '../theme/tokens';

export function useTokens(): Tokens {
  const { theme } = useSettings();
  return useMemo(() => getTokens(theme), [theme]);
}

/** Builds styles once per theme; pass a module-level factory (e.g. `makeStyles`) so it stays stable. */
export function useThemedStyles<T>(factory: (tokens: Tokens) => T): T {
  const tokens = useTokens();
  return useMemo(() => factory(tokens), [factory, tokens]);
}
