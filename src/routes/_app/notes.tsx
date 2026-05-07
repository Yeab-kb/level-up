import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Pin, Search, Trash2, NotebookPen } from "lucide-react";
import { useNotes, useUpsertNote, useDeleteNote, type Note } from "@/lib/data-hooks";
import { Modal, Empty, PageHeader, GradientButton, Field, inputClass } from "@/components/ui-bits";
import { format } from "date-fns";

export const Route = createFileRoute("/_app/notes")({ component: NotesPage });

const COLORS = [
  { id: "default", swatch: "bg-card" },
  { id: "blue", swatch: "bg-blue-500/30" },
  { id: "purple", swatch: "bg-purple-500/30" },
  { id: "pink", swatch: "bg-pink-500/30" },
  { id: "amber", swatch: "bg-amber-500/30" },
  { id: "emerald", swatch: "bg-emerald-500/30" },
];
const colorBg: Record<string,string> = {
  default: "", blue: "bg-blue-500/10", purple: "bg-purple-500/10",
  pink: "bg-pink-500/10", amber: "bg-amber-500/10", emerald: "bg-emerald-500/10",
};

function NotesPage() {
  const { data: notes = [] } = useNotes();
  const upsert = useUpsertNote();
  const del = useDeleteNote();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Note | null>(null);
  const [search, setSearch] = useState("");

  const filtered = useMemo(() =>
    notes.filter((n) => !search || n.title.toLowerCase().includes(search.toLowerCase()) || (n.content ?? "").toLowerCase().includes(search.toLowerCase())),
    [notes, search]
  );

  return (
    <div>
      <PageHeader title="Notes" subtitle={`${notes.length} note${notes.length === 1 ? "" : "s"}`}
        action={<GradientButton onClick={() => { setEditing(null); setOpen(true); }}><Plus className="h-4 w-4" /> New note</GradientButton>}
      />
      <div className="glass-card mb-5 p-4">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search notes…" className={`${inputClass} pl-10`} />
        </div>
      </div>

      {filtered.length === 0 ? (
        <Empty icon={NotebookPen} title="No notes yet" desc="Capture ideas, summaries, or formulas here."
          action={<GradientButton onClick={() => { setEditing(null); setOpen(true); }}><Plus className="h-4 w-4" /> New note</GradientButton>} />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          <AnimatePresence initial={false}>
            {filtered.map((n) => (
              <motion.button
                key={n.id} layout
                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
                whileHover={{ y: -4 }}
                onClick={() => { setEditing(n); setOpen(true); }}
                className={`glass-card group relative flex h-48 flex-col p-4 text-left ${colorBg[n.color] ?? ""}`}
              >
                <div className="mb-2 flex items-center justify-between">
                  <h3 className="line-clamp-1 font-display text-base font-semibold">{n.title}</h3>
                  {n.pinned && <Pin className="h-3.5 w-3.5 fill-warning text-warning" />}
                </div>
                <p className="line-clamp-5 flex-1 whitespace-pre-wrap text-xs text-muted-foreground">{n.content || "Empty note"}</p>
                <div className="mt-2 flex items-center justify-between text-[10px] text-muted-foreground">
                  <span>{format(new Date(n.updated_at), "MMM d")}</span>
                  <span onClick={(e) => { e.stopPropagation(); del.mutate(n.id); }} className="cursor-pointer rounded-md p-1 opacity-0 transition-opacity hover:bg-destructive/10 hover:text-destructive group-hover:opacity-100">
                    <Trash2 className="h-3.5 w-3.5" />
                  </span>
                </div>
              </motion.button>
            ))}
          </AnimatePresence>
        </div>
      )}

      <NoteModal
        open={open} onClose={() => setOpen(false)} editing={editing}
        onSave={(data: any) => { upsert.mutate({ id: editing?.id, ...data }); setOpen(false); }}
      />
    </div>
  );
}

function NoteModal({ open, onClose, editing, onSave }: any) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [color, setColor] = useState("default");
  const [pinned, setPinned] = useState(false);
  useEffect(() => {
    setTitle(editing?.title ?? "Untitled");
    setContent(editing?.content ?? "");
    setColor(editing?.color ?? "default");
    setPinned(editing?.pinned ?? false);
  }, [editing?.id]);

  return (
    <Modal open={open} onClose={onClose} title={editing ? "Edit note" : "New note"}>
      <form onSubmit={(e) => { e.preventDefault(); onSave({ title, content, color, pinned }); }} className="space-y-4">
        <Field label="Title"><input value={title} onChange={(e)=>setTitle(e.target.value)} className={inputClass} /></Field>
        <Field label="Content"><textarea rows={8} value={content} onChange={(e)=>setContent(e.target.value)} className={inputClass} placeholder="Markdown supported…" /></Field>
        <div className="flex items-center justify-between">
          <div className="flex gap-1.5">
            {COLORS.map(c => (
              <button key={c.id} type="button" onClick={() => setColor(c.id)} className={`h-7 w-7 rounded-full border-2 transition-all ${c.swatch} ${color === c.id ? "border-primary scale-110" : "border-transparent"}`} />
            ))}
          </div>
          <label className="flex cursor-pointer items-center gap-2 text-xs">
            <input type="checkbox" checked={pinned} onChange={(e)=>setPinned(e.target.checked)} className="accent-primary" />
            <Pin className="h-3.5 w-3.5" /> Pin
          </label>
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onClose} className="rounded-xl border border-border px-4 py-2 text-sm">Cancel</button>
          <GradientButton type="submit">Save</GradientButton>
        </div>
      </form>
    </Modal>
  );
}
