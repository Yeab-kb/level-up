import { createFileRoute, Link, redirect, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { motion } from "framer-motion";
import { Sparkles, Mail, Lock, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/login")({
  beforeLoad: async () => {
    const { data } = await supabase.auth.getSession();
    if (data.session) throw redirect({ to: "/dashboard" });
  },
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success("Welcome back!");
    navigate({ to: "/dashboard" });
  };

  return <AuthShell title="Welcome back" subtitle="Log in to continue leveling up.">
    <form onSubmit={onSubmit} className="space-y-4">
      <Field icon={Mail} label="Email" type="email" value={email} onChange={setEmail} required autoComplete="email" />
      <Field icon={Lock} label="Password" type="password" value={password} onChange={setPassword} required autoComplete="current-password" />
      <div className="flex justify-end">
        <Link to="/forgot-password" className="text-xs text-muted-foreground hover:text-foreground">Forgot password?</Link>
      </div>
      <button disabled={loading} className="flex w-full items-center justify-center gap-2 rounded-xl gradient-primary py-3 text-sm font-semibold text-primary-foreground shadow-glow disabled:opacity-60">
        {loading && <Loader2 className="h-4 w-4 animate-spin" />} Log in
      </button>
    </form>
    <p className="mt-6 text-center text-sm text-muted-foreground">
      No account? <Link to="/signup" className="font-medium text-primary hover:underline">Sign up</Link>
    </p>
  </AuthShell>;
}

export function AuthShell({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="relative hidden flex-col justify-between overflow-hidden gradient-primary p-12 lg:flex">
        <Link to="/" className="flex items-center gap-2 text-primary-foreground">
          <div className="grid h-9 w-9 place-items-center rounded-xl bg-white/15 backdrop-blur">
            <Sparkles className="h-5 w-5" />
          </div>
          <span className="font-display text-xl font-bold">Level Up</span>
        </Link>
        <div className="text-primary-foreground">
          <p className="font-display text-4xl font-extrabold leading-tight">Your study OS.<br/>Reimagined.</p>
          <p className="mt-3 max-w-md text-sm text-primary-foreground/80">Tasks, focus timer, calendar, notes, and analytics — all in one calm, gorgeous workspace.</p>
        </div>
        <div className="absolute -right-24 -top-24 h-80 w-80 rounded-full bg-white/15 blur-3xl" />
        <div className="absolute -bottom-24 -left-16 h-80 w-80 rounded-full bg-black/20 blur-3xl" />
      </div>
      <div className="flex items-center justify-center p-6">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-sm">
          <Link to="/" className="mb-8 flex items-center gap-2 lg:hidden">
            <div className="grid h-9 w-9 place-items-center rounded-xl gradient-primary shadow-glow"><Sparkles className="h-5 w-5 text-primary-foreground" /></div>
            <span className="font-display text-xl font-bold">Level Up</span>
          </Link>
          <h1 className="font-display text-3xl font-bold">{title}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
          <div className="mt-8">{children}</div>
        </motion.div>
      </div>
    </div>
  );
}

export function Field({ icon: Icon, label, type, value, onChange, required, autoComplete }: { icon: any; label: string; type: string; value: string; onChange: (v: string) => void; required?: boolean; autoComplete?: string }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium text-muted-foreground">{label}</span>
      <div className="relative">
        <Icon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          type={type} value={value} required={required} autoComplete={autoComplete}
          onChange={(e) => onChange(e.target.value)}
          className="w-full rounded-xl border border-input bg-background/60 py-3 pl-10 pr-3 text-sm outline-none ring-offset-2 ring-offset-background transition-colors focus:border-ring focus:ring-2 focus:ring-ring/40"
        />
      </div>
    </label>
  );
}
