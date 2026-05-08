import { createContext, useContext, useEffect, useRef, useState, useCallback, type ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";

export type TimerMode = "focus" | "break";

export const TIMER_LIMITS = {
  focus: { min: 5, max: 180 },
  break: { min: 1, maxRatio: 0.3 }, // break <= 30% of focus
} as const;

export function clampFocus(min: number) {
  if (!Number.isFinite(min)) return TIMER_LIMITS.focus.min;
  return Math.min(TIMER_LIMITS.focus.max, Math.max(TIMER_LIMITS.focus.min, Math.round(min)));
}
export function maxBreakFor(focusMin: number) {
  return Math.max(TIMER_LIMITS.break.min, Math.floor(clampFocus(focusMin) * TIMER_LIMITS.break.maxRatio));
}
export function clampBreak(breakMin: number, focusMin: number) {
  if (!Number.isFinite(breakMin)) return TIMER_LIMITS.break.min;
  return Math.min(maxBreakFor(focusMin), Math.max(TIMER_LIMITS.break.min, Math.round(breakMin)));
}

type Persisted = {
  mode: TimerMode;
  focusMin: number;
  breakMin: number;
  running: boolean;
  remainingMs: number;
  endsAt: number | null; // epoch ms when current run ends (only when running)
};

const STORAGE_KEY = "levelup.timer.v1";
const DEFAULTS: Persisted = {
  mode: "focus",
  focusMin: 25,
  breakMin: 5,
  running: false,
  remainingMs: 25 * 60_000,
  endsAt: null,
};

function loadInitial(): Persisted {
  if (typeof window === "undefined") return DEFAULTS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULTS;
    const p = JSON.parse(raw) as Persisted;
    const focusMin = clampFocus(p.focusMin ?? DEFAULTS.focusMin);
    const breakMin = clampBreak(p.breakMin ?? DEFAULTS.breakMin, focusMin);
    let remainingMs = Math.max(0, p.remainingMs ?? focusMin * 60_000);
    let running = !!p.running;
    let endsAt = p.endsAt ?? null;
    if (running && endsAt) {
      remainingMs = Math.max(0, endsAt - Date.now());
      if (remainingMs === 0) running = false;
    } else {
      endsAt = null;
    }
    return { mode: p.mode === "break" ? "break" : "focus", focusMin, breakMin, running, remainingMs, endsAt };
  } catch {
    return DEFAULTS;
  }
}

interface TimerContextValue {
  mode: TimerMode;
  focusMin: number;
  breakMin: number;
  running: boolean;
  remainingMs: number;
  totalMs: number;
  progress: number; // 0..1
  start: () => void;
  pause: () => void;
  toggle: () => void;
  reset: () => void;
  skip: () => void;
  setMode: (m: TimerMode) => void;
  setFocusMin: (m: number) => void;
  setBreakMin: (m: number) => void;
  maxBreak: number;
}

const TimerContext = createContext<TimerContextValue | null>(null);

export function TimerProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<Persisted>(() => loadInitial());
  const stateRef = useRef(state);
  stateRef.current = state;
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const qc = useQueryClient();
  const { user } = useAuth();
  const userRef = useRef(user);
  userRef.current = user;

  // persist
  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch {}
  }, [state]);

  const totalMsFor = useCallback((s: Persisted) => (s.mode === "focus" ? s.focusMin : s.breakMin) * 60_000, []);

  const completeSession = useCallback(async () => {
    const s = stateRef.current;
    if (s.mode === "focus") {
      toast.success(`Focus session complete — +${s.focusMin} min`);
      const u = userRef.current;
      if (u) {
        try {
          await supabase.from("study_sessions").insert({ user_id: u.id, duration_minutes: s.focusMin });
          qc.invalidateQueries({ queryKey: ["sessions"] });
        } catch {}
      }
      const nextBreak = clampBreak(s.breakMin, s.focusMin);
      setState({ ...s, mode: "break", running: false, remainingMs: nextBreak * 60_000, endsAt: null });
    } else {
      toast("Break over — back to focus.");
      setState({ ...s, mode: "focus", running: false, remainingMs: s.focusMin * 60_000, endsAt: null });
    }
  }, [qc]);

  // global tick
  useEffect(() => {
    if (!state.running || !state.endsAt) {
      if (tickRef.current) { clearInterval(tickRef.current); tickRef.current = null; }
      return;
    }
    const tick = () => {
      const s = stateRef.current;
      if (!s.running || !s.endsAt) return;
      const remaining = Math.max(0, s.endsAt - Date.now());
      if (remaining === 0) {
        completeSession();
        return;
      }
      setState((p) => ({ ...p, remainingMs: remaining }));
    };
    tick();
    tickRef.current = setInterval(tick, 250);
    return () => { if (tickRef.current) { clearInterval(tickRef.current); tickRef.current = null; } };
  }, [state.running, state.endsAt, completeSession]);

  // wake from sleep / tab refocus
  useEffect(() => {
    const onVis = () => {
      const s = stateRef.current;
      if (s.running && s.endsAt) {
        const remaining = Math.max(0, s.endsAt - Date.now());
        if (remaining === 0) completeSession();
        else setState((p) => ({ ...p, remainingMs: remaining }));
      }
    };
    document.addEventListener("visibilitychange", onVis);
    window.addEventListener("focus", onVis);
    return () => {
      document.removeEventListener("visibilitychange", onVis);
      window.removeEventListener("focus", onVis);
    };
  }, [completeSession]);

  const start = useCallback(() => {
    setState((p) => {
      if (p.running) return p;
      const remaining = p.remainingMs > 0 ? p.remainingMs : totalMsFor(p);
      return { ...p, running: true, remainingMs: remaining, endsAt: Date.now() + remaining };
    });
  }, [totalMsFor]);

  const pause = useCallback(() => {
    setState((p) => p.running ? { ...p, running: false, endsAt: null } : p);
  }, []);

  const toggle = useCallback(() => {
    const s = stateRef.current;
    if (s.running) pause(); else start();
  }, [pause, start]);

  const reset = useCallback(() => {
    setState((p) => ({ ...p, running: false, endsAt: null, remainingMs: totalMsFor(p) }));
  }, [totalMsFor]);

  const skip = useCallback(() => {
    completeSession();
  }, [completeSession]);

  const setMode = useCallback((mode: TimerMode) => {
    setState((p) => ({ ...p, mode, running: false, endsAt: null, remainingMs: (mode === "focus" ? p.focusMin : p.breakMin) * 60_000 }));
  }, []);

  const setFocusMin = useCallback((v: number) => {
    setState((p) => {
      const focusMin = clampFocus(v);
      const breakMin = clampBreak(p.breakMin, focusMin);
      const remainingMs = p.mode === "focus" && !p.running ? focusMin * 60_000 : p.remainingMs;
      return { ...p, focusMin, breakMin, remainingMs };
    });
  }, []);

  const setBreakMin = useCallback((v: number) => {
    setState((p) => {
      const breakMin = clampBreak(v, p.focusMin);
      const remainingMs = p.mode === "break" && !p.running ? breakMin * 60_000 : p.remainingMs;
      return { ...p, breakMin, remainingMs };
    });
  }, []);

  const totalMs = totalMsFor(state);
  const progress = totalMs > 0 ? 1 - state.remainingMs / totalMs : 0;

  return (
    <TimerContext.Provider value={{
      mode: state.mode,
      focusMin: state.focusMin,
      breakMin: state.breakMin,
      running: state.running,
      remainingMs: state.remainingMs,
      totalMs,
      progress,
      start, pause, toggle, reset, skip,
      setMode, setFocusMin, setBreakMin,
      maxBreak: maxBreakFor(state.focusMin),
    }}>
      {children}
    </TimerContext.Provider>
  );
}

export function useTimer() {
  const ctx = useContext(TimerContext);
  if (!ctx) throw new Error("useTimer must be used inside TimerProvider");
  return ctx;
}

export function formatTime(ms: number) {
  const total = Math.max(0, Math.ceil(ms / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}
