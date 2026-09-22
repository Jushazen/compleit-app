import React, { useCallback, useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { useHabits } from '../context/HabitContext';
import { useSettings } from '../context/SettingsContext';
import { getTokens } from '../theme/tokens';
import { isScheduledOn } from '../logic/isScheduledOn';
import { calculateStreak } from '../logic/streaks/streak';
import { localDateToString } from '../logic/dateUtils';
import { Habit } from '../storage/types';

export function todaysHabits(habits: Habit[], now: Date): Habit[] {
  const todayStr = localDateToString(now);
  return habits.filter((h) =>
    isScheduledOn(h.schedule, todayStr, h.createdAt.slice(0, 10))
  );
}

function minutesSinceMidnight(hhmm: string): number {
  const [hours, minutes] = hhmm.split(':').map(Number);
  return hours * 60 + minutes;
}

/** "HH:mm" (24h, as stored) -> "h:mm AM/PM" for display. */
function formatClockTime(hhmm: string): string {
  const [hoursStr, minutesStr] = hhmm.split(':');
  const hours = Number(hoursStr);
  const period = hours >= 12 ? 'PM' : 'AM';
  const displayHour = hours % 12 === 0 ? 12 : hours % 12;
  return `${displayHour}:${minutesStr} ${period}`;
}

function formatTimeRange(habit: Habit): string {
  return `${formatClockTime(habit.schedule.startTime)} - ${formatClockTime(habit.schedule.endTime)}`;
}

function formatTarget(habit: Habit): string | null {
  return habit.target ? `Target: ${habit.target.amount} ${habit.target.unit}` : null;
}

type HabitBucket = 'missed' | 'due' | 'upcoming' | 'completed';

/** Which of the day's four sections a habit belongs in, given whether it's already completed and the current time-of-day. */
function bucketFor(habit: Habit, completed: boolean, currentMinutes: number): HabitBucket {
  if (completed) return 'completed';
  if (currentMinutes > minutesSinceMidnight(habit.schedule.endTime)) return 'missed';
  if (currentMinutes >= minutesSinceMidnight(habit.schedule.startTime)) return 'due';
  return 'upcoming';
}

const SECTIONS: { key: HabitBucket; title: string }[] = [
  { key: 'missed', title: 'Missed' },
  { key: 'due', title: 'Must complete' },
  { key: 'upcoming', title: 'Upcoming' },
  { key: 'completed', title: 'Completed' },
];

export interface HomeScreenProps {
  /** Injectable for tests — defaults to the real clock. */
  now?: () => Date;
  onAddHabit?: () => void;
}

export function HomeScreen({ now = () => new Date(), onAddHabit }: HomeScreenProps) {
  const { habits, completions, recordCompletion, deleteHabit } = useHabits();
  const { theme } = useSettings();
  const tokens = getTokens(theme);

  const [deleteTarget, setDeleteTarget] = useState<Habit | null>(null);

  const currentNow = now();
  const today = todaysHabits(habits, currentNow);

  const handleTap = useCallback(
    async (habit: Habit) => {
      const tapNow = now();
      await recordCompletion(habit.id, localDateToString(tapNow));
    },
    [now, recordCompletion]
  );

  const startDelete = useCallback((habit: Habit) => {
    setDeleteTarget(habit);
  }, []);

  const confirmDelete = useCallback(async () => {
    if (!deleteTarget) return;
    await deleteHabit(deleteTarget.id);
    setDeleteTarget(null);
  }, [deleteTarget, deleteHabit]);

  const cancelDelete = useCallback(() => {
    setDeleteTarget(null);
  }, []);

  const isCompletedToday = useCallback(
    (habitId: string) => {
      const todayStr = localDateToString(currentNow);
      return completions.some((c) => c.habitId === habitId && c.date === todayStr);
    },
    [completions, currentNow]
  );

  const completedCount = today.filter((h) => isCompletedToday(h.id)).length;

  const currentMinutes = currentNow.getHours() * 60 + currentNow.getMinutes();

  const sections = useMemo(() => {
    const buckets: Record<HabitBucket, Habit[]> = { missed: [], due: [], upcoming: [], completed: [] };
    for (const habit of today) {
      const bucket = bucketFor(habit, isCompletedToday(habit.id), currentMinutes);
      buckets[bucket].push(habit);
    }
    const byStartTime = (a: Habit, b: Habit) =>
      minutesSinceMidnight(a.schedule.startTime) - minutesSinceMidnight(b.schedule.startTime);
    (Object.keys(buckets) as HabitBucket[]).forEach((key) => buckets[key].sort(byStartTime));
    return buckets;
  }, [today, isCompletedToday, currentMinutes]);

  const styles = makeStyles(tokens);

  return (
    <View style={styles.container} testID="home-screen">
      <Text style={styles.header}>Today</Text>

      <View style={styles.ringCard} testID="ring-card">
        <Text style={styles.ringLabel}>
          {`${completedCount} of ${today.length} done`}
        </Text>
        {today.length > 0 && (
          <View style={styles.progressBarContainer}>
            <View
              style={[
                styles.progressBar,
                { width: `${(completedCount / today.length) * 100}%` },
              ]}
            />
          </View>
        )}
      </View>

      {habits.length === 0 && (
        <Text style={styles.emptyState} testID="home-empty-state">
          No habits yet. Add one to get started.
        </Text>
      )}

      {habits.length > 0 && today.length === 0 && (
        <Text style={styles.emptyState} testID="home-empty-today">
          Nothing scheduled today.
        </Text>
      )}

      {onAddHabit && (
        <Pressable onPress={onAddHabit} testID="home-add-habit" style={styles.addHabitButton}>
          <Text style={styles.addHabitLabel}>Add habit</Text>
        </Pressable>
      )}

      <ScrollView testID="today-habit-list">
        {SECTIONS.map(({ key, title }) => {
          const items = sections[key];
          if (items.length === 0) return null;

          return (
            <View style={styles.section} testID={`section-${key}`} key={key}>
              <Text style={styles.sectionTitle}>{`${title} (${items.length})`}</Text>
              {items.map((item) => (
                <HabitCard
                  key={item.id}
                  habit={item}
                  completed={key === 'completed'}
                  streak={calculateStreak(item, completions, currentNow)}
                  styles={styles}
                  onComplete={() => handleTap(item)}
                  onDelete={() => startDelete(item)}
                />
              ))}
            </View>
          );
        })}
      </ScrollView>

      {deleteTarget && (
        <View style={styles.confirmOverlay} testID="delete-confirm-overlay">
          <Text style={styles.confirmPrompt}>
            Delete "{deleteTarget.title}"?
          </Text>
          <Pressable onPress={confirmDelete} testID="delete-confirm-submit">
            <Text style={styles.confirmSubmitLabel}>Delete</Text>
          </Pressable>
          <Pressable onPress={cancelDelete} testID="delete-confirm-cancel">
            <Text style={styles.confirmCancelLabel}>Cancel</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

function HabitCard({
  habit,
  completed,
  streak,
  styles,
  onComplete,
  onDelete,
}: {
  habit: Habit;
  completed: boolean;
  streak: number;
  styles: ReturnType<typeof makeStyles>;
  onComplete: () => void;
  onDelete: () => void;
}) {
  const metaParts = [
    completed ? 'Completed today' : `${streak}-day streak`,
    formatTimeRange(habit),
    formatTarget(habit),
  ].filter((part): part is string => Boolean(part));

  return (
    <View style={styles.habitCard} testID={`habit-card-${habit.id}`}>
      <View style={styles.habitInfo}>
        <Text style={styles.habitTitle}>{habit.title}</Text>
        <Text style={styles.habitMeta}>{metaParts.join(' • ')}</Text>
      </View>
      <View style={styles.habitActions}>
        <Pressable
          onPress={onComplete}
          testID={`habit-complete-${habit.id}`}
          accessibilityRole="checkbox"
          accessibilityState={{ checked: completed }}
          style={[styles.completeButton, completed && styles.completeButtonActive]}
        >
          <Text style={[styles.completeButtonText, completed && styles.completeButtonTextActive]}>
            {completed ? '✓' : 'Complete'}
          </Text>
        </Pressable>
        <Pressable
          onPress={onDelete}
          testID={`habit-delete-${habit.id}`}
          accessibilityLabel={`Delete ${habit.title}`}
        >
          <Text style={styles.deleteLabel}>Delete</Text>
        </Pressable>
      </View>
    </View>
  );
}

function makeStyles(tokens: ReturnType<typeof getTokens>) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: tokens.background, paddingHorizontal: tokens.space6 },
    header: { fontSize: 24, fontWeight: '600', color: tokens.text, marginTop: tokens.space6, marginBottom: tokens.space6 },
    ringCard: { backgroundColor: tokens.surface, borderColor: tokens.border, borderWidth: 1, borderRadius: tokens.radiusLg, padding: tokens.space8, marginBottom: tokens.space8 },
    ringLabel: { fontSize: 15, fontWeight: '600', color: tokens.text, marginBottom: tokens.space3 },
    progressBarContainer: { height: 8, backgroundColor: tokens.border, borderRadius: 4, overflow: 'hidden' },
    progressBar: { height: '100%', backgroundColor: '#2D8659', borderRadius: 4 },
    emptyState: { fontSize: 14, color: tokens.textMuted, textAlign: 'center', marginBottom: tokens.space4 },
    addHabitButton: { backgroundColor: tokens.primary, borderRadius: tokens.radiusMd, paddingVertical: tokens.space3, alignItems: 'center', marginBottom: tokens.space4 },
    addHabitLabel: { color: tokens.onPrimary, fontSize: 14, fontWeight: '600' },
    section: { marginBottom: tokens.space6 },
    sectionTitle: {
      fontSize: 12,
      fontWeight: '700',
      color: tokens.textMuted,
      marginBottom: tokens.space2,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    habitCard: { backgroundColor: tokens.surface, borderColor: tokens.border, borderWidth: 1, borderRadius: tokens.radiusLg, padding: tokens.space6, marginBottom: tokens.space3, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    habitInfo: { flex: 1, marginRight: tokens.space4 },
    habitTitle: { fontSize: 15, fontWeight: '600', color: tokens.text },
    habitMeta: { fontSize: 13, color: tokens.textMuted, marginTop: 4 },
    habitActions: { flexDirection: 'row', gap: tokens.space3, alignItems: 'center' },
    completeButton: { backgroundColor: tokens.primary, borderRadius: tokens.radiusMd, paddingHorizontal: tokens.space3, paddingVertical: tokens.space2 },
    completeButtonActive: { backgroundColor: '#2D8659' },
    completeButtonText: { fontSize: 12, color: tokens.onPrimary, fontWeight: '600' },
    completeButtonTextActive: { color: '#FFFFFF' },
    deleteLabel: { fontSize: 13, color: tokens.textMuted },
    confirmOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: tokens.primary, padding: tokens.space6, justifyContent: 'center' },
    confirmPrompt: { color: tokens.onPrimary, fontSize: 15, marginBottom: tokens.space3 },
    confirmSubmitLabel: { color: tokens.onPrimary, fontSize: 15, fontWeight: '600', marginTop: tokens.space4 },
    confirmCancelLabel: { color: tokens.onPrimary, fontSize: 13, marginTop: tokens.space3, opacity: 0.7 },
  });
}
