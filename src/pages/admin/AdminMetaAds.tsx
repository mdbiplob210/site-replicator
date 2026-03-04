import { useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import {
  DollarSign, TrendingUp, BarChart3,
  Upload, Save, Calendar, Plus, ArrowLeft, X, Facebook, Trash2, Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import { useAdSpends } from "@/hooks/useAdSpends";
import { format } from "date-fns";

type View = "main" | "manual-import";

export default function AdminMetaAds() {
  const [view, setView] = useState<View>("main");
  const [dollarRate, setDollarRate] = useState("121");
  const [dateRange, setDateRange] = useState("today");

  // Manual import state
  const [spendDate, setSpendDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [totalAdSpend, setTotalAdSpend] = useState("");

  const rate = parseFloat(dollarRate) || 121;
  const { entries, allEntries, isLoading, totalUsd, totalBdt, avgDaily, addEntry, deleteEntry } = useAdSpends(dateRange, rate);

  const handleSaveEntry = () => {
    const usd = parseFloat(totalAdSpend);
    if (!usd || usd <= 0) return;
    addEntry.mutate({
      spend_date: spendDate,
      amount_usd: usd,
      amount_bdt: usd * rate,
    }, {
      onSuccess: () => {
        setTotalAdSpend("");
      }
    });
  };

  if (view === "manual-import") {
    return (
      <AdminLayout>
        <div className="max-w-5xl mx-auto space-y-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setView("main")}
              className="h-9 w-9 rounded-lg border border-border flex items-center justify-center hover:bg-secondary transition-colors"
            >
              <ArrowLeft className="h-4 w-4 text-muted-foreground" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Manual Ad Spend Import</h1>
              <p className="text-sm text-muted-foreground">Add daily ad spend data manually.</p>
            </div>
          </div>

          {/* Add New Entry */}
          <div className="bg-card rounded-2xl border border-border p-6 space-y-5">
            <div>
              <h2 className="text-lg font-bold text-foreground">Add New Entry</h2>
              <p className="text-sm text-muted-foreground">Enter the total ad spend for a specific date.</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-foreground">Date *</label>
                <Input
                  type="date"
                  value={spendDate}
                  onChange={(e) => setSpendDate(e.target.value)}
                  className="mt-1.5"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">Total Ad Spend (USD) *</label>
                <Input
                  className="mt-1.5"
                  type="number"
                  step="0.01"
                  placeholder="e.g. 50.00"
                  value={totalAdSpend}
                  onChange={(e) => setTotalAdSpend(e.target.value)}
                />
              </div>
            </div>

            {totalAdSpend && parseFloat(totalAdSpend) > 0 && (
              <p className="text-sm text-muted-foreground">
                ≈ ৳{(parseFloat(totalAdSpend) * rate).toFixed(0)} BDT (@ {rate} rate)
              </p>
            )}

            <Button className="gap-2" onClick={handleSaveEntry} disabled={addEntry.isPending}>
              {addEntry.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              Save Entry
            </Button>
          </div>

          {/* Previous Entries */}
          <div className="bg-card rounded-2xl border border-border p-6">
            <h3 className="font-bold text-foreground mb-3">Previous Entries</h3>
            {allEntries.length === 0 ? (
              <p className="text-sm text-muted-foreground">No manual entries yet.</p>
            ) : (
              <div className="space-y-2">
                {allEntries.map((e) => (
                  <div key={e.id} className="flex items-center justify-between p-3 rounded-xl bg-secondary/30 border border-border">
                    <div className="flex items-center gap-4">
                      <span className="text-sm font-medium text-foreground">{e.spend_date}</span>
                      <span className="text-sm text-muted-foreground">${Number(e.amount_usd).toFixed(2)}</span>
                      <span className="text-sm text-muted-foreground">৳{Number(e.amount_bdt).toFixed(0)}</span>
                      <span className="text-xs text-muted-foreground bg-secondary px-2 py-0.5 rounded">{e.platform}</span>
                    </div>
                    <button
                      onClick={() => deleteEntry.mutate(e.id)}
                      className="h-8 w-8 rounded-lg flex items-center justify-center hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Meta Ads Analytics</h1>
            <p className="text-sm text-muted-foreground">Campaign → Ad Set → Ad breakdown</p>
          </div>
          <Button variant="outline" className="gap-2" onClick={() => setView("manual-import")}>
            <Upload className="h-4 w-4" /> Manual Import
          </Button>
        </div>

        {/* Dollar Rate & Date Range */}
        <div className="bg-card rounded-2xl border border-border p-5">
          <div className="flex items-end gap-4">
            <div>
              <label className="text-sm font-medium text-foreground">1 USD = ? BDT</label>
              <div className="flex items-center gap-2 mt-1.5">
                <Input value={dollarRate} onChange={(e) => setDollarRate(e.target.value)} className="w-28" />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">Date Range</label>
              <Select value={dateRange} onValueChange={setDateRange}>
                <SelectTrigger className="w-36 mt-1.5">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="yesterday">Yesterday</SelectItem>
                  <SelectItem value="7days">Last 7 Days</SelectItem>
                  <SelectItem value="30days">Last 30 Days</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4">
          {[
            { icon: DollarSign, label: "Spend (USD)", value: `$${totalUsd.toFixed(2)}` },
            { icon: TrendingUp, label: "Spend (BDT)", value: `৳${totalBdt.toFixed(0)}` },
            { icon: Calendar, label: "Entries", value: String(entries.length) },
            { icon: BarChart3, label: "Avg Daily", value: `$${avgDaily.toFixed(2)}` },
          ].map((s, i) => (
            <div key={i} className="bg-card rounded-2xl border border-border p-5">
              <div className="flex items-center gap-2 mb-2">
                <s.icon className="h-4 w-4 text-muted-foreground" />
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </div>
              <p className="text-2xl font-bold text-foreground">{isLoading ? "..." : s.value}</p>
            </div>
          ))}
        </div>

        {/* Entries Table */}
        {entries.length > 0 ? (
          <div className="bg-card rounded-2xl border border-border p-6">
            <h3 className="font-bold text-foreground mb-3">Ad Spend Entries</h3>
            <div className="space-y-2">
              {entries.map((e) => (
                <div key={e.id} className="flex items-center justify-between p-3 rounded-xl bg-secondary/30 border border-border">
                  <div className="flex items-center gap-4">
                    <span className="text-sm font-medium text-foreground">{e.spend_date}</span>
                    <span className="text-sm font-bold text-foreground">${Number(e.amount_usd).toFixed(2)}</span>
                    <span className="text-sm text-muted-foreground">৳{Number(e.amount_bdt).toFixed(0)}</span>
                  </div>
                  <button
                    onClick={() => deleteEntry.mutate(e.id)}
                    className="h-8 w-8 rounded-lg flex items-center justify-center hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="bg-card rounded-2xl border border-border p-6 text-center">
            <p className="text-muted-foreground">No ad spend entries found for this period. Use "Manual Import" to add data.</p>
          </div>
        )}

        {/* Connect Facebook */}
        <div className="bg-card rounded-2xl border border-border p-10 flex flex-col items-center text-center max-w-lg mx-auto">
          <div className="h-16 w-16 rounded-full bg-blue-100 dark:bg-blue-950/30 flex items-center justify-center mb-4">
            <Facebook className="h-8 w-8 text-blue-600" />
          </div>
          <h3 className="text-xl font-bold text-foreground mb-2">Connect Facebook Ads</h3>
          <p className="text-sm text-muted-foreground mb-6">Login with your Facebook account to view and monitor your ad campaigns.</p>
          <Button className="gap-2 bg-blue-600 hover:bg-blue-700 text-white">
            <Facebook className="h-4 w-4" /> Login with Facebook
          </Button>
        </div>
      </div>
    </AdminLayout>
  );
}
