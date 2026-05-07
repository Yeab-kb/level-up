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
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) return toast.error("Password must be at least 6 characters.");
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email, password,
      options: { emailRedirectTo: window.location.origin + "/dashboard", data: { full_name: name } },
    });
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success("Account created! Welcome to Level Up.");
    navigate({ to: "/dashboard" });
  };

  return <AuthShell title="Create your account" subtitle="Start your productive era today.">
    <form onSubmit={onSubmit} className="space-y-4">
      <Field icon={User} label="Full name" type="text" value={name} onChange={setName} required autoComplete="name" />
      <Field icon={Mail} label="Email" type="email" value={email} onChange={setEmail} required autoComplete="email" />
      <Field icon={Lock} label="Password" type="password" value={password} onChange={setPassword} required autoComplete="new-password" />
      <button disabled={loading} className="flex w-full items-center justify-center gap-2 rounded-xl gradient-primary py-3 text-sm font-semibold text-primary-foreground shadow-glow disabled:opacity-60">
        {loading && <Loader2 className="h-4 w-4 animate-spin" />} Create account
      </button>
    </form>
    <p className="mt-6 text-center text-sm text-muted-foreground">
      Already have an account? <Link to="/login" className="font-medium text-primary hover:underline">Log in</Link>
    </p>
  </AuthShell>;
}
