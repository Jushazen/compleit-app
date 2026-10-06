import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Icon } from '../components/icons';
import { useHabits } from '../context/HabitContext';
import { useNow } from '../hooks/useNow';
import { useThemedStyles, useTokens } from '../hooks/useTheme';
import { groupTodaysHabits, type HabitBucket } from '../logic/buckets';
import { localDateToString } from '../logic/dateUtils';
import { describeSchedule } from '../logic/schedule';
import { calculateStreak } from '../logic/streak';
import { formatClockTime } from '../logic/time';
import type { Habit } from '../storage/types';
import type { Tokens } from '../theme/tokens';

const SECTIONS: readonly { key: HabitBucket; title: string }[] = [
  { key: 'missed', title: 'Missed' },
  { key: 'due', title: 'Must complete' },
  { key: 'upcoming', title: 'Upcoming' },
  { key: 'completed', title: 'Completed' },
];

type Styles = ReturnType<typeof makeStyles>;

interface HomeScreenProps {
  onAddHabit: () => void;
  onEditHabit: (habit: Habit) => void;
}

export function HomeScreen({ onAddHabit, onEditHabit }: HomeScreenProps) {
  const { habits, completions, isLoading, recordCompletion, deleteHabit } =
    useHabits();
  const styles = useThemedStyles(makeStyles);
  const tokens = useTokens();
  const now = useNow();

  const groups = useMemo(
    () => groupTodaysHabits(habits, completions, now),
    [habits, completions, now],
  );
  const scheduledCount = SECTIONS.reduce(
    (count, { key }) => count + groups[key].length,
    0,
  );
  const completedCount = groups.completed.length;

  // Home lists only today's schedule; this collapsible list keeps every habit reachable.
  const [allExpanded, setAllExpanded] = useState(false);
  const habitsByTitle = useMemo(
    () => [...habits].sort((a, b) => a.title.localeCompare(b.title)),
    [habits],
  );

  const completeHabit = async (habit: Habit) => {
    try {
      // Use the tap time, not the (up to 30 s old) render clock.
      await recordCompletion(habit.id, localDateToString(new Date()));
    } catch {
      Alert.alert(
        'Could not save',
        `"${habit.title}" was not marked complete. Please try again.`,
      );
    }
  };

  const confirmDelete = (habit: Habit) => {
    Alert.alert(`Delete "${habit.title}"?`, 'Its history will be removed.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteHabit(habit.id);
          } catch {
            Alert.alert(
              'Could not delete',
              `"${habit.title}" was not deleted. Please try again.`,
            );
          }
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header} accessibilityRole="header">
        Today
      </Text>

      {isLoading ? (
        <ActivityIndicator
          style={styles.loading}
          size="large"
          color={tokens.textMuted}
          accessibilityLabel="Loading habits"
        />
      ) : (
        <>
          <View style={styles.progressCard}>
            <Text style={styles.progressLabel}>
              {`${completedCount} of ${scheduledCount} done`}
            </Text>
            {scheduledCount > 0 && (
              <View
                style={styles.progressTrack}
                accessibilityRole="progressbar"
                accessibilityValue={{
                  min: 0,
                  max: scheduledCount,
                  now: completedCount,
                }}
              >
                <View
                  style={[
                    styles.progressFill,
                    { width: `${(completedCount / scheduledCount) * 100}%` },
                  ]}
                />
              </View>
            )}
          </View>

          {habits.length === 0 && (
            <Text style={styles.emptyState}>
              No habits yet. Add one to get started.
            </Text>
          )}
          {habits.length > 0 && scheduledCount === 0 && (
            <Text style={styles.emptyState}>Nothing scheduled today.</Text>
          )}

          <Pressable
            onPress={onAddHabit}
            style={styles.addHabitButton}
            accessibilityRole="button"
          >
            <Text style={styles.addHabitLabel}>Add habit</Text>
          </Pressable>

          <ScrollView>
            {SECTIONS.map(({ key, title }) => {
              const sectionHabits = groups[key];
              if (sectionHabits.length === 0) {
                return null;
              }
              return (
                <View style={styles.section} key={key}>
                  <Text style={styles.sectionTitle} accessibilityRole="header">
                    {`${title} (${sectionHabits.length})`}
                  </Text>
                  {sectionHabits.map(habit => (
                    <HabitCard
                      key={habit.id}
                      habit={habit}
                      completed={key === 'completed'}
                      streak={calculateStreak(habit, completions, now)}
                      styles={styles}
                      onComplete={() => completeHabit(habit)}
                      onEdit={() => onEditHabit(habit)}
                      onDelete={() => confirmDelete(habit)}
                    />
                  ))}
                </View>
              );
            })}
            {habits.length > 0 && (
              <View style={styles.section}>
                <Pressable
                  onPress={() => setAllExpanded(expanded => !expanded)}
                  style={styles.allHabitsToggle}
                  hitSlop={8}
                  accessibilityRole="button"
                  accessibilityLabel="All habits"
                  accessibilityState={{ expanded: allExpanded }}
                >
                  <Icon
                    kind={allExpanded ? 'minus' : 'plus'}
                    color={tokens.textMuted}
                    size={14}
                  />
                  <Text style={[styles.sectionTitle, styles.allHabitsLabel]}>
                    {`All habits (${habits.length})`}
                  </Text>
                </Pressable>
                {allExpanded &&
                  habitsByTitle.map(habit => (
                    <AllHabitsRow
                      key={habit.id}
                      habit={habit}
                      styles={styles}
                      onEdit={() => onEditHabit(habit)}
                      onDelete={() => confirmDelete(habit)}
                    />
                  ))}
              </View>
            )}
          </ScrollView>
        </>
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
  onEdit,
  onDelete,
}: {
  habit: Habit;
  completed: boolean;
  streak: number;
  styles: Styles;
  onComplete: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const { schedule, target } = habit;
  const notes = habit.notes.trim();
  const meta = [
    completed ? 'Completed today' : `${streak}-day streak`,
    `${formatClockTime(schedule.startTime)} - ${formatClockTime(
      schedule.endTime,
    )}`,
    target && `Target: ${target.amount} ${target.unit}`,
  ]
    .filter(Boolean)
    .join(' • ');

  return (
    <View style={styles.habitCard}>
      <View style={styles.habitInfo}>
        <Text style={styles.habitTitle} numberOfLines={2}>
          {habit.title}
        </Text>
        {notes !== '' && (
          <Text style={styles.habitNotes} numberOfLines={3}>
            {notes}
          </Text>
        )}
        <Text style={styles.habitMeta}>{meta}</Text>
      </View>
      <View style={styles.habitActions}>
        <Pressable
          onPress={onComplete}
          disabled={completed}
          accessibilityRole="checkbox"
          accessibilityState={{ checked: completed, disabled: completed }}
          accessibilityLabel={`Complete ${habit.title}`}
          style={[
            styles.completeButton,
            completed && styles.completeButtonDone,
          ]}
        >
          <Text
            style={[
              styles.completeButtonLabel,
              completed && styles.completeButtonLabelDone,
            ]}
          >
            {completed ? '✓' : 'Complete'}
          </Text>
        </Pressable>
        <Pressable
          onPress={onEdit}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel={`Edit ${habit.title}`}
        >
          <Text style={styles.secondaryActionLabel}>Edit</Text>
        </Pressable>
        <Pressable
          onPress={onDelete}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel={`Delete ${habit.title}`}
        >
          <Text style={styles.secondaryActionLabel}>Delete</Text>
        </Pressable>
      </View>
    </View>
  );
}

function AllHabitsRow({
  habit,
  styles,
  onEdit,
  onDelete,
}: {
  habit: Habit;
  styles: Styles;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const { schedule, target } = habit;
  const meta = [
    describeSchedule(habit),
    `${formatClockTime(schedule.startTime)} - ${formatClockTime(
      schedule.endTime,
    )}`,
    target && `Target: ${target.amount} ${target.unit}`,
  ]
    .filter(Boolean)
    .join(' • ');

  return (
    <View style={styles.allHabitsRow}>
      <View style={styles.habitInfo}>
        <Text style={styles.habitTitle} numberOfLines={2}>
          {habit.title}
        </Text>
        <Text style={styles.habitMeta}>{meta}</Text>
      </View>
      <View style={styles.habitActions}>
        <Pressable
          onPress={onEdit}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel={`Edit ${habit.title}`}
        >
          <Text style={styles.secondaryActionLabel}>Edit</Text>
        </Pressable>
        <Pressable
          onPress={onDelete}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel={`Delete ${habit.title}`}
        >
          <Text style={styles.secondaryActionLabel}>Delete</Text>
        </Pressable>
      </View>
    </View>
  );
}

function makeStyles(tokens: Tokens) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: tokens.background,
      paddingHorizontal: tokens.space6,
    },
    header: {
      fontSize: 24,
      fontWeight: '600',
      color: tokens.text,
      marginVertical: tokens.space6,
    },
    loading: { marginTop: tokens.space8 },
    progressCard: {
      backgroundColor: tokens.surface,
      borderColor: tokens.border,
      borderWidth: 1,
      borderRadius: tokens.radiusLg,
      padding: tokens.space8,
      marginBottom: tokens.space8,
    },
    progressLabel: {
      fontSize: 15,
      fontWeight: '600',
      color: tokens.text,
      marginBottom: tokens.space3,
    },
    progressTrack: {
      height: 8,
      backgroundColor: tokens.border,
      borderRadius: 4,
      overflow: 'hidden',
    },
    progressFill: {
      height: '100%',
      backgroundColor: tokens.success,
      borderRadius: 4,
    },
    emptyState: {
      fontSize: 14,
      color: tokens.textMuted,
      textAlign: 'center',
      marginBottom: tokens.space4,
    },
    addHabitButton: {
      backgroundColor: tokens.primary,
      borderRadius: tokens.radiusMd,
      paddingVertical: tokens.space3,
      alignItems: 'center',
      marginBottom: tokens.space4,
    },
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
    habitCard: {
      backgroundColor: tokens.surface,
      borderColor: tokens.border,
      borderWidth: 1,
      borderRadius: tokens.radiusLg,
      padding: tokens.space6,
      marginBottom: tokens.space3,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    habitInfo: { flex: 1, marginRight: tokens.space4 },
    habitTitle: { fontSize: 15, fontWeight: '600', color: tokens.text },
    habitNotes: { fontSize: 13, color: tokens.text, marginTop: tokens.space1 },
    habitMeta: {
      fontSize: 13,
      color: tokens.textMuted,
      marginTop: tokens.space1,
    },
    habitActions: {
      flexDirection: 'row',
      gap: tokens.space3,
      alignItems: 'center',
    },
    completeButton: {
      backgroundColor: tokens.primary,
      borderRadius: tokens.radiusMd,
      paddingHorizontal: tokens.space3,
      paddingVertical: tokens.space2,
    },
    completeButtonDone: { backgroundColor: tokens.success },
    completeButtonLabel: {
      fontSize: 12,
      color: tokens.onPrimary,
      fontWeight: '600',
    },
    completeButtonLabelDone: { color: tokens.onSuccess },
    secondaryActionLabel: { fontSize: 13, color: tokens.textMuted },
    allHabitsToggle: {
      flexDirection: 'row',
      alignItems: 'center',
      alignSelf: 'flex-start',
      gap: tokens.space2,
      paddingVertical: tokens.space2,
    },
    allHabitsLabel: { marginBottom: 0 },
    allHabitsRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: tokens.space3,
      borderBottomColor: tokens.border,
      borderBottomWidth: StyleSheet.hairlineWidth,
    },
  });
}
