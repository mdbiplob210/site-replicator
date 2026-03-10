import { useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  Shield, Users, ChevronDown, ChevronRight,
  Loader2, Package, ShoppingCart, DollarSign, BarChart3,
  Settings, Monitor, Check, X, Globe, Megaphone,
  Truck, Info, LayoutGrid
} from "lucide-react";
import {
  useEmployees, useTogglePermission, useTogglePanel,
  ALL_PERMISSIONS, type PermissionKey
} from "@/hooks/useEmployeePermissions";
import { PanelManagement } from "@/components/admin/PanelManagement";

const groupIcons: Record<string, any> = {
  "Orders": ShoppingCart,
  "Products": Package,
  "Finance": DollarSign,
  "Dashboard & Reports": BarChart3,
  "Website": Globe,
  "Marketing": Megaphone,
  "Courier": Truck,
  "System": Settings,
};

const groupColors: Record<string, string> = {
  "Orders": "from-blue-500/10 to-blue-500/5 border-blue-500/20",
  "Products": "from-emerald-500/10 to-emerald-500/5 border-emerald-500/20",
  "Finance": "from-amber-500/10 to-amber-500/5 border-amber-500/20",
  "Dashboard & Reports": "from-purple-500/10 to-purple-500/5 border-purple-500/20",
  "Website": "from-cyan-500/10 to-cyan-500/5 border-cyan-500/20",
  "Marketing": "from-pink-500/10 to-pink-500/5 border-pink-500/20",
  "Courier": "from-orange-500/10 to-orange-500/5 border-orange-500/20",
  "System": "from-red-500/10 to-red-500/5 border-red-500/20",
};

const groupIconColors: Record<string, string> = {
  "Orders": "text-blue-600",
  "Products": "text-emerald-600",
  "Finance": "text-amber-600",
  "Dashboard & Reports": "text-purple-600",
  "Website": "text-cyan-600",
  "Marketing": "text-pink-600",
  "Courier": "text-orange-600",
  "System": "text-red-600",
};

const AdminRoles = () => {
  const { data: employees = [], isLoading } = useEmployees();
  const togglePermission = useTogglePermission();
  const togglePanel = useTogglePanel();
  const [expandedUser, setExpandedUser] = useState<string | null>(null);

  const permissionGroups = ALL_PERMISSIONS.reduce((acc, perm) => {
    if (!acc[perm.group]) acc[perm.group] = [];
    acc[perm.group].push(perm);
    return acc;
  }, {} as Record<string, typeof ALL_PERMISSIONS[number][]>);

  const handleTogglePermission = (userId: string, permission: string, currentlyGranted: boolean) => {
    togglePermission.mutate({ userId, permission, grant: !currentlyGranted });
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

  const handleGrantGroup = (userId: string, group: string) => {
    const perms = permissionGroups[group] || [];
    perms.forEach(perm => {
      const emp = employees.find(e => e.user_id === userId);
      if (emp && !emp.permissions.includes(perm.key)) {
        togglePermission.mutate({ userId, permission: perm.key, grant: true });
      }
    });
  };

  const handleRevokeGroup = (userId: string, group: string) => {
    const perms = permissionGroups[group] || [];
    perms.forEach(perm => {
      const emp = employees.find(e => e.user_id === userId);
      if (emp && emp.permissions.includes(perm.key)) {
        togglePermission.mutate({ userId, permission: perm.key, grant: false });
      }
    });
  };

  const activePanels = employees.filter(e => e.panel?.is_active).length;

  return (
    <AdminLayout>
      <TooltipProvider>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Shield className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground">Employee Roles & Permissions</h1>
                <p className="text-sm text-muted-foreground">Assign tasks and orders for each employee</p>
              </div>
            </div>
          </div>

          {/* Overview Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="border-border/40">
              <CardContent className="p-5 flex items-center gap-4">
                <div className="p-2.5 rounded-xl bg-primary/10"><Users className="h-5 w-5 text-primary" /></div>
                <div><p className="text-2xl font-bold text-foreground">{employees.length}</p><p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Total Employees</p></div>
              </CardContent>
            </Card>
            <Card className="border-border/40">
              <CardContent className="p-5 flex items-center gap-4">
                <div className="p-2.5 rounded-xl bg-emerald-50"><Monitor className="h-5 w-5 text-emerald-600" /></div>
                <div><p className="text-2xl font-bold text-foreground">{activePanels}</p><p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Active Panels</p></div>
              </CardContent>
            </Card>
            <Card className="border-border/40">
              <CardContent className="p-5 flex items-center gap-4">
                <div className="p-2.5 rounded-xl bg-blue-50"><ShoppingCart className="h-5 w-5 text-blue-600" /></div>
                <div><p className="text-2xl font-bold text-foreground">Auto</p><p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Order Distribution</p></div>
              </CardContent>
            </Card>
            <Card className="border-border/40">
              <CardContent className="p-5 flex items-center gap-4">
                <div className="p-2.5 rounded-xl bg-amber-50"><Shield className="h-5 w-5 text-amber-600" /></div>
                <div><p className="text-2xl font-bold text-foreground">{ALL_PERMISSIONS.length}</p><p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Total Permissions</p></div>
              </CardContent>
            </Card>
          </div>

          {/* Tabs for Permissions and Panels */}
          <Tabs defaultValue="panels" className="space-y-5">
            <TabsList className="grid w-full grid-cols-2 max-w-md">
              <TabsTrigger value="panels" className="gap-2">
                <LayoutGrid className="h-4 w-4" /> Order Panels
              </TabsTrigger>
              <TabsTrigger value="permissions" className="gap-2">
                <Shield className="h-4 w-4" /> Permissions
              </TabsTrigger>
            </TabsList>

            {/* Panel Tab */}
            <TabsContent value="panels">
              <PanelManagement />
            </TabsContent>

            {/* Permissions Tab */}
            <TabsContent value="permissions" className="space-y-5">
              {/* Permission Summary */}
              <Card className="border-border/40">
                <CardContent className="p-5">
                  <p className="text-sm font-bold text-foreground mb-3">পারমিশন ক্যাটাগরি সারাংশ</p>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(permissionGroups).map(([group, perms]) => {
                      const GroupIcon = groupIcons[group] || Shield;
                      const iconColor = groupIconColors[group] || "text-muted-foreground";
                      return (
                        <Badge key={group} variant="outline" className="gap-1.5 py-1.5 px-3 text-xs">
                          <GroupIcon className={`h-3.5 w-3.5 ${iconColor}`} />
                          {group} ({perms.length})
                        </Badge>
                      );
                    })}
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
                  <p className="text-sm text-muted-foreground/70 mt-1">প্রথমে Users পেজ থেকে এমপ্লয়ি যোগ করুন</p>
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
                              <div className="flex items-center gap-2 mt-0.5 flex-wrap">
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
                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                              {Object.entries(permissionGroups).map(([group, perms]) => {
                                const GroupIcon = groupIcons[group] || Shield;
                                const grantedInGroup = perms.filter(p => emp.permissions.includes(p.key)).length;
                                const allGranted = grantedInGroup === perms.length;
                                const colorClass = groupColors[group] || "from-muted/10 to-muted/5 border-border/40";
                                const iconColor = groupIconColors[group] || "text-muted-foreground";

                                return (
                                  <div key={group} className={`bg-gradient-to-br ${colorClass} rounded-xl border p-4`}>
                                    <div className="flex items-center gap-2 mb-3">
                                      <GroupIcon className={`h-4 w-4 ${iconColor}`} />
                                      <p className="text-xs font-bold text-foreground uppercase tracking-wide flex-1">{group}</p>
                                      <Badge variant="secondary" className="text-[10px]">{grantedInGroup}/{perms.length}</Badge>
                                    </div>

                                    {/* Group toggle all */}
                                    <div className="flex gap-1 mb-3">
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        className="h-6 text-[10px] px-2"
                                        onClick={() => handleGrantGroup(emp.user_id, group)}
                                        disabled={allGranted}
                                      >
                                        সব দিন
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        className="h-6 text-[10px] px-2 text-destructive"
                                        onClick={() => handleRevokeGroup(emp.user_id, group)}
                                        disabled={grantedInGroup === 0}
                                      >
                                        সব সরান
                                      </Button>
                                    </div>

                                    <div className="space-y-1.5">
                                      {perms.map((perm) => {
                                        const isGranted = emp.permissions.includes(perm.key);
                                        return (
                                          <div key={perm.key} className="flex items-center justify-between py-1.5 px-2 rounded-lg hover:bg-background/50 transition-colors">
                                            <div className="flex items-center gap-1.5">
                                              <span className="text-sm text-foreground">{perm.label}</span>
                                              {perm.description && (
                                                <Tooltip>
                                                  <TooltipTrigger asChild>
                                                    <Info className="h-3 w-3 text-muted-foreground/50 cursor-help" />
                                                  </TooltipTrigger>
                                                  <TooltipContent side="top" className="max-w-[200px] text-xs">
                                                    {perm.description}
                                                  </TooltipContent>
                                                </Tooltip>
                                              )}
                                            </div>
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
                          </div>
                        )}

                        {/* Admin notice */}
                        {isExpanded && isAdmin && (
                          <div className="border-t border-border/40 p-5 bg-secondary/5">
                            <div className="flex items-center gap-3 p-4 rounded-xl bg-primary/5 border border-primary/20">
                              <Shield className="h-5 w-5 text-primary" />
                              <div>
                                <p className="text-sm font-bold text-foreground">অ্যাডমিন ইউজার</p>
                                <p className="text-xs text-muted-foreground">অ্যাডমিনের সব পারমিশন স্বয়ংক্রিয়ভাবে থাকে।</p>
                              </div>
                            </div>
                          </div>
                        )}
                      </Card>
                    );
                  })}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </TooltipProvider>
    </AdminLayout>
  );
};

export default AdminRoles;