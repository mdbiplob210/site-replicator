import { useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Clock, RefreshCw, Download, Cloud, Link, Package, Wallet,
  FileText, ListChecks, HandCoins, Landmark, Users, Database,
  Globe, ShoppingCart, Settings, BarChart3, MessageSquare
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

const individualTables = [
  { name: "প্রোডাক্টস", icon: Package, table: "products" },
  { name: "অর্ডারস", icon: ShoppingCart, table: "orders" },
  { name: "অর্ডার আইটেমস", icon: FileText, table: "order_items" },
  { name: "ফাইন্যান্স রেকর্ডস", icon: Wallet, table: "finance_records" },
  { name: "ফাইন্যান্স সোর্সেস", icon: Landmark, table: "finance_sources" },
  { name: "ডেইলি রিপোর্টস", icon: FileText, table: "tasks" },
  { name: "প্ল্যানিং টাস্কস", icon: ListChecks, table: "tasks" },
  { name: "ইউজার রোলস", icon: Users, table: "user_roles" },
  { name: "প্রোফাইলস", icon: Users, table: "profiles" },
  { name: "ক্যাটাগরি", icon: Package, table: "categories" },
  { name: "ব্যানারস", icon: BarChart3, table: "banners" },
  { name: "ল্যান্ডিং পেজ", icon: Globe, table: "landing_pages" },
  { name: "সাইট সেটিংস", icon: Settings, table: "site_settings" },
  { name: "কুরিয়ার প্রোভাইডার", icon: Package, table: "courier_providers" },
  { name: "কুরিয়ার অর্ডারস", icon: ShoppingCart, table: "courier_orders" },
  { name: "ইনভয়েস", icon: FileText, table: "invoices" },
  { name: "নোটিফিকেশন", icon: MessageSquare, table: "notifications" },
  { name: "অ্যাড স্পেন্ডস", icon: HandCoins, table: "ad_spends" },
];

const downloadJSON = (data: any, filename: string) => {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

const fetchTableData = async (tableName: string) => {
  const { data, error } = await (supabase.from(tableName as any).select("*") as any);
  if (error) throw error;
  return data || [];
};

const AdminBackup = () => {
  const [generating, setGenerating] = useState(false);
  const [downloading, setDownloading] = useState<string | null>(null);

  const handleDownloadTable = async (tableName: string, displayName: string) => {
    setDownloading(tableName);
    try {
      const data = await fetchTableData(tableName);
      const date = new Date().toISOString().split("T")[0];
      downloadJSON({ table: tableName, exported_at: new Date().toISOString(), count: data.length, data }, `${tableName}_backup_${date}.json`);
      toast({ title: "ডাউনলোড সম্পন্ন", description: `${displayName} - ${data.length} রেকর্ড` });
    } catch (err: any) {
      toast({ title: "ত্রুটি", description: err.message, variant: "destructive" });
    } finally {
      setDownloading(null);
    }
  };

  const handleFullDataBackup = async () => {
    setGenerating(true);
    try {
      const allTables = [...new Set(individualTables.map(t => t.table))];
      const backup: any = { exported_at: new Date().toISOString(), tables: {} };
      for (const table of allTables) {
        try {
          const data = await fetchTableData(table);
          backup.tables[table] = { count: data.length, data };
        } catch { backup.tables[table] = { count: 0, data: [], error: "access_denied" }; }
      }
      const date = new Date().toISOString().split("T")[0];
      downloadJSON(backup, `full_data_backup_${date}.json`);
      toast({ title: "ফুল ডাটা ব্যাকআপ সম্পন্ন" });
    } catch (err: any) {
      toast({ title: "ত্রুটি", description: err.message, variant: "destructive" });
    } finally {
      setGenerating(false);
    }
  };

  const handleWebsiteBackup = async () => {
    setDownloading("website");
    try {
      const [settings, landingPages, banners, categories] = await Promise.all([
        fetchTableData("site_settings"),
        fetchTableData("landing_pages"),
        fetchTableData("banners"),
        fetchTableData("categories"),
      ]);
      const date = new Date().toISOString().split("T")[0];
      downloadJSON({
        exported_at: new Date().toISOString(),
        type: "website_backup",
        site_settings: { count: settings.length, data: settings },
        landing_pages: { count: landingPages.length, data: landingPages },
        banners: { count: banners.length, data: banners },
        categories: { count: categories.length, data: categories },
      }, `website_backup_${date}.json`);
      toast({ title: "ওয়েবসাইট ব্যাকআপ সম্পন্ন" });
    } catch (err: any) {
      toast({ title: "ত্রুটি", description: err.message, variant: "destructive" });
    } finally {
      setDownloading(null);
    }
  };

  return (
    <AdminLayout>
      <div className="max-w-[1400px] space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">ডাটা ব্যাকআপ ও রিস্টোর</h1>
          <p className="text-muted-foreground text-sm mt-0.5">যেকোনো টেবিল বা সম্পূর্ণ ডাটা JSON ফরম্যাটে ডাউনলোড করুন</p>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Card className="border-border/40">
            <CardContent className="flex items-center gap-4 p-5">
              <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <Database className="h-6 w-6 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-foreground">সম্পূর্ণ ডাটা ব্যাকআপ</h3>
                <p className="text-xs text-muted-foreground">সকল টেবিলের ডাটা একসাথে ডাউনলোড</p>
              </div>
              <Button onClick={handleFullDataBackup} disabled={generating} className="gap-2 shrink-0">
                <RefreshCw className={`h-4 w-4 ${generating ? "animate-spin" : ""}`} />
                {generating ? "প্রস্তুত হচ্ছে..." : "ডাউনলোড"}
              </Button>
            </CardContent>
          </Card>

          <Card className="border-border/40">
            <CardContent className="flex items-center gap-4 p-5">
              <div className="h-12 w-12 rounded-xl bg-accent/50 flex items-center justify-center shrink-0">
                <Globe className="h-6 w-6 text-accent-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-foreground">ওয়েবসাইট ব্যাকআপ</h3>
                <p className="text-xs text-muted-foreground">সেটিংস, ল্যান্ডিং পেজ, ব্যানার, ক্যাটাগরি</p>
              </div>
              <Button onClick={handleWebsiteBackup} disabled={downloading === "website"} variant="outline" className="gap-2 shrink-0">
                <Download className={`h-4 w-4 ${downloading === "website" ? "animate-bounce" : ""}`} />
                {downloading === "website" ? "ডাউনলোড হচ্ছে..." : "ডাউনলোড"}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Google Drive Sync */}
        <Card className="border-border/40">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Cloud className="h-5 w-5 text-muted-foreground" />
              <CardTitle className="text-lg font-bold">গুগল ড্রাইভ সিংক</CardTitle>
            </div>
            <p className="text-sm text-muted-foreground">গুগল ড্রাইভে অটোমেটিক ব্যাকআপ ট্রান্সফার করুন।</p>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <Cloud className="h-12 w-12 text-muted-foreground/30 mb-4" />
              <p className="text-sm font-semibold text-foreground mb-1">গুগল ড্রাইভ সংযুক্ত নেই</p>
              <p className="text-xs text-muted-foreground mb-6">আপনার গুগল অ্যাকাউন্ট দিয়ে সাইন ইন করে ব্যাকআপ সিংক করুন।</p>
              <Button className="gap-2 bg-foreground text-background hover:bg-foreground/90">
                <Link className="h-4 w-4" />
                গুগল ড্রাইভ সংযুক্ত করুন
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Individual Tables */}
        <Card className="border-border/40">
          <CardHeader>
            <CardTitle className="text-lg font-bold">পৃথক টেবিল ব্যাকআপ</CardTitle>
            <p className="text-sm text-muted-foreground">আলাদাভাবে যেকোনো টেবিলের ডাটা ডাউনলোড করুন</p>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {individualTables.map((table) => (
                <div key={table.name} className="flex items-center justify-between p-4 rounded-xl border border-border/50 bg-secondary/20 hover:bg-secondary/40 transition-colors">
                  <div className="flex items-center gap-3">
                    <table.icon className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium text-foreground">{table.name}</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    disabled={downloading === table.table}
                    onClick={() => handleDownloadTable(table.table, table.name)}
                  >
                    <Download className={`h-4 w-4 ${downloading === table.table ? "animate-bounce" : ""}`} />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default AdminBackup;
