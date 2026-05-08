import { createFileRoute, Link, redirect, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Mail, Lock, User, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { AuthShell, Field } from "./login";

export const Route = createFileRoute("/signup")({
  beforeLoad: async () => {
    const { data } = await supabase.auth.getSession();
    if (data.session) throw redirect({ to: "/dashboard" });
  },
  component: SignupPage,
});

function SignupPage() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<{ name?: string; email?: string; password?: string; form?: string }>({});
  const [loading, setLoading] = useState(false);

  const validate = () => {
    const next: typeof errors = {};
    if (name.trim().length < 2) next.name = "Tell us your name.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) next.email = "Enter a valid email.";
    if (password.length < 6) next.password = "At least 6 characters.";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    setErrors({});
    const { error } = await supabase.auth.signUp({
      email: email.trim(), password,
      options: { emailRedirectTo: window.location.origin + "/dashboard", data: { full_name: name.trim() } },
    });
    setLoading(false);
    if (error) {
      setErrors({ form: error.message });
      return toast.error(error.message);
    }
    toast.success("Account created! Welcome to Level Up.");
    navigate({ to: "/dashboard" });
  };

  return <AuthShell title="Create your account" subtitle="Start your productive era today.">
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      <Field icon={User} label="Full name" type="text" value={name} onChange={(v) => { setName(v); if (errors.name) setErrors({ ...errors, name: undefined }); }} required autoComplete="name" error={errors.name} />
      <Field icon={Mail} label="Email" type="email" value={email} onChange={(v) => { setEmail(v); if (errors.email) setErrors({ ...errors, email: undefined }); }} required autoComplete="email" error={errors.email} />
      <Field icon={Lock} label="Password" type="password" value={password} onChange={(v) => { setPassword(v); if (errors.password) setErrors({ ...errors, password: undefined }); }} required autoComplete="new-password" error={errors.password} />
      {errors.form && <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">{errors.form}</p>}
      <button disabled={loading} className="flex w-full items-center justify-center gap-2 rounded-xl gradient-primary py-3 text-sm font-semibold text-primary-foreground shadow-glow transition-opacity disabled:opacity-60">
        {loading && <Loader2 className="h-4 w-4 animate-spin" />} {loading ? "Creating…" : "Create account"}
      </button>
    </form>
    <p className="mt-6 text-center text-sm text-muted-foreground">
      Already have an account? <Link to="/login" className="font-medium text-primary hover:underline">Log in</Link>
    </p>
  </AuthShell>;
}
