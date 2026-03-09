import { useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import {
  Wallet, ArrowDownCircle, ArrowUpCircle, Landmark, PiggyBank,
  TrendingUp, Clock, ShoppingCart, Calendar, CircleDollarSign,
  Package, Trash2, Loader2, Plus, Tags, X
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useFinanceRecords, useFinanceSummary, useCreateFinanceRecord, useDeleteFinanceRecord, useFinanceSources, useCreateFinanceSource, useDeleteFinanceSource } from "@/hooks/useFinance";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";

type FinanceTab = "income" | "expense" | "banks" | "loans" | "investments" | "history";
type Period = "today" | "this_week" | "this_month" | "last_month" | "custom";

export default function AdminFinance() {
  const [tab, setTab] = useState<FinanceTab>("income");
  const [period, setPeriod] = useState<Period>("today");

  // Income form
  const [incomeSource, setIncomeSource] = useState("Sales");
  const [incomeAmount, setIncomeAmount] = useState("");
  const [incomeNote, setIncomeNote] = useState("");

  // Expense form
  const [expensePurpose, setExpensePurpose] = useState("Ads");
  const [expenseAmount, setExpenseAmount] = useState("");
  const [expenseNote, setExpenseNote] = useState("");

  // Banks form
  const [bankName, setBankName] = useState("");
  const [bankBalance, setBankBalance] = useState("");

  // Loans form
  const [loanDirection, setLoanDirection] = useState("incoming");
  const [loanAmount, setLoanAmount] = useState("");
  const [loanSource, setLoanSource] = useState("");
  const [loanNote, setLoanNote] = useState("");

  // Investments form
  const [investDirection, setInvestDirection] = useState("incoming");
  const [investAmount, setInvestAmount] = useState("");
  const [investSource, setInvestSource] = useState("");
  const [investNote, setInvestNote] = useState("");

  // History filters
  const [histType, setHistType] = useState("all");

  // Database hooks
  const { data: summary } = useFinanceSummary();
  const { data: records = [], isLoading: recordsLoading } = useFinanceRecords(histType);
  const createRecord = useCreateFinanceRecord();
  const deleteRecord = useDeleteFinanceRecord();

  // Cross-connect: Stock value from products table
  const { data: stockValue = 0 } = useQuery({
    queryKey: ["finance-stock-value"],
    queryFn: async () => {
      const { data, error } = await supabase.from("products").select("purchase_price, stock_quantity");
      if (error) throw error;
      return (data || []).reduce((s, p) => s + Number(p.purchase_price) * Number(p.stock_quantity), 0);
    },
  });

  const today = new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
  const dateRange = `${new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })} – ${new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}`;

  const fmt = (n: number) => `৳${n.toLocaleString()}`;

  const tabs: { id: FinanceTab; label: string; icon: any }[] = [
    { id: "income", label: "Income", icon: ArrowDownCircle },
    { id: "expense", label: "Expense", icon: ArrowUpCircle },
    { id: "banks", label: "Banks", icon: Landmark },
    { id: "loans", label: "Loans", icon: PiggyBank },
    { id: "investments", label: "Investments", icon: TrendingUp },
    { id: "history", label: "History", icon: Clock },
  ];

  const periods: { id: Period; label: string }[] = [
    { id: "today", label: "Today" },
    { id: "this_week", label: "This Week" },
    { id: "this_month", label: "This Month" },
    { id: "last_month", label: "Last Month" },
    { id: "custom", label: "Custom Range" },
  ];

  const topStats = [
    { icon: ArrowDownCircle, label: "MONEY IN", value: fmt(summary?.moneyIn || 0) },
    { icon: ArrowUpCircle, label: "MONEY OUT", value: fmt(summary?.moneyOut || 0), iconColor: "text-destructive" },
    { icon: ShoppingCart, label: "SALES", value: fmt(summary?.moneyIn || 0) },
    { icon: TrendingUp, label: "PROFIT", value: fmt(summary?.profit || 0) },
    { icon: PiggyBank, label: "LOANS TAKEN", value: fmt(summary?.totalLoan || 0) },
    { icon: CircleDollarSign, label: "INVESTMENTS", value: fmt(summary?.totalInvestment || 0) },
  ];

  const bottomStats = [
    { icon: Landmark, label: "BANK BALANCE", value: fmt(summary?.bankBalance || 0), iconBg: "bg-primary/10", iconColor: "text-primary" },
    { icon: PiggyBank, label: "TOTAL LOAN", value: fmt(summary?.totalLoan || 0), iconBg: "bg-destructive/10", iconColor: "text-destructive" },
    { icon: Package, label: "STOCK VALUE", value: fmt(stockValue), iconBg: "bg-secondary", iconColor: "text-foreground" },
    { icon: TrendingUp, label: "TOTAL VALUATION", value: fmt((summary?.bankBalance || 0) + (summary?.totalInvestment || 0) + stockValue), iconBg: "bg-secondary", iconColor: "text-foreground" },
  ];

  const handleSubmitIncome = () => {
    if (!incomeAmount || Number(incomeAmount) <= 0) return;
    createRecord.mutate({
      type: "income",
      label: incomeSource,
      amount: Number(incomeAmount),
      notes: incomeNote || null,
    }, { onSuccess: () => { setIncomeAmount(""); setIncomeNote(""); } });
  };

  const handleSubmitExpense = () => {
    if (!expenseAmount || Number(expenseAmount) <= 0 || !expenseNote) return;
    createRecord.mutate({
      type: "expense",
      label: expensePurpose,
      amount: Number(expenseAmount),
      notes: expenseNote,
    }, { onSuccess: () => { setExpenseAmount(""); setExpenseNote(""); } });
  };

  const handleSubmitBank = () => {
    if (!bankName || !bankBalance) return;
    createRecord.mutate({
      type: "bank",
      label: bankName,
      amount: Number(bankBalance),
      notes: null,
    }, { onSuccess: () => { setBankName(""); setBankBalance(""); } });
  };

  const handleSubmitLoan = () => {
    if (!loanAmount || Number(loanAmount) <= 0) return;
    createRecord.mutate({
      type: loanDirection === "incoming" ? "loan_in" : "loan_out",
      label: loanSource || "Loan",
      amount: Number(loanAmount),
      notes: loanNote || null,
    }, { onSuccess: () => { setLoanAmount(""); setLoanSource(""); setLoanNote(""); } });
  };

  const handleSubmitInvestment = () => {
    if (!investAmount || Number(investAmount) <= 0) return;
    createRecord.mutate({
      type: investDirection === "incoming" ? "investment_in" : "investment_out",
      label: investSource || "Investment",
      amount: Number(investAmount),
      notes: investNote || null,
    }, { onSuccess: () => { setInvestAmount(""); setInvestSource(""); setInvestNote(""); } });
  };

  const getTypeLabel = (type: string) => {
    const map: Record<string, string> = {
      income: "Income", expense: "Expense", bank: "Bank",
      loan_in: "Loan (In)", loan_out: "Loan (Out)",
      investment_in: "Investment (In)", investment_out: "Investment (Out)",
    };
    return map[type] || type;
  };

  const getTypeColor = (type: string) => {
    if (type === "income" || type === "loan_in" || type === "investment_in") return "text-emerald-600";
    if (type === "expense" || type === "loan_out" || type === "investment_out") return "text-destructive";
    return "text-primary";
  };

  const SelectField = ({ label, value, onChange, options, placeholder }: any) => (
    <div>
      <label className="text-xs font-semibold text-muted-foreground uppercase">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((o: string) => (
          <option key={o} value={o}>{o}</option>
        ))}
      </select>
    </div>
  );

  return (
    <AdminLayout>
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Wallet className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Finance</h1>
            <p className="text-sm text-muted-foreground">Track income, expenses, and finances</p>
          </div>
        </div>

        {/* Period Filter */}
        <div className="flex items-center justify-between">
          <div className="flex gap-2">
            {periods.map((p) => (
              <button
                key={p.id}
                onClick={() => setPeriod(p.id)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  period === p.id ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-secondary"
                }`}
              >
                {p.id === "custom" && <Calendar className="h-3.5 w-3.5" />}
                {p.label}
              </button>
            ))}
          </div>
          <span className="text-sm text-muted-foreground">{dateRange}</span>
        </div>

        {/* Top Stats */}
        <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
          {topStats.map((s, i) => (
            <div key={i} className="bg-card rounded-2xl border border-border p-4">
              <s.icon className={`h-5 w-5 mb-2 ${s.iconColor || "text-muted-foreground"}`} />
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">{s.label}</p>
              <p className="text-lg font-bold text-foreground mt-1">{s.value}</p>
            </div>
          ))}
        </div>

        {/* Bottom Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {bottomStats.map((s, i) => (
            <div key={i} className="bg-card rounded-2xl border border-border p-4 flex items-center gap-3">
              <div className={`h-10 w-10 rounded-xl ${s.iconBg} flex items-center justify-center`}>
                <s.icon className={`h-5 w-5 ${s.iconColor}`} />
              </div>
              <div className="flex-1 text-right">
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">{s.label}</p>
                <p className="text-lg font-bold text-foreground">{s.value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex justify-center gap-1 bg-card rounded-2xl border border-border p-2">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium transition-all ${
                tab === t.id ? "bg-primary text-primary-foreground shadow-md" : "text-muted-foreground hover:bg-secondary"
              }`}
            >
              <t.icon className="h-4 w-4" />
              {t.label}
            </button>
          ))}
        </div>

        {/* Income Tab */}
        {tab === "income" && (
          <div className="bg-card rounded-2xl border border-border p-6 space-y-5">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-lg bg-secondary flex items-center justify-center"><ArrowDownCircle className="h-4 w-4 text-foreground" /></div>
              <div><p className="font-semibold text-foreground">Amount IN (Income)</p><p className="text-xs text-muted-foreground">Record money received into your business</p></div>
            </div>
            <SelectField label="Source" value={incomeSource} onChange={setIncomeSource} options={["Sales", "Refund", "Investment", "Loan", "Other"]} />
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase">Amount (৳)</label>
              <Input className="mt-1" type="number" value={incomeAmount} onChange={(e) => setIncomeAmount(e.target.value)} placeholder="0.00" />
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase">Note (Optional)</label>
              <Textarea className="mt-1" placeholder="Add a note..." value={incomeNote} onChange={(e) => setIncomeNote(e.target.value)} />
            </div>
            <Button className="w-full h-12 rounded-2xl text-base font-semibold" onClick={handleSubmitIncome} disabled={createRecord.isPending || !incomeAmount}>
              {createRecord.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Record Income"}
            </Button>
          </div>
        )}

        {/* Expense Tab */}
        {tab === "expense" && (
          <div className="bg-card rounded-2xl border border-border p-6 space-y-5">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-lg bg-destructive/10 flex items-center justify-center"><ArrowUpCircle className="h-4 w-4 text-destructive" /></div>
              <div><p className="font-semibold text-foreground">Amount OUT (Expense)</p><p className="text-xs text-muted-foreground">Record business expenditures</p></div>
            </div>
            <SelectField label="Purpose" value={expensePurpose} onChange={setExpensePurpose} options={["Ads", "Courier", "Product Cost", "Salary", "Rent", "Other"]} />
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase">Amount (৳)</label>
              <Input className="mt-1" type="number" value={expenseAmount} onChange={(e) => setExpenseAmount(e.target.value)} placeholder="0.00" />
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase">Note (Mandatory)</label>
              <Textarea className="mt-1" placeholder="Describe this expense..." value={expenseNote} onChange={(e) => setExpenseNote(e.target.value)} />
            </div>
            <Button className="w-full h-12 rounded-2xl text-base font-semibold bg-destructive hover:bg-destructive/90 text-destructive-foreground" onClick={handleSubmitExpense} disabled={createRecord.isPending || !expenseAmount || !expenseNote}>
              {createRecord.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Record Expense"}
            </Button>
          </div>
        )}

        {/* Banks Tab */}
        {tab === "banks" && (
          <div className="bg-card rounded-2xl border border-border p-6 space-y-5">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center"><Landmark className="h-4 w-4 text-primary" /></div>
              <div><p className="font-semibold text-foreground">Add Bank Account</p><p className="text-xs text-muted-foreground">Create a new bank account to track balances</p></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase">Account Name</label>
                <Input className="mt-1" placeholder="e.g. bKash, Nagad, DBBL" value={bankName} onChange={(e) => setBankName(e.target.value)} />
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase">Opening Balance (৳)</label>
                <Input className="mt-1" type="number" value={bankBalance} onChange={(e) => setBankBalance(e.target.value)} placeholder="0.00" />
              </div>
            </div>
            <Button className="w-full h-12 rounded-2xl text-base font-semibold" onClick={handleSubmitBank} disabled={createRecord.isPending || !bankName}>
              {createRecord.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Add Bank Account"}
            </Button>

            {/* Bank list */}
            {records.filter(r => r.type === "bank").length > 0 && (
              <div className="space-y-2 pt-4 border-t border-border">
                <p className="text-xs font-semibold text-muted-foreground uppercase">Existing Accounts</p>
                {records.filter(r => r.type === "bank").map((r) => (
                  <div key={r.id} className="flex items-center justify-between p-3 rounded-xl bg-secondary/30 border border-border/40">
                    <div><p className="font-medium text-sm">{r.label}</p></div>
                    <div className="flex items-center gap-3">
                      <p className="font-bold text-primary">৳{Number(r.amount).toLocaleString()}</p>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => deleteRecord.mutate(r.id)}><Trash2 className="h-4 w-4" /></Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Loans Tab */}
        {tab === "loans" && (
          <div className="bg-card rounded-2xl border border-border p-6 space-y-5">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-lg bg-secondary flex items-center justify-center"><PiggyBank className="h-4 w-4 text-foreground" /></div>
              <div><p className="font-semibold text-foreground">Record Loan</p><p className="text-xs text-muted-foreground">Track loans received or given</p></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <SelectField label="Direction" value={loanDirection} onChange={setLoanDirection} options={["incoming", "outgoing"]} />
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase">Amount (৳)</label>
                <Input className="mt-1" type="number" value={loanAmount} onChange={(e) => setLoanAmount(e.target.value)} placeholder="0.00" />
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase">Source / Person</label>
              <Input className="mt-1" placeholder="e.g. Bank, Partner name" value={loanSource} onChange={(e) => setLoanSource(e.target.value)} />
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase">Note</label>
              <Textarea className="mt-1" placeholder="Details..." value={loanNote} onChange={(e) => setLoanNote(e.target.value)} />
            </div>
            <Button className="w-full h-12 rounded-2xl text-base font-semibold" onClick={handleSubmitLoan} disabled={createRecord.isPending || !loanAmount}>
              {createRecord.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Record Loan"}
            </Button>
          </div>
        )}

        {/* Investments Tab */}
        {tab === "investments" && (
          <div className="bg-card rounded-2xl border border-border p-6 space-y-5">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center"><TrendingUp className="h-4 w-4 text-primary" /></div>
              <div><p className="font-semibold text-foreground">Record Investment</p><p className="text-xs text-muted-foreground">Track investments received or made</p></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <SelectField label="Direction" value={investDirection} onChange={setInvestDirection} options={["incoming", "outgoing"]} />
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase">Amount (৳)</label>
                <Input className="mt-1" type="number" value={investAmount} onChange={(e) => setInvestAmount(e.target.value)} placeholder="0.00" />
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase">Source / Person</label>
              <Input className="mt-1" placeholder="e.g. Partner, Investor name" value={investSource} onChange={(e) => setInvestSource(e.target.value)} />
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase">Note</label>
              <Textarea className="mt-1" placeholder="Details..." value={investNote} onChange={(e) => setInvestNote(e.target.value)} />
            </div>
            <Button className="w-full h-12 rounded-2xl text-base font-semibold" onClick={handleSubmitInvestment} disabled={createRecord.isPending || !investAmount}>
              {createRecord.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Record Investment"}
            </Button>
          </div>
        )}

        {/* History Tab */}
        {tab === "history" && (
          <div className="bg-card rounded-2xl border border-border p-6 space-y-5">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-lg bg-secondary flex items-center justify-center"><Clock className="h-4 w-4 text-muted-foreground" /></div>
              <div><p className="font-semibold text-foreground">Recent Transactions</p><p className="text-xs text-muted-foreground">Browse and filter your transaction history</p></div>
            </div>
            <div className="flex items-center justify-between">
              <select value={histType} onChange={(e) => setHistType(e.target.value)} className="flex h-9 rounded-md border border-input bg-background px-3 py-1 text-sm">
                <option value="all">All Types</option>
                <option value="income">Income</option>
                <option value="expense">Expense</option>
                <option value="loan_in">Loan (In)</option>
                <option value="loan_out">Loan (Out)</option>
                <option value="investment_in">Investment (In)</option>
                <option value="investment_out">Investment (Out)</option>
                <option value="bank">Bank</option>
              </select>
              <span className="text-sm text-muted-foreground">Showing {records.length} records</span>
            </div>

            {recordsLoading ? (
              <div className="flex flex-col items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
            ) : records.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <Clock className="h-10 w-10 mb-3 opacity-30" />
                <p className="font-medium">No transactions found</p>
                <p className="text-sm opacity-70">Try adjusting your filters</p>
              </div>
            ) : (
              <div className="space-y-2">
                {records.map((r) => (
                  <div key={r.id} className="flex items-center justify-between p-4 rounded-xl bg-secondary/20 border border-border/40 hover:bg-secondary/40 transition-all">
                    <div className="flex items-center gap-3">
                      <div className={`h-2.5 w-2.5 rounded-full ${r.type.includes("in") || r.type === "income" || r.type === "bank" ? "bg-emerald-500" : "bg-destructive"}`} />
                      <div>
                        <p className="font-medium text-sm text-foreground">{r.label}</p>
                        <p className="text-xs text-muted-foreground">{getTypeLabel(r.type)} • {format(new Date(r.created_at), "dd MMM yyyy, hh:mm a")}</p>
                        {r.notes && <p className="text-xs text-muted-foreground/70 mt-0.5">{r.notes}</p>}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <p className={`font-bold text-sm ${getTypeColor(r.type)}`}>
                        {r.type === "expense" || r.type === "loan_out" || r.type === "investment_out" ? "-" : "+"}৳{Number(r.amount).toLocaleString()}
                      </p>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive/10" onClick={() => deleteRecord.mutate(r.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
