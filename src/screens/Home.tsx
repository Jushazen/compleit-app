import React, { useCallback, useState } from 'react';
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

      {onAddHabit && (
        <Pressable onPress={onAddHabit} testID="home-add-habit" style={styles.addHabitButton}>
          <Text style={styles.addHabitLabel}>Add habit</Text>
        </Pressable>
      )}

      <ScrollView testID="today-habit-list">
        {today.map((item) => {
          const completed = isCompletedToday(item.id);
          const streak = calculateStreak(item, completions, currentNow);
          return (
            <View style={styles.habitCard} testID={`habit-card-${item.id}`} key={item.id}>
              <View style={styles.habitInfo}>
                <Text style={styles.habitTitle}>{item.title}</Text>
                <Text style={styles.habitMeta}>
                  {completed ? 'Completed today' : `${streak}-day streak`}
                </Text>
              </View>
              <View style={styles.habitActions}>
                <Pressable
                  onPress={() => handleTap(item)}
                  testID={`habit-complete-${item.id}`}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: completed }}
                  style={[
                    styles.completeButton,
                    completed && styles.completeButtonActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.completeButtonText,
                      completed && styles.completeButtonTextActive,
                    ]}
                  >
                    {completed ? '✓' : 'Complete'}
                  </Text>
                </Pressable>
                <Pressable
                  onPress={() => startDelete(item)}
                  testID={`habit-delete-${item.id}`}
                  accessibilityLabel={`Delete ${item.title}`}
                >
                  <Text style={styles.deleteLabel}>Delete</Text>
                </Pressable>
              </View>
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
