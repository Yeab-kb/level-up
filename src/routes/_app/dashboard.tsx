import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { useMemo, useState } from "react";
import { CheckCircle2, Clock, Flame, Plus, Sparkles, TrendingUp, Calendar as CalIcon, Target, Quote } from "lucide-react";
import { useTasks, useCreateTask, useUpdateTask, useSessions } from "@/lib/data-hooks";
import { useAuth } from "@/lib/auth-context";
import { Skeleton, useNow, inputClass, GradientButton, Empty } from "@/components/ui-bits";
import { format, isToday, isThisWeek, startOfWeek, addDays, isSameDay, differenceInCalendarDays } from "date-fns";

export const Route = createFileRoute("/_app/dashboard")({ component: Dashboard });

const QUOTES = [
  { q: "Discipline is choosing between what you want now and what you want most.", a: "Abraham Lincoln" },
  { q: "Small steps every day.", a: "Anonymous" },
  { q: "You don't have to be great to start, but you have to start to be great.", a: "Zig Ziglar" },
  { q: "The future depends on what you do today.", a: "Mahatma Gandhi" },
];

function Dashboard() {
  const now = useNow();
  const { user } = useAuth();
  const { data: tasks = [], isLoading } = useTasks();
  const { data: sessions = [] } = useSessions();
  const create = useCreateTask();
  const update = useUpdateTask();
  const [quick, setQuick] = useState("");

  const name = (user?.user_metadata?.full_name as string)?.split(" ")[0] ?? user?.email?.split("@")[0] ?? "friend";
  const greeting = now.getHours() < 12 ? "Good morning" : now.getHours() < 18 ? "Good afternoon" : "Good evening";

  const stats = useMemo(() => {
    const total = tasks.length;
    const completed = tasks.filter((t) => t.completed).length;
    const pending = total - completed;
    const weekTasks = tasks.filter((t) => t.completed_at && isThisWeek(new Date(t.completed_at), { weekStartsOn: 1 }));
    const pct = total ? Math.round((completed / total) * 100) : 0;
    return { total, completed, pending, pct, weekCompleted: weekTasks.length };
  }, [tasks]);

  const upcoming = useMemo(
    () => tasks.filter((t) => !t.completed && t.due_at).sort((a, b) => +new Date(a.due_at!) - +new Date(b.due_at!)).slice(0, 5),
    [tasks]
  );

  const weeklyData = useMemo(() => {
    const start = startOfWeek(now, { weekStartsOn: 1 });
    return Array.from({ length: 7 }).map((_, i) => {
      const day = addDays(start, i);
      const completedCount = tasks.filter((t) => t.completed_at && isSameDay(new Date(t.completed_at), day)).length;
      const minutes = sessions.filter((s) => isSameDay(new Date(s.completed_at), day)).reduce((sum, s) => sum + s.duration_minutes, 0);
      return { day: format(day, "EEE"), value: completedCount, minutes, isToday: isSameDay(day, now) };
    });
  }, [tasks, sessions, now]);

  const maxBar = Math.max(1, ...weeklyData.map((d) => d.value));

  // Streak calc — consecutive days with at least one completion or session
  const streak = useMemo(() => {
    const days = new Set<string>();
    tasks.forEach((t) => t.completed_at && days.add(format(new Date(t.completed_at), "yyyy-MM-dd")));
    sessions.forEach((s) => days.add(format(new Date(s.completed_at), "yyyy-MM-dd")));
    let count = 0;
    for (let i = 0; i < 365; i++) {
      const d = format(addDays(now, -i), "yyyy-MM-dd");
      if (days.has(d)) count++;
      else if (i > 0) break;
    }
    return count;
  }, [tasks, sessions, now]);

  const quote = QUOTES[now.getDate() % QUOTES.length];

  const onQuickAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quick.trim()) return;
    create.mutate({ title: quick.trim() });
    setQuick("");
  };

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-card relative overflow-hidden p-6 sm:p-8">
        <div className="absolute -right-16 -top-16 h-56 w-56 rounded-full gradient-primary opacity-30 blur-3xl" />
        <div className="relative flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm text-muted-foreground">{greeting},</p>
            <h1 className="font-display text-3xl font-extrabold sm:text-4xl">Welcome back, <span className="gradient-text">{name}</span></h1>
            <p className="mt-2 text-sm text-muted-foreground">{format(now, "EEEE, MMMM d")} · {format(now, "HH:mm:ss")}</p>
          </div>
          <div className="flex items-center gap-2 rounded-full glass px-4 py-2 text-sm font-medium">
            <Flame className="h-4 w-4 text-warning" /> {streak} day streak
          </div>
        </div>

        <form onSubmit={onQuickAdd} className="relative mt-6 flex gap-2">
          <div className="relative flex-1">
            <Plus className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={quick} onChange={(e) => setQuick(e.target.value)}
              placeholder="Quick add a task… (Enter)"
              className={`${inputClass} pl-10`}
            />
          </div>
          <GradientButton type="submit" disabled={!quick.trim()}>Add</GradientButton>
        </form>
      </motion.div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard icon={CheckCircle2} label="Total tasks" value={stats.total} loading={isLoading} />
        <StatCard icon={Sparkles} label="Completed" value={stats.completed} loading={isLoading} accent />
        <StatCard icon={Clock} label="Pending" value={stats.pending} loading={isLoading} />
        <StatCard icon={TrendingUp} label="Productivity" value={`${stats.pct}%`} loading={isLoading} progress={stats.pct} />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-6 lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-lg font-semibold">Weekly activity</h2>
            <span className="text-xs text-muted-foreground">{stats.weekCompleted} done this week</span>
          </div>
          <div className="flex h-44 items-end gap-3">
            {weeklyData.map((d) => (
              <div key={d.day} className="flex flex-1 flex-col items-center gap-2">
                <motion.div
                  initial={{ height: 0 }} animate={{ height: `${(d.value / maxBar) * 100}%` }}
                  transition={{ duration: 0.6, delay: 0.05 }}
                  className={`w-full min-h-[6px] rounded-t-lg ${d.isToday ? "gradient-primary shadow-glow" : "bg-muted"}`}
                />
                <span className={`text-[11px] font-medium ${d.isToday ? "text-foreground" : "text-muted-foreground"}`}>{d.day}</span>
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-card flex flex-col justify-between p-6">
          <div>
            <Quote className="h-5 w-5 text-accent" />
            <p className="mt-3 font-display text-lg leading-snug">"{quote.q}"</p>
            <p className="mt-2 text-xs text-muted-foreground">— {quote.a}</p>
          </div>
          <div className="mt-6 rounded-xl bg-muted/50 p-4">
            <div className="flex items-center gap-2 text-xs font-medium">
              <Target className="h-4 w-4 text-primary" /> Daily goal
            </div>
            <DailyGoal sessions={sessions} now={now} />
          </div>
        </motion.div>
      </div>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold">Upcoming</h2>
          <Link to="/tasks" className="text-xs text-primary hover:underline">See all</Link>
        </div>
        {isLoading ? (
          <div className="space-y-2">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-14" />)}</div>
        ) : upcoming.length === 0 ? (
          <Empty icon={CalIcon} title="No upcoming tasks" desc="Add a task to see it here. Stay ahead of deadlines." />
        ) : (
          <ul className="space-y-2">
            {upcoming.map((t) => {
              const days = differenceInCalendarDays(new Date(t.due_at!), now);
              const dueLabel = isToday(new Date(t.due_at!)) ? "Today" : days < 0 ? `${-days}d overdue` : days === 1 ? "Tomorrow" : `in ${days}d`;
              return (
                <li key={t.id} className="flex items-center gap-3 rounded-xl border border-border/40 bg-background/40 p-3 transition-colors hover:bg-background/60">
                  <button
                    onClick={() => update.mutate({ id: t.id, completed: true, completed_at: new Date().toISOString() })}
                    className="grid h-7 w-7 place-items-center rounded-full border border-border hover:border-primary"
                    aria-label="Complete"
                  >
                    <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
                  </button>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{t.title}</p>
                    <p className="text-xs text-muted-foreground capitalize">{t.priority} · {t.category}</p>
                  </div>
                  <span className={`rounded-full px-2.5 py-1 text-[11px] font-medium ${days < 0 ? "bg-destructive/15 text-destructive" : days <= 1 ? "bg-warning/15 text-warning" : "bg-muted text-muted-foreground"}`}>
                    {dueLabel}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </motion.div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, loading, accent, progress }: { icon: any; label: string; value: any; loading?: boolean; accent?: boolean; progress?: number }) {
  return (
    <motion.div whileHover={{ y: -2 }} className="glass-card p-4 sm:p-5">
      <div className="mb-3 flex items-center justify-between">
        <span className={`grid h-9 w-9 place-items-center rounded-xl ${accent ? "gradient-primary text-primary-foreground shadow-glow" : "bg-muted text-foreground"}`}>
          <Icon className="h-4.5 w-4.5" />
        </span>
        {progress !== undefined && (
          <div className="relative h-9 w-9">
            <svg viewBox="0 0 36 36" className="h-9 w-9 -rotate-90">
              <circle cx="18" cy="18" r="14" fill="none" stroke="currentColor" strokeOpacity="0.15" strokeWidth="4" />
              <motion.circle cx="18" cy="18" r="14" fill="none" stroke="url(#g)" strokeWidth="4" strokeLinecap="round"
                strokeDasharray={`${(progress / 100) * 88} 88`}
                initial={{ strokeDasharray: "0 88" }} animate={{ strokeDasharray: `${(progress / 100) * 88} 88` }} transition={{ duration: 0.8 }} />
              <defs>
                <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="oklch(0.70 0.20 260)" />
                  <stop offset="100%" stopColor="oklch(0.72 0.20 300)" />
                </linearGradient>
              </defs>
            </svg>
          </div>
        )}
      </div>
      <p className="text-xs text-muted-foreground">{label}</p>
      {loading ? <Skeleton className="mt-1 h-7 w-16" /> : <p className="font-display text-2xl font-bold">{value}</p>}
    </motion.div>
  );
}

function DailyGoal({ sessions, now }: { sessions: any[]; now: Date }) {
  const minutesToday = sessions.filter((s) => isSameDay(new Date(s.completed_at), now)).reduce((s, x) => s + x.duration_minutes, 0);
  const goal = 120;
  const pct = Math.min(100, Math.round((minutesToday / goal) * 100));
  return (
    <div className="mt-2">
      <div className="flex items-baseline justify-between">
        <p className="font-display text-xl font-bold">{minutesToday}<span className="text-sm font-normal text-muted-foreground"> / {goal} min</span></p>
        <span className="text-xs text-muted-foreground">{pct}%</span>
      </div>
      <div className="mt-2 h-2 overflow-hidden rounded-full bg-background">
        <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.7 }} className="h-full gradient-primary" />
      </div>
    </div>
  );
}
