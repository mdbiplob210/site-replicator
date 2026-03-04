import { useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import {
  DollarSign, TrendingUp, ShoppingCart, BarChart3,
  Upload, Save, Calendar, Plus, ArrowLeft, X, Facebook
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";

type View = "main" | "manual-import";

export default function AdminMetaAds() {
  const [view, setView] = useState<View>("main");
  const [dollarRate, setDollarRate] = useState("121");
  const [dateRange, setDateRange] = useState("today");

  // Manual import state
  const [campaignName, setCampaignName] = useState("");
  const [totalAdSpend, setTotalAdSpend] = useState("");
  const [productRows, setProductRows] = useState([{ product: "", usd: "0.00" }]);

  const addProductRow = () => {
    setProductRows([...productRows, { product: "", usd: "0.00" }]);
  };

  const removeProductRow = (index: number) => {
    if (productRows.length > 1) {
      setProductRows(productRows.filter((_, i) => i !== index));
    }
  };

  if (view === "manual-import") {
    return (
      <AdminLayout>
        <div className="max-w-5xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setView("main")}
              className="h-9 w-9 rounded-lg border border-border flex items-center justify-center hover:bg-secondary transition-colors"
            >
              <ArrowLeft className="h-4 w-4 text-muted-foreground" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Manual Ad Spend Import</h1>
              <p className="text-sm text-muted-foreground">Add daily ad spend data manually. This feeds into all analytics and profit calculations.</p>
            </div>
          </div>

          {/* Add New Entry */}
          <div className="bg-card rounded-2xl border border-border p-6 space-y-5">
            <div>
              <h2 className="text-lg font-bold text-foreground">Add New Entry</h2>
              <p className="text-sm text-muted-foreground">Enter the total ad spend and product-wise breakdown for the day.</p>
            </div>

            {/* Date & Campaign */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-foreground">Date *</label>
                <div className="relative mt-1.5">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="text"
                    value="March 4th, 2026"
                    readOnly
                    className="pl-10 bg-secondary/30"
                  />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">Campaign Name (optional)</label>
                <Input
                  className="mt-1.5"
                  placeholder="e.g. Summer Sale"
                  value={campaignName}
                  onChange={(e) => setCampaignName(e.target.value)}
                />
              </div>
            </div>

            {/* Total Ad Spend */}
            <div>
              <label className="text-sm font-medium text-foreground">Total Ad Spend (USD) *</label>
              <Input
                className="mt-1.5 max-w-xs"
                placeholder="e.g. 50.00"
                value={totalAdSpend}
                onChange={(e) => setTotalAdSpend(e.target.value)}
              />
            </div>

            {/* Product-wise Spend */}
            <div>
              <label className="text-sm font-medium text-foreground">Product-wise Spend (USD) *</label>
              <p className="text-sm text-muted-foreground mt-0.5">Break down the ad spend per product. Product codes are shown for easy mapping with Ad Manager campaigns.</p>

              <div className="space-y-3 mt-3">
                {productRows.map((row, index) => (
                  <div key={index} className="flex items-end gap-3">
                    <div className="flex-1">
                      {index === 0 && <p className="text-xs text-muted-foreground mb-1">Product</p>}
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Select product" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">No products available</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="w-28">
                      {index === 0 && <p className="text-xs text-muted-foreground mb-1">USD</p>}
                      <Input
                        value={row.usd}
                        onChange={(e) => {
                          const updated = [...productRows];
                          updated[index].usd = e.target.value;
                          setProductRows(updated);
                        }}
                      />
                    </div>
                    {productRows.length > 1 && (
                      <button
                        onClick={() => removeProductRow(index)}
                        className="h-10 w-10 rounded-lg border border-border flex items-center justify-center hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              <button
                onClick={addProductRow}
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mt-3 transition-colors"
              >
                <Plus className="h-4 w-4" /> Add Product
              </button>
            </div>

            <Button className="gap-2">
              <Plus className="h-4 w-4" /> Save All Entries
            </Button>
          </div>

          {/* Previous Entries */}
          <div className="bg-card rounded-2xl border border-border p-6">
            <h3 className="font-bold text-foreground mb-3">Previous Manual Entries</h3>
            <p className="text-sm text-muted-foreground">No manual entries yet.</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
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
                <Input
                  value={dollarRate}
                  onChange={(e) => setDollarRate(e.target.value)}
                  className="w-28"
                />
                <Button variant="outline" className="gap-2">
                  <Save className="h-4 w-4" /> Save
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
                  <SelectItem value="custom">Custom</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4">
          {[
            { icon: DollarSign, label: "Spend (USD)", value: "$0.00" },
            { icon: TrendingUp, label: "Spend (BDT)", value: "৳0" },
            { icon: ShoppingCart, label: "Total Orders", value: "0" },
            { icon: BarChart3, label: "Avg Daily", value: "$0.00" },
          ].map((s, i) => (
            <div key={i} className="bg-card rounded-2xl border border-border p-5">
              <div className="flex items-center gap-2 mb-2">
                <s.icon className="h-4 w-4 text-muted-foreground" />
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </div>
              <p className="text-2xl font-bold text-foreground">{s.value}</p>
            </div>
          ))}
        </div>

        {/* No Data Message */}
        <div className="bg-card rounded-2xl border border-border p-6 text-center">
          <p className="text-muted-foreground">No ad spend entries found for this period. Use "Manual Import" to add data.</p>
        </div>

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
