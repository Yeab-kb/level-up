import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Play, Pause, RotateCcw, SkipForward } from "lucide-react";
import { toast } from "sonner";
import { useLogSession, useSessions } from "@/lib/data-hooks";
import { PageHeader } from "@/components/ui-bits";
import { format, isSameDay } from "date-fns";

export const Route = createFileRoute("/_app/timer")({ component: TimerPage });

type Mode = "focus" | "break";

function TimerPage() {
  const [focusMin, setFocusMin] = useState(25);
  const [breakMin, setBreakMin] = useState(5);
  const [mode, setMode] = useState<Mode>("focus");
  const [secondsLeft, setSecondsLeft] = useState(focusMin * 60);
  const [running, setRunning] = useState(false);
  const log = useLogSession();
  const { data: sessions = [] } = useSessions();
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    setSecondsLeft((mode === "focus" ? focusMin : breakMin) * 60);
  }, [mode, focusMin, breakMin]);

  useEffect(() => {
    if (!running) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }
    intervalRef.current = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          if (mode === "focus") {
            log.mutate(focusMin);
            toast.success(`Focus session complete! +${focusMin} min`);
            setMode("break");
          } else {
            toast("Break over — back to focus!");
            setMode("focus");
          }
          setRunning(false);
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [running, mode, focusMin, log]);

  const total = (mode === "focus" ? focusMin : breakMin) * 60;
  const pct = ((total - secondsLeft) / total) * 100;
  const mins = Math.floor(secondsLeft / 60);
  const secs = secondsLeft % 60;

  const todayMin = sessions.filter((s) => isSameDay(new Date(s.completed_at), new Date())).reduce((a, b) => a + b.duration_minutes, 0);
  const totalMin = sessions.reduce((a, b) => a + b.duration_minutes, 0);

  const C = 2 * Math.PI * 110;

  return (
    <div>
      <PageHeader title="Focus Timer" subtitle="Pomodoro sessions to enter deep work." />
      <div className="grid gap-6 lg:grid-cols-[1fr,340px]">
        <div className="glass-card flex flex-col items-center p-8">
          <div className="mb-6 inline-flex rounded-full bg-muted p-1 text-xs font-medium">
            {(["focus","break"] as Mode[]).map(m => (
              <button key={m} onClick={() => { setMode(m); setRunning(false); }} className={`rounded-full px-4 py-1.5 capitalize ${mode === m ? "gradient-primary text-primary-foreground shadow-glow" : "text-muted-foreground"}`}>{m}</button>
            ))}
          </div>
          <div className="relative">
            <svg width="280" height="280" viewBox="0 0 280 280" className="-rotate-90">
              <circle cx="140" cy="140" r="110" fill="none" stroke="currentColor" strokeOpacity="0.10" strokeWidth="14" />
              <motion.circle cx="140" cy="140" r="110" fill="none" stroke="url(#tg)" strokeWidth="14" strokeLinecap="round"
                strokeDasharray={C} animate={{ strokeDashoffset: C - (pct / 100) * C }} transition={{ duration: 0.4 }} />
              <defs><linearGradient id="tg" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="oklch(0.70 0.20 260)" />
                <stop offset="100%" stopColor="oklch(0.72 0.20 300)" />
              </linearGradient></defs>
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <p className="font-display text-6xl font-extrabold tabular-nums">{String(mins).padStart(2,"0")}:{String(secs).padStart(2,"0")}</p>
              <p className="mt-1 text-xs uppercase tracking-widest text-muted-foreground">{mode}</p>
            </div>
          </div>
          <div className="mt-8 flex items-center gap-3">
            <button onClick={() => { setRunning(false); setSecondsLeft(total); }} className="rounded-full border border-border p-3 hover:bg-muted"><RotateCcw className="h-5 w-5" /></button>
            <button onClick={() => setRunning(!running)} className="grid h-16 w-16 place-items-center rounded-full gradient-primary shadow-glow text-primary-foreground transition-transform hover:scale-105">
              {running ? <Pause className="h-7 w-7" /> : <Play className="h-7 w-7 translate-x-0.5" />}
            </button>
            <button onClick={() => { setSecondsLeft(0); }} className="rounded-full border border-border p-3 hover:bg-muted"><SkipForward className="h-5 w-5" /></button>
          </div>
          <div className="mt-8 grid w-full max-w-sm grid-cols-2 gap-3">
            <label className="rounded-xl bg-muted/50 p-3 text-center">
              <p className="text-[11px] uppercase text-muted-foreground">Focus min</p>
              <input type="number" min={1} max={120} value={focusMin} onChange={(e)=>setFocusMin(Math.max(1, +e.target.value))} className="mt-1 w-full bg-transparent text-center font-display text-2xl font-bold outline-none" />
            </label>
            <label className="rounded-xl bg-muted/50 p-3 text-center">
              <p className="text-[11px] uppercase text-muted-foreground">Break min</p>
              <input type="number" min={1} max={60} value={breakMin} onChange={(e)=>setBreakMin(Math.max(1, +e.target.value))} className="mt-1 w-full bg-transparent text-center font-display text-2xl font-bold outline-none" />
            </label>
          </div>
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
