import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TextInput, Pressable } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useHabits } from '../context/HabitContext';
import { useSettings } from '../context/SettingsContext';
import { getTokens } from '../theme/tokens';
import { Habit, RepeatMode, DayOfWeek, HabitTarget } from '../storage/types';

const REPEAT_MODES: RepeatMode[] = ['daily', 'weekly', 'custom'];
const DAY_LABELS: { label: string; value: DayOfWeek }[] = [
  { label: 'Sun', value: 0 },
  { label: 'Mon', value: 1 },
  { label: 'Tue', value: 2 },
  { label: 'Wed', value: 3 },
  { label: 'Thu', value: 4 },
  { label: 'Fri', value: 5 },
  { label: 'Sat', value: 6 },
];

function padTime(value: number): string {
  return value.toString().padStart(2, '0');
}

function parseTimeString(value: string): Date {
  if (!value || !/^\d{2}:\d{2}$/.test(value)) {
    return new Date(2000, 0, 1, 9, 0);
  }

  const [hours, minutes] = value.split(':').map(Number);
  const next = new Date(2000, 0, 1, hours, minutes);
  return Number.isNaN(next.getTime()) ? new Date(2000, 0, 1, 9, 0) : next;
}

function formatTimeString(date: Date): string {
  return `${padTime(date.getHours())}:${padTime(date.getMinutes())}`;
}

/** "HH:mm" (24h, as stored) -> "h:mm AM/PM" for display. */
function formatDisplayTime(value: string): string {
  if (!value || !/^\d{2}:\d{2}$/.test(value)) {
    return value;
  }
  const [hoursStr, minutesStr] = value.split(':');
  const hours = Number(hoursStr);
  const period = hours >= 12 ? 'PM' : 'AM';
  const displayHour = hours % 12 === 0 ? 12 : hours % 12;
  return `${displayHour}:${minutesStr} ${period}`;
}

function makeId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export interface HabitFormProps {
  existingHabit?: Habit;
  onDone?: () => void;
}

export function HabitFormScreen({ existingHabit, onDone }: HabitFormProps) {
  const { addHabit, updateHabit } = useHabits();
  const { theme } = useSettings();
  const tokens = getTokens(theme);
  const styles = makeStyles(tokens);

  const [title, setTitle] = useState(existingHabit?.title ?? '');
  const [notes, setNotes] = useState(existingHabit?.notes ?? '');
  const [repeat, setRepeat] = useState<RepeatMode>(existingHabit?.schedule.repeat ?? 'daily');
  const [days, setDays] = useState<DayOfWeek[]>(existingHabit?.schedule.days ?? []);
  const [startTime, setStartTime] = useState(existingHabit?.schedule.startTime ?? '09:00');
  const [endTime, setEndTime] = useState(existingHabit?.schedule.endTime ?? '17:00');
  const [countUnit, setCountUnit] = useState(existingHabit?.target?.unit ?? '');
  const [countAmount, setCountAmount] = useState(
    existingHabit?.target?.amount !== undefined ? String(existingHabit.target.amount) : ''
  );
  const [timePickerTarget, setTimePickerTarget] = useState<'start' | 'end' | null>(null);
  const [showTimePicker, setShowTimePicker] = useState(false);

  const toggleDay = useCallback((day: DayOfWeek) => {
    setDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  }, []);

  const openTimePicker = useCallback((target: 'start' | 'end') => {
    setTimePickerTarget(target);
    setShowTimePicker(true);
  }, []);

  const handleTimeChange = useCallback((event: unknown, selectedDate?: Date) => {
    if (event) {
      setShowTimePicker(false);
    }
    if (!selectedDate || !timePickerTarget) {
      return;
    }

    const formatted = formatTimeString(selectedDate);
    if (timePickerTarget === 'start') {
      setStartTime(formatted);
    } else {
      setEndTime(formatted);
    }
    setTimePickerTarget(null);
  }, [timePickerTarget]);

  const handleSubmit = useCallback(async () => {
    const schedule = {
      repeat,
      days: repeat === 'custom' ? days : [],
      startTime,
      endTime,
    };

    const trimmedUnit = countUnit.trim();
    const parsedAmount = Number(countAmount);
    const target: HabitTarget | undefined =
      trimmedUnit && countAmount.trim() && Number.isFinite(parsedAmount) && parsedAmount > 0
        ? { unit: trimmedUnit, amount: parsedAmount }
        : undefined;

    if (existingHabit) {
      await updateHabit({ ...existingHabit, title, notes, schedule, target });
      onDone?.();
      return;
    }

    const newHabit: Habit = {
      id: makeId(),
      title,
      notes,
      schedule,
      target,
      createdAt: new Date().toISOString(),
    };

    await addHabit(newHabit);
    onDone?.();
  }, [existingHabit, title, notes, repeat, days, startTime, endTime, countUnit, countAmount, addHabit, updateHabit, onDone]);

  const timePickerValue = timePickerTarget === 'start' ? parseTimeString(startTime) : parseTimeString(endTime);

  return (
    <View style={styles.container} testID="habit-form-screen">
      <Text style={styles.label}>Title</Text>
      <TextInput
        style={styles.input}
        value={title}
        onChangeText={setTitle}
        testID="habit-form-title"
        placeholder="Habit title"
      />

      <Text style={styles.label}>Notes</Text>
      <TextInput
        style={styles.input}
        value={notes}
        onChangeText={setNotes}
        testID="habit-form-notes"
        placeholder="Optional notes"
      />

      <Text style={styles.label}>Track a target amount (optional)</Text>
      <View style={styles.countRow}>
        <View style={styles.countUnitInput}>
          <Text style={styles.countFieldLabel}>What are you tracking?</Text>
          <TextInput
            style={styles.input}
            value={countUnit}
            onChangeText={setCountUnit}
            testID="habit-form-count-unit"
            placeholder="e.g. pages, glasses, minutes"
          />
        </View>
        <View style={styles.countAmountInput}>
          <Text style={styles.countFieldLabel}>Target</Text>
          <TextInput
            style={styles.input}
            value={countAmount}
            onChangeText={setCountAmount}
            testID="habit-form-count-amount"
            placeholder="e.g. 20"
            keyboardType="numeric"
          />
        </View>
      </View>

      <Text style={styles.label}>Repeat</Text>
      <View style={styles.segmented} testID="habit-form-repeat">
        {REPEAT_MODES.map((mode) => (
          <Pressable
            key={mode}
            onPress={() => setRepeat(mode)}
            testID={`repeat-${mode}`}
            style={[styles.segment, repeat === mode && { backgroundColor: tokens.primary }]}
          >
            <Text style={[styles.segmentLabel, repeat === mode && { color: tokens.onPrimary }]}>
              {mode}
            </Text>
          </Pressable>
        ))}
      </View>

      {repeat === 'custom' && (
        <View style={styles.dayRow} testID="habit-form-days">
          {DAY_LABELS.map(({ label, value }) => (
            <Pressable
              key={value}
              onPress={() => toggleDay(value)}
              testID={`day-toggle-${value}`}
              style={[styles.dayChip, days.includes(value) && { backgroundColor: tokens.accent }]}
            >
              <Text style={styles.dayChipLabel}>{label}</Text>
            </Pressable>
          ))}
        </View>
      )}

      <Text style={styles.label}>Start time</Text>
      <Pressable style={styles.timePickerButton} onPress={() => openTimePicker('start')} testID="habit-form-start-time-button">
        <Text style={styles.timePickerText}>{formatDisplayTime(startTime)}</Text>
      </Pressable>

      <Text style={styles.label}>End time</Text>
      <Pressable style={styles.timePickerButton} onPress={() => openTimePicker('end')} testID="habit-form-end-time-button">
        <Text style={styles.timePickerText}>{formatDisplayTime(endTime)}</Text>
      </Pressable>

      {showTimePicker && timePickerTarget && (
        <DateTimePicker
          value={timePickerValue}
          mode="time"
          display="spinner"
          is24Hour={false}
          onChange={handleTimeChange}
        />
      )}

      <Pressable
        style={styles.submitButton}
        onPress={handleSubmit}
        testID="habit-form-submit"
      >
        <Text style={styles.submitText}>{existingHabit ? 'Save' : 'Add habit'}</Text>
      </Pressable>
    </View>
  );
}

function makeStyles(tokens: ReturnType<typeof getTokens>) {
  return StyleSheet.create({
    container: { backgroundColor: tokens.background, paddingHorizontal: tokens.space6, paddingVertical: tokens.space6 },
    label: { fontSize: 13, color: tokens.textMuted, marginTop: tokens.space4, marginBottom: tokens.space2 },
    input: { backgroundColor: tokens.surface, borderWidth: 1, borderColor: tokens.border, borderRadius: tokens.radiusMd, padding: tokens.space3, color: tokens.text },
    countRow: { flexDirection: 'row', gap: tokens.space2 },
    countUnitInput: { flex: 2 },
    countAmountInput: { flex: 1 },
    countFieldLabel: { fontSize: 12, color: tokens.textMuted, marginBottom: tokens.space1 },
    segmented: { flexDirection: 'row', gap: tokens.space2 },
    segment: { flex: 1, alignItems: 'center', paddingVertical: tokens.space3, borderRadius: tokens.radiusMd, backgroundColor: tokens.surface, borderWidth: 1, borderColor: tokens.border },
    segmentLabel: { fontSize: 13, color: tokens.text },
    dayRow: { flexDirection: 'row', flexWrap: 'wrap', gap: tokens.space2, marginTop: tokens.space2 },
    dayChip: { borderWidth: 1, borderColor: tokens.border, borderRadius: tokens.radiusMd, paddingHorizontal: tokens.space2, paddingVertical: tokens.space2 },
    dayChipLabel: { fontSize: 12, color: tokens.text },
    timePickerButton: { backgroundColor: tokens.surface, borderWidth: 1, borderColor: tokens.border, borderRadius: tokens.radiusMd, padding: tokens.space3 },
    timePickerText: { color: tokens.text, fontSize: 15 },
    submitButton: {
      marginTop: tokens.space6,
      backgroundColor: tokens.primary,
      borderRadius: tokens.radiusMd,
      paddingVertical: tokens.space3,
      alignItems: 'center',
    },
    submitText: { color: tokens.onPrimary, fontSize: 15, fontWeight: '600' },
  });
}
