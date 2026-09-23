import React, { useState, useCallback } from 'react';
import { View, StyleSheet, Pressable} from 'react-native';
import Svg, { Path, Circle, Rect, Line } from 'react-native-svg';
import { useSettings } from '../context/SettingsContext';
import { getTokens } from '../theme/tokens';
import { HomeScreen } from '../screens/Home';
import { HabitFormScreen } from '../screens/HabitForm';
import { HeatmapScreen } from '../screens/Heatmap';
import { SettingsScreen } from '../screens/Settings';
import { Habit } from '../storage/types';


type Tab = 'home' | 'heatmap';

type IconKind = 'home' | 'heatmap' | 'sun' | 'moon';

function NavIcon({ kind, color, size = 18 }: { kind: IconKind; color: string; size?: number }) {
  const strokeWidth = 2.2;

  switch (kind) {
    case 'home':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Path
            d="M3 10.5L12 3L21 10.5V19.5C21 20.33 20.33 21 19.5 21H14V14H10V21H4.5C3.67 21 3 20.33 3 19.5V10.5Z"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Svg>
      );
    case 'heatmap':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Rect x="3" y="3" width="6" height="6" rx="1.5" stroke={color} strokeWidth={strokeWidth} />
          <Rect x="15" y="3" width="6" height="4" rx="1.5" stroke={color} strokeWidth={strokeWidth} />
          <Rect x="3" y="15" width="10" height="6" rx="1.5" stroke={color} strokeWidth={strokeWidth} />
          <Rect x="15" y="11" width="6" height="10" rx="1.5" stroke={color} strokeWidth={strokeWidth} />
        </Svg>
      );
    case 'sun':
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
    case 'moon':
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
    default:
      return null;
  }
}

export function AppShell() {
  const { theme } = useSettings();
  const tokens = getTokens(theme);
  const styles = makeStyles(tokens);

  const [tab, setTab] = useState<Tab>('home');
  const [modal, setModal] = useState<ModalState>(null);
  const [settingsMenuOpen, setSettingsMenuOpen] = useState(false);

  const closeModal = useCallback(() => setModal(null), []);

  const handleTabPress = (nextTab: Tab) => {
    setSettingsMenuOpen(false);
    setTab(nextTab);
  };

  const TAB_ITEMS: { key: Tab; icon: IconKind }[] = [
    { key: 'home', icon: 'home' },
    { key: 'heatmap', icon: 'heatmap' },
  ];

  return (
    <View style={styles.root}>
      <View style={styles.screenArea}>
        {tab === 'home' && (
          <HomeScreen
            onAddHabit={() => setModal({ type: 'habitForm' })}
          />
        )}
        {tab === 'heatmap' && <HeatmapScreen />}
      </View>

      <View style={styles.tabBar}>
        {TAB_ITEMS.map((t) => (
          <Pressable
            key={t.key}
            onPress={() => handleTabPress(t.key)}
            style={[
              styles.tabItem,
              tab === t.key && styles.activeTabItem,
            ]}
          >
            <View style={styles.navIconContainer}>
              <NavIcon
                kind={t.icon}
                color={tab === t.key ? tokens.accent : tokens.textMuted}
                size={20}
              />
            </View>
          </Pressable>
        ))}

        <Pressable
          onPress={() => setSettingsMenuOpen((prev) => !prev)}
          style={styles.settingsToggle}
        >
          <View style={styles.navIconContainer}>
            <NavIcon kind={theme === 'light' ? 'sun' : 'moon'} color={tokens.onPrimary} size={20} />
          </View>
        </Pressable>
      </View>

      {settingsMenuOpen && (
        <View style={styles.settingsDropdownWrapper} pointerEvents="box-none">
          <View style={styles.settingsDropdownPointer} />
          <View style={styles.settingsDropdown} pointerEvents="box-none">
            <SettingsScreen compact />
          </View>
        </View>
      )}

      {modal?.type === 'habitForm' && (
        <View style={styles.modalOverlay}>
          <HabitFormScreen existingHabit={modal.existingHabit} onDone={closeModal} />
          <Pressable onPress={closeModal} style={styles.modalClose}>
            <Svg width={26} height={26} viewBox="0 0 24 24" fill="none">
              <Circle cx="12" cy="12" r="10" stroke={tokens.accent} strokeWidth={2} />
              <Path d="M8 8L16 16M16 8L8 16" stroke={tokens.accent} strokeWidth={2.2} strokeLinecap="round" />
            </Svg>
          </Pressable>
        </View>
      )}

    </View>
  );
}

type ModalState =
  | { type: 'habitForm'; existingHabit?: Habit }
  | null;

function makeStyles(tokens: ReturnType<typeof getTokens>) {
  return StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: tokens.background,
      paddingBottom: 40,
      paddingTop: 20,
    },
    screenArea: { flex: 1, paddingTop: 6 },
    tabBar: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      gap: 50,
      borderTopWidth: 1,
      borderTopColor: tokens.border,
      backgroundColor: tokens.surface,
      paddingTop: tokens.space2,
      paddingBottom: tokens.space3 + 4,
    },
    tabItem: {
      alignItems: 'center',
      justifyContent: 'center',
      width: 60,
      height: 60,
      borderRadius: 50,
    },
    navIconContainer: {
      width: '100%',
      height: '100%',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 0,
    },
    activeTabItem: {
      backgroundColor: tokens.background,
      borderWidth: 1,
      borderColor: tokens.border,
    },
    settingsToggle: {
      alignItems: 'center',
      justifyContent: 'center',
      width: 60,
      height: 60,
      borderRadius: 50,
      backgroundColor: tokens.primary,
      borderWidth: 1,
      borderColor: tokens.primary,
      padding: 0,
    },
    settingsDropdown: {
      backgroundColor: tokens.surface,
      borderRadius: tokens.radiusLg,
      borderWidth: 1,
      borderColor: tokens.border,
      padding: tokens.space3,
      shadowColor: '#000',
      shadowOpacity: 0.08,
      shadowRadius: 10,
      shadowOffset: { width: 0, height: 6 },
      elevation: 6,
    },
    settingsDropdownWrapper: {
      position: 'absolute',
      right: 18,
      bottom: 140,
      alignItems: 'flex-end',
    },
    settingsDropdownPointer: {
      width: 0,
      height: 0,
      backgroundColor: 'transparent',
      borderLeftWidth: 8,
      borderRightWidth: 8,
      borderTopWidth: 10,
      borderLeftColor: 'transparent',
      borderRightColor: 'transparent',
      borderTopColor: tokens.surface,
      marginBottom: -1,
      marginRight: 12,
    },
    modalOverlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: tokens.background,
      paddingTop: 25,
    },
    modalClose: {
      position: 'absolute',
      top: 45,
      right: 18,
      width: 32,
      height: 32,
      alignItems: 'center',
      justifyContent: 'center',
    },
    modalCloseLabel: { fontSize: 14, color: tokens.accent },
  });
}
