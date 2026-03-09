import { useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Plus, User, Users, Send, Globe, Trash2, CheckCircle2, Clock, AlertTriangle, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useTasks, useDeletedTasks, useCreateTask, useCompleteTask, useSoftDeleteTask, useTeamMembers, Task } from "@/hooks/useTasks";
import { format, isToday, startOfWeek, endOfWeek, startOfMonth, endOfMonth, parseISO } from "date-fns";

type TaskType = "personal" | "own_assigned" | "common";
type TaskFilter = "today" | "daily" | "weekly" | "monthly" | "date_specific" | "all";
type TaskTab = "personal" | "by_others" | "assigned" | "common" | "deleted";

const priorityColors: Record<string, string> = {
  Low: "bg-muted text-muted-foreground",
  Medium: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  High: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300",
  Urgent: "bg-destructive/10 text-destructive",
};

export default function AdminTasks() {
  const { user } = useAuth();
  const { data: tasks = [], isLoading } = useTasks();
  const { data: deletedTasks = [] } = useDeletedTasks();
  const { data: teamMembers = [] } = useTeamMembers();
  const createTask = useCreateTask();
  const completeTask = useCompleteTask();
  const softDeleteTask = useSoftDeleteTask();

  const [title, setTitle] = useState("");
  const [priority, setPriority] = useState("Medium");
  const [description, setDescription] = useState("");
  const [frequency, setFrequency] = useState("date_specific");
  const [date, setDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [assignTo, setAssignTo] = useState("");
  const [deadline, setDeadline] = useState("");
  const [taskType, setTaskType] = useState<TaskType>("personal");
  const [filter, setFilter] = useState<TaskFilter>("all");
  const [taskTab, setTaskTab] = useState<TaskTab>("personal");

  const typeDescriptions: Record<TaskType, string> = {
    personal: "Personal: শুধু আপনি দেখতে পারবেন।",
    own_assigned: "Own Assigned: আপনি এবং অ্যাডমিন দেখতে পারবেন।",
    common: "Common: সব টিম মেম্বার দেখতে পারবেন।",
  };

  const filters: { id: TaskFilter; label: string }[] = [
    { id: "today", label: "Today" },
    { id: "weekly", label: "Weekly" },
    { id: "monthly", label: "Monthly" },
    { id: "all", label: "All" },
  ];

  const taskTabs: { id: TaskTab; label: string; icon: any }[] = [
    { id: "personal", label: "Personal", icon: User },
    { id: "by_others", label: "By Others", icon: Users },
    { id: "assigned", label: "Assigned", icon: Send },
    { id: "common", label: "Common", icon: Globe },
    { id: "deleted", label: "Deleted", icon: Trash2 },
  ];

  const handleSubmit = () => {
    if (!title.trim() || !user) return;
    createTask.mutate({
      title: title.trim(),
      description: description.trim() || undefined,
      priority,
      task_type: taskType,
      frequency,
      task_date: date || undefined,
      deadline: deadline || undefined,
      assigned_to: assignTo || undefined,
      created_by: user.id,
    }, {
      onSuccess: () => {
        setTitle(""); setDescription(""); setPriority("Medium");
        setDate(format(new Date(), "yyyy-MM-dd")); setAssignTo(""); setDeadline("");
        setTaskType("personal"); setFrequency("date_specific");
      },
    });
  };

  // Filter tasks by tab
  const getTabTasks = (): Task[] => {
    if (taskTab === "deleted") return deletedTasks;
    const uid = user?.id;
    if (!uid) return [];

    let filtered: Task[] = [];
    switch (taskTab) {
      case "personal":
        filtered = tasks.filter(t => t.created_by === uid && t.task_type === "personal" && !t.assigned_to);
        break;
      case "by_others":
        filtered = tasks.filter(t => t.assigned_to === uid && t.created_by !== uid);
        break;
      case "assigned":
        filtered = tasks.filter(t => t.created_by === uid && t.assigned_to && t.assigned_to !== uid);
        break;
      case "common":
        filtered = tasks.filter(t => t.task_type === "common");
        break;
    }
    return filtered;
  };

  // Apply date filter
  const applyDateFilter = (list: Task[]): Task[] => {
    if (filter === "all" || taskTab === "deleted") return list;
    const now = new Date();
    return list.filter(t => {
      const d = t.task_date ? parseISO(t.task_date) : parseISO(t.created_at);
      if (filter === "today") return isToday(d) || t.frequency === "daily";
      if (filter === "weekly") {
        const ws = startOfWeek(now, { weekStartsOn: 6 });
        const we = endOfWeek(now, { weekStartsOn: 6 });
        return (d >= ws && d <= we) || t.frequency === "weekly" || t.frequency === "daily";
      }
      if (filter === "monthly") {
        const ms = startOfMonth(now);
        const me = endOfMonth(now);
        return (d >= ms && d <= me) || t.frequency === "monthly" || t.frequency === "weekly" || t.frequency === "daily";
      }
      return true;
    });
  };

  const displayTasks = applyDateFilter(getTabTasks());

  // Counts per tab
  const uid = user?.id;
  const tabCounts: Record<TaskTab, number> = {
    personal: tasks.filter(t => t.created_by === uid && t.task_type === "personal" && !t.assigned_to).length,
    by_others: tasks.filter(t => t.assigned_to === uid && t.created_by !== uid).length,
    assigned: tasks.filter(t => t.created_by === uid && t.assigned_to && t.assigned_to !== uid).length,
    common: tasks.filter(t => t.task_type === "common").length,
    deleted: deletedTasks.length,
  };

  return (
    <AdminLayout>
      <div className="max-w-5xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Tasks</h1>
          <p className="text-sm text-muted-foreground">টাস্ক তৈরি করুন, অ্যাসাইন করুন এবং ট্র্যাক করুন</p>
        </div>

        {/* New Task Form */}
        <div className="bg-card rounded-2xl border border-border p-6 space-y-4">
          <h2 className="text-lg font-bold text-foreground">নতুন টাস্ক</h2>

          <div className="grid grid-cols-2 gap-4">
            <Input placeholder="টাস্কের নাম *" value={title} onChange={(e) => setTitle(e.target.value)} />
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
              <option value="Urgent">Urgent</option>
            </select>
          </div>

          <Textarea placeholder="বিবরণ (ঐচ্ছিক)" value={description} onChange={(e) => setDescription(e.target.value)} />

          <div className="grid grid-cols-3 gap-4">
            <select
              value={frequency}
              onChange={(e) => setFrequency(e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="date_specific">Date-specific (once)</option>
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
            </select>
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            <select
              value={assignTo}
              onChange={(e) => setAssignTo(e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="">নিজের জন্য রাখুন</option>
              {teamMembers.filter(m => m.user_id !== user?.id).map(m => (
                <option key={m.user_id} value={m.user_id}>{m.full_name} ({m.role})</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm text-muted-foreground">ডেডলাইন (ঐচ্ছিক)</label>
            <Input type="date" className="mt-1 max-w-sm" value={deadline} onChange={(e) => setDeadline(e.target.value)} />
          </div>

          <div>
            <p className="text-sm font-medium text-foreground mb-2">টাস্কের ধরন</p>
            <div className="flex gap-2 flex-wrap">
              {([
                { id: "personal" as TaskType, label: "Personal (Private)" },
                { id: "own_assigned" as TaskType, label: "Own Assigned (Admin দেখবে)" },
                { id: "common" as TaskType, label: "Common Task" },
              ]).map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTaskType(t.id)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium border transition-all ${
                    taskType === t.id
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-background text-foreground border-border hover:bg-secondary"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-2">{typeDescriptions[taskType]}</p>
          </div>

          <Button className="gap-2" onClick={handleSubmit} disabled={createTask.isPending || !title.trim()}>
            {createTask.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            টাস্ক যোগ করুন
          </Button>
        </div>

        {/* Tasks List */}
        <div className="bg-card rounded-2xl border border-border p-6 space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <h2 className="text-lg font-bold text-foreground">Tasks ({displayTasks.length})</h2>
            <div className="flex gap-1">
              {filters.map((f) => (
                <button
                  key={f.id}
                  onClick={() => setFilter(f.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    filter === f.id
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* Sub tabs */}
          <div className="flex justify-center gap-4 border-b border-border pb-3 flex-wrap">
            {taskTabs.map((t) => (
              <button
                key={t.id}
                onClick={() => setTaskTab(t.id)}
                className={`flex items-center gap-1.5 text-sm font-medium pb-1 transition-all ${
                  taskTab === t.id
                    ? "text-foreground border-b-2 border-primary"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <t.icon className="h-4 w-4" />
                {t.label} ({tabCounts[t.id]})
              </button>
            ))}
          </div>

          {isLoading ? (
            <div className="text-center py-8"><Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" /></div>
          ) : displayTasks.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">এই ফিল্টারে কোনো টাস্ক নেই।</p>
          ) : (
            <div className="space-y-2">
              {displayTasks.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  isDeleted={taskTab === "deleted"}
                  onComplete={() => completeTask.mutate(task.id)}
                  onDelete={() => softDeleteTask.mutate(task.id)}
                  currentUserId={user?.id}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}

function TaskCard({ task, isDeleted, onComplete, onDelete, currentUserId }: {
  task: Task;
  isDeleted: boolean;
  onComplete: () => void;
  onDelete: () => void;
  currentUserId?: string;
}) {
  const isCompleted = task.status === "completed";

  return (
    <div className={`flex items-start gap-3 p-4 rounded-xl border transition-all ${
      isCompleted ? "bg-muted/50 border-border/50 opacity-70" : "bg-background border-border hover:shadow-sm"
    }`}>
      {/* Complete button */}
      {!isDeleted && !isCompleted && (
        <button onClick={onComplete} className="mt-0.5 text-muted-foreground hover:text-emerald-500 transition-colors" title="সম্পন্ন করুন">
          <CheckCircle2 className="h-5 w-5" />
        </button>
      )}
      {isCompleted && <CheckCircle2 className="h-5 w-5 text-emerald-500 mt-0.5" />}

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`font-medium text-sm ${isCompleted ? "line-through text-muted-foreground" : "text-foreground"}`}>
            {task.title}
          </span>
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${priorityColors[task.priority] || "bg-muted"}`}>
            {task.priority}
          </span>
          {task.frequency !== "date_specific" && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-accent text-accent-foreground">
              {task.frequency}
            </span>
          )}
          {isCompleted && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
              সম্পন্ন
            </span>
          )}
        </div>

        {task.description && (
          <p className="text-xs text-muted-foreground mt-1">{task.description}</p>
        )}

        <div className="flex items-center gap-3 mt-2 text-[11px] text-muted-foreground flex-wrap">
          {task.assigned_to && task.assigned_to !== task.created_by && (
            <span className="flex items-center gap-1">
              <Send className="h-3 w-3" />
              {task.created_by === currentUserId ? `→ ${task.assignee_name}` : `← ${task.creator_name}`}
            </span>
          )}
          {task.task_date && (
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {task.task_date}
            </span>
          )}
          {task.deadline && (
            <span className="flex items-center gap-1">
              <AlertTriangle className="h-3 w-3" />
              ডেডলাইন: {task.deadline}
            </span>
          )}
          {task.completed_at && (
            <span>সম্পন্ন: {format(new Date(task.completed_at), "dd/MM/yyyy HH:mm")}</span>
          )}
        </div>
      </div>

      {/* Delete button */}
      {!isDeleted && (
        <button onClick={onDelete} className="text-muted-foreground hover:text-destructive transition-colors" title="ডিলিট করুন">
          <Trash2 className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
