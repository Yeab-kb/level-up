import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { motion } from "framer-motion";
import { Plus, Trash2, BookOpen } from "lucide-react";
import { useSubjects, useCreateSubject, useDeleteSubject, useTasks, useSessions } from "@/lib/data-hooks";
import { Modal, Empty, PageHeader, GradientButton, Field, inputClass } from "@/components/ui-bits";

export const Route = createFileRoute("/_app/subjects")({ component: SubjectsPage });

const PALETTE = ["#7c3aed", "#3b82f6", "#06b6d4", "#10b981", "#f59e0b", "#ef4444", "#ec4899", "#8b5cf6"];

function SubjectsPage() {
  const { data: subjects = [] } = useSubjects();
  const { data: tasks = [] } = useTasks();
  const { data: sessions = [] } = useSessions();
  const create = useCreateSubject();
  const del = useDeleteSubject();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [color, setColor] = useState(PALETTE[0]);

  return (
    <div>
      <PageHeader title="Subjects" subtitle="Organize your studies."
        action={<GradientButton onClick={() => setOpen(true)}><Plus className="h-4 w-4" /> Add subject</GradientButton>} />

      {subjects.length === 0 ? (
        <Empty icon={BookOpen} title="No subjects yet" desc="Add subjects to color-code your tasks and notes."
          action={<GradientButton onClick={() => setOpen(true)}><Plus className="h-4 w-4" /> Add subject</GradientButton>} />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {subjects.map((s) => {
            const subjTasks = tasks.filter((t) => t.subject_id === s.id);
            const done = subjTasks.filter((t) => t.completed).length;
            const pct = subjTasks.length ? Math.round((done / subjTasks.length) * 100) : 0;
            const minutes = sessions.filter((x) => x.subject_id === s.id).reduce((a, b) => a + b.duration_minutes, 0);
            return (
              <motion.div key={s.id} whileHover={{ y: -3 }} className="glass-card p-5">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="grid h-11 w-11 place-items-center rounded-xl text-white shadow-glow" style={{ background: s.color }}>
                      <BookOpen className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-display text-lg font-semibold">{s.name}</h3>
                      <p className="text-xs text-muted-foreground">{subjTasks.length} task{subjTasks.length === 1 ? "" : "s"} · {minutes} min</p>
                    </div>
                  </div>
                  <button onClick={() => del.mutate(s.id)} className="rounded-lg p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
                <div className="mt-4">
                  <div className="mb-1 flex justify-between text-xs">
                    <span className="text-muted-foreground">Progress</span>
                    <span className="font-semibold">{pct}%</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-muted">
                    <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.7 }} className="h-full" style={{ background: s.color }} />
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title="New subject">
        <form onSubmit={(e) => { e.preventDefault(); if (!name.trim()) return; create.mutate({ name: name.trim(), color }, { onSuccess: () => { setOpen(false); setName(""); } }); }} className="space-y-4">
          <Field label="Name"><input value={name} onChange={(e) => setName(e.target.value)} required className={inputClass} placeholder="Mathematics" /></Field>
          <Field label="Color">
            <div className="flex flex-wrap gap-2">
              {PALETTE.map((c) => (
                <button key={c} type="button" onClick={() => setColor(c)} className={`h-9 w-9 rounded-full border-2 transition-all ${color === c ? "scale-110 border-foreground" : "border-transparent"}`} style={{ background: c }} />
              ))}
            </div>
          </Field>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setOpen(false)} className="rounded-xl border border-border px-4 py-2 text-sm">Cancel</button>
            <GradientButton type="submit">Create</GradientButton>
          </div>
        </form>
      </Modal>
    </div>
  );
}
