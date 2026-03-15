import { useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  RefreshCw, Download, Cloud, Link, Package, Wallet,
  FileText, ListChecks, HandCoins, Landmark, Users, Database,
  Globe, ShoppingCart, Settings, BarChart3, MessageSquare, HardDrive,
  Shield, Eye, Bell, Receipt, Truck
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

// All database tables for complete backup
const allDbTables = [
  "products", "orders", "order_items", "order_sources", "order_activity_logs", "order_assignments",
  "profiles", "user_roles", "employee_permissions", "employee_panels",
  "finance_records", "finance_sources",
  "categories", "banners", "site_settings",
  "landing_pages", "landing_page_images", "landing_page_events",
  "courier_providers", "courier_orders", "courier_webhook_logs",
  "invoices", "notifications", "ad_spends",
  "tasks", "incomplete_orders",
  "blocked_ips", "blocked_phones", "fraud_settings",
  "meta_campaigns", "meta_adsets", "meta_ads",
  "login_activity", "login_attempts", "user_presence",
  "website_events", "api_keys", "internal_messages",
  "whatsapp_settings", "whatsapp_conversations", "whatsapp_messages",
  "whatsapp_auto_replies", "whatsapp_templates", "whatsapp_transfer_logs",
];

const individualTables = [
  { name: "প্রোডাক্টস", icon: Package, table: "products" },
  { name: "অর্ডারস", icon: ShoppingCart, table: "orders" },
  { name: "অর্ডার আইটেমস", icon: FileText, table: "order_items" },
  { name: "অর্ডার সোর্সেস", icon: Truck, table: "order_sources" },
  { name: "অর্ডার অ্যাক্টিভিটি লগ", icon: Eye, table: "order_activity_logs" },
  { name: "ফাইন্যান্স রেকর্ডস", icon: Wallet, table: "finance_records" },
  { name: "ফাইন্যান্স সোর্সেস", icon: Landmark, table: "finance_sources" },
  { name: "টাস্কস", icon: ListChecks, table: "tasks" },
  { name: "ইউজার রোলস", icon: Users, table: "user_roles" },
  { name: "প্রোফাইলস", icon: Users, table: "profiles" },
  { name: "কর্মচারী পারমিশন", icon: Shield, table: "employee_permissions" },
  { name: "ক্যাটাগরি", icon: Package, table: "categories" },
  { name: "ব্যানারস", icon: BarChart3, table: "banners" },
  { name: "ল্যান্ডিং পেজ", icon: Globe, table: "landing_pages" },
  { name: "সাইট সেটিংস", icon: Settings, table: "site_settings" },
  { name: "কুরিয়ার প্রোভাইডার", icon: Truck, table: "courier_providers" },
  { name: "কুরিয়ার অর্ডারস", icon: ShoppingCart, table: "courier_orders" },
  { name: "ইনভয়েস", icon: Receipt, table: "invoices" },
  { name: "নোটিফিকেশন", icon: Bell, table: "notifications" },
  { name: "অ্যাড স্পেন্ডস", icon: HandCoins, table: "ad_spends" },
  { name: "ইনকমপ্লিট অর্ডারস", icon: FileText, table: "incomplete_orders" },
  { name: "ব্লক আইপি", icon: Shield, table: "blocked_ips" },
  { name: "ব্লক ফোন", icon: Shield, table: "blocked_phones" },
  { name: "মেটা ক্যাম্পেইন", icon: BarChart3, table: "meta_campaigns" },
  { name: "API Keys", icon: Settings, table: "api_keys" },
  { name: "ইন্টারনাল মেসেজ", icon: MessageSquare, table: "internal_messages" },
  { name: "ওয়েবসাইট ইভেন্টস", icon: Eye, table: "website_events" },
  { name: "লগইন অ্যাক্টিভিটি", icon: Shield, table: "login_activity" },
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
  const [dbBackup, setDbBackup] = useState(false);

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
      const uniqueTables = [...new Set(individualTables.map(t => t.table))];
      const backup: any = { exported_at: new Date().toISOString(), type: "data_backup", tables: {} };
      let totalRecords = 0;
      for (const table of uniqueTables) {
        try {
          const data = await fetchTableData(table);
          backup.tables[table] = { count: data.length, data };
          totalRecords += data.length;
        } catch { backup.tables[table] = { count: 0, data: [], error: "access_denied" }; }
      }
      backup.total_records = totalRecords;
      const date = new Date().toISOString().split("T")[0];
      downloadJSON(backup, `full_data_backup_${date}.json`);
      toast({ title: "ডাটা ব্যাকআপ সম্পন্ন", description: `মোট ${totalRecords} রেকর্ড ডাউনলোড হয়েছে` });
    } catch (err: any) {
      toast({ title: "ত্রুটি", description: err.message, variant: "destructive" });
    } finally {
      setGenerating(false);
    }
  };

  const handleDatabaseBackup = async () => {
    setDbBackup(true);
    try {
      const backup: any = { exported_at: new Date().toISOString(), type: "full_database_backup", tables: {} };
      let totalRecords = 0;
      let successCount = 0;
      let failCount = 0;

      for (const table of allDbTables) {
        try {
          const data = await fetchTableData(table);
          backup.tables[table] = { count: data.length, data };
          totalRecords += data.length;
          successCount++;
        } catch {
          backup.tables[table] = { count: 0, data: [], error: "access_denied" };
          failCount++;
        }
      }

      backup.total_records = totalRecords;
      backup.tables_exported = successCount;
      backup.tables_failed = failCount;
      const date = new Date().toISOString().split("T")[0];
      downloadJSON(backup, `database_full_backup_${date}.json`);
      toast({ title: "ডাটাবেস ব্যাকআপ সম্পন্ন", description: `${successCount} টেবিল, মোট ${totalRecords} রেকর্ড` });
    } catch (err: any) {
      toast({ title: "ত্রুটি", description: err.message, variant: "destructive" });
    } finally {
      setDbBackup(false);
    }
  };

  const handleWebsiteBackup = async () => {
    setDownloading("website");
    try {
      const [settings, landingPages, landingImages, banners, categories] = await Promise.all([
        fetchTableData("site_settings"),
        fetchTableData("landing_pages"),
        fetchTableData("landing_page_images"),
        fetchTableData("banners"),
        fetchTableData("categories"),
      ]);
      const date = new Date().toISOString().split("T")[0];
      downloadJSON({
        exported_at: new Date().toISOString(),
        type: "website_backup",
        site_settings: { count: settings.length, data: settings },
        landing_pages: { count: landingPages.length, data: landingPages },
        landing_page_images: { count: landingImages.length, data: landingImages },
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
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Database Backup */}
          <Card className="border-border/40 border-2 border-primary/20">
            <CardContent className="flex flex-col items-center gap-3 p-5 text-center">
              <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center">
                <HardDrive className="h-7 w-7 text-primary" />
              </div>
              <div>
                <h3 className="font-bold text-foreground">ডাটাবেস ব্যাকআপ</h3>
                <p className="text-xs text-muted-foreground mt-1">সম্পূর্ণ ডাটাবেসের সব টেবিল ({allDbTables.length}টি) একসাথে ডাউনলোড</p>
              </div>
              <Button onClick={handleDatabaseBackup} disabled={dbBackup} className="gap-2 w-full">
                {dbBackup ? (
                  <><RefreshCw className="h-4 w-4 animate-spin" /> ব্যাকআপ হচ্ছে...</>
                ) : (
                  <><Download className="h-4 w-4" /> ডাটাবেস ডাউনলোড</>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Data Backup */}
          <Card className="border-border/40">
            <CardContent className="flex flex-col items-center gap-3 p-5 text-center">
              <div className="h-14 w-14 rounded-2xl bg-secondary flex items-center justify-center">
                <Database className="h-7 w-7 text-foreground" />
              </div>
              <div>
                <h3 className="font-bold text-foreground">ডাটা ব্যাকআপ</h3>
                <p className="text-xs text-muted-foreground mt-1">মূল ডাটা টেবিলগুলো (প্রোডাক্ট, অর্ডার, ফাইন্যান্স)</p>
              </div>
              <Button onClick={handleFullDataBackup} disabled={generating} variant="outline" className="gap-2 w-full">
                {generating ? (
                  <><RefreshCw className="h-4 w-4 animate-spin" /> প্রস্তুত হচ্ছে...</>
                ) : (
                  <><Download className="h-4 w-4" /> ডাটা ডাউনলোড</>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Website Backup */}
          <Card className="border-border/40">
            <CardContent className="flex flex-col items-center gap-3 p-5 text-center">
              <div className="h-14 w-14 rounded-2xl bg-accent/50 flex items-center justify-center">
                <Globe className="h-7 w-7 text-accent-foreground" />
              </div>
              <div>
                <h3 className="font-bold text-foreground">ওয়েবসাইট ব্যাকআপ</h3>
                <p className="text-xs text-muted-foreground mt-1">সেটিংস, ল্যান্ডিং পেজ, ব্যানার, ক্যাটাগরি</p>
              </div>
              <Button onClick={handleWebsiteBackup} disabled={downloading === "website"} variant="outline" className="gap-2 w-full">
                {downloading === "website" ? (
                  <><RefreshCw className="h-4 w-4 animate-spin" /> ডাউনলোড হচ্ছে...</>
                ) : (
                  <><Download className="h-4 w-4" /> ওয়েবসাইট ডাউনলোড</>
                )}
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
                    disabled={downloading === table.table + table.name}
                    onClick={() => {
                      setDownloading(table.table + table.name);
                      handleDownloadTable(table.table, table.name).finally(() => setDownloading(null));
                    }}
                  >
                    <Download className={`h-4 w-4 ${downloading === table.table + table.name ? "animate-bounce" : ""}`} />
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
