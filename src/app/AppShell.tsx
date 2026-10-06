import { useCallback, useEffect, useState } from 'react';
import {
  BackHandler,
  Pressable,
  StyleSheet,
  View,
  type LayoutChangeEvent,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon } from '../components/icons';
import { useSettings } from '../context/SettingsContext';
import { useThemedStyles, useTokens } from '../hooks/useTheme';
import { HabitFormScreen } from '../screens/HabitForm';
import { HeatmapScreen } from '../screens/Heatmap';
import { HomeScreen } from '../screens/Home';
import type { Habit } from '../storage/types';
import type { Tokens } from '../theme/tokens';
import { ThemeMenu } from './ThemeMenu';

type Tab = 'home' | 'heatmap';

/** `null` = closed; open with no habit to add one, or with `existingHabit` to edit it. */
type FormModal = { existingHabit?: Habit } | null;

const TABS: { key: Tab; label: string }[] = [
  { key: 'home', label: 'Home' },
  { key: 'heatmap', label: 'Heatmap' },
];

/** Gap between the status bar and the active screen. */
const SCREEN_TOP_GAP = 6;
/** Space between the top of the tab bar and the theme dropdown's pointer. */
const DROPDOWN_GAP = 15;
/** Distance of the theme dropdown and modal close button from the right edge. */
const EDGE_OFFSET = 18;
/** Extra space between the status bar and the form modal's content. */
const MODAL_TOP_GAP = 5;
/** Offset of the modal close button below the form modal's content top. */
const MODAL_CLOSE_OFFSET = 20;

export function AppShell() {
  const { theme } = useSettings();
  const tokens = useTokens();
  const styles = useThemedStyles(makeStyles);
  const insets = useSafeAreaInsets();

  const [tab, setTab] = useState<Tab>('home');
  const [formModal, setFormModal] = useState<FormModal>(null);
  const [themeMenuOpen, setThemeMenuOpen] = useState(false);
  const [tabBarHeight, setTabBarHeight] = useState(0);

  const openForm = useCallback((modal: NonNullable<FormModal>) => {
    setThemeMenuOpen(false);
    setFormModal(modal);
  }, []);
  const openNewHabit = useCallback(() => openForm({}), [openForm]);
  const openEditHabit = useCallback(
    (habit: Habit) => openForm({ existingHabit: habit }),
    [openForm],
  );
  const closeForm = useCallback(() => setFormModal(null), []);
  const closeThemeMenu = useCallback(() => setThemeMenuOpen(false), []);

  const handleTabPress = (nextTab: Tab) => {
    setThemeMenuOpen(false);
    setTab(nextTab);
  };

  const handleTabBarLayout = (event: LayoutChangeEvent) =>
    setTabBarHeight(event.nativeEvent.layout.height);

  // Android back closes the form modal, then the theme menu, before leaving the app.
  const backClosesSomething = formModal !== null || themeMenuOpen;
  useEffect(() => {
    if (!backClosesSomething) {
      return;
    }
    const subscription = BackHandler.addEventListener(
      'hardwareBackPress',
      () => {
        if (formModal) {
          setFormModal(null);
        } else {
          setThemeMenuOpen(false);
        }
        return true;
      },
    );
    return () => subscription.remove();
  }, [backClosesSomething, formModal]);

  const horizontalInsets = {
    paddingLeft: insets.left,
    paddingRight: insets.right,
  };

  return (
    <View style={styles.root}>
      <View
        style={[
          styles.screenArea,
          horizontalInsets,
          { paddingTop: insets.top + SCREEN_TOP_GAP },
        ]}
      >
        {tab === 'home' && (
          <HomeScreen onAddHabit={openNewHabit} onEditHabit={openEditHabit} />
        )}
        {tab === 'heatmap' && <HeatmapScreen />}
      </View>

      <View
        style={[
          styles.tabBar,
          { paddingBottom: tokens.space4 + insets.bottom },
        ]}
        onLayout={handleTabBarLayout}
      >
        {TABS.map(({ key, label }) => {
          const isActive = tab === key;
          return (
            <Pressable
              key={key}
              onPress={() => handleTabPress(key)}
              accessibilityRole="tab"
              accessibilityLabel={label}
              accessibilityState={{ selected: isActive }}
              style={[styles.navButton, isActive && styles.activeNavButton]}
            >
              <Icon
                kind={key}
                color={isActive ? tokens.accent : tokens.textMuted}
                size={20}
              />
            </Pressable>
          );
        })}

        <Pressable
          onPress={() => setThemeMenuOpen(open => !open)}
          accessibilityRole="button"
          accessibilityLabel="Theme"
          accessibilityState={{ expanded: themeMenuOpen }}
          style={[styles.navButton, styles.themeToggle]}
        >
          <Icon
            kind={theme === 'light' ? 'sun' : 'moon'}
            color={tokens.onPrimary}
            size={20}
          />
        </Pressable>
      </View>

      {themeMenuOpen && (
        <>
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={closeThemeMenu}
            accessibilityRole="button"
            accessibilityLabel="Close theme menu"
          />
          <View
            style={[
              styles.dropdownWrapper,
              {
                bottom: tabBarHeight + DROPDOWN_GAP,
                right: EDGE_OFFSET + insets.right,
              },
            ]}
            pointerEvents="box-none"
          >
            <View style={styles.dropdownPointer} />
            <View style={styles.dropdown}>
              <ThemeMenu />
            </View>
          </View>
        </>
      )}

      {formModal && (
        <View
          style={[
            styles.modalOverlay,
            horizontalInsets,
            {
              paddingTop: insets.top + MODAL_TOP_GAP,
              paddingBottom: insets.bottom,
            },
          ]}
        >
          <HabitFormScreen
            key={formModal.existingHabit?.id ?? 'new'}
            existingHabit={formModal.existingHabit}
            onDone={closeForm}
          />
          <Pressable
            onPress={closeForm}
            accessibilityRole="button"
            accessibilityLabel="Close"
            style={[
              styles.modalClose,
              {
                top: insets.top + MODAL_TOP_GAP + MODAL_CLOSE_OFFSET,
                right: EDGE_OFFSET + insets.right,
              },
            ]}
          >
            <Icon kind="close" color={tokens.accent} size={26} />
          </Pressable>
        </View>
      )}
    </View>
  );
}

function makeStyles(tokens: Tokens) {
  return StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: tokens.background,
    },
    screenArea: { flex: 1 },
    tabBar: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      gap: 50,
      borderTopWidth: 1,
      borderTopColor: tokens.border,
      backgroundColor: tokens.surface,
      paddingTop: tokens.space2,
    },
    navButton: {
      alignItems: 'center',
      justifyContent: 'center',
      width: 60,
      height: 60,
      borderRadius: 30,
    },
    activeNavButton: {
      backgroundColor: tokens.background,
      borderWidth: 1,
      borderColor: tokens.border,
    },
    themeToggle: {
      backgroundColor: tokens.primary,
      borderWidth: 1,
      borderColor: tokens.primary,
    },
    dropdownWrapper: {
      position: 'absolute',
      alignItems: 'flex-end',
    },
    dropdownPointer: {
      width: 0,
      height: 0,
      borderLeftWidth: 8,
      borderRightWidth: 8,
      borderTopWidth: 10,
      borderLeftColor: 'transparent',
      borderRightColor: 'transparent',
      borderTopColor: tokens.surface,
      marginBottom: -1,
      marginRight: 12,
    },
    dropdown: {
      backgroundColor: tokens.surface,
      borderRadius: tokens.radiusLg,
      borderWidth: 1,
      borderColor: tokens.border,
      padding: tokens.space3,
      shadowColor: tokens.shadow,
      shadowOpacity: 0.08,
      shadowRadius: 10,
      shadowOffset: { width: 0, height: 6 },
      elevation: 6,
    },
    modalOverlay: {
      position: 'absolute',
      top: 0,
      right: 0,
      bottom: 0,
      left: 0,
      backgroundColor: tokens.background,
    },
    modalClose: {
      position: 'absolute',
      width: 32,
      height: 32,
      alignItems: 'center',
      justifyContent: 'center',
    },
  });
}
