import { useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Shield, Users, UserCog, ChevronDown, ChevronRight,
  Loader2, Package, ShoppingCart, DollarSign, BarChart3,
  FileText, Settings, Monitor, Check, X
} from "lucide-react";
import {
  useEmployees, useTogglePermission, useTogglePanel,
  ALL_PERMISSIONS, type PermissionKey
} from "@/hooks/useEmployeePermissions";

const groupIcons: Record<string, any> = {
  Orders: ShoppingCart,
  Products: Package,
  Finance: DollarSign,
  Analytics: BarChart3,
  Reports: FileText,
  Admin: Settings,
};

const AdminRoles = () => {
  const { data: employees = [], isLoading } = useEmployees();
  const togglePermission = useTogglePermission();
  const togglePanel = useTogglePanel();
  const [expandedUser, setExpandedUser] = useState<string | null>(null);

  // Group permissions by category
  const permissionGroups = ALL_PERMISSIONS.reduce((acc, perm) => {
    if (!acc[perm.group]) acc[perm.group] = [];
    acc[perm.group].push(perm);
    return acc;
  }, {} as Record<string, typeof ALL_PERMISSIONS[number][]>);

  const handleTogglePermission = (userId: string, permission: string, currentlyGranted: boolean) => {
    togglePermission.mutate({
      userId,
      permission,
      grant: !currentlyGranted,
    });
  };

  const handleTogglePanel = (userId: string, name: string, isActive: boolean) => {
    togglePanel.mutate({ userId, panelName: name, isActive });
  };

  const handleGrantAll = (userId: string) => {
    ALL_PERMISSIONS.forEach(perm => {
      const emp = employees.find(e => e.user_id === userId);
      if (emp && !emp.permissions.includes(perm.key)) {
        togglePermission.mutate({ userId, permission: perm.key, grant: true });
      }
    });
  };

  const handleRevokeAll = (userId: string) => {
    ALL_PERMISSIONS.forEach(perm => {
      const emp = employees.find(e => e.user_id === userId);
      if (emp && emp.permissions.includes(perm.key)) {
        togglePermission.mutate({ userId, permission: perm.key, grant: false });
      }
    });
  };

  const activePanels = employees.filter(e => e.panel?.is_active).length;

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Shield className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">এমপ্লয়ি রোল ও পারমিশন</h1>
              <p className="text-sm text-muted-foreground">প্রতিটি এমপ্লয়ির কাজ ও অর্ডার ভাগ করুন</p>
            </div>
          </div>
        </div>

        {/* Overview Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="border-border/40">
            <CardContent className="p-5 flex items-center gap-4">
              <div className="p-2.5 rounded-xl bg-primary/10"><Users className="h-5 w-5 text-primary" /></div>
              <div><p className="text-2xl font-bold text-foreground">{employees.length}</p><p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">মোট এমপ্লয়ি</p></div>
            </CardContent>
          </Card>
          <Card className="border-border/40">
            <CardContent className="p-5 flex items-center gap-4">
              <div className="p-2.5 rounded-xl bg-emerald-50"><Monitor className="h-5 w-5 text-emerald-600" /></div>
              <div><p className="text-2xl font-bold text-foreground">{activePanels}</p><p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">এক্টিভ প্যানেল</p></div>
            </CardContent>
          </Card>
          <Card className="border-border/40">
            <CardContent className="p-5 flex items-center gap-4">
              <div className="p-2.5 rounded-xl bg-blue-50"><ShoppingCart className="h-5 w-5 text-blue-600" /></div>
              <div><p className="text-2xl font-bold text-foreground">অটো</p><p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">অর্ডার বণ্টন</p></div>
            </CardContent>
          </Card>
          <Card className="border-border/40">
            <CardContent className="p-5 flex items-center gap-4">
              <div className="p-2.5 rounded-xl bg-amber-50"><Shield className="h-5 w-5 text-amber-600" /></div>
              <div><p className="text-2xl font-bold text-foreground">{ALL_PERMISSIONS.length}</p><p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">মোট পারমিশন</p></div>
            </CardContent>
          </Card>
        </div>

        {/* Order Distribution Info */}
        <Card className="border-border/40 bg-gradient-to-r from-primary/5 to-transparent">
          <CardContent className="p-5">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-primary/10 mt-0.5"><ShoppingCart className="h-4 w-4 text-primary" /></div>
              <div>
                <p className="font-bold text-foreground text-sm">অর্ডার অটো-ডিস্ট্রিবিউশন সিস্টেম</p>
                <p className="text-xs text-muted-foreground mt-1">
                  নতুন অর্ডার আসলে সব এক্টিভ প্যানেলে স্বয়ংক্রিয়ভাবে ভাগ হয়ে যাবে। যার কাছে কম অর্ডার পেন্ডিং আছে তাকে আগে দেওয়া হবে (Round-Robin)।
                  প্রতিটি এমপ্লয়ির প্যানেল On/Off করে অর্ডার বণ্টন নিয়ন্ত্রণ করুন।
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Employee List */}
        {isLoading ? (
          <Card className="border-border/40 p-16 text-center">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mx-auto" />
            <p className="text-muted-foreground mt-3">লোড হচ্ছে...</p>
          </Card>
        ) : employees.length === 0 ? (
          <Card className="border-border/40 p-16 text-center">
            <Users className="h-12 w-12 text-muted-foreground/20 mx-auto mb-4" />
            <p className="text-lg font-semibold text-muted-foreground">কোনো এমপ্লয়ি নেই</p>
            <p className="text-sm text-muted-foreground/70 mt-1">প্রথমে Users পেজ থেকে এমপ্লয়ি যোগ করুন এবং তাদের রোল অ্যাসাইন করুন</p>
          </Card>
        ) : (
          <div className="space-y-4">
            {employees.map((emp) => {
              const isExpanded = expandedUser === emp.user_id;
              const permCount = emp.permissions.length;
              const isAdmin = (emp as any).role === "admin";

              return (
                <Card key={emp.user_id} className="border-border/40 overflow-hidden">
                  {/* Employee Header */}
                  <div
                    className="flex items-center justify-between p-5 cursor-pointer hover:bg-secondary/20 transition-colors"
                    onClick={() => setExpandedUser(isExpanded ? null : emp.user_id)}
                  >
                    <div className="flex items-center gap-4">
                      <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center text-primary font-bold text-lg">
                        {(emp.full_name || "U")[0].toUpperCase()}
                      </div>
                      <div>
                        <p className="font-bold text-foreground">{emp.full_name}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <Badge variant={isAdmin ? "default" : "secondary"} className="text-[10px]">
                            {isAdmin ? "Admin" : (emp as any).role}
                          </Badge>
                          <span className="text-xs text-muted-foreground">{permCount}/{ALL_PERMISSIONS.length} পারমিশন</span>
                          {emp.panel?.is_active && (
                            <Badge className="text-[10px] bg-emerald-100 text-emerald-700 border-emerald-200">
                              <Monitor className="h-3 w-3 mr-1" /> প্যানেল এক্টিভ
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {!isAdmin && (
                        <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                          <Label className="text-xs text-muted-foreground">অর্ডার প্যানেল</Label>
                          <Switch
                            checked={emp.panel?.is_active || false}
                            onCheckedChange={(checked) => handleTogglePanel(emp.user_id, emp.full_name || "Panel", checked)}
                          />
                        </div>
                      )}
                      {isExpanded ? <ChevronDown className="h-5 w-5 text-muted-foreground" /> : <ChevronRight className="h-5 w-5 text-muted-foreground" />}
                    </div>
                  </div>

                  {/* Expanded Permission Details */}
                  {isExpanded && !isAdmin && (
                    <div className="border-t border-border/40 p-5 bg-secondary/5">
                      {/* Quick Actions */}
                      <div className="flex items-center justify-between mb-5">
                        <p className="text-sm font-bold text-foreground">পারমিশন সেট করুন</p>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" className="gap-1.5 text-xs rounded-lg" onClick={() => handleGrantAll(emp.user_id)}>
                            <Check className="h-3 w-3" /> সব দিন
                          </Button>
                          <Button size="sm" variant="outline" className="gap-1.5 text-xs rounded-lg text-destructive" onClick={() => handleRevokeAll(emp.user_id)}>
                            <X className="h-3 w-3" /> সব সরান
                          </Button>
                        </div>
                      </div>

                      {/* Permission Groups */}
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {Object.entries(permissionGroups).map(([group, perms]) => {
                          const GroupIcon = groupIcons[group] || Shield;
                          const grantedInGroup = perms.filter(p => emp.permissions.includes(p.key)).length;

                          return (
                            <div key={group} className="bg-card rounded-xl border border-border/40 p-4">
                              <div className="flex items-center gap-2 mb-3">
                                <GroupIcon className="h-4 w-4 text-muted-foreground" />
                                <p className="text-xs font-bold text-foreground uppercase tracking-wide">{group}</p>
                                <Badge variant="secondary" className="text-[10px] ml-auto">{grantedInGroup}/{perms.length}</Badge>
                              </div>
                              <div className="space-y-2">
                                {perms.map((perm) => {
                                  const isGranted = emp.permissions.includes(perm.key);
                                  return (
                                    <div key={perm.key} className="flex items-center justify-between py-1.5">
                                      <span className="text-sm text-foreground">{perm.label}</span>
                                      <Switch
                                        checked={isGranted}
                                        onCheckedChange={() => handleTogglePermission(emp.user_id, perm.key, isGranted)}
                                        className="scale-90"
                                      />
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Panel Settings */}
                      {emp.panel && (
                        <div className="mt-5 bg-card rounded-xl border border-border/40 p-4">
                          <div className="flex items-center gap-2 mb-3">
                            <Monitor className="h-4 w-4 text-muted-foreground" />
                            <p className="text-xs font-bold text-foreground uppercase tracking-wide">অর্ডার প্যানেল সেটিংস</p>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            এই এমপ্লয়ির প্যানেল {emp.panel.is_active ? "এক্টিভ আছে" : "বন্ধ আছে"}।
                            এক্টিভ থাকলে নতুন অর্ডার স্বয়ংক্রিয়ভাবে এই প্যানেলে আসবে।
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Admin notice */}
                  {isExpanded && isAdmin && (
                    <div className="border-t border-border/40 p-5 bg-secondary/5">
                      <div className="flex items-center gap-3 p-4 rounded-xl bg-primary/5 border border-primary/20">
                        <Shield className="h-5 w-5 text-primary" />
                        <div>
                          <p className="text-sm font-bold text-foreground">অ্যাডমিন ইউজার</p>
                          <p className="text-xs text-muted-foreground">অ্যাডমিনের সব পারমিশন স্বয়ংক্রিয়ভাবে থাকে। আলাদাভাবে পারমিশন সেট করার দরকার নেই।</p>
                        </div>
                      </div>
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminRoles;
