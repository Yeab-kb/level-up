import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { ArrowRight, CheckCircle2, Calendar, Timer, NotebookPen, Sparkles, Zap, BarChart3 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/")({
  beforeLoad: async () => {
    const { data } = await supabase.auth.getSession();
    if (data.session) throw redirect({ to: "/dashboard" });
  },
  component: Landing,
  head: () => ({
    meta: [
      { title: "Level Up — Smart Student Productivity" },
      { name: "description", content: "Beat deadlines, build streaks, level up. The all-in-one productivity OS for students." },
    ],
  }),
});

const features = [
  { icon: CheckCircle2, title: "Smart Tasks", desc: "Priorities, subjects, due dates. Search, sort, filter — built for students." },
  { icon: Calendar, title: "Calendar", desc: "See your week at a glance. Click any day to plan." },
  { icon: Timer, title: "Pomodoro Timer", desc: "Focus sessions with stats and streaks." },
  { icon: NotebookPen, title: "Notes", desc: "Color-coded notes you can pin, search, and organize." },
  { icon: BarChart3, title: "Analytics", desc: "Productivity trends, study hours, and weekly progress." },
  { icon: Zap, title: "Gamified", desc: "Earn XP, level up, keep your streak alive." },
];

function Landing() {
  return (
    <div className="min-h-screen">
      <header className="mx-auto flex max-w-7xl items-center justify-between px-6 py-6">
        <Link to="/" className="flex items-center gap-2">
          <div className="grid h-9 w-9 place-items-center rounded-xl gradient-primary shadow-glow">
            <Sparkles className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="font-display text-xl font-bold">Level Up</span>
        </Link>
        <nav className="flex items-center gap-2">
          <Link to="/login" className="rounded-full px-4 py-2 text-sm font-medium hover:bg-muted">Log in</Link>
          <Link to="/signup" className="rounded-full gradient-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-glow">Get started</Link>
        </nav>
      </header>

      <section className="mx-auto max-w-7xl px-6 pb-20 pt-10 sm:pt-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mx-auto max-w-3xl text-center"
        >
          <span className="inline-flex items-center gap-2 rounded-full glass px-3 py-1 text-xs font-medium text-muted-foreground">
            <Sparkles className="h-3.5 w-3.5 text-accent" /> Smart productivity for students
          </span>
          <h1 className="mt-6 font-display text-5xl font-extrabold leading-[1.05] sm:text-6xl md:text-7xl">
            Beat deadlines.<br />
            <span className="gradient-text">Level up</span> your week.
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-lg text-muted-foreground">
            Tasks, calendar, focus timer, notes, streaks, and analytics. One beautiful workspace built for student life.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link to="/signup" className="inline-flex items-center gap-2 rounded-full gradient-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-glow transition-transform hover:scale-[1.02]">
              Start free <ArrowRight className="h-4 w-4" />
            </Link>
            <Link to="/login" className="rounded-full border border-border px-6 py-3 text-sm font-semibold hover:bg-muted">
              Log in
            </Link>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="mx-auto mt-16 grid max-w-6xl gap-4 sm:grid-cols-2 lg:grid-cols-3"
        >
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.05 }}
              className="glass-card p-6 transition-transform hover:-translate-y-1"
            >
              <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl gradient-primary shadow-glow">
                <f.icon className="h-5 w-5 text-primary-foreground" />
              </div>
              <h3 className="font-display text-lg font-semibold">{f.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{f.desc}</p>
            </motion.div>
          ))}
        </motion.div>
      </section>

      <footer className="border-t border-border/40 py-8 text-center text-xs text-muted-foreground">
        Built with ❤️ on Level Up · {new Date().getFullYear()}
      </footer>
    </div>
  );
}
