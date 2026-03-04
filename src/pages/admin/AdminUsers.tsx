import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  Shield, Trash2, Users, UserPlus, Lock, Eye, Edit,
  Activity, Clock, AlertCircle, XCircle, Monitor, RefreshCw,
  Search, ChevronDown, ShoppingCart, CheckCircle2, RotateCcw, Truck, BarChart3,
  Settings, Package, DollarSign, FileText, ChevronRight, Loader2, X, Check
} from "lucide-react";
import {
  useEmployees, useTogglePermission, useTogglePanel,
  ALL_PERMISSIONS, type PermissionKey
} from "@/hooks/useEmployeePermissions";

interface UserProfile {
  id: string;
  user_id: string;
  full_name: string | null;
  created_at: string;
  roles: string[];
}

type TabType = "users" | "rules" | "tracking" | "activity";
type TrackingSubTab = "live" | "performance";

const groupIcons: Record<string, any> = {
  Orders: ShoppingCart,
  Products: Package,
  Finance: DollarSign,
  Analytics: BarChart3,
  Reports: FileText,
  Admin: Settings,
};

const AdminUsers = () => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>("users");
  const [trackingSubTab, setTrackingSubTab] = useState<TrackingSubTab>("live");

  // Create admin dialog
  const [createOpen, setCreateOpen] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newName, setNewName] = useState("");
  const [newRole, setNewRole] = useState<"admin" | "moderator" | "user">("admin");
  const [creating, setCreating] = useState(false);

  // Rules tab
  const { data: employees = [], isLoading: employeesLoading } = useEmployees();
  const togglePermission = useTogglePermission();
  const togglePanel = useTogglePanel();
  const [expandedUser, setExpandedUser] = useState<string | null>(null);

  const permissionGroups = ALL_PERMISSIONS.reduce((acc, perm) => {
    if (!acc[perm.group]) acc[perm.group] = [];
    acc[perm.group].push(perm);
    return acc;
  }, {} as Record<string, typeof ALL_PERMISSIONS[number][]>);

  const fetchUsers = async () => {
    setLoading(true);
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, user_id, full_name, created_at");

    if (profiles) {
      const { data: roles } = await supabase
        .from("user_roles")
        .select("user_id, role");

      const usersWithRoles = profiles.map((p) => ({
        ...p,
        roles: (roles || [])
          .filter((r) => r.user_id === p.user_id)
          .map((r) => r.role),
      }));
      setUsers(usersWithRoles);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const assignRole = async (userId: string, role: "admin" | "moderator" | "user") => {
    const { error } = await supabase
      .from("user_roles")
      .upsert({ user_id: userId, role } as any, { onConflict: "user_id,role" });

    if (error) {
      toast.error(error.message);
    } else {
      toast.success(`রোল "${role}" অ্যাসাইন হয়েছে`);
      fetchUsers();
    }
  };

  const removeRole = async (userId: string, role: "admin" | "moderator" | "user") => {
    // Self-protection: prevent removing own admin role
    const { data: { user: currentUser } } = await supabase.auth.getUser();
    if (currentUser && currentUser.id === userId && role === "admin") {
      toast.error("⚠️ নিজের অ্যাডমিন রোল ডিলিট করা যাবে না!");
      return;
    }

    const { error } = await supabase
      .from("user_roles")
      .delete()
      .eq("user_id", userId)
      .eq("role", role as any);

    if (error) {
      toast.error(error.message);
    } else {
      toast.success(`রোল "${role}" রিমুভ হয়েছে`);
      fetchUsers();
    }
  };

  const handleCreateAdmin = async () => {
    if (!newEmail || !newPassword || !newName) {
      toast.error("সব ফিল্ড পূরণ করুন");
      return;
    }
    setCreating(true);
    try {
      // Sign up user
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: newEmail,
        password: newPassword,
        options: { data: { full_name: newName } },
      });
      if (signUpError) throw signUpError;

      if (signUpData.user) {
        // Assign role
        const { error: roleError } = await supabase
          .from("user_roles")
          .insert({ user_id: signUpData.user.id, role: newRole } as any);
        if (roleError) throw roleError;
      }

      toast.success(`${newRole} অ্যাকাউন্ট তৈরি হয়েছে!`);
      setCreateOpen(false);
      setNewEmail("");
      setNewPassword("");
      setNewName("");
      fetchUsers();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setCreating(false);
    }
  };

  const handleTogglePermission = (userId: string, permission: string, currentlyGranted: boolean) => {
    togglePermission.mutate({ userId, permission, grant: !currentlyGranted });
  };

  const handleTogglePanel = (userId: string, name: string, isActive: boolean) => {
    togglePanel.mutate({ userId, panelName: name, isActive });
  };

  const handleGrantAll = async (userId: string) => {
    for (const perm of ALL_PERMISSIONS) {
      togglePermission.mutate({ userId, permission: perm.key, grant: true });
    }
  };

  const handleRevokeAll = async (userId: string) => {
    for (const perm of ALL_PERMISSIONS) {
      togglePermission.mutate({ userId, permission: perm.key, grant: false });
    }
  };

  const adminCount = users.filter(u => u.roles.includes("admin")).length;
  const modCount = users.filter(u => u.roles.includes("moderator")).length;

  const tabs = [
    { id: "users" as TabType, label: "Users", icon: Users },
    { id: "rules" as TabType, label: "Rules & Permissions", icon: Shield },
    { id: "tracking" as TabType, label: "User Tracking", icon: Activity },
    { id: "activity" as TabType, label: "Login Activity", icon: Clock },
  ];

  return (
    <AdminLayout>
      <div className="max-w-[1400px] space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Users & Business Management</h1>
            <p className="text-muted-foreground text-sm mt-0.5">Manage businesses, team members, roles and permissions</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" className="gap-2" onClick={() => setCreateOpen(true)}>
              <UserPlus className="h-4 w-4" />
              Create Admin
            </Button>
            <Button variant="outline" className="gap-2">
              <Lock className="h-4 w-4" />
              Change Password
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center justify-center gap-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                activeTab === tab.id
                  ? "bg-card border border-border shadow-sm text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* ===== USERS TAB ===== */}
        {activeTab === "users" && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="border-border/40">
                <CardContent className="p-5 flex items-center gap-4">
                  <div className="p-2.5 rounded-xl bg-primary/10"><Users className="h-5 w-5 text-primary" /></div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total Users</p>
                    <p className="text-2xl font-bold text-foreground">{users.length}</p>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-border/40">
                <CardContent className="p-5 flex items-center gap-4">
                  <div className="p-2.5 rounded-xl bg-destructive/10"><Shield className="h-5 w-5 text-destructive" /></div>
                  <div>
                    <p className="text-sm text-muted-foreground">Admins</p>
                    <p className="text-2xl font-bold text-foreground">{adminCount}</p>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-border/40">
                <CardContent className="p-5 flex items-center gap-4">
                  <div className="p-2.5 rounded-xl bg-amber-500/10"><Users className="h-5 w-5 text-amber-600" /></div>
                  <div>
                    <p className="text-sm text-muted-foreground">Moderators</p>
                    <p className="text-2xl font-bold text-foreground">{modCount}</p>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-border/40">
                <CardContent className="p-5 flex items-center gap-4">
                  <div className="p-2.5 rounded-xl bg-emerald-500/10"><CheckCircle2 className="h-5 w-5 text-emerald-600" /></div>
                  <div>
                    <p className="text-sm text-muted-foreground">Active</p>
                    <p className="text-2xl font-bold text-foreground">{users.length}/{users.length}</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card className="border-border/40">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg font-bold">Team Members</CardTitle>
                <Button className="gap-2" onClick={() => setCreateOpen(true)}>
                  <UserPlus className="h-4 w-4" />
                  Add User
                </Button>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex justify-center py-8"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>User</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Assign Role</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {users.map((user) => (
                        <TableRow key={user.id}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <Avatar className="h-9 w-9">
                                <AvatarFallback className="bg-secondary text-foreground text-xs font-bold">
                                  {(user.full_name || "U").charAt(0).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="text-sm font-semibold text-foreground">{user.full_name || "Unknown"}</p>
                                <p className="text-[11px] text-muted-foreground font-mono">{user.user_id.substring(0, 8)}...</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            {user.roles.length > 0 ? (
                              <div className="flex gap-1 flex-wrap">
                                {user.roles.map((role) => (
                                  <Badge
                                    key={role}
                                    variant={role === "admin" ? "default" : "secondary"}
                                    className="text-xs cursor-pointer"
                                    onClick={() => removeRole(user.user_id, role as any)}
                                  >
                                    {role} ✕
                                  </Badge>
                                ))}
                              </div>
                            ) : (
                              <span className="text-muted-foreground text-sm">No role</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <Select onValueChange={(val) => assignRole(user.user_id, val as any)}>
                              <SelectTrigger className="w-32 h-8">
                                <SelectValue placeholder="Add role..." />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="admin">Admin</SelectItem>
                                <SelectItem value="moderator">Moderator</SelectItem>
                                <SelectItem value="user">User</SelectItem>
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-600 border-emerald-200/50 gap-1">
                              <span className="h-2 w-2 rounded-full bg-emerald-500" />
                              Active
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => { setActiveTab("rules"); setExpandedUser(user.user_id); }}
                                className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
                                title="Edit Rules"
                              >
                                <Shield className="h-4 w-4" />
                              </button>
                              <button className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors">
                                <Eye className="h-4 w-4" />
                              </button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                      {users.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                            কোন ইউজার পাওয়া যায়নি
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </>
        )}

        {/* ===== RULES & PERMISSIONS TAB ===== */}
        {activeTab === "rules" && (
          <>
            <Card className="border-border/40 p-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2.5 rounded-xl bg-primary/10">
                  <Shield className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-foreground">Rules & Permissions Editor</h2>
                  <p className="text-sm text-muted-foreground">প্রতিটা এমপ্লয়ির জন্য আলাদাভাবে পারমিশন এবং অর্ডার প্যানেল সেটিং করুন</p>
                </div>
              </div>
            </Card>

            {employeesLoading ? (
              <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
            ) : employees.length === 0 ? (
              <Card className="border-border/40 p-12 text-center">
                <Users className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-muted-foreground">কোন ইউজার পাওয়া যায়নি। প্রথমে ইউজার তৈরি করুন।</p>
              </Card>
            ) : (
              <div className="space-y-3">
                {employees.map((emp) => {
                  const isExpanded = expandedUser === emp.user_id;
                  const grantedCount = emp.permissions?.length || 0;
                  return (
                    <Card key={emp.user_id} className="border-border/40 overflow-hidden">
                      {/* User header */}
                      <button
                        onClick={() => setExpandedUser(isExpanded ? null : emp.user_id)}
                        className="w-full flex items-center justify-between p-4 hover:bg-secondary/30 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10">
                            <AvatarFallback className="bg-primary/10 text-primary font-bold">
                              {(emp.full_name || "U").charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="text-left">
                            <p className="font-semibold text-foreground">{emp.full_name || "Unknown"}</p>
                            <p className="text-xs text-muted-foreground font-mono">{emp.user_id.substring(0, 8)}...</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <Badge variant="secondary" className="text-xs">
                            {grantedCount}/{ALL_PERMISSIONS.length} permissions
                          </Badge>
                          <Badge variant={emp.panel?.is_active ? "default" : "secondary"} className="text-xs">
                            Panel: {emp.panel?.is_active ? "ON" : "OFF"}
                          </Badge>
                          {isExpanded ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
                        </div>
                      </button>

                      {/* Expanded permission editor */}
                      {isExpanded && (
                        <div className="border-t border-border p-5 space-y-5">
                          {/* Quick actions */}
                          <div className="flex items-center gap-3">
                            <Button size="sm" variant="outline" className="gap-1.5 text-xs" onClick={() => handleGrantAll(emp.user_id)}>
                              <Check className="h-3.5 w-3.5" /> Grant All
                            </Button>
                            <Button size="sm" variant="outline" className="gap-1.5 text-xs text-destructive" onClick={() => handleRevokeAll(emp.user_id)}>
                              <X className="h-3.5 w-3.5" /> Revoke All
                            </Button>
                            <div className="ml-auto flex items-center gap-2">
                              <span className="text-sm text-muted-foreground">Order Panel</span>
                              <Switch
                                checked={emp.panel?.is_active || false}
                                onCheckedChange={(checked) =>
                                  handleTogglePanel(emp.user_id, emp.full_name || "Panel", checked)
                                }
                              />
                            </div>
                          </div>

                          {/* Permission groups */}
                          {Object.entries(permissionGroups).map(([group, perms]) => {
                            const GroupIcon = groupIcons[group] || Settings;
                            return (
                              <div key={group}>
                                <div className="flex items-center gap-2 mb-3">
                                  <GroupIcon className="h-4 w-4 text-muted-foreground" />
                                  <h4 className="text-sm font-bold text-foreground uppercase tracking-wide">{group}</h4>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                  {perms.map((perm) => {
                                    const isGranted = emp.permissions?.includes(perm.key as PermissionKey) || false;
                                    return (
                                      <div
                                        key={perm.key}
                                        className={`flex items-center justify-between p-3 rounded-xl border transition-colors ${
                                          isGranted
                                            ? "bg-emerald-500/5 border-emerald-500/20"
                                            : "bg-secondary/20 border-border/40"
                                        }`}
                                      >
                                        <div>
                                          <p className="text-sm font-medium text-foreground">{perm.label}</p>
                                          <p className="text-[11px] text-muted-foreground">{perm.key.replace(/_/g, " ")}</p>
                                        </div>
                                        <Switch
                                          checked={isGranted}
                                          onCheckedChange={() => handleTogglePermission(emp.user_id, perm.key, isGranted)}
                                        />
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            );
                          })}

                          {/* Panel settings */}
                          {emp.panel && (
                            <div className="bg-secondary/20 rounded-xl p-4 border border-border/40">
                              <h4 className="text-sm font-bold text-foreground mb-2 flex items-center gap-2">
                                <Monitor className="h-4 w-4" /> Order Panel Settings
                              </h4>
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <p className="text-xs text-muted-foreground">Panel Name</p>
                                  <p className="text-sm font-medium text-foreground">{emp.panel.panel_name}</p>
                                </div>
                                <div>
                                  <p className="text-xs text-muted-foreground">Max Orders</p>
                                  <p className="text-sm font-medium text-foreground">{emp.panel.max_orders}</p>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </Card>
                  );
                })}
              </div>
            )}
          </>
        )}

        {/* ===== TRACKING TAB ===== */}
        {activeTab === "tracking" && (
          <>
            <Card className="border-border/40">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="p-2 rounded-lg bg-secondary"><Clock className="h-4 w-4 text-muted-foreground" /></div>
                <Select defaultValue="today">
                  <SelectTrigger className="w-32"><SelectValue placeholder="Today" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="today">Today</SelectItem>
                    <SelectItem value="yesterday">Yesterday</SelectItem>
                    <SelectItem value="week">This Week</SelectItem>
                    <SelectItem value="month">This Month</SelectItem>
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { icon: Users, label: "Total Users", value: users.length, bg: "bg-primary/10", color: "text-primary" },
                { icon: Activity, label: "Active Now", value: users.length, bg: "bg-emerald-500/10", color: "text-emerald-600" },
                { icon: Clock, label: "Idle", value: 0, bg: "bg-amber-500/10", color: "text-amber-600" },
                { icon: XCircle, label: "Offline", value: 0, bg: "bg-destructive/10", color: "text-destructive" },
              ].map((s, i) => (
                <Card key={i} className="border-border/40">
                  <CardContent className="p-5 flex items-center gap-4">
                    <div className={`p-2.5 rounded-xl ${s.bg}`}><s.icon className={`h-5 w-5 ${s.color}`} /></div>
                    <div>
                      <p className="text-sm text-muted-foreground">{s.label}</p>
                      <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="flex items-center justify-center gap-1">
              {[
                { id: "live" as TrackingSubTab, label: "Live Status", icon: Activity },
                { id: "performance" as TrackingSubTab, label: "Order Performance", icon: BarChart3 },
              ].map(t => (
                <button key={t.id} onClick={() => setTrackingSubTab(t.id)}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all ${
                    trackingSubTab === t.id ? "bg-card border border-border shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <t.icon className="h-4 w-4" />{t.label}
                </button>
              ))}
            </div>

            {trackingSubTab === "live" && (
              <Card className="border-border/40">
                <CardHeader><CardTitle className="text-lg font-bold">Live User Status</CardTitle></CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>User</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Last Activity</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {users.map((user) => (
                        <TableRow key={user.id}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <Avatar className="h-8 w-8">
                                <AvatarFallback className="bg-secondary text-foreground text-xs font-bold">
                                  {(user.full_name || "U").charAt(0).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <p className="text-sm font-semibold text-foreground">{user.full_name || "Unknown"}</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-600 border-emerald-200/50 gap-1">
                              <span className="h-2 w-2 rounded-full bg-emerald-500" />Active
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}
                          </TableCell>
                          <TableCell>
                            <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground">
                              <Eye className="h-4 w-4" />View
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )}

            {trackingSubTab === "performance" && (
              <Card className="border-border/40">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <ShoppingCart className="h-5 w-5 text-muted-foreground" />
                    <CardTitle className="text-lg font-bold">Order-Based Performance</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>User</TableHead>
                        <TableHead><div className="flex items-center gap-1"><CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />Confirmed</div></TableHead>
                        <TableHead><div className="flex items-center gap-1"><XCircle className="h-3.5 w-3.5 text-destructive" />Cancelled</div></TableHead>
                        <TableHead><div className="flex items-center gap-1"><RotateCcw className="h-3.5 w-3.5 text-amber-500" />Returned</div></TableHead>
                        <TableHead><div className="flex items-center gap-1"><Truck className="h-3.5 w-3.5 text-primary" />Delivered</div></TableHead>
                        <TableHead>Total</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <TableRow>
                        <TableCell colSpan={6} className="text-center text-muted-foreground py-10">
                          No order activity in selected period
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )}
          </>
        )}

        {/* ===== ACTIVITY TAB ===== */}
        {activeTab === "activity" && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { icon: Shield, label: "আজকের Login", value: 1, bg: "bg-violet-500/10", color: "text-violet-600" },
                { icon: XCircle, label: "Failed Login", value: 0, bg: "bg-destructive/10", color: "text-destructive" },
                { icon: AlertCircle, label: "Suspicious", value: 0, bg: "bg-amber-500/10", color: "text-amber-600" },
              ].map((s, i) => (
                <Card key={i} className="border-border/40">
                  <CardContent className="p-5 flex items-center gap-4">
                    <div className={`p-2.5 rounded-xl ${s.bg}`}><s.icon className={`h-5 w-5 ${s.color}`} /></div>
                    <div>
                      <p className="text-2xl font-bold text-foreground">{s.value}</p>
                      <p className="text-sm text-muted-foreground">{s.label}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
              <Card className="border-border/40 flex items-center justify-center">
                <CardContent className="p-5">
                  <Button variant="outline" className="gap-2"><Lock className="h-4 w-4" />Unlock Account</Button>
                </CardContent>
              </Card>
            </div>

            <Card className="border-border/40">
              <CardHeader>
                <div className="flex items-center gap-2 mb-4">
                  <Monitor className="h-5 w-5 text-muted-foreground" />
                  <CardTitle className="text-lg font-bold">Login Activity Log</CardTitle>
                </div>
                <div className="flex items-center gap-3">
                  <Select defaultValue="all">
                    <SelectTrigger className="w-36"><SelectValue placeholder="All Attempts" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Attempts</SelectItem>
                      <SelectItem value="success">Success</SelectItem>
                      <SelectItem value="failed">Failed</SelectItem>
                    </SelectContent>
                  </Select>
                  <div className="flex-1 flex items-center gap-2 bg-secondary rounded-lg px-3 py-2 border border-border/50">
                    <Search className="h-4 w-4 text-muted-foreground" />
                    <input type="text" placeholder="Search by email..." className="bg-transparent text-sm outline-none flex-1 text-foreground placeholder:text-muted-foreground" />
                  </div>
                  <Button variant="outline" className="gap-2"><RefreshCw className="h-4 w-4" />Refresh</Button>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>সময়</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Device</TableHead>
                      <TableHead>IP</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short" })} {new Date().toLocaleTimeString("en-GB")}
                      </TableCell>
                      <TableCell className="text-sm">user@example.com</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                          <Monitor className="h-4 w-4" />Chrome/Windows
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">—</TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-600 border-emerald-200/50 gap-1">
                          <span className="h-2 w-2 rounded-full bg-emerald-500" />Success
                        </Badge>
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* ===== CREATE ADMIN DIALOG ===== */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-primary/10"><UserPlus className="h-5 w-5 text-primary" /></div>
              Create New Admin / User
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-xs font-semibold text-muted-foreground uppercase">Full Name *</Label>
              <Input className="mt-1" placeholder="e.g. Sakib Ahmed" value={newName} onChange={(e) => setNewName(e.target.value)} />
            </div>
            <div>
              <Label className="text-xs font-semibold text-muted-foreground uppercase">Email *</Label>
              <Input className="mt-1" type="email" placeholder="e.g. admin@example.com" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} />
            </div>
            <div>
              <Label className="text-xs font-semibold text-muted-foreground uppercase">Password *</Label>
              <Input className="mt-1" type="password" placeholder="Minimum 6 characters" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
            </div>
            <div>
              <Label className="text-xs font-semibold text-muted-foreground uppercase">Role</Label>
              <Select value={newRole} onValueChange={(v) => setNewRole(v as any)}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin (Full Access)</SelectItem>
                  <SelectItem value="moderator">Moderator (Limited Access)</SelectItem>
                  <SelectItem value="user">User (Basic Access)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button className="w-full h-11 gap-2" onClick={handleCreateAdmin} disabled={creating}>
              {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
              Create Account
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default AdminUsers;
