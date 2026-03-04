import { useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import {
  Wallet, ArrowDownCircle, ArrowUpCircle, Landmark, PiggyBank,
  TrendingUp, Clock, ShoppingCart, Calendar, CircleDollarSign,
  Package, CreditCard
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

type FinanceTab = "income" | "expense" | "banks" | "loans" | "investments" | "history";
type Period = "today" | "this_week" | "this_month" | "last_month" | "custom";

export default function AdminFinance() {
  const [tab, setTab] = useState<FinanceTab>("income");
  const [period, setPeriod] = useState<Period>("today");

  // Income form
  const [incomeAccount, setIncomeAccount] = useState("");
  const [incomeSource, setIncomeSource] = useState("Sales");
  const [incomeAmount, setIncomeAmount] = useState("0.00");
  const [incomeNote, setIncomeNote] = useState("");

  // Expense form
  const [expenseAccount, setExpenseAccount] = useState("");
  const [expensePurpose, setExpensePurpose] = useState("Ads");
  const [expenseAmount, setExpenseAmount] = useState("0.00");
  const [expenseNote, setExpenseNote] = useState("");

  // Banks form
  const [bankName, setBankName] = useState("");
  const [bankBalance, setBankBalance] = useState("0.00");

  // Loans form
  const [loanDirection, setLoanDirection] = useState("incoming");
  const [loanAmount, setLoanAmount] = useState("0.00");
  const [loanSource, setLoanSource] = useState("");
  const [loanNote, setLoanNote] = useState("");

  // Investments form
  const [investDirection, setInvestDirection] = useState("incoming");
  const [investAmount, setInvestAmount] = useState("0.00");
  const [investSource, setInvestSource] = useState("");
  const [investNote, setInvestNote] = useState("");

  // History filters
  const [histType, setHistType] = useState("all");
  const [histCategory, setHistCategory] = useState("all");

  const today = new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
  const dateRange = `${new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })} – ${new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}`;

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
    { icon: ArrowDownCircle, label: "MONEY IN", value: "৳0" },
    { icon: ArrowUpCircle, label: "MONEY OUT", value: "৳0", iconColor: "text-destructive" },
    { icon: ShoppingCart, label: "SALES", value: "৳0" },
    { icon: TrendingUp, label: "PROFIT", value: "৳0" },
    { icon: PiggyBank, label: "LOANS TAKEN", value: "৳0" },
    { icon: CircleDollarSign, label: "INVESTMENTS", value: "৳0" },
  ];

  const bottomStats = [
    { icon: Landmark, label: "BANK BALANCE", value: "৳0", iconBg: "bg-primary/10", iconColor: "text-primary" },
    { icon: PiggyBank, label: "TOTAL LOAN", value: "৳0", iconBg: "bg-destructive/10", iconColor: "text-destructive" },
    { icon: Package, label: "STOCK VALUE", value: "৳0", iconBg: "bg-secondary", iconColor: "text-foreground" },
    { icon: TrendingUp, label: "TOTAL VALUATION", value: "৳0", iconBg: "bg-secondary", iconColor: "text-foreground" },
  ];

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
                  period === p.id
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-secondary"
                }`}
              >
                {p.id === "custom" && <Calendar className="h-3.5 w-3.5" />}
                {p.label}
              </button>
            ))}
          </div>
          <span className="text-sm text-muted-foreground">{dateRange}</span>
        </div>

        {/* Top Stats - 6 cards */}
        <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
          {topStats.map((s, i) => (
            <div key={i} className="bg-card rounded-2xl border border-border p-4">
              <s.icon className={`h-5 w-5 mb-2 ${s.iconColor || "text-muted-foreground"}`} />
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">{s.label}</p>
              <p className="text-lg font-bold text-foreground mt-1">{s.value}</p>
            </div>
          ))}
        </div>

        {/* Bottom Stats - 4 cards */}
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
                tab === t.id
                  ? "bg-primary text-primary-foreground shadow-md"
                  : "text-muted-foreground hover:bg-secondary"
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
              <div className="h-9 w-9 rounded-lg bg-secondary flex items-center justify-center">
                <ArrowDownCircle className="h-4 w-4 text-foreground" />
              </div>
              <div>
                <p className="font-semibold text-foreground">Amount IN (Income)</p>
                <p className="text-xs text-muted-foreground">Record money received into your business</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <SelectField label="Bank Account" value={incomeAccount} onChange={setIncomeAccount} options={[]} placeholder="Select account" />
              <SelectField label="Source" value={incomeSource} onChange={setIncomeSource} options={["Sales", "Refund", "Investment", "Loan", "Other"]} />
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase">Amount (৳)</label>
              <Input className="mt-1" type="number" value={incomeAmount} onChange={(e) => setIncomeAmount(e.target.value)} />
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase">Note (Optional)</label>
              <Textarea className="mt-1" placeholder="Add a note..." value={incomeNote} onChange={(e) => setIncomeNote(e.target.value)} />
            </div>
            <Button className="w-full h-12 rounded-2xl text-base font-semibold">Record Income</Button>
          </div>
        )}

        {/* Expense Tab */}
        {tab === "expense" && (
          <div className="bg-card rounded-2xl border border-border p-6 space-y-5">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-lg bg-destructive/10 flex items-center justify-center">
                <ArrowUpCircle className="h-4 w-4 text-destructive" />
              </div>
              <div>
                <p className="font-semibold text-foreground">Amount OUT (Expense)</p>
                <p className="text-xs text-muted-foreground">Record business expenditures</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <SelectField label="Bank Account" value={expenseAccount} onChange={setExpenseAccount} options={[]} placeholder="Select account" />
              <SelectField label="Purpose" value={expensePurpose} onChange={setExpensePurpose} options={["Ads", "Courier", "Product Cost", "Salary", "Rent", "Other"]} />
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase">Amount (৳)</label>
              <Input className="mt-1" type="number" value={expenseAmount} onChange={(e) => setExpenseAmount(e.target.value)} />
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase">Note (Mandatory)</label>
              <Textarea className="mt-1" placeholder="Describe this expense..." value={expenseNote} onChange={(e) => setExpenseNote(e.target.value)} />
            </div>
            <Button className="w-full h-12 rounded-2xl text-base font-semibold bg-destructive hover:bg-destructive/90 text-destructive-foreground">Record Expense</Button>
          </div>
        )}

        {/* Banks Tab */}
        {tab === "banks" && (
          <div className="bg-card rounded-2xl border border-border p-6 space-y-5">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
                <Landmark className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="font-semibold text-foreground">Add Bank Account</p>
                <p className="text-xs text-muted-foreground">Create a new bank account to track balances</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase">Account Name</label>
                <Input className="mt-1" placeholder="e.g. bKash, Nagad, DBBL" value={bankName} onChange={(e) => setBankName(e.target.value)} />
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase">Opening Balance (৳)</label>
                <Input className="mt-1" type="number" value={bankBalance} onChange={(e) => setBankBalance(e.target.value)} />
              </div>
            </div>
            <Button className="w-full h-12 rounded-2xl text-base font-semibold">Add Bank Account</Button>
          </div>
        )}

        {/* Loans Tab */}
        {tab === "loans" && (
          <div className="bg-card rounded-2xl border border-border p-6 space-y-5">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-lg bg-secondary flex items-center justify-center">
                <PiggyBank className="h-4 w-4 text-foreground" />
              </div>
              <div>
                <p className="font-semibold text-foreground">Record Loan</p>
                <p className="text-xs text-muted-foreground">Track loans received or given</p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <SelectField label="Direction" value={loanDirection} onChange={setLoanDirection} options={["incoming", "outgoing"]} />
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase">Amount (৳)</label>
                <Input className="mt-1" type="number" value={loanAmount} onChange={(e) => setLoanAmount(e.target.value)} />
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase">Date</label>
                <div className="relative mt-1">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input className="pl-10" readOnly value={today} />
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase">Source / Person</label>
                <Input className="mt-1" placeholder="e.g. Bank, Partner name" value={loanSource} onChange={(e) => setLoanSource(e.target.value)} />
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase">Note</label>
                <Textarea className="mt-1" placeholder="Details..." value={loanNote} onChange={(e) => setLoanNote(e.target.value)} />
              </div>
            </div>
            <Button className="w-full h-12 rounded-2xl text-base font-semibold">Record Loan</Button>
          </div>
        )}

        {/* Investments Tab */}
        {tab === "investments" && (
          <div className="bg-card rounded-2xl border border-border p-6 space-y-5">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
                <TrendingUp className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="font-semibold text-foreground">Record Investment</p>
                <p className="text-xs text-muted-foreground">Track investments received or made</p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <SelectField label="Direction" value={investDirection} onChange={setInvestDirection} options={["incoming", "outgoing"]} />
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase">Amount (৳)</label>
                <Input className="mt-1" type="number" value={investAmount} onChange={(e) => setInvestAmount(e.target.value)} />
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase">Date</label>
                <div className="relative mt-1">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input className="pl-10" readOnly value={today} />
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase">Source / Person</label>
                <Input className="mt-1" placeholder="e.g. Partner, Investor name" value={investSource} onChange={(e) => setInvestSource(e.target.value)} />
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase">Note</label>
                <Textarea className="mt-1" placeholder="Details..." value={investNote} onChange={(e) => setInvestNote(e.target.value)} />
              </div>
            </div>
            <Button className="w-full h-12 rounded-2xl text-base font-semibold">Record Investment</Button>
          </div>
        )}

        {/* History Tab */}
        {tab === "history" && (
          <div className="bg-card rounded-2xl border border-border p-6 space-y-5">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-lg bg-secondary flex items-center justify-center">
                <Clock className="h-4 w-4 text-muted-foreground" />
              </div>
              <div>
                <p className="font-semibold text-foreground">Recent Transactions</p>
                <p className="text-xs text-muted-foreground">Browse and filter your transaction history</p>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex gap-2">
                <select
                  value={histType}
                  onChange={(e) => setHistType(e.target.value)}
                  className="flex h-9 rounded-md border border-input bg-background px-3 py-1 text-sm"
                >
                  <option value="all">All Types</option>
                  <option value="income">Income</option>
                  <option value="expense">Expense</option>
                  <option value="loan">Loan</option>
                  <option value="investment">Investment</option>
                </select>
                <select
                  value={histCategory}
                  onChange={(e) => setHistCategory(e.target.value)}
                  className="flex h-9 rounded-md border border-input bg-background px-3 py-1 text-sm"
                >
                  <option value="all">All Categories</option>
                  <option value="sales">Sales</option>
                  <option value="ads">Ads</option>
                  <option value="courier">Courier</option>
                </select>
                <button className="flex items-center gap-1.5 h-9 px-3 rounded-md border border-input bg-background text-sm">
                  <Calendar className="h-3.5 w-3.5" /> From
                </button>
                <button className="flex items-center gap-1.5 h-9 px-3 rounded-md border border-input bg-background text-sm">
                  <Calendar className="h-3.5 w-3.5" /> To
                </button>
              </div>
              <span className="text-sm text-muted-foreground">Showing 0 of 0</span>
            </div>
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <Clock className="h-10 w-10 mb-3 opacity-30" />
              <p className="font-medium">No transactions found</p>
              <p className="text-sm opacity-70">Try adjusting your filters</p>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
