import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { toast } from "sonner";

export type Task = {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  category: string;
  priority: "low" | "medium" | "high";
  subject_id: string | null;
  due_at: string | null;
  completed: boolean;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
};

export function useTasks() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["tasks", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tasks").select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Task[];
    },
  });
}

export function useCreateTask() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (input: Partial<Task> & { title: string }) => {
      const { data, error } = await supabase.from("tasks").insert({
        user_id: user!.id,
        title: input.title,
        description: input.description ?? null,
        category: input.category ?? "homework",
        priority: input.priority ?? "medium",
        subject_id: input.subject_id ?? null,
        due_at: input.due_at ?? null,
      }).select().single();
      if (error) throw error;
      return data as Task;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tasks"] });
      toast.success("Task added");
    },
    onError: (e: any) => toast.error(e.message),
  });
}

export function useUpdateTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...patch }: Partial<Task> & { id: string }) => {
      const { data, error } = await supabase.from("tasks").update({ ...patch, updated_at: new Date().toISOString() }).eq("id", id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tasks"] }),
    onError: (e: any) => toast.error(e.message),
  });
}

export function useDeleteTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("tasks").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tasks"] });
      toast.success("Task deleted");
    },
    onError: (e: any) => toast.error(e.message),
  });
}

// Subjects
export type Subject = { id: string; user_id: string; name: string; color: string; icon: string | null; created_at: string };

export function useSubjects() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["subjects", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase.from("subjects").select("*").order("created_at");
      if (error) throw error;
      return data as Subject[];
    },
  });
}
export function useCreateSubject() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (s: { name: string; color: string }) => {
      const { data, error } = await supabase.from("subjects").insert({ user_id: user!.id, name: s.name, color: s.color }).select().single();
      if (error) throw error; return data;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["subjects"] }); toast.success("Subject added"); },
    onError: (e: any) => toast.error(e.message),
  });
}
export function useDeleteSubject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("subjects").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["subjects"] }); toast.success("Subject removed"); },
  });
}

// Notes
export type Note = { id: string; user_id: string; title: string; content: string | null; color: string; pinned: boolean; subject_id: string | null; task_id: string | null; created_at: string; updated_at: string };

export function useNotes() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["notes", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase.from("notes").select("*").order("pinned", { ascending: false }).order("updated_at", { ascending: false });
      if (error) throw error;
      return data as Note[];
    },
  });
}
export function useUpsertNote() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (n: Partial<Note> & { id?: string }) => {
      if (n.id) {
        const { data, error } = await supabase.from("notes").update({ title: n.title, content: n.content, color: n.color, pinned: n.pinned, updated_at: new Date().toISOString() }).eq("id", n.id).select().single();
        if (error) throw error; return data;
      }
      const { data, error } = await supabase.from("notes").insert({ user_id: user!.id, title: n.title ?? "Untitled", content: n.content ?? "", color: n.color ?? "default", pinned: n.pinned ?? false }).select().single();
      if (error) throw error; return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notes"] }),
    onError: (e: any) => toast.error(e.message),
  });
}
export function useDeleteNote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("notes").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["notes"] }); toast.success("Note deleted"); },
  });
}

// Sessions
export type StudySession = { id: string; user_id: string; subject_id: string | null; duration_minutes: number; completed_at: string };

export function useSessions() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["sessions", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase.from("study_sessions").select("*").order("completed_at", { ascending: false });
      if (error) throw error;
      return data as StudySession[];
    },
  });
}
export function useLogSession() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (duration_minutes: number) => {
      const { error } = await supabase.from("study_sessions").insert({ user_id: user!.id, duration_minutes });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["sessions"] }),
  });
}

// Profile
export function useProfile() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["profile", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase.from("profiles").select("*").eq("id", user!.id).maybeSingle();
      if (error) throw error;
      return data;
    },
  });
}
export function useUpdateProfile() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (patch: { full_name?: string; username?: string; bio?: string }) => {
      const { error } = await supabase.from("profiles").update({ ...patch, updated_at: new Date().toISOString() }).eq("id", user!.id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["profile"] }); toast.success("Profile updated"); },
    onError: (e: any) => toast.error(e.message),
  });
}
