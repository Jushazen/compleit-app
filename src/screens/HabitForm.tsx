import { useRef, useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useHabits } from '../context/HabitContext';
import { useThemedStyles, useTokens } from '../hooks/useTheme';
import { dateToTime, formatClockTime, timeToDate } from '../logic/time';
import {
  draftFromHabit,
  parseTargetAmount,
  validateHabitDraft,
  type HabitDraft,
} from '../logic/validation';
import type { Tokens } from '../theme/tokens';
import type {
  DayOfWeek,
  Habit,
  HabitSchedule,
  HabitTarget,
  RepeatMode,
} from '../storage/types';

type DraftErrors = ReturnType<typeof validateHabitDraft>;
type ErrorField = keyof DraftErrors;
type TimeField = 'startTime' | 'endTime';

const REPEAT_MODES: RepeatMode[] = ['daily', 'weekly', 'custom'];

const DAYS: { label: string; name: string; value: DayOfWeek }[] = [
  { label: 'Sun', name: 'Sunday', value: 0 },
  { label: 'Mon', name: 'Monday', value: 1 },
  { label: 'Tue', name: 'Tuesday', value: 2 },
  { label: 'Wed', name: 'Wednesday', value: 3 },
  { label: 'Thu', name: 'Thursday', value: 4 },
  { label: 'Fri', name: 'Friday', value: 5 },
  { label: 'Sat', name: 'Saturday', value: 6 },
];

const EMPTY_DRAFT: HabitDraft = {
  title: '',
  notes: '',
  repeat: 'daily',
  days: [],
  startTime: '09:00',
  endTime: '17:00',
  targetUnit: '',
  targetAmount: '',
};

/** The validation error each draft field feeds, so editing a field clears its message. */
const ERROR_FOR_FIELD: Partial<Record<keyof HabitDraft, ErrorField>> = {
  title: 'title',
  repeat: 'days',
  days: 'days',
  startTime: 'time',
  endTime: 'time',
  targetUnit: 'target',
  targetAmount: 'target',
};

function makeId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function buildTarget(draft: HabitDraft): HabitTarget | undefined {
  const unit = draft.targetUnit.trim();
  const amount = parseTargetAmount(draft.targetAmount);
  // validateHabitDraft guarantees unit and amount are both present or both blank.
  return unit && amount !== null ? { unit, amount } : undefined;
}

function buildSchedule(draft: HabitDraft): HabitSchedule {
  return {
    repeat: draft.repeat,
    days: draft.repeat === 'custom' ? draft.days : [],
    startTime: draft.startTime,
    endTime: draft.endTime,
  };
}

type HabitFormProps = {
  existingHabit?: Habit;
  onDone: () => void;
};

export function HabitFormScreen({ existingHabit, onDone }: HabitFormProps) {
  const { habits, addHabit, updateHabit } = useHabits();
  const tokens = useTokens();
  const styles = useThemedStyles(makeStyles);

  const [draft, setDraft] = useState<HabitDraft>(() =>
    existingHabit ? draftFromHabit(existingHabit) : EMPTY_DRAFT,
  );
  const [errors, setErrors] = useState<DraftErrors>({});
  const [pickerField, setPickerField] = useState<TimeField | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  // A ref, unlike state, also blocks a second tap that lands before the re-render.
  const submittingRef = useRef(false);

  function updateField<K extends keyof HabitDraft>(
    field: K,
    value: HabitDraft[K],
  ) {
    setDraft(prev => ({ ...prev, [field]: value }));
    const errorField = ERROR_FOR_FIELD[field];
    if (errorField) {
      setErrors(prev => ({ ...prev, [errorField]: undefined }));
    }
  }

  function toggleDay(day: DayOfWeek) {
    // Functional update so two quick taps before a re-render both register.
    setDraft(prev => ({
      ...prev,
      days: prev.days.includes(day)
        ? prev.days.filter(d => d !== day)
        : [...prev.days, day].sort((a, b) => a - b),
    }));
    setErrors(prev => ({ ...prev, days: undefined }));
  }

  // The Android dialog closes itself on confirm or cancel; unmount it to match.
  function handleTimeConfirm(_event: unknown, date: Date) {
    const field = pickerField;
    setPickerField(null);
    if (field) {
      updateField(field, dateToTime(date));
    }
  }

  function handleTimeDismiss() {
    setPickerField(null);
  }

  async function handleSubmit() {
    if (submittingRef.current) {
      return;
    }
    const validationErrors = validateHabitDraft(
      draft,
      habits,
      existingHabit?.id,
    );
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) {
      return;
    }

    const title = draft.title.trim();
    const notes = draft.notes;
    const schedule = buildSchedule(draft);
    const target = buildTarget(draft);

    submittingRef.current = true;
    setIsSubmitting(true);
    try {
      if (existingHabit) {
        await updateHabit({ ...existingHabit, title, notes, schedule, target });
      } else {
        await addHabit({
          id: makeId(),
          title,
          notes,
          schedule,
          target,
          createdAt: new Date().toISOString(),
        });
      }
    } catch {
      submittingRef.current = false;
      setIsSubmitting(false);
      Alert.alert(
        'Could not save habit',
        'Something went wrong while saving. Please try again.',
      );
      return;
    }
    onDone();
  }

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.container}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={styles.label}>Title</Text>
      <TextInput
        style={[styles.input, errors.title && styles.inputInvalid]}
        value={draft.title}
        onChangeText={text => updateField('title', text)}
        placeholder="Habit title"
        placeholderTextColor={tokens.textMuted}
        accessibilityLabel="Title"
      />
      <FieldError message={errors.title} />

      <Text style={styles.label}>Notes</Text>
      <TextInput
        style={styles.input}
        value={draft.notes}
        onChangeText={text => updateField('notes', text)}
        placeholder="Optional notes"
        placeholderTextColor={tokens.textMuted}
        accessibilityLabel="Notes"
      />

      <Text style={styles.label}>Track a target amount (optional)</Text>
      <View style={styles.targetRow}>
        <View style={styles.targetUnit}>
          <Text style={styles.targetFieldLabel}>What are you tracking?</Text>
          <TextInput
            style={[styles.input, errors.target && styles.inputInvalid]}
            value={draft.targetUnit}
            onChangeText={text => updateField('targetUnit', text)}
            placeholder="e.g. pages, glasses, minutes"
            placeholderTextColor={tokens.textMuted}
            accessibilityLabel="What are you tracking?"
          />
        </View>
        <View style={styles.targetAmount}>
          <Text style={styles.targetFieldLabel}>Target</Text>
          <TextInput
            style={[styles.input, errors.target && styles.inputInvalid]}
            value={draft.targetAmount}
            onChangeText={text => updateField('targetAmount', text)}
            placeholder="e.g. 20"
            placeholderTextColor={tokens.textMuted}
            keyboardType="decimal-pad"
            accessibilityLabel="Target amount"
          />
        </View>
      </View>
      <FieldError message={errors.target} />

      <Text style={styles.label}>Repeat</Text>
      <View style={styles.segmented} accessibilityRole="radiogroup">
        {REPEAT_MODES.map(mode => {
          const selected = draft.repeat === mode;
          return (
            <Pressable
              key={mode}
              onPress={() => updateField('repeat', mode)}
              style={[styles.segment, selected && styles.segmentSelected]}
              accessibilityRole="radio"
              accessibilityLabel={`Repeat ${mode}`}
              accessibilityState={{ checked: selected }}
            >
              <Text
                style={[
                  styles.segmentLabel,
                  selected && styles.segmentLabelSelected,
                ]}
              >
                {mode}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {draft.repeat === 'custom' && (
        <>
          <View style={styles.dayRow}>
            {DAYS.map(({ label, name, value }) => {
              const selected = draft.days.includes(value);
              return (
                <Pressable
                  key={value}
                  onPress={() => toggleDay(value)}
                  style={[styles.dayChip, selected && styles.dayChipSelected]}
                  accessibilityRole="checkbox"
                  accessibilityLabel={name}
                  accessibilityState={{ checked: selected }}
                >
                  <Text style={styles.dayChipLabel}>{label}</Text>
                </Pressable>
              );
            })}
          </View>
          <FieldError message={errors.days} />
        </>
      )}

      <Text style={styles.label}>Start time</Text>
      <Pressable
        style={[styles.timeButton, errors.time && styles.inputInvalid]}
        onPress={() => setPickerField('startTime')}
        accessibilityRole="button"
        accessibilityLabel={`Start time, ${formatClockTime(draft.startTime)}`}
        accessibilityHint="Opens a time picker"
      >
        <Text style={styles.timeText}>{formatClockTime(draft.startTime)}</Text>
      </Pressable>

      <Text style={styles.label}>End time</Text>
      <Pressable
        style={[styles.timeButton, errors.time && styles.inputInvalid]}
        onPress={() => setPickerField('endTime')}
        accessibilityRole="button"
        accessibilityLabel={`End time, ${formatClockTime(draft.endTime)}`}
        accessibilityHint="Opens a time picker"
      >
        <Text style={styles.timeText}>{formatClockTime(draft.endTime)}</Text>
      </Pressable>
      <FieldError message={errors.time} />

      {pickerField && (
        <DateTimePicker
          value={timeToDate(draft[pickerField])}
          mode="time"
          display="spinner"
          is24Hour={false}
          onValueChange={handleTimeConfirm}
          onDismiss={handleTimeDismiss}
        />
      )}

      <Pressable
        style={[styles.submitButton, isSubmitting && styles.submitDisabled]}
        onPress={handleSubmit}
        disabled={isSubmitting}
        accessibilityRole="button"
        accessibilityState={{ disabled: isSubmitting, busy: isSubmitting }}
      >
        <Text style={styles.submitText}>
          {existingHabit ? 'Save' : 'Add habit'}
        </Text>
      </Pressable>
    </ScrollView>
  );
}

function FieldError({ message }: { message?: string }) {
  const styles = useThemedStyles(makeStyles);
  if (!message) {
    return null;
  }
  return (
    <Text style={styles.errorText} accessibilityLiveRegion="polite">
      {message}
    </Text>
  );
}

function makeStyles(tokens: Tokens) {
  return StyleSheet.create({
    scroll: { flex: 1, backgroundColor: tokens.background },
    container: {
      paddingHorizontal: tokens.space6,
      paddingVertical: tokens.space6,
    },
    label: {
      fontSize: 13,
      color: tokens.textMuted,
      marginTop: tokens.space4,
      marginBottom: tokens.space2,
    },
    input: {
      backgroundColor: tokens.surface,
      borderWidth: 1,
      borderColor: tokens.border,
      borderRadius: tokens.radiusMd,
      padding: tokens.space3,
      color: tokens.text,
    },
    inputInvalid: { borderColor: tokens.accent },
    errorText: {
      fontSize: 12,
      color: tokens.text,
      marginTop: tokens.space1,
    },
    targetRow: { flexDirection: 'row', gap: tokens.space2 },
    targetUnit: { flex: 2 },
    targetAmount: { flex: 1 },
    targetFieldLabel: {
      fontSize: 12,
      color: tokens.textMuted,
      marginBottom: tokens.space1,
    },
    segmented: { flexDirection: 'row', gap: tokens.space2 },
    segment: {
      flex: 1,
      alignItems: 'center',
      paddingVertical: tokens.space3,
      borderRadius: tokens.radiusMd,
      backgroundColor: tokens.surface,
      borderWidth: 1,
      borderColor: tokens.border,
    },
    segmentSelected: { backgroundColor: tokens.primary },
    segmentLabel: { fontSize: 13, color: tokens.text },
    segmentLabelSelected: { color: tokens.onPrimary },
    dayRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: tokens.space2,
      marginTop: tokens.space2,
    },
    dayChip: {
      borderWidth: 1,
      borderColor: tokens.border,
      borderRadius: tokens.radiusMd,
      paddingHorizontal: tokens.space2,
      paddingVertical: tokens.space2,
    },
    dayChipSelected: { backgroundColor: tokens.accent },
    dayChipLabel: { fontSize: 12, color: tokens.text },
    timeButton: {
      backgroundColor: tokens.surface,
      borderWidth: 1,
      borderColor: tokens.border,
      borderRadius: tokens.radiusMd,
      padding: tokens.space3,
    },
    timeText: { color: tokens.text, fontSize: 15 },
    submitButton: {
      marginTop: tokens.space6,
      backgroundColor: tokens.primary,
      borderRadius: tokens.radiusMd,
      paddingVertical: tokens.space3,
      alignItems: 'center',
    },
    submitDisabled: { opacity: 0.6 },
    submitText: { color: tokens.onPrimary, fontSize: 15, fontWeight: '600' },
  });
}
