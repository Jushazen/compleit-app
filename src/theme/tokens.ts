import { ThemeMode } from '../storage/types';

/** Every screen calls getTokens(theme) rather than hardcoding a color/spacing value, so the app stays on one shared palette. */
export interface Tokens {
  background: string;
  surface: string;
  primary: string;
  onPrimary: string;
  accent: string;
  text: string;
  textMuted: string;
  border: string;
  radiusSm: number;
  radiusMd: number;
  radiusLg: number;
  space1: number;
  space2: number;
  space3: number;
  space4: number;
  space6: number;
  space8: number;
  space12: number;
}

const light: Tokens = {
  background: '#FAF6EE',
  surface: '#FFFFFF',
  primary: '#2E2A25',
  onPrimary: '#FAF6EE',
  // On light mode, accent is UI-safe (icons, rings, indicators) but NOT
  // text-safe against the cream background — never use it for small text/links.
  accent: '#D97A42',
  text: '#2E2A25',
  textMuted: '#8A8078',
  border: '#E6DFD3',
  radiusSm: 8,
  radiusMd: 14,
  radiusLg: 20,
  space1: 4,
  space2: 8,
  space3: 12,
  space4: 16,
  space6: 24,
  space8: 32,
  space12: 48,
};

const dark: Tokens = {
  ...light,
  background: '#1B1714',
  surface: '#24201C',
  primary: '#EDE7DC',
  onPrimary: '#1B1714',
  accent: '#E8935A',
  text: '#EDE7DC',
  textMuted: '#9C9188',
  border: '#362F28',
};

export function getTokens(theme: ThemeMode): Tokens {
  return theme === 'dark' ? dark : light;
}
