import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { useHabits } from '../context/HabitContext';
import { useSettings } from '../context/SettingsContext';
import { getTokens } from '../theme/tokens';
import { isScheduledOn } from '../logic/isScheduledOn';
import { aggregateHeatmap } from '../logic/heatmap/aggregate';
import { localDateToString, addDays } from '../logic/dateUtils';
import { Habit, HabitCompletion } from '../storage/types';

const GREEN_PALETTE = ['#EBEDF0', '#CDECC3', '#9DDC93', '#43A047', '#1B5E20'];

/** Merges the per-habit aggregateHeatmap output across every habit into one day-by-day completion count, for a GitHub-style combined view rather than per-habit. */
export function mergeHeatmapAcrossHabits(
  habits: Habit[],
  completions: HabitCompletion[],
  startDateStr: string,
  endDateStr: string
): Record<string, { date: string; count: number }[]> {
  const perHabitResults = habits.map((h) =>
    aggregateHeatmap(h.id, completions, startDateStr, endDateStr)
  );

  const merged: Record<string, { date: string; count: number }[]> = {};
  // Walk day-by-day so months are grouped and ordered even if perHabitResults is empty (no habits yet).
  let cursor = startDateStr;
  while (cursor <= endDateStr) {
    const month = cursor.slice(0, 7);
    if (!merged[month]) merged[month] = [];
    const count = perHabitResults.reduce((sum, monthMap) => {
      const dayEntry = monthMap[month]?.find((d) => d.date === cursor);
      return sum + (dayEntry?.intensity ?? 0);
    }, 0);
    merged[month].push({ date: cursor, count });
    cursor = addDays(cursor, 1);
  }
  return merged;
}

/** 0-4 discrete intensity steps, derived from the accent color at decreasing opacity. */
export function intensityStep(count: number): 0 | 1 | 2 | 3 | 4 {
  if (count <= 0) return 0;
  if (count === 1) return 1;
  if (count === 2) return 2;
  if (count === 3) return 3;
  return 4;
}

const PALETTE_OPACITIES: Record<string, [number, number, number, number, number]> = {
  default: [0.08, 0.3, 0.5, 0.7, 1],
  mono: [0.1, 0.25, 0.4, 0.6, 0.85],
};

export interface HeatmapScreenProps {
  now?: () => Date;
  /** Days of history to show, ending today. Defaults to 35 (5 weeks) — enough to prove month-grouping without a huge render. */
  daysOfHistory?: number;
}

function buildMonthDays(currentMonth: Date): { date: Date; dateStr: string; inMonth: boolean }[] {
  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const firstOfMonth = new Date(year, month, 1);
  const lastOfMonth = new Date(year, month + 1, 0);
  const firstWeekday = firstOfMonth.getDay();
  const totalDays = lastOfMonth.getDate();
  const cells: { date: Date; dateStr: string; inMonth: boolean }[] = [];

  for (let i = 0; i < firstWeekday; i += 1) {
    const day = new Date(year, month, i - firstWeekday + 1);
    cells.push({ date: day, dateStr: localDateToString(day), inMonth: false });
  }

  for (let day = 1; day <= totalDays; day += 1) {
    const date = new Date(year, month, day);
    cells.push({ date, dateStr: localDateToString(date), inMonth: true });
  }

  while (cells.length % 7 !== 0) {
    const last = cells[cells.length - 1].date;
    const next = new Date(last.getFullYear(), last.getMonth(), last.getDate() + 1);
    cells.push({ date: next, dateStr: localDateToString(next), inMonth: false });
  }

  return cells;
}

function getDisplayedMonthLabel(date: Date): string {
  return date.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
}

export function HeatmapScreen({ now = () => new Date(), daysOfHistory = 35 }: HeatmapScreenProps) {
  const { habits, completions } = useHabits();
  const { theme, heatmapPalette } = useSettings();
  const tokens = getTokens(theme);
  const styles = makeStyles(tokens);

  const today = now();
  const todayStr = localDateToString(today);
  const [viewMonth, setViewMonth] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1));
  const [selectedDate, setSelectedDate] = useState(todayStr);

  const monthKey = `${viewMonth.getFullYear()}-${String(viewMonth.getMonth() + 1).padStart(2, '0')}`;
  const startStr = addDays(`${viewMonth.getFullYear()}-${String(viewMonth.getMonth() + 1).padStart(2, '0')}-01`, -(daysOfHistory - 1));
  const monthDays = useMemo(() => buildMonthDays(viewMonth), [viewMonth]);

  const merged = useMemo(
    () => mergeHeatmapAcrossHabits(habits, completions, startStr, todayStr),
    [habits, completions, startStr, todayStr]
  );

  const monthCounts = useMemo(
    () => merged[monthKey] ?? [],
    [merged, monthKey]
  );
  const countMap = useMemo(
    () => Object.fromEntries(monthCounts.map((entry) => [entry.date, entry.count])),
    [monthCounts]
  );
  const opacities = PALETTE_OPACITIES[heatmapPalette] ?? PALETTE_OPACITIES.default;

  const scheduledHabits = useMemo(
    () =>
      habits.filter((habit) =>
        isScheduledOn(habit.schedule, selectedDate, habit.createdAt.slice(0, 10))
      ),
    [habits, selectedDate]
  );

  const completedHabits = useMemo(
    () => habits.filter((habit) => completions.some((completion) => completion.habitId === habit.id && completion.date === selectedDate)),
    [completions, habits, selectedDate]
  );

  const handlePrevMonth = () => {
    setViewMonth((prev) => {
      const next = new Date(prev.getFullYear(), prev.getMonth() - 1, 1);
      const lastDayOfPrevMonth = new Date(next.getFullYear(), next.getMonth() + 1, 0);
      setSelectedDate(localDateToString(lastDayOfPrevMonth));
      return next;
    });
  };

  const handleNextMonth = () => {
    setViewMonth((prev) => {
      const next = new Date(prev.getFullYear(), prev.getMonth() + 1, 1);
      setSelectedDate(localDateToString(new Date(next.getFullYear(), next.getMonth(), 1)));
      return next;
    });
  };

  const selectedHasProgress = (countMap[selectedDate] ?? 0) > 0;
  const selectedIsToday = selectedDate === todayStr;

  return (
    <View style={styles.container} testID="heatmap-screen">
      <Text style={styles.header}>Activity</Text>

      <View style={styles.column}>
        <View style={styles.card}>
          <View style={styles.monthNav}>
            <Pressable onPress={handlePrevMonth} style={styles.navButton} accessibilityRole="button">
              <Text style={styles.navIcon}>‹</Text>
            </Pressable>
            <Text style={styles.monthLabel}>{getDisplayedMonthLabel(viewMonth)}</Text>
            <Pressable onPress={handleNextMonth} style={styles.navButton} accessibilityRole="button">
              <Text style={styles.navIcon}>›</Text>
            </Pressable>
          </View>

          <View style={styles.weekdayRow}>
            {['Su', 'M', 'Tu', 'W', 'Th', 'F', 'Sa'].map((day) => (
              <Text key={day} style={styles.dayName}>{day}</Text>
            ))}
          </View>

          <View style={styles.calendarGrid}>
            {monthDays.map(({ dateStr, inMonth }) => {
              const dayCount = countMap[dateStr] ?? 0;
              const hasProgress = dayCount > 0;
              const step = intensityStep(dayCount);
              const isToday = dateStr === todayStr;
              const isSelected = dateStr === selectedDate;
              const fill = hasProgress ? GREEN_PALETTE[step] : '#F4F0E9';
              const cellOpacity = inMonth ? (hasProgress ? opacities[step] : 0.75) : 0.35;
              const borderStyle = isSelected || isToday
                ? { borderColor: tokens.primary, borderWidth: 1.5 }
                : { borderColor: 'transparent', borderWidth: 0 };

              return (
                <View key={dateStr} style={styles.dateColumn}>
                  <Pressable
                    onPress={() => setSelectedDate(dateStr)}
                    style={[styles.dateCell, { backgroundColor: fill, opacity: cellOpacity }, borderStyle]}
                    testID={`heatmap-day-${dateStr}`}
                  />
                  <Text
                    style={[
                      styles.dateText,
                      inMonth ? styles.inMonthText : styles.outOfMonthText,
                      isToday && styles.todayText,
                    ]}
                  >
                    {new Date(dateStr).getDate()}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>

        <View style={styles.detailsColumn}>
          {selectedIsToday && scheduledHabits.length > 0 && (
            <View style={styles.detailSection}>
              <Text style={styles.detailTitle}>Current habits</Text>
              <ScrollView style={styles.detailList} contentContainerStyle={styles.detailListContent}>
                {scheduledHabits.map((habit) => (
                  <Text key={habit.id} style={styles.detailItem}>{habit.title}</Text>
                ))}
              </ScrollView>
            </View>
          )}

          {(selectedHasProgress || completedHabits.length > 0) && (
            <View style={styles.detailSection}>
              <Text style={styles.detailTitle}>Completed habits</Text>
              <ScrollView style={styles.detailList} contentContainerStyle={styles.detailListContent}>
                {completedHabits.map((habit) => (
                  <Text key={habit.id} style={styles.detailItem}>{habit.title}</Text>
                ))}
              </ScrollView>
            </View>
          )}

          {!selectedHasProgress && !scheduledHabits.length && (
            <View style={styles.emptyStateBox}>
              <Text style={styles.emptyStateText}>No activity recorded for this day.</Text>
            </View>
          )}
        </View>
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
    header: {
      fontSize: 24,
      fontWeight: '600',
      color: tokens.text,
      marginBottom: tokens.space6,
    },
    column: {
      flex: 1,
      gap: tokens.space4,
    },
    card: {
      backgroundColor: tokens.surface,
      borderColor: tokens.border,
      borderWidth: 1,
      borderRadius: tokens.radiusLg,
      padding: tokens.space4,
      elevation: 0,
    },
    monthNav: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: tokens.space4,
    },
    navButton: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: tokens.background,
      borderColor: tokens.border,
      borderWidth: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },
    navIcon: {
      fontSize: 22,
      fontWeight: '600',
      color: tokens.text,
      lineHeight: 22,
    },
    monthLabel: {
      fontSize: 16,
      fontWeight: '600',
      color: tokens.text,
      textAlign: 'center',
      flex: 1,
    },
    weekdayRow: {
      flexDirection: 'row',
      width: '100%',
      justifyContent: 'space-between',
      marginBottom: 4,
    },
    calendarGrid: {
      width: '100%',
      flexDirection: 'row',
      flexWrap: 'wrap',
      alignItems: 'flex-start',
    },
    dayName: {
      width: '14.2857%',
      textAlign: 'center',
      fontSize: 10,
      color: tokens.textMuted,
      fontWeight: '600',
    },
    dateColumn: {
      width: '14.2857%',
      alignItems: 'center',
      marginBottom: 8,
    },
    dateCell: {
      width: '86%',
      aspectRatio: 1,
      borderRadius: 8,
      borderWidth: 1,
    },
    dateText: {
      marginTop: 4,
      fontSize: 11,
      textAlign: 'center',
    },
    detailsColumn: {
      flex: 1,
      gap: tokens.space4,
    },
    detailSection: {
      flex: 1,
      minHeight: 120,
    },
    detailTitle: {
      fontSize: 13,
      fontWeight: '600',
      color: tokens.textMuted,
      marginBottom: tokens.space2,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    detailList: {
      flex: 1,
      maxHeight: 220,
    },
    detailListContent: {
      gap: tokens.space2,
    },
    detailItem: {
      backgroundColor: tokens.surface,
      borderColor: tokens.border,
      borderWidth: 1,
      borderRadius: tokens.radiusMd,
      paddingHorizontal: tokens.space3,
      paddingVertical: tokens.space2,
      color: tokens.text,
      fontSize: 14,
    },
    emptyStateBox: {
      backgroundColor: tokens.surface,
      borderColor: tokens.border,
      borderWidth: 1,
      borderRadius: tokens.radiusLg,
      padding: tokens.space4,
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: 120,
    },
    emptyStateText: {
      color: tokens.textMuted,
      fontSize: 13,
      textAlign: 'center',
    },
    inMonthText: {
      color: tokens.text,
      fontWeight: '500',
    },
    outOfMonthText: {
      color: tokens.textMuted,
      fontWeight: '500',
    },
    todayText: {
      fontWeight: '700',
    },
  });
}
