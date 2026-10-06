import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import * as transitions from '../logic/habitState';
import type { HabitData } from '../logic/habitState';
import { createSerialQueue } from '../logic/serialQueue';
import {
  getCompletions,
  getHabits,
  setCompletions,
  setHabits,
} from '../storage/storage';
import type { Habit, HabitCompletion } from '../storage/types';

interface HabitContextValue {
  habits: Habit[];
  completions: HabitCompletion[];
  isLoading: boolean;
  addHabit: (habit: Habit) => Promise<void>;
  updateHabit: (habit: Habit) => Promise<void>;
  deleteHabit: (id: string) => Promise<void>;
  recordCompletion: (habitId: string, date: string) => Promise<void>;
}

const EMPTY_DATA: HabitData = { habits: [], completions: [] };

const HabitContext = createContext<HabitContextValue | undefined>(undefined);

export function HabitProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<HabitData>(EMPTY_DATA);
  const [isLoading, setIsLoading] = useState(true);
  // Mirror of `data` read by queued tasks, so each sees its predecessor's result.
  const dataRef = useRef(data);
  const [enqueue] = useState(createSerialQueue);
  const hydrationRef = useRef<Promise<void> | null>(null);

  const commit = useCallback((next: HabitData) => {
    dataRef.current = next;
    setData(next);
  }, []);

  /** Queues the one-time load first; idempotent, so StrictMode and early callers are safe. */
  const hydrate = useCallback(() => {
    hydrationRef.current ??= enqueue(async () => {
      try {
        const [habits, completions] = await Promise.all([
          getHabits(),
          getCompletions(),
        ]);
        commit({ habits, completions });
      } catch (err) {
        console.warn('[habits] hydration failed, starting empty', err);
      } finally {
        setIsLoading(false);
      }
    });
    return hydrationRef.current;
  }, [enqueue, commit]);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  /**
   * Runs a pure transition behind hydration and every earlier mutation, persists
   * only the domains it changed, then commits. A failed write rejects and commits
   * nothing. Habits are written first, so a failure in between leaves orphaned
   * completions rather than a surviving habit with its history erased.
   */
  const mutate = useCallback(
    (transition: (current: HabitData) => HabitData): Promise<void> => {
      hydrate();
      return enqueue(async () => {
        const current = dataRef.current;
        const next = transition(current);
        if (next === current) {
          return;
        }
        if (next.habits !== current.habits) {
          await setHabits(next.habits);
        }
        if (next.completions !== current.completions) {
          await setCompletions(next.completions);
        }
        commit(next);
      });
    },
    [hydrate, enqueue, commit],
  );

  const addHabit = useCallback(
    (habit: Habit) => mutate(d => transitions.addHabit(d, habit)),
    [mutate],
  );

  const updateHabit = useCallback(
    (habit: Habit) => mutate(d => transitions.updateHabit(d, habit)),
    [mutate],
  );

  const deleteHabit = useCallback(
    (id: string) => mutate(d => transitions.deleteHabit(d, id)),
    [mutate],
  );

  const recordCompletion = useCallback(
    (habitId: string, date: string) => {
      const completion: HabitCompletion = {
        habitId,
        date,
        completedAt: new Date().toISOString(),
      };
      return mutate(d => transitions.recordCompletion(d, completion));
    },
    [mutate],
  );

  const value: HabitContextValue = useMemo(
    () => ({
      habits: data.habits,
      completions: data.completions,
      isLoading,
      addHabit,
      updateHabit,
      deleteHabit,
      recordCompletion,
    }),
    [data, isLoading, addHabit, updateHabit, deleteHabit, recordCompletion],
  );

  return (
    <HabitContext.Provider value={value}>{children}</HabitContext.Provider>
  );
}

export function useHabits(): HabitContextValue {
  const ctx = useContext(HabitContext);
  if (!ctx) {
    throw new Error('useHabits() must be called inside a HabitProvider');
  }
  return ctx;
}
