import { useState, useRef, useEffect, useMemo } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import {
  DollarSign, TrendingUp, BarChart3, ShoppingCart,
  Upload, Save, Calendar, Plus, ArrowLeft, Facebook, Trash2, Loader2, FileSpreadsheet, CheckCircle2, RefreshCw, KeyRound
} from "lucide-react";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import { useAdSpends } from "@/hooks/useAdSpends";
import { useSiteSettings, useUpdateSiteSetting } from "@/hooks/useSiteSettings";
import { format } from "date-fns";
import { toast } from "sonner";
import * as XLSX from "@datalens-tech/xlsx";
import { ProductAdSpendTable } from "@/components/admin/meta-ads/ProductAdSpendTable";
import { CampaignBreakdown } from "@/components/admin/meta-ads/CampaignBreakdown";
import { ManualCampaignEntry } from "@/components/admin/meta-ads/ManualCampaignEntry";
import { useExchangeToken, useAdAccounts, useSyncMetaAds } from "@/hooks/useMetaAds";

type View = "main" | "import" | "manual-campaign";

type ParsedRow = {
  spend_date: string;
  amount_usd: number;
};

export default function AdminMetaAds() {
  const [view, setView] = useState<View>("main");
  const [dateRange, setDateRange] = useState("today");
  const [trendMode, setTrendMode] = useState<"weekly" | "monthly">("weekly");
  const [fbConnected, setFbConnected] = useState(true);
  const [selectedAccountId, setSelectedAccountId] = useState<string>("");
  const exchangeToken = useExchangeToken();
  const { data: adAccounts = [], isLoading: accountsLoading } = useAdAccounts();
  const syncMutation = useSyncMetaAds();

  // Site settings for dollar rate
  const { data: settings, isLoading: settingsLoading } = useSiteSettings();
  const updateSetting = useUpdateSiteSetting();
  const [dollarRate, setDollarRate] = useState("121");
  const [rateSaved, setRateSaved] = useState(false);

  useEffect(() => {
    if (settings?.dollar_rate) {
      setDollarRate(settings.dollar_rate);
    }
  }, [settings]);

  const rate = parseFloat(dollarRate) || 121;
  const { entries, allEntries, isLoading, totalUsd, totalBdt, avgDaily, addEntry, deleteEntry } = useAdSpends(dateRange, rate);

  // Manual entry state
  const [spendDate, setSpendDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [totalAdSpend, setTotalAdSpend] = useState("");

  // Excel import state
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [parsedRows, setParsedRows] = useState<ParsedRow[]>([]);
  const [importing, setImporting] = useState(false);

  const handleSaveDollarRate = () => {
    updateSetting.mutate({ key: "dollar_rate", value: dollarRate }, {
      onSuccess: () => {
        setRateSaved(true);
        setTimeout(() => setRateSaved(false), 2000);
      }
    });
  };

  const handleSaveEntry = () => {
    const usd = parseFloat(totalAdSpend);
    if (!usd || usd <= 0) return;
    addEntry.mutate({
      spend_date: spendDate,
      amount_usd: usd,
      amount_bdt: usd * rate,
    }, {
      onSuccess: () => setTotalAdSpend("")
    });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = evt.target?.result;
        const workbook = XLSX.read(data, { type: "binary" });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const json = XLSX.utils.sheet_to_json<any>(sheet);

        const rows: ParsedRow[] = [];
        for (const row of json) {
          // Try to find date and amount columns flexibly
          const dateVal = row["Date"] || row["date"] || row["Reporting starts"] || row["Day"] || row["spend_date"];
          const amountVal = row["Amount spent (USD)"] || row["Amount Spent"] || row["amount_usd"] || row["Spend"] || row["Cost"] || row["Amount"] || row["amount"];

          if (dateVal && amountVal) {
            let parsedDate: string;
            if (typeof dateVal === "number") {
              // Excel serial date
              const d = XLSX.SSF.parse_date_code(dateVal);
              parsedDate = `${d.y}-${String(d.m).padStart(2, "0")}-${String(d.d).padStart(2, "0")}`;
            } else {
              const d = new Date(dateVal);
              parsedDate = isNaN(d.getTime()) ? String(dateVal) : format(d, "yyyy-MM-dd");
            }

            const amount = parseFloat(String(amountVal).replace(/[^0-9.]/g, ""));
            if (!isNaN(amount) && amount > 0) {
              rows.push({ spend_date: parsedDate, amount_usd: amount });
            }
          }
        }

        if (rows.length === 0) {
          toast.error("কোনো ভ্যালিড ডাটা পাওয়া যায়নি। Date ও Amount কলাম আছে কিনা দেখুন।");
        } else {
          setParsedRows(rows);
          toast.success(`${rows.length}টি এন্ট্রি পাওয়া গেছে!`);
        }
      } catch (err) {
        toast.error("ফাইল পড়তে সমস্যা হয়েছে।");
      }
    };
    reader.readAsBinaryString(file);
    // Reset input
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleImportAll = async () => {
    if (parsedRows.length === 0) return;
    setImporting(true);
    let success = 0;
    for (const row of parsedRows) {
      try {
        await new Promise<void>((resolve, reject) => {
          addEntry.mutate({
            spend_date: row.spend_date,
            amount_usd: row.amount_usd,
            amount_bdt: row.amount_usd * rate,
          }, { onSuccess: () => resolve(), onError: () => reject() });
        });
        success++;
      } catch {}
    }
    setImporting(false);
    setParsedRows([]);
    toast.success(`${success}টি এন্ট্রি সফলভাবে ইমপোর্ট হয়েছে!`);
  };

  if (view === "manual-campaign") {
    return (
      <AdminLayout>
        <ManualCampaignEntry onBack={() => setView("main")} />
      </AdminLayout>
    );
  }

  if (view === "import") {
    return (
      <AdminLayout>
        <div className="max-w-5xl mx-auto space-y-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => { setView("main"); setParsedRows([]); }}
              className="h-9 w-9 rounded-lg border border-border flex items-center justify-center hover:bg-secondary transition-colors"
            >
              <ArrowLeft className="h-4 w-4 text-muted-foreground" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Ad Spend Import</h1>
              <p className="text-sm text-muted-foreground">Excel/CSV ফাইল থেকে বা ম্যানুয়ালি ডাটা যোগ করুন।</p>
            </div>
          </div>

          {/* Excel Import */}
          <div className="bg-card rounded-2xl border border-border p-6 space-y-5">
            <div>
              <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                <FileSpreadsheet className="h-5 w-5 text-green-600" /> Excel/CSV ফাইল ইমপোর্ট
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                Meta Ads Manager থেকে এক্সপোর্ট করা Excel বা CSV ফাইল আপলোড করুন। 
                ফাইলে <strong>Date</strong> ও <strong>Amount spent (USD)</strong> কলাম থাকতে হবে।
              </p>
            </div>

            <div className="flex items-center gap-3">
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={handleFileUpload}
                className="hidden"
              />
              <Button variant="outline" className="gap-2" onClick={() => fileInputRef.current?.click()}>
                <Upload className="h-4 w-4" /> ফাইল সিলেক্ট করুন
              </Button>
              {parsedRows.length > 0 && (
                <span className="text-sm text-green-600 font-medium">{parsedRows.length}টি এন্ট্রি পাওয়া গেছে</span>
              )}
            </div>

            {/* Preview parsed rows */}
            {parsedRows.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-sm font-bold text-foreground">প্রিভিউ:</h3>
                <div className="max-h-60 overflow-y-auto space-y-1.5">
                  {parsedRows.map((r, i) => (
                    <div key={i} className="flex items-center justify-between p-2.5 rounded-lg bg-secondary/30 border border-border text-sm">
                      <span className="text-foreground font-medium">{r.spend_date}</span>
                      <span className="text-foreground">${r.amount_usd.toFixed(2)}</span>
                      <span className="text-muted-foreground">≈ ৳{(r.amount_usd * rate).toFixed(0)}</span>
                    </div>
                  ))}
                </div>
                <div className="flex gap-3">
                  <Button className="gap-2" onClick={handleImportAll} disabled={importing}>
                    {importing ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                    সব ইমপোর্ট করুন ({parsedRows.length}টি)
                  </Button>
                  <Button variant="outline" onClick={() => setParsedRows([])}>বাতিল</Button>
                </div>
              </div>
            )}
          </div>

          {/* Manual Entry */}
          <div className="bg-card rounded-2xl border border-border p-6 space-y-5">
            <div>
              <h2 className="text-lg font-bold text-foreground">ম্যানুয়াল এন্ট্রি</h2>
              <p className="text-sm text-muted-foreground">একটি নির্দিষ্ট তারিখের জন্য অ্যাড খরচ যোগ করুন।</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-foreground">Date *</label>
                <Input type="date" value={spendDate} onChange={(e) => setSpendDate(e.target.value)} className="mt-1.5" />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">Total Ad Spend (USD) *</label>
                <Input className="mt-1.5" type="number" step="0.01" placeholder="e.g. 50.00" value={totalAdSpend} onChange={(e) => setTotalAdSpend(e.target.value)} />
              </div>
            </div>
            {totalAdSpend && parseFloat(totalAdSpend) > 0 && (
              <p className="text-sm text-muted-foreground">≈ ৳{(parseFloat(totalAdSpend) * rate).toFixed(0)} BDT (@ {rate} rate)</p>
            )}
            <Button className="gap-2" onClick={handleSaveEntry} disabled={addEntry.isPending}>
              {addEntry.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              Save Entry
            </Button>
          </div>

          {/* Previous Entries */}
          <div className="bg-card rounded-2xl border border-border p-6">
            <h3 className="font-bold text-foreground mb-3">আগের এন্ট্রিসমূহ</h3>
            {allEntries.length === 0 ? (
              <p className="text-sm text-muted-foreground">কোনো এন্ট্রি নেই।</p>
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
          <div className="flex gap-2">
            <Button variant="outline" className="gap-2" onClick={() => setView("manual-campaign")}>
              <Plus className="h-4 w-4" /> Manual Campaign
            </Button>
            <Button variant="outline" className="gap-2" onClick={() => setView("import")}>
              <Upload className="h-4 w-4" /> Ad Spend Import
            </Button>
            <Button variant="outline" className="gap-2" onClick={() => window.location.reload()}>
              <RefreshCw className="h-4 w-4" /> Refresh
            </Button>
            <Button
              variant="outline"
              className="gap-2"
              onClick={() => exchangeToken.mutate()}
              disabled={exchangeToken.isPending}
            >
              {exchangeToken.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <KeyRound className="h-4 w-4" />}
              Long-Lived Token
            </Button>
          </div>
        </div>

        {/* Dollar Rate & Date Range */}
        <div className="bg-card rounded-2xl border border-border p-5">
          <div className="flex items-end gap-4">
            <div>
              <label className="text-sm font-medium text-foreground">1 USD = ? BDT</label>
              <div className="flex items-center gap-2 mt-1.5">
                <Input value={dollarRate} onChange={(e) => { setDollarRate(e.target.value); setRateSaved(false); }} className="w-28" />
                <Button size="sm" variant="outline" className="gap-1.5" onClick={handleSaveDollarRate} disabled={updateSetting.isPending}>
                  {rateSaved ? <CheckCircle2 className="h-3.5 w-3.5 text-green-600" /> : <Save className="h-3.5 w-3.5" />}
                  {rateSaved ? "Saved" : "Save"}
                </Button>
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
            <div>
              <label className="text-sm font-medium text-foreground">Ad Account</label>
              <Select value={selectedAccountId} onValueChange={setSelectedAccountId}>
                <SelectTrigger className="w-56 mt-1.5">
                  <SelectValue placeholder={accountsLoading ? "Loading..." : "সব অ্যাকাউন্ট"} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">সব অ্যাকাউন্ট</SelectItem>
                  {adAccounts.map((ac) => (
                    <SelectItem key={ac.id} value={ac.id}>
                      {ac.name} ({ac.currency})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button
                size="sm"
                variant="default"
                className="gap-1.5"
                onClick={() => {
                  const ids = selectedAccountId && selectedAccountId !== "all"
                    ? [selectedAccountId]
                    : adAccounts.map(a => a.id);
                  syncMutation.mutate({ dateRange, adAccountIds: ids.length > 0 ? ids : undefined });
                }}
                disabled={syncMutation.isPending}
              >
                {syncMutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
                {syncMutation.isPending ? "Syncing..." : "Sync All"}
              </Button>
            </div>
          </div>
        </div>

        {/* Connected Ad Accounts */}
        {adAccounts.length > 0 && (
          <div className="bg-card rounded-2xl border border-border p-4">
            <h3 className="text-sm font-bold text-foreground mb-2 flex items-center gap-2">
              <Facebook className="h-4 w-4 text-blue-600" /> {adAccounts.length}টি Ad Account পাওয়া গেছে
            </h3>
            <div className="flex flex-wrap gap-2">
              {adAccounts.map(ac => (
                <button
                  key={ac.id}
                  onClick={() => setSelectedAccountId(ac.id === selectedAccountId ? "all" : ac.id)}
                  className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                    ac.id === selectedAccountId
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-secondary text-muted-foreground border-border hover:bg-secondary/80"
                  }`}
                >
                  {ac.name} · {ac.business_name} ({ac.currency})
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { icon: DollarSign, label: "Spend (USD)", value: `$${totalUsd.toFixed(2)}` },
            { icon: TrendingUp, label: "Spend (BDT)", value: `৳${totalBdt.toFixed(0)}` },
            { icon: ShoppingCart, label: "Total Orders", value: "25" },
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

        {/* Product-wise Ad Spend */}
        <ProductAdSpendTable dateRange={dateRange} totalSpendUsd={totalUsd} rate={rate} />

        {/* Campaign Breakdown */}
        <CampaignBreakdown dateRange={dateRange} adAccountId={selectedAccountId && selectedAccountId !== "all" ? selectedAccountId : undefined} />

        {/* Daily Spend Chart */}
        {entries.length > 0 && (
          <div className="bg-card rounded-2xl border border-border p-6">
            <h3 className="font-bold text-foreground mb-4">দিনভিত্তিক অ্যাড খরচ</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={[...entries].sort((a, b) => a.spend_date.localeCompare(b.spend_date)).map(e => ({
                  date: e.spend_date.slice(5),
                  USD: Number(e.amount_usd),
                  BDT: Number(e.amount_usd) * rate,
                }))}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} className="text-muted-foreground" />
                  <YAxis tick={{ fontSize: 12 }} className="text-muted-foreground" />
                  <Tooltip
                    contentStyle={{ borderRadius: 12, border: '1px solid hsl(var(--border))', background: 'hsl(var(--card))' }}
                    formatter={(value: number, name: string) => [
                      name === 'USD' ? `$${value.toFixed(2)}` : `৳${value.toFixed(0)}`,
                      name === 'USD' ? 'USD' : 'BDT'
                    ]}
                  />
                  <Bar dataKey="USD" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="BDT" fill="hsl(var(--accent))" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Weekly/Monthly Trend Line Chart */}
        {allEntries.length > 1 && (() => {
          const sorted = [...allEntries].sort((a, b) => a.spend_date.localeCompare(b.spend_date));
          const groupMap = new Map<string, number>();

          for (const e of sorted) {
            let key: string;
            if (trendMode === "weekly") {
              const d = new Date(e.spend_date);
              const day = d.getDay();
              const diff = d.getDate() - day + (day === 0 ? -6 : 1);
              const weekStart = new Date(d.setDate(diff));
              key = weekStart.toISOString().slice(0, 10);
            } else {
              key = e.spend_date.slice(0, 7); // YYYY-MM
            }
            groupMap.set(key, (groupMap.get(key) || 0) + Number(e.amount_usd));
          }

          const trendData = Array.from(groupMap.entries()).map(([label, usd]) => ({
            label: trendMode === "weekly" ? label.slice(5) : label,
            USD: parseFloat(usd.toFixed(2)),
            BDT: parseFloat((usd * rate).toFixed(0)),
          }));

          if (trendData.length < 2) return null;
          return (
            <div className="bg-card rounded-2xl border border-border p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-foreground">
                  {trendMode === "weekly" ? "সাপ্তাহিক" : "মাসিক"} খরচের ট্রেন্ড
                </h3>
                <div className="flex gap-1 bg-secondary rounded-lg p-1">
                  <button
                    onClick={() => setTrendMode("weekly")}
                    className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${trendMode === "weekly" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
                  >
                    সাপ্তাহিক
                  </button>
                  <button
                    onClick={() => setTrendMode("monthly")}
                    className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${trendMode === "monthly" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
                  >
                    মাসিক
                  </button>
                </div>
              </div>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={trendData}>
                    <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                    <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip
                      contentStyle={{ borderRadius: 12, border: '1px solid hsl(var(--border))', background: 'hsl(var(--card))' }}
                      formatter={(value: number, name: string) => [
                        name === 'USD' ? `$${value.toFixed(2)}` : `৳${value}`,
                        name
                      ]}
                    />
                    <Legend />
                    <Line type="monotone" dataKey="USD" stroke="hsl(var(--primary))" strokeWidth={2.5} dot={{ r: 4 }} />
                    <Line type="monotone" dataKey="BDT" stroke="hsl(var(--accent))" strokeWidth={2} dot={{ r: 3 }} strokeDasharray="5 5" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          );
        })()}

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
            <p className="text-muted-foreground">এই সময়ের জন্য কোনো এন্ট্রি নেই। "Import Data" থেকে ডাটা যোগ করুন।</p>
          </div>
        )}

        {/* Facebook Connection Status */}
        <div className="bg-card rounded-2xl border border-border p-6 flex items-center justify-between max-w-2xl mx-auto">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-blue-100 dark:bg-blue-950/30 flex items-center justify-center">
              <Facebook className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h3 className="font-bold text-foreground">Facebook Ads</h3>
              <p className="text-xs text-muted-foreground">
                {fbConnected ? "Connected via Marketing API" : "কানেক্ট করা হয়নি"}
              </p>
            </div>
          </div>
          <Button
            variant={fbConnected ? "outline" : "default"}
            className={fbConnected ? "gap-2" : "gap-2 bg-blue-600 hover:bg-blue-700 text-white"}
            onClick={() => setFbConnected(!fbConnected)}
          >
            <Facebook className="h-4 w-4" />
            {fbConnected ? "Disconnect" : "Connect"}
          </Button>
        </div>
      </div>
    </AdminLayout>
  );
}
