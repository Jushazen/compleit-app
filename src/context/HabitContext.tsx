import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  ReactNode,
} from 'react';
import {
  getHabits,
  setHabits as persistHabits,
  getCompletions,
  setCompletions as persistCompletions,
} from '../storage/storage';
import { Habit, HabitCompletion } from '../storage/types';
import { GateResult } from './SettingsContext';

/**
 * A gate for adding a habit before it is persisted. Consumers can inject
 * a custom check here if the app needs one later.
 */
export type AddHabitGate = (habit: Habit) => Promise<GateResult>;

const defaultAddHabitGate: AddHabitGate = async () => ({ allowed: true });

interface HabitContextValue {
  habits: Habit[];
  isLoading: boolean;
  addHabit: (habit: Habit) => Promise<GateResult>;
  updateHabit: (habit: Habit) => Promise<void>;
  deleteHabit: (id: string) => Promise<void>;
  completions: HabitCompletion[];
  recordCompletion: (habitId: string, date: string) => Promise<void>;
}

const HabitContext = createContext<HabitContextValue | undefined>(undefined);

interface HabitProviderProps {
  children: ReactNode;
  addHabitGate?: AddHabitGate;
}

export function HabitProvider({
  children,
  addHabitGate = defaultAddHabitGate,
}: HabitProviderProps) {
  const [habits, setHabitsState] = useState<Habit[]>([]);
  const [completions, setCompletionsState] = useState<HabitCompletion[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Bug fix (found while building leaf 1.4.1 / wave 5): the original
  // version of this file read `habits`/`completions` from the closure
  // and relied on the initial-hydration effect resolving before any
  // write. If a write (e.g. addHabit) happened while hydration's
  // AsyncStorage read was still in flight, whichever async op committed
  // its setState LAST would silently win — a hydration read that
  // resolves after a write would overwrite the just-written data with
  // stale (pre-write) storage contents, and a write that resolves after
  // hydration would build its `[...habits, x]` on a stale pre-hydration
  // closure, losing anything hydration was about to load. Refs (synced
  // synchronously, not subject to React 18's batching/timing for state
  // updates) plus an explicit hydration gate that every write awaits
  // FIRST closes both directions of that race.
  const habitsRef = useRef<Habit[]>([]);
  const completionsRef = useRef<HabitCompletion[]>([]);

  const commitHabits = useCallback((next: Habit[]) => {
    habitsRef.current = next;
    setHabitsState(next);
  }, []);
  const commitCompletions = useCallback((next: HabitCompletion[]) => {
    completionsRef.current = next;
    setCompletionsState(next);
  }, []);

  const hydrationRef = useRef<Promise<void> | null>(null);
  const ensureHydrated = useCallback((): Promise<void> => {
    if (!hydrationRef.current) {
      hydrationRef.current = (async () => {
        const [storedHabits, storedCompletions] = await Promise.all([
          getHabits(),
          getCompletions(),
        ]);
        commitHabits(storedHabits);
        commitCompletions(storedCompletions);
        setIsLoading(false);
      })();
    }
    return hydrationRef.current;
  }, [commitHabits, commitCompletions]);

  useEffect(() => {
    ensureHydrated();
  }, [ensureHydrated]);

  const addHabit = useCallback(
    async (habit: Habit): Promise<GateResult> => {
      await ensureHydrated();
      const result = await addHabitGate(habit);
      if (result.allowed) {
        const next = [...habitsRef.current, habit];
        await persistHabits(next);
        commitHabits(next);
      }
      return result;
    },
    [addHabitGate, ensureHydrated, commitHabits]
  );

  // Editing an existing habit is intentionally not gated by the add-habit gate.
  const updateHabit = useCallback(
    async (habit: Habit) => {
      await ensureHydrated();
      const next = habitsRef.current.map((h) => (h.id === habit.id ? habit : h));
      await persistHabits(next);
      commitHabits(next);
    },
    [ensureHydrated, commitHabits]
  );

  // Deletion is NOT gated here — per leaf 1.2.3's gate G3, the 60-char
  // confirmation requirement is enforced by whatever calls this (the
  // screen), which must not offer any path to deleteHabit that skips its
  // own confirmation flow. This context trusts that its caller already
  // did that; it does not re-implement the confirmation itself.
  const deleteHabit = useCallback(
    async (id: string) => {
      await ensureHydrated();
      const next = habitsRef.current.filter((h) => h.id !== id);
      await persistHabits(next);
      commitHabits(next);
    },
    [ensureHydrated, commitHabits]
  );

  const recordCompletion = useCallback(
    async (habitId: string, date: string) => {
      await ensureHydrated();
      const alreadyRecorded = completionsRef.current.some(
        (c) => c.habitId === habitId && c.date === date
      );
      if (alreadyRecorded) return; // idempotent — no duplicate record
      const next = [
        ...completionsRef.current,
        { habitId, date, completedAt: new Date().toISOString() },
      ];
      await persistCompletions(next);
      commitCompletions(next);
    },
    [ensureHydrated, commitCompletions]
  );

  return (
    <HabitContext.Provider
      value={{
        habits,
        isLoading,
        addHabit,
        updateHabit,
        deleteHabit,
        completions,
        recordCompletion,
      }}
    >
      {children}
    </HabitContext.Provider>
  );
}

export function useHabits(): HabitContextValue {
  const ctx = useContext(HabitContext);
  if (!ctx) {
    throw new Error('useHabits() must be called inside a HabitProvider');
  }
  return ctx;
}
