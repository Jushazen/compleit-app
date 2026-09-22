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

interface HabitContextValue {
  habits: Habit[];
  isLoading: boolean;
  addHabit: (habit: Habit) => Promise<void>;
  updateHabit: (habit: Habit) => Promise<void>;
  deleteHabit: (id: string) => Promise<void>;
  completions: HabitCompletion[];
  recordCompletion: (habitId: string, date: string) => Promise<void>;
}

const HabitContext = createContext<HabitContextValue | undefined>(undefined);

interface HabitProviderProps {
  children: ReactNode;
}

export function HabitProvider({ children }: HabitProviderProps) {
  const [habits, setHabitsState] = useState<Habit[]>([]);
  const [completions, setCompletionsState] = useState<HabitCompletion[]>([]);
  const [isLoading, setIsLoading] = useState(true);

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
    async (habit: Habit): Promise<void> => {
      await ensureHydrated();
      const next = [...habitsRef.current, habit];
      await persistHabits(next);
      commitHabits(next);
    },
    [ensureHydrated, commitHabits]
  );

  const updateHabit = useCallback(
    async (habit: Habit) => {
      await ensureHydrated();
      const next = habitsRef.current.map((h) => (h.id === habit.id ? habit : h));
      await persistHabits(next);
      commitHabits(next);
    },
    [ensureHydrated, commitHabits]
  );

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
