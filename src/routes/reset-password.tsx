import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Lock, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { AuthShell, Field } from "./login";

export const Route = createFileRoute("/reset-password")({ component: ResetPage });

function ResetPage() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) return toast.error("Password must be at least 6 characters.");
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success("Password updated.");
    navigate({ to: "/dashboard" });
  };

  return <AuthShell title="Set a new password" subtitle="Choose a strong one.">
    <form onSubmit={onSubmit} className="space-y-4">
      <Field icon={Lock} label="New password" type="password" value={password} onChange={setPassword} required autoComplete="new-password" />
      <button disabled={loading} className="flex w-full items-center justify-center gap-2 rounded-xl gradient-primary py-3 text-sm font-semibold text-primary-foreground shadow-glow disabled:opacity-60">
        {loading && <Loader2 className="h-4 w-4 animate-spin" />} Update password
      </button>
    </form>
  </AuthShell>;
}
