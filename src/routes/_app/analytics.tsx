import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import { motion } from "framer-motion";
import { Trophy, Flame, TrendingUp, Clock } from "lucide-react";
import { useTasks, useSessions } from "@/lib/data-hooks";
import { PageHeader } from "@/components/ui-bits";
import { addDays, format, isSameDay, subDays } from "date-fns";

export const Route = createFileRoute("/_app/analytics")({ component: AnalyticsPage });

function AnalyticsPage() {
  const { data: tasks = [] } = useTasks();
  const { data: sessions = [] } = useSessions();

  const last14 = useMemo(() => Array.from({ length: 14 }).map((_, i) => {
    const d = subDays(new Date(), 13 - i);
    return {
      date: d,
      label: format(d, "MMM d"),
      done: tasks.filter((t) => t.completed_at && isSameDay(new Date(t.completed_at), d)).length,
      minutes: sessions.filter((s) => isSameDay(new Date(s.completed_at), d)).reduce((a, b) => a + b.duration_minutes, 0),
    };
  }), [tasks, sessions]);

  const maxDone = Math.max(1, ...last14.map((d) => d.done));
  const maxMin = Math.max(1, ...last14.map((d) => d.minutes));

  const totalMin = sessions.reduce((a, b) => a + b.duration_minutes, 0);
  const totalDone = tasks.filter((t) => t.completed).length;

  const dayTotals: Record<string, number> = {};
  tasks.forEach((t) => {
    if (t.completed_at) {
      const k = format(new Date(t.completed_at), "EEE");
      dayTotals[k] = (dayTotals[k] ?? 0) + 1;
    }
  });
  const bestDay = Object.entries(dayTotals).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "—";

  // Streak
  const dayKeys = new Set<string>();
  tasks.forEach((t) => t.completed_at && dayKeys.add(format(new Date(t.completed_at), "yyyy-MM-dd")));
  sessions.forEach((s) => dayKeys.add(format(new Date(s.completed_at), "yyyy-MM-dd")));
  let streak = 0;
  for (let i = 0; i < 365; i++) {
    const d = format(addDays(new Date(), -i), "yyyy-MM-dd");
    if (dayKeys.has(d)) streak++;
    else if (i > 0) break;
  }

  return (
    <div>
      <PageHeader title="Analytics" subtitle="Your productivity, at a glance." />
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat icon={Trophy} label="Tasks done" value={totalDone} />
        <Stat icon={Clock} label="Total minutes" value={totalMin} />
        <Stat icon={Flame} label="Current streak" value={`${streak}d`} />
        <Stat icon={TrendingUp} label="Best day" value={bestDay} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Chart title="Tasks completed (14d)" data={last14.map(d => ({ ...d, value: d.done }))} max={maxDone} unit="" />
        <Chart title="Study minutes (14d)" data={last14.map(d => ({ ...d, value: d.minutes }))} max={maxMin} unit="m" />
      </div>
    </div>
  );
}

function Stat({ icon: Icon, label, value }: any) {
  return (
    <motion.div whileHover={{ y: -2 }} className="glass-card p-5">
      <span className="grid h-9 w-9 place-items-center rounded-xl gradient-primary text-primary-foreground shadow-glow"><Icon className="h-4.5 w-4.5" /></span>
      <p className="mt-3 text-xs text-muted-foreground">{label}</p>
      <p className="font-display text-2xl font-bold">{value}</p>
    </motion.div>
  );
}

function Chart({ title, data, max, unit }: { title: string; data: any[]; max: number; unit: string }) {
  // Build clean rounded scale
  const niceMax = niceCeil(max);
  const ticks = [niceMax, Math.round(niceMax * 0.75), Math.round(niceMax * 0.5), Math.round(niceMax * 0.25), 0];
  return (
    <div className="glass-card p-5">
      <h3 className="mb-4 font-display text-lg font-semibold">{title}</h3>
      <div className="flex gap-3">
        <div className="flex h-44 flex-col justify-between text-[10px] text-muted-foreground">
          {ticks.map((t) => <span key={t} className="leading-none">{t}{unit}</span>)}
        </div>
        <div className="relative flex-1">
          <div className="pointer-events-none absolute inset-0 flex flex-col justify-between">
            {ticks.map((_, i) => <div key={i} className="h-px w-full bg-border/40" />)}
          </div>
          <div className="relative flex h-44 items-end gap-1.5">
            {data.map((d, i) => {
              const pct = niceMax > 0 ? (d.value / niceMax) * 100 : 0;
              return (
                <div key={i} className="group relative flex flex-1 flex-col items-center justify-end" title={`${d.label}: ${d.value}${unit}`}>
                  <span className="pointer-events-none absolute -top-5 rounded bg-popover px-1.5 py-0.5 text-[10px] opacity-0 shadow group-hover:opacity-100">{d.value}{unit}</span>
                  <motion.div
                    initial={{ height: 0 }} animate={{ height: `${pct}%` }} transition={{ delay: i * 0.02 }}
                    className={`w-full rounded-t gradient-primary ${d.value === 0 ? "opacity-20" : "opacity-80 group-hover:opacity-100"}`}
                  />
                </div>
              );
            })}
          </div>
        </div>
      </div>
      <div className="mt-2 flex justify-between pl-9 text-[10px] text-muted-foreground">
        <span>{data[0].label}</span><span>{data[data.length - 1].label}</span>
      </div>
    </div>
  );
}

function niceCeil(n: number) {
  if (n <= 4) return 4;
  const pow = Math.pow(10, Math.floor(Math.log10(n)));
  const norm = n / pow;
  const nice = norm <= 1 ? 1 : norm <= 2 ? 2 : norm <= 5 ? 5 : 10;
  return nice * pow;
}
