import { createFileRoute } from "@tanstack/react-router";
import { motion, AnimatePresence } from "framer-motion";
import { useMemo, useState } from "react";
import { Plus, Search, CheckCircle2, Trash2, Calendar as CalIcon, Filter, ListTodo, ChevronDown } from "lucide-react";
import { useTasks, useCreateTask, useUpdateTask, useDeleteTask, useSubjects, type Task } from "@/lib/data-hooks";
import { Modal, Empty, Skeleton, PageHeader, GradientButton, Field, inputClass } from "@/components/ui-bits";
import { format, isPast, isToday } from "date-fns";

export const Route = createFileRoute("/_app/tasks")({ component: TasksPage });

const PRIORITIES = ["low", "medium", "high"] as const;
const CATEGORIES = ["homework", "exam", "project", "personal"] as const;

const priColor: Record<string, string> = {
  high: "bg-destructive/15 text-destructive",
  medium: "bg-warning/15 text-warning",
  low: "bg-success/15 text-success",
};

function TasksPage() {
  const { data: tasks = [], isLoading } = useTasks();
  const { data: subjects = [] } = useSubjects();
  const create = useCreateTask();
  const update = useUpdateTask();
  const del = useDeleteTask();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Task | null>(null);
  const [search, setSearch] = useState("");
  const [filterPri, setFilterPri] = useState<string>("all");
  const [filterCat, setFilterCat] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<"all" | "open" | "done">("open");
  const [sort, setSort] = useState<"due" | "priority" | "newest">("due");

  const filtered = useMemo(() => {
    let arr = tasks.filter((t) =>
      (filterStatus === "all" || (filterStatus === "open" ? !t.completed : t.completed)) &&
      (filterPri === "all" || t.priority === filterPri) &&
      (filterCat === "all" || t.category === filterCat) &&
      (search === "" || t.title.toLowerCase().includes(search.toLowerCase()))
    );
    const priRank: Record<string, number> = { high: 0, medium: 1, low: 2 };
    if (sort === "due") arr = arr.sort((a, b) => (a.due_at ? +new Date(a.due_at) : Infinity) - (b.due_at ? +new Date(b.due_at) : Infinity));
    if (sort === "priority") arr = arr.sort((a, b) => priRank[a.priority] - priRank[b.priority]);
    if (sort === "newest") arr = arr.sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at));
    return arr;
  }, [tasks, filterPri, filterCat, filterStatus, search, sort]);

  return (
    <div>
      <PageHeader
        title="Tasks" subtitle={`${tasks.filter((t) => !t.completed).length} open · ${tasks.filter((t) => t.completed).length} done`}
        action={<GradientButton onClick={() => { setEditing(null); setOpen(true); }}><Plus className="h-4 w-4" /> New task</GradientButton>}
      />

      <div className="glass-card mb-5 flex flex-col gap-3 p-4 sm:flex-row sm:flex-wrap sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search tasks…" className={`${inputClass} pl-10`} />
        </div>
        <div className="flex flex-wrap gap-2">
          <Select value={filterStatus} onChange={setFilterStatus as any} options={[["all","All"],["open","Open"],["done","Done"]]} icon={<Filter className="h-3.5 w-3.5" />} />
          <Select value={filterPri} onChange={setFilterPri} options={[["all","Priority"],...PRIORITIES.map(p=>[p,cap(p)] as [string,string])]} />
          <Select value={filterCat} onChange={setFilterCat} options={[["all","Category"],...CATEGORIES.map(p=>[p,cap(p)] as [string,string])]} />
          <Select value={sort} onChange={setSort as any} options={[["due","Due"],["priority","Priority"],["newest","Newest"]]} />
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-2">{Array.from({length:5}).map((_,i)=><Skeleton key={i} className="h-16" />)}</div>
      ) : filtered.length === 0 ? (
        <Empty icon={ListTodo} title="No tasks found" desc="Create your first task to start leveling up." action={<GradientButton onClick={() => { setEditing(null); setOpen(true); }}><Plus className="h-4 w-4" /> New task</GradientButton>} />
      ) : (
        <ul className="space-y-2">
          <AnimatePresence initial={false}>
            {filtered.map((t) => {
              const subject = subjects.find((s) => s.id === t.subject_id);
              const due = t.due_at ? new Date(t.due_at) : null;
              const overdue = due && !t.completed && isPast(due) && !isToday(due);
              return (
                <motion.li
                  key={t.id}
                  layout initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: -20 }}
                  className="glass-card flex items-center gap-3 p-4"
                >
                  <button
                    onClick={() => update.mutate({ id: t.id, completed: !t.completed, completed_at: !t.completed ? new Date().toISOString() : null })}
                    className={`grid h-7 w-7 shrink-0 place-items-center rounded-full border transition-all ${t.completed ? "border-primary bg-primary text-primary-foreground" : "border-border hover:border-primary"}`}
                  >
                    {t.completed && <CheckCircle2 className="h-4 w-4" />}
                  </button>
                  <button onClick={() => { setEditing(t); setOpen(true); }} className="min-w-0 flex-1 text-left">
                    <p className={`truncate text-sm font-medium ${t.completed ? "text-muted-foreground line-through" : ""}`}>{t.title}</p>
                    <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[11px]">
                      <span className={`rounded-full px-2 py-0.5 font-medium ${priColor[t.priority]}`}>{t.priority}</span>
                      <span className="rounded-full bg-muted px-2 py-0.5 capitalize text-muted-foreground">{t.category}</span>
                      {subject && (
                        <span className="rounded-full px-2 py-0.5 font-medium" style={{ background: `${subject.color}22`, color: subject.color }}>{subject.name}</span>
                      )}
                      {due && (
                        <span className={`flex items-center gap-1 rounded-full px-2 py-0.5 ${overdue ? "bg-destructive/15 text-destructive" : "bg-muted text-muted-foreground"}`}>
                          <CalIcon className="h-3 w-3" /> {format(due, "MMM d, HH:mm")}
                        </span>
                      )}
                    </div>
                  </button>
                  <button onClick={() => del.mutate(t.id)} className="rounded-lg p-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </motion.li>
              );
            })}
          </AnimatePresence>
        </ul>
      )}

      <TaskModal
        open={open} onClose={() => setOpen(false)} editing={editing}
        subjects={subjects}
        onSave={(data: any) => {
          if (editing) update.mutate({ id: editing.id, ...data });
          else create.mutate(data as any);
          setOpen(false);
        }}
      />
    </div>
  );
}

function Select({ value, onChange, options, icon }: { value: string; onChange: (v: string) => void; options: [string, string][]; icon?: React.ReactNode }) {
  return (
    <div className="relative">
      {icon && <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground">{icon}</span>}
      <select value={value} onChange={(e) => onChange(e.target.value)} className={`appearance-none rounded-xl border border-input bg-background/60 py-2 pr-8 text-xs font-medium outline-none focus:border-ring ${icon ? "pl-7" : "pl-3"}`}>
        {options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
      </select>
      <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
    </div>
  );
}

function cap(s: string) { return s[0].toUpperCase() + s.slice(1); }

function TaskModal({ open, onClose, editing, subjects, onSave }: any) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<"low"|"medium"|"high">("medium");
  const [category, setCategory] = useState("homework");
  const [subjectId, setSubjectId] = useState("");
  const [dueAt, setDueAt] = useState("");

  // reset when editing changes
  const key = editing?.id ?? "new";
  useMemoReset(key, () => {
    setTitle(editing?.title ?? "");
    setDescription(editing?.description ?? "");
    setPriority(editing?.priority ?? "medium");
    setCategory(editing?.category ?? "homework");
    setSubjectId(editing?.subject_id ?? "");
    setDueAt(editing?.due_at ? format(new Date(editing.due_at), "yyyy-MM-dd'T'HH:mm") : "");
  });

  return (
    <Modal open={open} onClose={onClose} title={editing ? "Edit task" : "New task"}>
      <form onSubmit={(e) => { e.preventDefault(); if (!title.trim()) return; onSave({
        title: title.trim(), description: description || null,
        priority, category, subject_id: subjectId || null,
        due_at: dueAt ? new Date(dueAt).toISOString() : null,
      }); }} className="space-y-4">
        <Field label="Title"><input value={title} onChange={(e)=>setTitle(e.target.value)} required className={inputClass} placeholder="Math homework chapter 3" /></Field>
        <Field label="Description"><textarea value={description} onChange={(e)=>setDescription(e.target.value)} rows={3} className={inputClass} /></Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Priority">
            <select value={priority} onChange={(e)=>setPriority(e.target.value as any)} className={inputClass}>
              {PRIORITIES.map(p => <option key={p} value={p}>{cap(p)}</option>)}
            </select>
          </Field>
          <Field label="Category">
            <select value={category} onChange={(e)=>setCategory(e.target.value)} className={inputClass}>
              {CATEGORIES.map(p => <option key={p} value={p}>{cap(p)}</option>)}
            </select>
          </Field>
          <Field label="Subject">
            <select value={subjectId} onChange={(e)=>setSubjectId(e.target.value)} className={inputClass}>
              <option value="">None</option>
              {subjects.map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </Field>
          <Field label="Due"><input type="datetime-local" value={dueAt} onChange={(e)=>setDueAt(e.target.value)} className={inputClass} /></Field>
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onClose} className="rounded-xl border border-border px-4 py-2 text-sm">Cancel</button>
          <GradientButton type="submit">{editing ? "Save" : "Create"}</GradientButton>
        </div>
      </form>
    </Modal>
  );
}

import { useEffect } from "react";
function useMemoReset(key: string, fn: () => void) { useEffect(() => { fn(); /* eslint-disable-next-line */ }, [key]); }
