import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Mail, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { AuthShell, Field } from "./login";

export const Route = createFileRoute("/forgot-password")({ component: ForgotPage });

function ForgotPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin + "/reset-password",
    });
    setLoading(false);
    if (error) return toast.error(error.message);
    setSent(true);
    toast.success("Check your inbox for the reset link.");
  };

  return <AuthShell title="Forgot password" subtitle="We'll send a reset link to your email.">
    {sent ? (
      <div className="glass-card p-6 text-sm">
        We sent a reset link to <span className="font-medium">{email}</span>. Check your inbox.
      </div>
    ) : (
      <form onSubmit={onSubmit} className="space-y-4">
        <Field icon={Mail} label="Email" type="email" value={email} onChange={setEmail} required autoComplete="email" />
        <button disabled={loading} className="flex w-full items-center justify-center gap-2 rounded-xl gradient-primary py-3 text-sm font-semibold text-primary-foreground shadow-glow disabled:opacity-60">
          {loading && <Loader2 className="h-4 w-4 animate-spin" />} Send reset link
        </button>
      </form>
    )}
    <p className="mt-6 text-center text-sm text-muted-foreground">
      <Link to="/login" className="font-medium text-primary hover:underline">Back to log in</Link>
    </p>
  </AuthShell>;
}
