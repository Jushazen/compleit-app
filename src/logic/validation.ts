import { DayOfWeek, Habit, RepeatMode } from '../storage/types';
import { minutesSinceMidnight } from './time';

/** The habit form's editable fields, as the user typed them. */
export interface HabitDraft {
  title: string;
  notes: string;
  repeat: RepeatMode;
  days: DayOfWeek[];
  startTime: string;
  endTime: string;
  targetUnit: string;
  targetAmount: string;
}

type DraftField = 'title' | 'days' | 'time' | 'target';

/** Prefills the form for editing an existing habit. */
export function draftFromHabit(habit: Habit): HabitDraft {
  const { schedule, target } = habit;
  return {
    title: habit.title,
    notes: habit.notes,
    repeat: schedule.repeat,
    days: [...schedule.days],
    startTime: schedule.startTime,
    endTime: schedule.endTime,
    targetUnit: target?.unit ?? '',
    targetAmount: target ? String(target.amount) : '',
  };
}

/** Case- and spacing-insensitive form of a title, used to detect duplicates. */
function normalizeTitle(title: string): string {
  return title.trim().replace(/\s+/g, ' ').toLocaleLowerCase();
}

/**
 * A user-facing message per invalid field; an empty object means the draft is valid.
 * `editingId` names the habit being edited, which may keep its own title.
 */
export function validateHabitDraft(
  draft: HabitDraft,
  existingHabits: Habit[] = [],
  editingId?: string,
): Partial<Record<DraftField, string>> {
  const errors: Partial<Record<DraftField, string>> = {};

  const title = normalizeTitle(draft.title);
  if (!title) {
    errors.title = 'Enter a title.';
  } else if (
    existingHabits.some(
      habit => habit.id !== editingId && normalizeTitle(habit.title) === title,
    )
  ) {
    errors.title = 'A habit with this name already exists.';
  }
  if (draft.repeat === 'custom' && draft.days.length === 0) {
    errors.days = 'Pick at least one day.';
  }

  // Any comparison with NaN is false, so malformed times are rejected too.
  const start = minutesSinceMidnight(draft.startTime);
  const end = minutesSinceMidnight(draft.endTime);
  if (!(end > start)) {
    errors.time = 'End time must be after start time.';
  }

  const hasUnit = draft.targetUnit.trim() !== '';
  const hasAmount = draft.targetAmount.trim() !== '';
  if (hasUnit !== hasAmount) {
    errors.target = hasUnit
      ? 'Enter a target amount, or clear what you are tracking.'
      : 'Enter what you are tracking, or clear the target amount.';
  } else if (hasAmount && parseTargetAmount(draft.targetAmount) === null) {
    errors.target = 'Target amount must be a number greater than 0.';
  }

  return errors;
}

const DECIMAL = /^(\d+([.,]\d*)?|[.,]\d+)$/;

/** Parses a positive decimal, accepting "2,5" as well as "2.5"; null if malformed or not above 0. */
export function parseTargetAmount(text: string): number | null {
  const trimmed = text.trim();
  if (!DECIMAL.test(trimmed)) {
    return null;
  }
  const amount = Number(trimmed.replace(',', '.'));
  return Number.isFinite(amount) && amount > 0 ? amount : null;
}
