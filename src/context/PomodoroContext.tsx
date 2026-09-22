import React, {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
  ReactNode,
} from 'react';
import { useSettings } from './SettingsContext';
import { PomodoroDurations } from '../storage/types';

export type PomodoroPhase = 'work' | 'shortBreak' | 'longBreak';

export interface PomodoroSession {
  phase: PomodoroPhase;
  secondsRemaining: number;
  isRunning: boolean;
  /** Which habit this session is being run for, if any (the Workspace screen, leaf 1.4.5, runs sessions tied to a specific habit). */
  habitId?: string;
  /** Completed work phases since the timer was last reset — decides when a long break is due, per pomodoroDurations.cyclesBeforeLongBreak. */
  cyclesCompleted: number;
}

interface PomodoroContextValue {
  durations: PomodoroDurations;
  setDurations: (durations: PomodoroDurations) => Promise<void>;
  session: PomodoroSession | null;
  start: (habitId?: string) => void;
  pause: () => void;
  resume: () => void;
  /** Advances the clock by one second — the screen owns the interval/timer and calls this, so this context stays timer-implementation-agnostic (easier to test, no fake-timer coupling here). */
  tick: () => void;
  reset: () => void;
  /**
   * In-memory only (not persisted) — resets on app restart.
   */
  completedWorkSessionsToday: (habitId: string) => number;
}

const PomodoroContext = createContext<PomodoroContextValue | undefined>(
  undefined
);

function phaseDuration(phase: PomodoroPhase, durations: PomodoroDurations): number {
  switch (phase) {
    case 'work':
      return durations.workMinutes * 60;
    case 'shortBreak':
      return durations.shortBreakMinutes * 60;
    case 'longBreak':
      return durations.longBreakMinutes * 60;
  }
}

function nextPhase(
  current: PomodoroPhase,
  cyclesCompleted: number,
  durations: PomodoroDurations
): PomodoroPhase {
  if (current !== 'work') return 'work';
  const dueForLongBreak =
    (cyclesCompleted + 1) % durations.cyclesBeforeLongBreak === 0;
  return dueForLongBreak ? 'longBreak' : 'shortBreak';
}

export function PomodoroProvider({ children }: { children: ReactNode }) {
  // Requires being nested inside a SettingsProvider — durations live
  // there (see PLAN.md amendment log) so there is exactly one persisted
  // copy, not a second one duplicated into this context.
  const { pomodoroDurations, setPomodoroDurations } = useSettings();
  const [session, setSession] = useState<PomodoroSession | null>(null);
  const completedRef = useRef<Record<string, number>>({});
  const [, forceRerender] = useState(0);

  const start = useCallback(
    (habitId?: string) => {
      setSession({
        phase: 'work',
        secondsRemaining: phaseDuration('work', pomodoroDurations),
        isRunning: true,
        habitId,
        cyclesCompleted: 0,
      });
    },
    [pomodoroDurations]
  );

  const pause = useCallback(() => {
    setSession((s) => (s ? { ...s, isRunning: false } : s));
  }, []);

  const resume = useCallback(() => {
    setSession((s) => (s ? { ...s, isRunning: true } : s));
  }, []);

  const reset = useCallback(() => {
    setSession(null);
  }, []);

  const tick = useCallback(() => {
    setSession((s) => {
      if (!s || !s.isRunning) return s;
      if (s.secondsRemaining > 1) {
        return { ...s, secondsRemaining: s.secondsRemaining - 1 };
      }
      // Phase complete.
      const completedWork = s.phase === 'work';
      const cyclesCompleted = completedWork ? s.cyclesCompleted + 1 : s.cyclesCompleted;
      if (completedWork && s.habitId) {
        completedRef.current[s.habitId] =
          (completedRef.current[s.habitId] ?? 0) + 1;
        // completedRef is a ref (not state) so the increment itself
        // doesn't need a render, but a consumer reading
        // completedWorkSessionsToday() right after this tick does need
        // one — hence the deliberate extra render trigger below.
        forceRerender((n) => n + 1);
      }
      const phase = nextPhase(s.phase, s.cyclesCompleted, pomodoroDurations);
      return {
        phase,
        secondsRemaining: phaseDuration(phase, pomodoroDurations),
        isRunning: true,
        habitId: s.habitId,
        cyclesCompleted,
      };
    });
  }, [pomodoroDurations]);

  const completedWorkSessionsToday = useCallback(
    (habitId: string) => completedRef.current[habitId] ?? 0,
    []
  );

  return (
    <PomodoroContext.Provider
      value={{
        durations: pomodoroDurations,
        setDurations: setPomodoroDurations,
        session,
        start,
        pause,
        resume,
        tick,
        reset,
        completedWorkSessionsToday,
      }}
    >
      {children}
    </PomodoroContext.Provider>
  );
}

export function usePomodoro(): PomodoroContextValue {
  const ctx = useContext(PomodoroContext);
  if (!ctx) {
    throw new Error('usePomodoro() must be called inside a PomodoroProvider');
  }
  return ctx;
}
