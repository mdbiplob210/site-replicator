import { useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { ListChecks, Plus, User, Users, Send, Globe, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

type TaskType = "personal" | "own_assigned" | "common";
type TaskFilter = "today" | "daily" | "weekly" | "monthly" | "date_specific" | "all";
type TaskTab = "personal" | "by_others" | "assigned" | "common" | "deleted";

export default function AdminTasks() {
  const [title, setTitle] = useState("");
  const [priority, setPriority] = useState("Medium");
  const [description, setDescription] = useState("");
  const [frequency, setFrequency] = useState("Date-specific (once)");
  const [date, setDate] = useState("");
  const [assignTo, setAssignTo] = useState("");
  const [deadline, setDeadline] = useState("");
  const [taskType, setTaskType] = useState<TaskType>("personal");
  const [filter, setFilter] = useState<TaskFilter>("today");
  const [taskTab, setTaskTab] = useState<TaskTab>("personal");

  const typeDescriptions: Record<TaskType, string> = {
    personal: "Personal: Only you can see this task. Admins see counts only.",
    own_assigned: "Own Assigned: Visible to you and admin users.",
    common: "Common: Visible to all team members.",
  };

  const filters: { id: TaskFilter; label: string }[] = [
    { id: "today", label: "Today" },
    { id: "daily", label: "Daily" },
    { id: "weekly", label: "Weekly" },
    { id: "monthly", label: "Monthly" },
    { id: "date_specific", label: "Date-Specific" },
    { id: "all", label: "All" },
  ];

  const taskTabs: { id: TaskTab; label: string; icon: any }[] = [
    { id: "personal", label: "Personal", icon: User },
    { id: "by_others", label: "By Others", icon: Users },
    { id: "assigned", label: "Assigned", icon: Send },
    { id: "common", label: "Common", icon: Globe },
    { id: "deleted", label: "Deleted", icon: Trash2 },
  ];

  return (
    <AdminLayout>
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-foreground">Tasks</h1>
          <p className="text-sm text-muted-foreground">Manage personal, assigned, and common tasks</p>
        </div>

        {/* New Task Form */}
        <div className="bg-card rounded-2xl border border-border p-6 space-y-4">
          <h2 className="text-lg font-bold text-foreground">New Task</h2>

          <div className="grid grid-cols-2 gap-4">
            <Input placeholder="Task title *" value={title} onChange={(e) => setTitle(e.target.value)} />
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option>Low</option>
              <option>Medium</option>
              <option>High</option>
              <option>Urgent</option>
            </select>
          </div>

          <Textarea placeholder="Description (optional)" value={description} onChange={(e) => setDescription(e.target.value)} />

          <div className="grid grid-cols-3 gap-4">
            <select
              value={frequency}
              onChange={(e) => setFrequency(e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option>Date-specific (once)</option>
              <option>Daily</option>
              <option>Weekly</option>
              <option>Monthly</option>
            </select>
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            <select
              value={assignTo}
              onChange={(e) => setAssignTo(e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="">Assign to user</option>
            </select>
          </div>

          <div>
            <label className="text-sm text-muted-foreground">Deadline (optional)</label>
            <Input type="date" className="mt-1 max-w-sm" value={deadline} onChange={(e) => setDeadline(e.target.value)} />
          </div>

          <div>
            <p className="text-sm font-medium text-foreground mb-2">Task Type</p>
            <div className="flex gap-2">
              {([
                { id: "personal" as TaskType, label: "Personal (Private)" },
                { id: "own_assigned" as TaskType, label: "Own Assigned (Visible to Admin)" },
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

          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Add Task
          </Button>
        </div>

        {/* Tasks List */}
        <div className="bg-card rounded-2xl border border-border p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-foreground">Tasks (0)</h2>
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
          <div className="flex justify-center gap-4 border-b border-border pb-3">
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
                {t.label} (0)
              </button>
            ))}
          </div>

          <p className="text-center text-muted-foreground py-8">No tasks for this filter.</p>
        </div>
      </div>
    </AdminLayout>
  );
}
