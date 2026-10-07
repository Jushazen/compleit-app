import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { MonthPicker } from '../components/MonthPicker';
import { useHabits } from '../context/HabitContext';
import { useNow } from '../hooks/useNow';
import { useThemedStyles, useTokens } from '../hooks/useTheme';
import {
  addDays,
  localDateToString,
  parseDateString,
  toDateString,
} from '../logic/dateUtils';
import {
  buildMonthGrid,
  countCompletionsByDate,
  dayDetails,
  intensityStep,
  selectionForMonth,
  shiftMonth,
} from '../logic/heatmap';
import type { Habit } from '../storage/types';
import type { Tokens } from '../theme/tokens';

interface YearMonth {
  year: number;
  /** 0-based, like `Date#getMonth`. */
  month: number;
}

const WEEKDAY_LABELS = ['Su', 'M', 'Tu', 'W', 'Th', 'F', 'Sa'];
const OUT_OF_MONTH_OPACITY = 0.35;

function firstDayOf({ year, month }: YearMonth): string {
  return toDateString(year, month + 1, 1);
}

function lastDayOf(view: YearMonth): string {
  return addDays(firstDayOf(shiftMonth(view, 1)), -1);
}

function toLocalDate(dateStr: string): Date {
  const { year, month, day } = parseDateString(dateStr);
  return new Date(year, month - 1, day);
}

function cellLabel(dateStr: string, count: number): string {
  const date = toLocalDate(dateStr).toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
  return `${date}, ${count} ${count === 1 ? 'completion' : 'completions'}`;
}

export function HeatmapScreen() {
  const { habits, completions } = useHabits();
  const tokens = useTokens();
  const styles = useThemedStyles(makeStyles);
  const todayStr = localDateToString(useNow());

  const [viewMonth, setViewMonth] = useState<YearMonth>(() => {
    const { year, month } = parseDateString(todayStr);
    return { year, month: month - 1 };
  });
  const [selectedDate, setSelectedDate] = useState(todayStr);
  const [pickerOpen, setPickerOpen] = useState(false);

  const grid = useMemo(
    () => buildMonthGrid(viewMonth.year, viewMonth.month),
    [viewMonth.year, viewMonth.month],
  );
  // Labels are memoized because useNow re-renders the screen every 30 seconds.
  const cells = useMemo(() => {
    const counts = countCompletionsByDate(
      habits,
      completions,
      grid[0].dateStr,
      grid[grid.length - 1].dateStr,
    );
    return grid.map(({ dateStr, inMonth }) => {
      const count = counts[dateStr] ?? 0;
      return {
        dateStr,
        inMonth,
        count,
        day: parseDateString(dateStr).day,
        label: cellLabel(dateStr, count),
      };
    });
  }, [grid, habits, completions]);
  const details = useMemo(
    () => dayDetails(habits, completions, selectedDate, todayStr),
    [habits, completions, selectedDate, todayStr],
  );

  // Going back selects the last day of the new month, going forward the first.
  const goToMonth = (delta: -1 | 1) => {
    const next = shiftMonth(viewMonth, delta);
    setViewMonth(next);
    setSelectedDate(delta < 0 ? lastDayOf(next) : firstDayOf(next));
  };

  const handleMonthSelect = (year: number, month: number) => {
    const next = { year, month };
    setViewMonth(next);
    setSelectedDate(selectionForMonth(next, todayStr));
    setPickerOpen(false);
  };

  const monthLabel = new Date(
    viewMonth.year,
    viewMonth.month,
    1,
  ).toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
  const hasDetails =
    details.completed.length > 0 ||
    details.inProgress.length > 0 ||
    details.missed.length > 0 ||
    details.upcoming.length > 0;

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Activity</Text>

      <View style={styles.card}>
        <View style={styles.monthNav}>
          <Pressable
            onPress={() => goToMonth(-1)}
            style={styles.navButton}
            accessibilityRole="button"
            accessibilityLabel="Previous month"
          >
            <Text style={styles.navIcon}>‹</Text>
          </Pressable>
          <Pressable
            onPress={() => setPickerOpen(true)}
            style={styles.monthButton}
            accessibilityRole="button"
            accessibilityLabel="Choose month"
            accessibilityValue={{ text: monthLabel }}
          >
            <Text style={styles.monthLabel}>{monthLabel}</Text>
            <Text style={styles.monthCaret}>▾</Text>
          </Pressable>
          <Pressable
            onPress={() => goToMonth(1)}
            style={styles.navButton}
            accessibilityRole="button"
            accessibilityLabel="Next month"
          >
            <Text style={styles.navIcon}>›</Text>
          </Pressable>
        </View>

        <View style={styles.weekdayRow}>
          {WEEKDAY_LABELS.map(label => (
            <Text key={label} style={styles.dayName}>
              {label}
            </Text>
          ))}
        </View>

        <View style={styles.calendarGrid}>
          {cells.map(({ dateStr, inMonth, count, day, label }) => {
            const isToday = dateStr === todayStr;
            const isSelected = dateStr === selectedDate;
            const fill =
              count > 0
                ? tokens.heatmapScale[intensityStep(count) - 1]
                : tokens.heatmapEmpty;

            return (
              <Pressable
                key={dateStr}
                onPress={() => setSelectedDate(dateStr)}
                style={styles.dateColumn}
                accessibilityRole="button"
                accessibilityLabel={label}
                accessibilityState={{ selected: isSelected }}
              >
                <View
                  style={[
                    styles.dateCell,
                    { backgroundColor: fill },
                    !inMonth && styles.outOfMonthCell,
                    (isToday || isSelected) && styles.highlightedCell,
                  ]}
                />
                <Text
                  style={[
                    styles.dateText,
                    !inMonth && styles.outOfMonthText,
                    isToday && styles.todayText,
                  ]}
                >
                  {day}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <ScrollView
        style={styles.details}
        contentContainerStyle={styles.detailsContent}
      >
        <DetailSection
          title="Completed"
          habits={details.completed}
          styles={styles}
        />
        <DetailSection
          title="In progress"
          habits={details.inProgress}
          styles={styles}
        />
        <DetailSection title="Missed" habits={details.missed} styles={styles} />
        <DetailSection
          title="Upcoming"
          habits={details.upcoming}
          styles={styles}
        />
        {!hasDetails && (
          <View style={styles.emptyStateBox}>
            <Text style={styles.emptyStateText}>
              No habits scheduled or completed on this day.
            </Text>
          </View>
        )}
      </ScrollView>

      <MonthPicker
        visible={pickerOpen}
        year={viewMonth.year}
        month={viewMonth.month}
        onSelect={handleMonthSelect}
        onClose={() => setPickerOpen(false)}
      />
    </View>
  );
}

function DetailSection({
  title,
  habits,
  styles,
}: {
  title: string;
  habits: Habit[];
  styles: ReturnType<typeof makeStyles>;
}) {
  if (habits.length === 0) {
    return null;
  }
  return (
    <View style={styles.detailSection}>
      <Text style={styles.detailTitle} accessibilityRole="header">
        {title}
      </Text>
      {habits.map(habit => (
        <Text key={habit.id} style={styles.detailItem}>
          {habit.title}
        </Text>
      ))}
    </View>
  );
}

function makeStyles(tokens: Tokens) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: tokens.background,
      paddingHorizontal: tokens.space6,
      paddingTop: tokens.space6,
      gap: tokens.space4,
    },
    header: {
      fontSize: 24,
      fontWeight: '600',
      color: tokens.text,
      marginBottom: tokens.space2,
    },
    card: {
      backgroundColor: tokens.surface,
      borderColor: tokens.border,
      borderWidth: 1,
      borderRadius: tokens.radiusLg,
      padding: tokens.space4,
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
    monthButton: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: tokens.space1,
      minHeight: 44,
      marginHorizontal: tokens.space2,
    },
    monthLabel: {
      fontSize: 16,
      fontWeight: '600',
      color: tokens.text,
    },
    monthCaret: {
      fontSize: 12,
      color: tokens.textMuted,
    },
    weekdayRow: {
      flexDirection: 'row',
      marginBottom: tokens.space1,
    },
    dayName: {
      width: '14.2857%',
      textAlign: 'center',
      fontSize: 10,
      fontWeight: '600',
      color: tokens.textMuted,
    },
    calendarGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
    },
    dateColumn: {
      width: '14.2857%',
      alignItems: 'center',
      marginBottom: tokens.space2,
    },
    dateCell: {
      width: '86%',
      aspectRatio: 1,
      borderRadius: 8,
      borderWidth: 1.5,
      borderColor: 'transparent',
    },
    outOfMonthCell: {
      opacity: OUT_OF_MONTH_OPACITY,
    },
    highlightedCell: {
      borderColor: tokens.primary,
    },
    dateText: {
      marginTop: tokens.space1,
      fontSize: 11,
      fontWeight: '500',
      textAlign: 'center',
      color: tokens.text,
    },
    outOfMonthText: {
      color: tokens.textMuted,
    },
    todayText: {
      fontWeight: '700',
    },
    details: {
      flex: 1,
    },
    detailsContent: {
      gap: tokens.space4,
      paddingBottom: tokens.space6,
    },
    detailSection: {
      gap: tokens.space2,
    },
    detailTitle: {
      fontSize: 13,
      fontWeight: '600',
      color: tokens.textMuted,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
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
  });
}
