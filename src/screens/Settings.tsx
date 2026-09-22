import React, { useCallback } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import Svg, { Circle, Path, Line } from 'react-native-svg';
import { useSettings } from '../context/SettingsContext';
import { getTokens } from '../theme/tokens';
import { ThemeMode } from '../storage/types';

function ThemeIcon({ kind, color, size = 18 }: { kind: 'light' | 'dark'; color: string; size?: number }) {
  const strokeWidth = 2.2;

  if (kind === 'light') {
    return (
      <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <Circle cx="12" cy="12" r="4.5" stroke={color} strokeWidth={strokeWidth} />
        <Line x1="12" y1="1.5" x2="12" y2="4.2" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
        <Line x1="12" y1="19.8" x2="12" y2="22.5" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
        <Line x1="1.5" y1="12" x2="4.2" y2="12" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
        <Line x1="19.8" y1="12" x2="22.5" y2="12" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
        <Line x1="4.1" y1="4.1" x2="6.1" y2="6.1" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
        <Line x1="17.9" y1="17.9" x2="19.9" y2="19.9" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
        <Line x1="4.1" y1="19.9" x2="6.1" y2="17.9" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
        <Line x1="17.9" y1="6.1" x2="19.9" y2="4.1" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
      </Svg>
    );
  }

  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M18.5 15.5C17.2 16.6 15.6 17.2 13.9 17.2C9.7 17.2 6.2 13.7 6.2 9.5C6.2 7.8 6.8 6.2 7.9 4.9C5.8 5.6 4.2 7.6 4.2 10C4.2 14.2 7.7 17.7 11.9 17.7C14.3 17.7 16.3 16.8 18.5 15.5Z"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function SettingsScreen({ compact = false }: { compact?: boolean }) {
  const settings = useSettings();
  const tokens = getTokens(settings.theme);
  const styles = makeStyles(tokens);

  const setTheme = useCallback(
    (theme: ThemeMode) => settings.setTheme(theme),
    [settings]
  );

  return (
    <View style={compact ? styles.dropdownContainer : styles.container} testID="settings-screen">
      {!compact && <Text style={styles.header}>Settings</Text>}

      <View style={styles.row}>
        {(['light', 'dark'] as ThemeMode[]).map((mode) => {
          const isActive = settings.theme === mode;
          const color = isActive ? tokens.onPrimary : tokens.text;

          return (
            <Pressable
              key={mode}
              onPress={() => setTheme(mode)}
              testID={`theme-${mode}`}
              style={[
                styles.modeButton,
                isActive && styles.activeModeButton,
              ]}
            >
              <ThemeIcon kind={mode} color={color} size={20} />
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

function makeStyles(tokens: ReturnType<typeof getTokens>) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: tokens.background,
      paddingHorizontal: tokens.space6,
      paddingTop: tokens.space6,
    },
    dropdownContainer: {
      backgroundColor: tokens.surface,
      borderRadius: tokens.radiusLg,
      borderWidth: 1,
      borderColor: tokens.border,
      padding: tokens.space3,
      minWidth: 120,
    },
    header: {
      fontSize: 24,
      fontWeight: '600',
      color: tokens.text,
      marginBottom: tokens.space6,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: tokens.space2,
    },
    modeButton: {
      width: 46,
      height: 46,
      borderRadius: 23,
      backgroundColor: tokens.background,
      borderWidth: 1,
      borderColor: tokens.border,
      alignItems: 'center',
      justifyContent: 'center',
    },
    activeModeButton: {
      backgroundColor: tokens.primary,
      borderColor: tokens.primary,
    },
  });
}
