import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Play, Pause, RotateCcw, SkipForward, Info } from "lucide-react";
import { useSessions } from "@/lib/data-hooks";
import { PageHeader } from "@/components/ui-bits";
import { format, isSameDay } from "date-fns";
import { useTimer, TIMER_LIMITS, maxBreakFor, formatTime } from "@/lib/timer-context";
import type { TimerMode } from "@/lib/timer-context";

export const Route = createFileRoute("/_app/timer")({ component: TimerPage });

function TimerPage() {
  const t = useTimer();
  const { data: sessions = [] } = useSessions();

  const pct = t.progress * 100;
  const todayMin = sessions.filter((s) => isSameDay(new Date(s.completed_at), new Date())).reduce((a, b) => a + b.duration_minutes, 0);
  const totalMin = sessions.reduce((a, b) => a + b.duration_minutes, 0);
  const C = 2 * Math.PI * 110;

  return (
    <div>
      <PageHeader title="Focus Timer" subtitle="Pomodoro sessions to enter deep work — runs in the background as you navigate." />
      <div className="grid gap-6 lg:grid-cols-[1fr,340px]">
        <div className="glass-card flex flex-col items-center p-6 sm:p-8">
          <div className="mb-6 inline-flex rounded-full bg-muted p-1 text-xs font-medium">
            {(["focus", "break"] as TimerMode[]).map((m) => (
              <button
                key={m}
                onClick={() => t.setMode(m)}
                className={`rounded-full px-4 py-1.5 capitalize transition-colors ${t.mode === m ? "gradient-primary text-primary-foreground shadow-glow" : "text-muted-foreground"}`}
              >
                {m}
              </button>
            ))}
          </div>
          <div className="relative">
            <svg width="280" height="280" viewBox="0 0 280 280" className="-rotate-90">
              <circle cx="140" cy="140" r="110" fill="none" stroke="currentColor" strokeOpacity="0.10" strokeWidth="14" />
              <motion.circle
                cx="140" cy="140" r="110" fill="none" stroke="url(#tg)" strokeWidth="14" strokeLinecap="round"
                strokeDasharray={C}
                animate={{ strokeDashoffset: C - (pct / 100) * C }}
                transition={{ duration: 0.4, ease: "linear" }}
              />
              <defs>
                <linearGradient id="tg" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="oklch(0.70 0.20 260)" />
                  <stop offset="100%" stopColor="oklch(0.72 0.20 300)" />
                </linearGradient>
              </defs>
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <p className="font-display text-6xl font-extrabold tabular-nums">{formatTime(t.remainingMs)}</p>
              <p className="mt-1 text-xs uppercase tracking-widest text-muted-foreground">{t.mode}</p>
            </div>
          </div>
          <div className="mt-8 flex items-center gap-3">
            <button onClick={t.reset} aria-label="Reset" className="rounded-full border border-border p-3 transition-colors hover:bg-muted">
              <RotateCcw className="h-5 w-5" />
            </button>
            <button
              onClick={t.toggle}
              aria-label={t.running ? "Pause" : "Start"}
              className="grid h-16 w-16 place-items-center rounded-full gradient-primary text-primary-foreground shadow-glow transition-transform hover:scale-105 active:scale-95"
            >
              {t.running ? <Pause className="h-7 w-7" /> : <Play className="h-7 w-7 translate-x-0.5" />}
            </button>
            <button onClick={t.skip} aria-label="Skip" className="rounded-full border border-border p-3 transition-colors hover:bg-muted">
              <SkipForward className="h-5 w-5" />
            </button>
          </div>

          <div className="mt-8 grid w-full max-w-sm grid-cols-2 gap-3">
            <DurationInput
              label="Focus min"
              value={t.focusMin}
              min={TIMER_LIMITS.focus.min}
              max={TIMER_LIMITS.focus.max}
              onChange={t.setFocusMin}
              disabled={t.running}
            />
            <DurationInput
              label="Break min"
              value={t.breakMin}
              min={TIMER_LIMITS.break.min}
              max={t.maxBreak}
              onChange={t.setBreakMin}
              disabled={t.running}
            />
          </div>
          <p className="mt-3 inline-flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <Info className="h-3 w-3" />
            Break is capped at 30% of focus ({maxBreakFor(t.focusMin)} min max).
          </p>
        </div>

        <div className="space-y-4">
          <div className="glass-card p-5">
            <p className="text-xs text-muted-foreground">Today</p>
            <p className="font-display text-3xl font-bold">{todayMin} <span className="text-base font-normal text-muted-foreground">min</span></p>
          </div>
          <div className="glass-card p-5">
            <p className="text-xs text-muted-foreground">Lifetime</p>
            <p className="font-display text-3xl font-bold">{totalMin} <span className="text-base font-normal text-muted-foreground">min</span></p>
            <p className="mt-1 text-xs text-muted-foreground">{sessions.length} sessions</p>
          </div>
          <div className="glass-card p-5">
            <p className="mb-3 text-sm font-semibold">Recent</p>
            <ul className="space-y-2">
              {sessions.slice(0, 5).map((s) => (
                <li key={s.id} className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">{format(new Date(s.completed_at), "MMM d, HH:mm")}</span>
                  <span className="font-semibold">{s.duration_minutes}m</span>
                </li>
              ))}
              {sessions.length === 0 && <li className="text-xs text-muted-foreground">No sessions yet.</li>}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

function DurationInput({
  label, value, min, max, onChange, disabled,
}: { label: string; value: number; min: number; max: number; onChange: (v: number) => void; disabled?: boolean }) {
  return (
    <label className={`rounded-xl bg-muted/50 p-3 text-center transition-opacity ${disabled ? "opacity-60" : ""}`}>
      <p className="text-[11px] uppercase text-muted-foreground">{label}</p>
      <div className="mt-1 flex items-center justify-center gap-2">
        <button
          type="button"
          disabled={disabled || value <= min}
          onClick={() => onChange(value - 1)}
          className="grid h-7 w-7 place-items-center rounded-full bg-background/60 text-sm hover:bg-background disabled:opacity-40"
          aria-label={`Decrease ${label}`}
        >−</button>
        <input
          type="number"
          min={min}
          max={max}
          value={value}
          disabled={disabled}
          onChange={(e) => onChange(Number(e.target.value))}
          className="w-14 bg-transparent text-center font-display text-2xl font-bold outline-none disabled:cursor-not-allowed"
        />
        <button
          type="button"
          disabled={disabled || value >= max}
          onClick={() => onChange(value + 1)}
          className="grid h-7 w-7 place-items-center rounded-full bg-background/60 text-sm hover:bg-background disabled:opacity-40"
          aria-label={`Increase ${label}`}
        >+</button>
      </div>
      <p className="mt-1 text-[10px] text-muted-foreground">{min}–{max}</p>
    </label>
  );
}
