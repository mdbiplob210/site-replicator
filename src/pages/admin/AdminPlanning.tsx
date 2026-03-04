import { useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import {
  Lightbulb, TrendingUp, DollarSign, Send, FileText,
  User, Building2, Plus
} from "lucide-react";
import { Button } from "@/components/ui/button";

type PlanTab = "sales" | "profit" | "marketing" | "content" | "self" | "business";

const tabConfig: { id: PlanTab; label: string; icon: any; planLabel: string; emptyMsg: string }[] = [
  { id: "sales", label: "Sales Plan", icon: TrendingUp, planLabel: "Sales Plans", emptyMsg: "No sales plans yet." },
  { id: "profit", label: "Profit", icon: DollarSign, planLabel: "Profit Plans", emptyMsg: "No profit plans yet." },
  { id: "marketing", label: "Marketing", icon: Send, planLabel: "Marketing Plans", emptyMsg: "No marketing plans yet. Create one to start tracking your growth goals." },
  { id: "content", label: "Content", icon: FileText, planLabel: "Content Plans", emptyMsg: "No content plans yet." },
  { id: "self", label: "Self", icon: User, planLabel: "Self Plans", emptyMsg: "No self plans yet." },
  { id: "business", label: "Business", icon: Building2, planLabel: "Business Plans", emptyMsg: "No business plans yet." },
];

export default function AdminPlanning() {
  const [tab, setTab] = useState<PlanTab>("sales");
  const current = tabConfig.find((t) => t.id === tab)!;

  return (
    <AdminLayout>
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-foreground">Planning</h1>
          <p className="text-sm text-muted-foreground">Set goals, track progress, and plan your business growth</p>
        </div>

        {/* Tabs */}
        <div className="flex justify-center gap-1">
          {tabConfig.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium transition-all border ${
                tab === t.id
                  ? "border-primary text-primary bg-primary/5"
                  : "border-transparent text-muted-foreground hover:bg-secondary"
              }`}
            >
              <t.icon className="h-4 w-4" />
              {t.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="bg-card rounded-2xl border border-border p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <current.icon className="h-5 w-5 text-muted-foreground" />
              <h3 className="font-semibold text-foreground">{current.planLabel} (0)</h3>
              {tab === "self" && <span className="text-sm text-muted-foreground">0 completed</span>}
            </div>
            <Button className="gap-2 rounded-xl">
              <Plus className="h-4 w-4" />
              New Plan
            </Button>
          </div>
          <p className="text-center text-muted-foreground py-8">{current.emptyMsg}</p>
        </div>
      </div>
    </AdminLayout>
  );
}
