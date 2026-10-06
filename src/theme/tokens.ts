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
  /** Completed state (progress bars, "done" buttons). */
  success: string;
  /** Text/icons drawn on top of `success`. */
  onSuccess: string;
  /** Heatmap cell for a day with no completions. */
  heatmapEmpty: string;
  /** Heatmap cell colours for 1, 2, 3 and 4+ completions; used as-is, no extra opacity. */
  heatmapScale: readonly [string, string, string, string];
  shadow: string;
  radiusMd: number;
  radiusLg: number;
  space1: number;
  space2: number;
  space3: number;
  space4: number;
  space6: number;
  space8: number;
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
  success: '#2D8659',
  onSuccess: '#FFFFFF',
  heatmapEmpty: '#F4F0E9',
  heatmapScale: ['#ADDCA4', '#6DBF6B', '#2F8F48', '#1B5E2E'],
  shadow: '#000000',
  radiusMd: 14,
  radiusLg: 20,
  space1: 4,
  space2: 8,
  space3: 12,
  space4: 16,
  space6: 24,
  space8: 32,
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
  success: '#3F9E6C',
  onSuccess: '#1B1714',
  heatmapEmpty: '#36302A',
  // Dark ramp brightens with count so busier days stand out on the dark surface.
  heatmapScale: ['#2B5236', '#357A46', '#4AA35E', '#74D18A'],
};

export function getTokens(theme: ThemeMode): Tokens {
  return theme === 'dark' ? dark : light;
}
