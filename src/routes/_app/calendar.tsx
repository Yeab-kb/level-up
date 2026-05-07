import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight, CheckCircle2 } from "lucide-react";
import { addMonths, eachDayOfInterval, endOfMonth, endOfWeek, format, isSameDay, isSameMonth, startOfMonth, startOfWeek, subMonths } from "date-fns";
import { useTasks } from "@/lib/data-hooks";
import { PageHeader } from "@/components/ui-bits";

export const Route = createFileRoute("/_app/calendar")({ component: CalendarPage });

function CalendarPage() {
  const { data: tasks = [] } = useTasks();
  const [cursor, setCursor] = useState(new Date());
  const [selected, setSelected] = useState(new Date());

  const days = useMemo(() => {
    const start = startOfWeek(startOfMonth(cursor), { weekStartsOn: 1 });
    const end = endOfWeek(endOfMonth(cursor), { weekStartsOn: 1 });
    return eachDayOfInterval({ start, end });
  }, [cursor]);

  const dayTasks = useMemo(() => tasks.filter((t) => t.due_at && isSameDay(new Date(t.due_at), selected)), [tasks, selected]);

  return (
    <div>
      <PageHeader title="Calendar" subtitle="Plan your weeks. Click a day to view tasks." />
      <div className="grid gap-6 lg:grid-cols-[1fr,360px]">
        <div className="glass-card p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-xl font-bold">{format(cursor, "MMMM yyyy")}</h2>
            <div className="flex gap-1">
              <button onClick={() => setCursor(subMonths(cursor, 1))} className="rounded-lg p-2 hover:bg-muted"><ChevronLeft className="h-4 w-4" /></button>
              <button onClick={() => setCursor(new Date())} className="rounded-lg px-3 py-1.5 text-xs font-medium hover:bg-muted">Today</button>
              <button onClick={() => setCursor(addMonths(cursor, 1))} className="rounded-lg p-2 hover:bg-muted"><ChevronRight className="h-4 w-4" /></button>
            </div>
          </div>
          <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-medium uppercase text-muted-foreground">
            {["Mon","Tue","Wed","Thu","Fri","Sat","Sun"].map(d => <div key={d} className="py-1">{d}</div>)}
          </div>
          <div className="grid grid-cols-7 gap-1.5">
            {days.map((d) => {
              const isOther = !isSameMonth(d, cursor);
              const isSel = isSameDay(d, selected);
              const isToday = isSameDay(d, new Date());
              const count = tasks.filter((t) => t.due_at && isSameDay(new Date(t.due_at), d)).length;
              return (
                <motion.button
                  key={d.toISOString()} whileTap={{ scale: 0.95 }}
                  onClick={() => setSelected(d)}
                  className={`relative aspect-square rounded-xl text-sm transition-colors ${isSel ? "gradient-primary text-primary-foreground shadow-glow" : isToday ? "bg-muted font-semibold" : "hover:bg-muted/60"} ${isOther ? "opacity-40" : ""}`}
                >
                  <span className="absolute left-2 top-1.5 text-xs font-medium">{format(d, "d")}</span>
                  {count > 0 && (
                    <span className={`absolute bottom-1.5 right-1.5 rounded-full px-1.5 text-[10px] font-bold ${isSel ? "bg-white/30" : "bg-primary/20 text-primary"}`}>{count}</span>
                  )}
                </motion.button>
              );
            })}
          </div>
        </div>

        <div className="glass-card p-5">
          <h3 className="font-display text-lg font-semibold">{format(selected, "EEEE, MMM d")}</h3>
          <p className="text-xs text-muted-foreground">{dayTasks.length} task{dayTasks.length === 1 ? "" : "s"}</p>
          <ul className="mt-4 space-y-2">
            {dayTasks.length === 0 && <li className="rounded-xl border border-dashed border-border/60 p-6 text-center text-sm text-muted-foreground">No tasks for this day.</li>}
            {dayTasks.map((t) => (
              <li key={t.id} className="flex items-center gap-3 rounded-xl border border-border/40 bg-background/40 p-3">
                <CheckCircle2 className={`h-4 w-4 ${t.completed ? "text-success" : "text-muted-foreground"}`} />
                <div className="min-w-0 flex-1">
                  <p className={`truncate text-sm font-medium ${t.completed ? "line-through text-muted-foreground" : ""}`}>{t.title}</p>
                  <p className="text-xs text-muted-foreground">{format(new Date(t.due_at!), "HH:mm")} · {t.priority}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
