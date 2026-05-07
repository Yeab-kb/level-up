import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { LogOut, Moon, Sun, User as UserIcon, Trophy, Flame, Mail } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth-context";
import { useTheme } from "@/lib/theme-context";
import { useProfile, useUpdateProfile, useTasks, useSessions } from "@/lib/data-hooks";
import { PageHeader, GradientButton, Field, inputClass } from "@/components/ui-bits";
import { format, addDays } from "date-fns";

export const Route = createFileRoute("/_app/settings")({ component: SettingsPage });

function SettingsPage() {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { theme, toggle } = useTheme();
  const { data: profile } = useProfile();
  const { data: tasks = [] } = useTasks();
  const { data: sessions = [] } = useSessions();
  const update = useUpdateProfile();
  const [fullName, setFullName] = useState("");
  const [bio, setBio] = useState("");

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name ?? "");
      setBio(profile.bio ?? "");
    }
  }, [profile?.id]);

  const totalDone = tasks.filter((t) => t.completed).length;
  const totalMin = sessions.reduce((a, b) => a + b.duration_minutes, 0);
  const xp = totalDone * 10 + Math.floor(totalMin / 5);
  const level = Math.floor(xp / 100) + 1;
  const xpInLevel = xp % 100;

  const dayKeys = new Set<string>();
  tasks.forEach((t) => t.completed_at && dayKeys.add(format(new Date(t.completed_at), "yyyy-MM-dd")));
  sessions.forEach((s) => dayKeys.add(format(new Date(s.completed_at), "yyyy-MM-dd")));
  let streak = 0;
  for (let i = 0; i < 365; i++) {
    const d = format(addDays(new Date(), -i), "yyyy-MM-dd");
    if (dayKeys.has(d)) streak++; else if (i > 0) break;
  }

  return (
    <div>
      <PageHeader title="Settings" subtitle="Profile, theme & preferences." />
      <div className="grid gap-6 lg:grid-cols-3">
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="glass-card relative overflow-hidden p-6 lg:col-span-1">
          <div className="absolute -right-12 -top-12 h-40 w-40 rounded-full gradient-primary opacity-30 blur-3xl" />
          <div className="relative flex flex-col items-center text-center">
            <div className="grid h-20 w-20 place-items-center rounded-2xl gradient-primary text-2xl font-bold text-primary-foreground shadow-glow">
              {(fullName?.[0] ?? user?.email?.[0] ?? "?").toUpperCase()}
            </div>
            <p className="mt-3 font-display text-xl font-bold">{fullName || user?.email?.split("@")[0]}</p>
            <p className="flex items-center gap-1 text-xs text-muted-foreground"><Mail className="h-3 w-3" /> {user?.email}</p>

            <div className="mt-6 grid w-full grid-cols-3 gap-2 text-center">
              <div className="rounded-xl bg-muted/50 p-3"><Trophy className="mx-auto h-4 w-4 text-warning" /><p className="mt-1 text-lg font-bold">{level}</p><p className="text-[10px] text-muted-foreground">Level</p></div>
              <div className="rounded-xl bg-muted/50 p-3"><Flame className="mx-auto h-4 w-4 text-destructive" /><p className="mt-1 text-lg font-bold">{streak}</p><p className="text-[10px] text-muted-foreground">Streak</p></div>
              <div className="rounded-xl bg-muted/50 p-3"><UserIcon className="mx-auto h-4 w-4 text-primary" /><p className="mt-1 text-lg font-bold">{xp}</p><p className="text-[10px] text-muted-foreground">XP</p></div>
            </div>

            <div className="mt-4 w-full">
              <div className="mb-1 flex justify-between text-[11px]"><span className="text-muted-foreground">Level {level}</span><span>{xpInLevel}/100 XP</span></div>
              <div className="h-2 overflow-hidden rounded-full bg-muted">
                <motion.div initial={{ width: 0 }} animate={{ width: `${xpInLevel}%` }} transition={{ duration: 0.8 }} className="h-full gradient-primary" />
              </div>
            </div>
          </div>
        </motion.div>

        <div className="space-y-6 lg:col-span-2">
          <div className="glass-card p-6">
            <h2 className="mb-4 font-display text-lg font-semibold">Profile</h2>
            <form onSubmit={(e) => { e.preventDefault(); update.mutate({ full_name: fullName, bio }); }} className="space-y-4">
              <Field label="Full name"><input value={fullName} onChange={(e) => setFullName(e.target.value)} className={inputClass} /></Field>
              <Field label="Bio"><textarea rows={3} value={bio} onChange={(e) => setBio(e.target.value)} className={inputClass} placeholder="A line about you…" /></Field>
              <div className="flex justify-end"><GradientButton type="submit">Save profile</GradientButton></div>
            </form>
          </div>

          <div className="glass-card p-6">
            <h2 className="mb-4 font-display text-lg font-semibold">Appearance</h2>
            <button onClick={toggle} className="flex w-full items-center justify-between rounded-xl border border-border p-4 hover:bg-muted/50">
              <span className="flex items-center gap-3">
                {theme === "dark" ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
                <span className="text-sm font-medium">{theme === "dark" ? "Dark mode" : "Light mode"}</span>
              </span>
              <span className="text-xs text-muted-foreground">Click to toggle</span>
            </button>
          </div>

          <div className="glass-card p-6">
            <h2 className="mb-4 font-display text-lg font-semibold">Account</h2>
            <button
              onClick={async () => { await signOut(); toast.success("Logged out"); navigate({ to: "/" }); }}
              className="flex items-center gap-2 rounded-xl border border-destructive/30 px-4 py-2.5 text-sm font-medium text-destructive hover:bg-destructive/10"
            >
              <LogOut className="h-4 w-4" /> Log out
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
