import { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useThemedStyles } from '../hooks/useTheme';
import type { Tokens } from '../theme/tokens';

const MONTH_INDEXES = Array.from({ length: 12 }, (_, i) => i);
const SHORT_MONTHS = MONTH_INDEXES.map(i =>
  new Date(2000, i, 1).toLocaleDateString(undefined, { month: 'short' }),
);
const LONG_MONTHS = MONTH_INDEXES.map(i =>
  new Date(2000, i, 1).toLocaleDateString(undefined, { month: 'long' }),
);
const SCRIM_OPACITY = 0.4;

/** Modal month chooser: a year stepper over a 3×4 grid of months (`month` is 0-based). */
export function MonthPicker({
  visible,
  year: viewedYear,
  month: viewedMonth,
  onSelect,
  onClose,
}: {
  visible: boolean;
  year: number;
  month: number;
  onSelect: (year: number, month: number) => void;
  onClose: () => void;
}) {
  const styles = useThemedStyles(makeStyles);
  // The year shown in the picker; the stepper changes only this, not the screen.
  const [year, setYear] = useState(viewedYear);
  const [wasVisible, setWasVisible] = useState(visible);
  // Each time the picker opens, start from the viewed year again.
  if (visible !== wasVisible) {
    setWasVisible(visible);
    if (visible) {
      setYear(viewedYear);
    }
  }

  return (
    <Modal
      visible={visible}
      transparent
      statusBarTranslucent
      navigationBarTranslucent
      onRequestClose={onClose}
    >
      <View style={styles.root}>
        <Pressable
          style={styles.scrim}
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel="Close month picker"
        />
        <View style={styles.card}>
          <View style={styles.yearRow}>
            <Pressable
              onPress={() => setYear(year - 1)}
              style={styles.stepButton}
              accessibilityRole="button"
              accessibilityLabel="Previous year"
            >
              <Text style={styles.stepIcon}>‹</Text>
            </Pressable>
            <Text style={styles.yearLabel} accessibilityRole="header">
              {year}
            </Text>
            <Pressable
              onPress={() => setYear(year + 1)}
              style={styles.stepButton}
              accessibilityRole="button"
              accessibilityLabel="Next year"
            >
              <Text style={styles.stepIcon}>›</Text>
            </Pressable>
          </View>

          <View style={styles.monthGrid}>
            {MONTH_INDEXES.map(i => {
              const isSelected = year === viewedYear && i === viewedMonth;
              return (
                <View key={i} style={styles.monthSlot}>
                  <Pressable
                    onPress={() => onSelect(year, i)}
                    style={[
                      styles.monthButton,
                      isSelected && styles.monthButtonSelected,
                    ]}
                    accessibilityRole="button"
                    accessibilityLabel={`${LONG_MONTHS[i]} ${year}`}
                    accessibilityState={{ selected: isSelected }}
                  >
                    <Text
                      style={[
                        styles.monthText,
                        isSelected && styles.monthTextSelected,
                      ]}
                    >
                      {SHORT_MONTHS[i]}
                    </Text>
                  </Pressable>
                </View>
              );
            })}
          </View>
        </View>
      </View>
    </Modal>
  );
}

function makeStyles(tokens: Tokens) {
  return StyleSheet.create({
    root: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      padding: tokens.space6,
    },
    scrim: {
      ...StyleSheet.absoluteFill,
      backgroundColor: tokens.shadow,
      opacity: SCRIM_OPACITY,
    },
    card: {
      width: '100%',
      maxWidth: 360,
      backgroundColor: tokens.surface,
      borderColor: tokens.border,
      borderWidth: 1,
      borderRadius: tokens.radiusLg,
      padding: tokens.space4,
      gap: tokens.space4,
    },
    yearRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    stepButton: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: tokens.background,
      borderColor: tokens.border,
      borderWidth: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },
    stepIcon: {
      fontSize: 24,
      fontWeight: '600',
      color: tokens.text,
      lineHeight: 24,
    },
    yearLabel: {
      flex: 1,
      fontSize: 18,
      fontWeight: '600',
      color: tokens.text,
      textAlign: 'center',
    },
    monthGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
    },
    monthSlot: {
      width: '33.3333%',
      padding: tokens.space1,
    },
    monthButton: {
      minHeight: 48,
      borderRadius: tokens.radiusMd,
      alignItems: 'center',
      justifyContent: 'center',
    },
    monthButtonSelected: {
      backgroundColor: tokens.primary,
    },
    monthText: {
      fontSize: 15,
      fontWeight: '500',
      color: tokens.text,
    },
    monthTextSelected: {
      color: tokens.onPrimary,
      fontWeight: '700',
    },
  });
}
