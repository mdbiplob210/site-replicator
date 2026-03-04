import { useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Clock, RefreshCw, Download, Cloud, Link, Package, Wallet,
  FileText, ListChecks, HandCoins, Landmark, Users, Upload
} from "lucide-react";

const backupFiles = [
  {
    name: "backup_61b6c1f7-11ab-4f22-8e2e-c92900840451_2026-03-04.json",
    date: "Mar 04, 2026 · 06:33 PM",
    size: "210.4 KB",
    type: "manual",
    details: "profiles: 38 · user_roles: 1 · order_items: 452 · report_items: 4 · user_sessions: 1 · website_configs: 1"
  }
];

const individualTables = [
  { name: "Products", icon: Package },
  { name: "Transactions", icon: Wallet },
  { name: "Daily Reports", icon: FileText },
  { name: "Report Items", icon: FileText },
  { name: "Planning Tasks", icon: ListChecks },
  { name: "Loans", icon: HandCoins },
  { name: "Bank Accounts", icon: Landmark },
  { name: "User Roles", icon: Users },
];

const AdminBackup = () => {
  const [generating, setGenerating] = useState(false);

  const handleGenerate = () => {
    setGenerating(true);
    setTimeout(() => setGenerating(false), 2000);
  };

  return (
    <AdminLayout>
      <div className="max-w-[1400px] space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-foreground">Data Backup & Restore</h1>
          <p className="text-muted-foreground text-sm mt-0.5">Automatic daily backups · Last 7 days available</p>
        </div>

        {/* Automatic Backups */}
        <Card className="border-border/40">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-muted-foreground" />
              <CardTitle className="text-lg font-bold">Automatic Backups</CardTitle>
            </div>
            <p className="text-sm text-muted-foreground">Backups are generated daily and kept for 7 days. You can also generate one now.</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button
              onClick={handleGenerate}
              disabled={generating}
              className="gap-2 bg-primary text-primary-foreground"
            >
              <RefreshCw className={`h-4 w-4 ${generating ? "animate-spin" : ""}`} />
              {generating ? "Generating..." : "Generate Backup Now"}
            </Button>

            {/* Backup Files */}
            {backupFiles.map((file, i) => (
              <div key={i} className="flex items-start justify-between p-4 rounded-xl border border-border/50 bg-secondary/30">
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-foreground">{file.name}</p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <FileText className="h-3 w-3" />
                    {file.date} · {file.size}
                    <Badge variant="secondary" className="text-[10px] px-2 py-0.5 font-semibold">
                      {file.type}
                    </Badge>
                  </div>
                  <p className="text-[11px] text-muted-foreground">{file.details}</p>
                </div>
                <Button variant="outline" size="sm" className="gap-1.5 shrink-0">
                  <Download className="h-4 w-4" />
                  Download
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Google Drive Sync */}
        <Card className="border-border/40">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Cloud className="h-5 w-5 text-muted-foreground" />
              <CardTitle className="text-lg font-bold">Google Drive Sync</CardTitle>
            </div>
            <p className="text-sm text-muted-foreground">Connect Google Drive to automatically transfer backups to your cloud storage.</p>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <Cloud className="h-12 w-12 text-muted-foreground/30 mb-4" />
              <p className="text-sm font-semibold text-foreground mb-1">No Google Drive connected</p>
              <p className="text-xs text-muted-foreground mb-6">Sign in with your Google account to automatically sync backups to Drive.</p>
              <Button className="gap-2 bg-foreground text-background hover:bg-foreground/90">
                <Link className="h-4 w-4" />
                Connect Google Drive
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Individual Tables */}
        <Card className="border-border/40">
          <CardHeader>
            <CardTitle className="text-lg font-bold">Individual Tables</CardTitle>
            <p className="text-sm text-muted-foreground">Export or restore specific data tables separately</p>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {individualTables.map((table) => (
                <div key={table.name} className="flex items-center justify-between p-4 rounded-xl border border-border/50 bg-secondary/20 hover:bg-secondary/40 transition-colors">
                  <div className="flex items-center gap-3">
                    <table.icon className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium text-foreground">{table.name}</span>
                  </div>
                  <button className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors">
                    <Upload className="h-4 w-4" />
                  </button>
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
