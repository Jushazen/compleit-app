import { Alert, Pressable, StyleSheet, View } from 'react-native';
import { Icon } from '../components/icons';
import { useSettings } from '../context/SettingsContext';
import { useThemedStyles, useTokens } from '../hooks/useTheme';
import type { ThemeMode } from '../storage/types';
import type { Tokens } from '../theme/tokens';

const MODES: { mode: ThemeMode; icon: 'sun' | 'moon'; label: string }[] = [
  { mode: 'light', icon: 'sun', label: 'Light theme' },
  { mode: 'dark', icon: 'moon', label: 'Dark theme' },
];

/** Light/dark switcher shown in the tab bar's theme dropdown. */
export function ThemeMenu() {
  const { theme, setTheme } = useSettings();
  const tokens = useTokens();
  const styles = useThemedStyles(makeStyles);

  const selectTheme = (mode: ThemeMode) => {
    if (mode === theme) {
      return;
    }
    setTheme(mode).catch(() => {
      Alert.alert('Could not change theme', 'Please try again.');
    });
  };

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        {MODES.map(({ mode, icon, label }) => {
          const isActive = theme === mode;
          return (
            <Pressable
              key={mode}
              onPress={() => selectTheme(mode)}
              accessibilityRole="button"
              accessibilityLabel={label}
              accessibilityState={{ selected: isActive }}
              style={[styles.modeButton, isActive && styles.activeModeButton]}
            >
              <Icon
                kind={icon}
                color={isActive ? tokens.onPrimary : tokens.text}
                size={20}
              />
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

function makeStyles(tokens: Tokens) {
  return StyleSheet.create({
    container: {
      backgroundColor: tokens.surface,
      borderRadius: tokens.radiusLg,
      borderWidth: 1,
      borderColor: tokens.border,
      padding: tokens.space3,
      minWidth: 120,
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
