import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface Task {
  id: string;
  title: string;
  description: string | null;
  priority: string;
  task_type: string;
  frequency: string;
  task_date: string | null;
  deadline: string | null;
  status: string;
  created_by: string;
  assigned_to: string | null;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
  deleted_at: string | null;
  creator_name?: string;
  assignee_name?: string;
}

export function useTasks() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["tasks", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tasks" as any)
        .select("*")
        .is("deleted_at", null)
        .order("created_at", { ascending: false });
      if (error) throw error;

      const tasks = (data || []) as unknown as Task[];

      const userIds = [...new Set([
        ...tasks.map(t => t.created_by),
        ...tasks.filter(t => t.assigned_to).map(t => t.assigned_to!),
      ])];

      if (userIds.length > 0) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("user_id, full_name")
          .in("user_id", userIds);

        const nameMap: Record<string, string> = {};
        profiles?.forEach(p => { nameMap[p.user_id] = p.full_name || "Unknown"; });

        tasks.forEach(t => {
          t.creator_name = nameMap[t.created_by] || "Unknown";
          t.assignee_name = t.assigned_to ? (nameMap[t.assigned_to] || "Unknown") : undefined;
        });
      }

      return tasks;
    },
    enabled: !!user,
  });
}

export function useDeletedTasks() {
  return useQuery({
    queryKey: ["tasks-deleted"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tasks" as any)
        .select("*")
        .not("deleted_at", "is", null)
        .order("deleted_at", { ascending: false });
      if (error) throw error;
      return (data || []) as unknown as Task[];
    },
  });
}

export function useCreateTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (task: {
      title: string;
      description?: string;
      priority: string;
      task_type: string;
      frequency: string;
      task_date?: string;
      deadline?: string;
      assigned_to?: string;
      created_by: string;
    }) => {
      const { error } = await supabase.from("tasks" as any).insert(task as any);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      toast.success("Task created!");
    },
    onError: (e: Error) => toast.error("Task creation failed: " + e.message),
  });
}

export function useCompleteTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (taskId: string) => {
      const { error } = await supabase
        .from("tasks" as any)
        .update({ status: "completed", completed_at: new Date().toISOString() } as any)
        .eq("id", taskId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      toast.success("Task completed!");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useSoftDeleteTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (taskId: string) => {
      const { error } = await supabase
        .from("tasks" as any)
        .update({ deleted_at: new Date().toISOString() } as any)
        .eq("id", taskId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      queryClient.invalidateQueries({ queryKey: ["tasks-deleted"] });
      toast.success("Task deleted!");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useTeamMembers() {
  return useQuery({
    queryKey: ["team-members-for-tasks"],
    queryFn: async () => {
      const { data: roles } = await supabase
        .from("user_roles")
        .select("user_id, role");
      const userIds = [...new Set(roles?.map(r => r.user_id) || [])];
      if (userIds.length === 0) return [];

      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, full_name")
        .in("user_id", userIds);

      return (profiles || []).map(p => ({
        user_id: p.user_id,
        full_name: p.full_name || `User (${p.user_id.slice(0, 8)})`,
        role: roles?.find(r => r.user_id === p.user_id)?.role || "user",
      }));
    },
  });
}
