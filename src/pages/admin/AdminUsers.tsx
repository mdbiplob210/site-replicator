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
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import {
  Shield, Trash2, Users, UserPlus, Lock, Eye, Edit,
  Activity, Clock, AlertCircle, XCircle, Monitor, RefreshCw,
  Search, ChevronDown, ShoppingCart, CheckCircle2, RotateCcw, Truck, BarChart3,
  Settings, Package, DollarSign, FileText, ChevronRight, Loader2, X, Check,
  Ban, Calendar, Smartphone, Laptop, Globe, MapPin
} from "lucide-react";
import {
  useEmployees, useTogglePermission, useTogglePanel,
  ALL_PERMISSIONS, type PermissionKey
} from "@/hooks/useEmployeePermissions";
import {
  useUserPresenceList, useLoginActivity, useUserPerformance
} from "@/hooks/useUserTracking";
import { formatDistanceToNow } from "date-fns";
import { bn } from "date-fns/locale";

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
  "অর্ডার": ShoppingCart,
  "প্রোডাক্ট": Package,
  "ফিন্যান্স": DollarSign,
  "ড্যাশবোর্ড ও রিপোর্ট": BarChart3,
  "ওয়েবসাইট": Globe,
  "মার্কেটিং": ShoppingCart,
  "কুরিয়ার": Truck,
  "সিস্টেম": Settings,
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
  const [newRole, setNewRole] = useState<string>("manager");
  const [creating, setCreating] = useState(false);

  // Rules tab
  const { data: employees = [], isLoading: employeesLoading } = useEmployees();
  const togglePermission = useTogglePermission();
  const togglePanel = useTogglePanel();
  const [expandedUser, setExpandedUser] = useState<string | null>(null);

  // Tracking
  const { data: presenceList = [] } = useUserPresenceList();
  const [perfDateRange, setPerfDateRange] = useState("today");
  const { data: perfData = [], isLoading: perfLoading } = useUserPerformance(perfDateRange);

  // Activity
  const [activityDateRange, setActivityDateRange] = useState("today");
  const [activityStatus, setActivityStatus] = useState("all");
  const [activitySearch, setActivitySearch] = useState("");
  const { data: loginLogs = [], isLoading: activityLoading, refetch: refetchActivity } = useLoginActivity({
    dateRange: activityDateRange,
    status: activityStatus,
    search: activitySearch,
  });

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

  const assignRole = async (userId: string, role: string) => {
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
    conststring } = await supabase.auth.getUser();
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
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: newEmail,
        password: newPassword,
        options: { data: { full_name: newName } },
      });
      if (signUpError) throw signUpError;

      if (signUpData.user) {
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

  const handleGrantAll = (userId: string) => {
    ALL_PERMISSIONS.forEach(perm => {
      togglePermission.mutate({ userId, permission: perm.key, grant: true });
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

  const adminCount = users.filter(u => u.roles.includes("admin")).length;
  const modCount = users.filter(u => u.roles.includes("moderator") || u.roles.includes("manager")).length;
  const onlineCount = presenceList.filter((p: any) => {
    const lastSeen = new Date(p.last_seen_at);
    return (Date.now() - lastSeen.getTime()) < 60000 && p.is_online;
  }).length;

  const tabs = [
    { id: "users" as TabType, label: "Users", icon: Users },
    { id: "rules" as TabType, label: "Rules & Permissions", icon: Shield },
    { id: "tracking" as TabType, label: "User Tracking", icon: Activity },
    { id: "activity" as TabType, label: "Login Activity", icon: Clock },
  ];

  const dateFilterOptions = [
    { value: "today", label: "আজকে" },
    { value: "yesterday", label: "গতকাল" },
    { value: "last7", label: "গত ৭ দিন" },
    { value: "last30", label: "গত ৩০ দিন" },
    { value: "thisMonth", label: "এই মাস" },
    { value: "lastMonth", label: "গত মাস" },
    { value: "thisYear", label: "এই বছর" },
    { value: "all", label: "সর্বকালীন" },
  ];

  // Helper: get user name from profiles or presence
  const getUserName = (userId: string) => {
    const user = users.find(u => u.user_id === userId);
    return user?.full_name || `User (${userId.slice(0, 8)})`;
  };

  const getPresenceStatus = (userId: string) => {
    const presence = presenceList.find((p: any) => p.user_id === userId);
    if (!presence) return { status: "offline", label: "Offline", page: null, device: null, lastSeen: null };
    const lastSeen = new Date((presence as any).last_seen_at);
    const diffMs = Date.now() - lastSeen.getTime();
    if (diffMs < 60000 && (presence as any).is_online) {
      return { status: "online", label: "Online", page: (presence as any).current_page, device: (presence as any).device_info, lastSeen };
    }
    if (diffMs < 300000) {
      return { status: "idle", label: "Idle", page: (presence as any).current_page, device: (presence as any).device_info, lastSeen };
    }
    return { status: "offline", label: "Offline", page: null, device: (presence as any).device_info, lastSeen };
  };

  // Login activity stats
  const successLogins = loginLogs.filter((l: any) => l.status === "success").length;
  const failedLogins = loginLogs.filter((l: any) => l.status === "failed").length;
  const uniqueIPs = new Set(loginLogs.map((l: any) => l.ip_address).filter(Boolean)).size;

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
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center justify-center gap-1 flex-wrap">
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
              {tab.id === "tracking" && onlineCount > 0 && (
                <span className="h-5 w-5 rounded-full bg-emerald-500 text-white text-[10px] flex items-center justify-center font-bold">{onlineCount}</span>
              )}
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
                    <p className="text-sm text-muted-foreground">ম্যানেজার</p>
                    <p className="text-2xl font-bold text-foreground">{modCount}</p>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-border/40">
                <CardContent className="p-5 flex items-center gap-4">
                  <div className="p-2.5 rounded-xl bg-emerald-500/10"><Activity className="h-5 w-5 text-emerald-600" /></div>
                  <div>
                    <p className="text-sm text-muted-foreground">Online Now</p>
                    <p className="text-2xl font-bold text-emerald-600">{onlineCount}</p>
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
                      {users.map((user) => {
                        const presence = getPresenceStatus(user.user_id);
                        return (
                          <TableRow key={user.id}>
                            <TableCell>
                              <div className="flex items-center gap-3">
                                <div className="relative">
                                  <Avatar className="h-9 w-9">
                                    <AvatarFallback className="bg-secondary text-foreground text-xs font-bold">
                                      {(user.full_name || "U").charAt(0).toUpperCase()}
                                    </AvatarFallback>
                                  </Avatar>
                                  <span className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full ring-2 ring-card ${
                                    presence.status === "online" ? "bg-emerald-500" :
                                    presence.status === "idle" ? "bg-amber-500" : "bg-muted-foreground/30"
                                  }`} />
                                </div>
                                <div>
                                  <p className="text-sm font-semibold text-foreground">{user.full_name || "Unknown"}</p>
                                  <p className="text-[11px] text-muted-foreground font-mono">{user.user_id.substring(0, 8)}...</p>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                            {user.roles.length > 0 ? (
                                <div className="flex gap-1 flex-wrap">
                                  {user.roles.map((role) => {
                                    const displayName = role === "moderator" ? "ম্যানেজার" : role === "manager" ? "ম্যানেজার" : role === "accounting" ? "অ্যাকাউন্টিং" : role === "ad_analytics" ? "অ্যাড অ্যানালিটিক্স" : role === "admin" ? "অ্যাডমিন" : "ইউজার";
                                    return (
                                      <Badge
                                        key={role}
                                        variant={role === "admin" ? "default" : "secondary"}
                                        className="text-xs cursor-pointer"
                                        onClick={() => removeRole(user.user_id, role)}
                                      >
                                        {displayName} ✕
                                      </Badge>
                                    );
                                  })}
                                </div>
                              ) : (
                                <span className="text-muted-foreground text-sm">No role</span>
                              )}
                            </TableCell>
                            <TableCell>
                              <Select onValueChange={(val) => assignRole(user.user_id, val)}>
                                <SelectTrigger className="w-36 h-8">
                                  <SelectValue placeholder="রোল দিন..." />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="admin">অ্যাডমিন</SelectItem>
                                  <SelectItem value="manager">ম্যানেজার</SelectItem>
                                  <SelectItem value="user">ইউজার</SelectItem>
                                  <SelectItem value="accounting">অ্যাকাউন্টিং</SelectItem>
                                  <SelectItem value="ad_analytics">অ্যাড অ্যানালিটিক্স</SelectItem>
                                </SelectContent>
                              </Select>
                            </TableCell>
                            <TableCell>
                              <Badge variant="secondary" className={`gap-1 ${
                                presence.status === "online" ? "bg-emerald-500/10 text-emerald-600 border-emerald-200/50" :
                                presence.status === "idle" ? "bg-amber-500/10 text-amber-600 border-amber-200/50" :
                                "bg-muted text-muted-foreground"
                              }`}>
                                <span className={`h-2 w-2 rounded-full ${
                                  presence.status === "online" ? "bg-emerald-500" :
                                  presence.status === "idle" ? "bg-amber-500" : "bg-muted-foreground/50"
                                }`} />
                                {presence.label}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1">
                                <button
                                  onClick={() => { setActiveTab("tracking"); setTrackingSubTab("live"); }}
                                  className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
                                  title="Track"
                                >
                                  <Eye className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={() => { setActiveTab("rules"); setExpandedUser(user.user_id); }}
                                  className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
                                  title="Edit Rules"
                                >
                                  <Shield className="h-4 w-4" />
                                </button>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
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
                <p className="text-muted-foreground">কোন ইউজার পাওয়া যায়নি।</p>
              </Card>
            ) : (
              <div className="space-y-3">
                {employees.map((emp) => {
                  const isExpanded = expandedUser === emp.user_id;
                  const grantedCount = emp.permissions?.length || 0;
                  const isAdmin = (emp as any).role === "admin";
                  return (
                    <Card key={emp.user_id} className="border-border/40 overflow-hidden">
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
                            <div className="flex items-center gap-2 mt-0.5">
                              <Badge variant={isAdmin ? "default" : "secondary"} className="text-[10px]">
                                {(emp as any).role}
                              </Badge>
                              <span className="text-xs text-muted-foreground">{grantedCount}/{ALL_PERMISSIONS.length} permissions</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <Badge variant={emp.panel?.is_active ? "default" : "secondary"} className="text-xs">
                            Panel: {emp.panel?.is_active ? "ON" : "OFF"}
                          </Badge>
                          {isExpanded ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
                        </div>
                      </button>

                      {isExpanded && (
                        <div className="border-t border-border p-5 space-y-5">
                          {isAdmin && (
                            <div className="flex items-center gap-3 p-4 rounded-xl bg-primary/5 border border-primary/20">
                              <Shield className="h-5 w-5 text-primary" />
                              <div>
                                <p className="text-sm font-bold text-foreground">অ্যাডমিন ইউজার</p>
                                <p className="text-xs text-muted-foreground">অ্যাডমিনের সব পারমিশন স্বয়ংক্রিয়ভাবে থাকে। নিচে দেখুন কোন কোন পারমিশন আছে।</p>
                              </div>
                            </div>
                          )}

                          {!isAdmin && (
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
                          )}

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
                                    const isGranted = isAdmin || (emp.permissions?.includes(perm.key as PermissionKey) || false);
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
                                          <p className="text-[11px] text-muted-foreground">{perm.description}</p>
                                        </div>
                                        {isAdmin ? (
                                          <Badge variant="secondary" className="text-[10px] bg-emerald-100 text-emerald-700">
                                            <Check className="h-3 w-3 mr-1" /> Auto
                                          </Badge>
                                        ) : (
                                          <Switch
                                            checked={isGranted}
                                            onCheckedChange={() => handleTogglePermission(emp.user_id, perm.key, isGranted)}
                                          />
                                        )}
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            );
                          })}
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
            {/* Online Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { icon: Users, label: "মোট ইউজার", value: users.length, bg: "bg-primary/10", color: "text-primary" },
                { icon: Activity, label: "এখন অনলাইন", value: onlineCount, bg: "bg-emerald-500/10", color: "text-emerald-600" },
                { icon: Clock, label: "Idle", value: presenceList.filter((p: any) => {
                  const d = Date.now() - new Date(p.last_seen_at).getTime();
                  return d >= 60000 && d < 300000;
                }).length, bg: "bg-amber-500/10", color: "text-amber-600" },
                { icon: XCircle, label: "অফলাইন", value: users.length - onlineCount, bg: "bg-destructive/10", color: "text-destructive" },
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

            {/* Sub tabs */}
            <div className="flex items-center justify-center gap-1">
              {[
                { id: "live" as TrackingSubTab, label: "লাইভ স্ট্যাটাস", icon: Activity },
                { id: "performance" as TrackingSubTab, label: "অর্ডার পারফরম্যান্স", icon: BarChart3 },
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

            {/* LIVE STATUS */}
            {trackingSubTab === "live" && (
              <Card className="border-border/40">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg font-bold flex items-center gap-2">
                      <Activity className="h-5 w-5 text-emerald-500" />
                      লাইভ ইউজার স্ট্যাটাস
                    </CardTitle>
                    <Badge variant="outline" className="gap-1.5 text-emerald-600">
                      <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                      রিয়েল-টাইম
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {users.map((user) => {
                      const presence = getPresenceStatus(user.user_id);
                      const statusColor = presence.status === "online" ? "emerald" :
                        presence.status === "idle" ? "amber" : "gray";

                      return (
                        <div key={user.id} className={`flex items-center gap-4 p-4 rounded-xl border transition-all ${
                          presence.status === "online" ? "border-emerald-500/20 bg-emerald-500/5" :
                          presence.status === "idle" ? "border-amber-500/20 bg-amber-500/5" :
                          "border-border/40 bg-secondary/10"
                        }`}>
                          {/* Avatar */}
                          <div className="relative">
                            <Avatar className="h-11 w-11">
                              <AvatarFallback className="bg-primary/10 text-primary font-bold text-lg">
                                {(user.full_name || "U").charAt(0).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <span className={`absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full ring-2 ring-card ${
                              presence.status === "online" ? "bg-emerald-500 animate-pulse" :
                              presence.status === "idle" ? "bg-amber-500" : "bg-muted-foreground/30"
                            }`} />
                          </div>

                          {/* Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="font-bold text-foreground">{user.full_name || "Unknown"}</p>
                              <Badge variant="secondary" className={`text-[10px] ${
                                presence.status === "online" ? "bg-emerald-100 text-emerald-700" :
                                presence.status === "idle" ? "bg-amber-100 text-amber-700" :
                                ""
                              }`}>
                                {presence.label}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                              {presence.page && (
                                <span className="flex items-center gap-1">
                                  <Globe className="h-3 w-3" />
                                  {presence.page}
                                </span>
                              )}
                              {presence.device && (
                                <span className="flex items-center gap-1">
                                  <Monitor className="h-3 w-3" />
                                  {presence.device}
                                </span>
                              )}
                              {presence.lastSeen && (
                                <span className="flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  {formatDistanceToNow(presence.lastSeen, { addSuffix: true })}
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Current page visual */}
                          {presence.status === "online" && presence.page && (
                            <div className="hidden lg:flex items-center gap-2 bg-background/80 rounded-lg px-3 py-2 border border-border/50">
                              <Monitor className="h-4 w-4 text-emerald-500" />
                              <div>
                                <p className="text-[10px] text-muted-foreground font-medium">বর্তমান পেজ</p>
                                <p className="text-xs font-bold text-foreground">{presence.page.replace("/admin/", "").replace("/admin", "Dashboard") || "Dashboard"}</p>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  <div className="mt-4 p-3 rounded-lg bg-secondary/30 border border-border/30">
                    <p className="text-[11px] text-muted-foreground">
                      💡 <strong>লাইভ ট্র্যাকিং:</strong> প্রতি ৩০ সেকেন্ডে অটো-আপডেট হয়। এখানে দেখতে পাচ্ছেন প্রতিটি ইউজার কোন পেজে আছে, কোন ডিভাইস ব্যবহার করছে এবং কখন শেষবার এক্টিভ ছিলো।
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* PERFORMANCE */}
            {trackingSubTab === "performance" && (
              <Card className="border-border/40">
                <CardHeader>
                  <div className="flex items-center justify-between flex-wrap gap-3">
                    <CardTitle className="text-lg font-bold flex items-center gap-2">
                      <BarChart3 className="h-5 w-5 text-primary" />
                      অর্ডার পারফরম্যান্স
                    </CardTitle>
                    <Select value={perfDateRange} onValueChange={setPerfDateRange}>
                      <SelectTrigger className="w-40">
                        <Calendar className="h-4 w-4 mr-2" />
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {dateFilterOptions.map(opt => (
                          <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </CardHeader>
                <CardContent>
                  {perfLoading ? (
                    <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
                  ) : perfData.length === 0 ? (
                    <div className="text-center py-10">
                      <BarChart3 className="h-10 w-10 text-muted-foreground/20 mx-auto mb-3" />
                      <p className="text-sm text-muted-foreground">এই সময়ে কোনো অর্ডার অ্যাক্টিভিটি নেই</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {/* Summary row */}
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                        {[
                          { label: "কনফার্মড", value: perfData.reduce((s, p) => s + p.confirmed, 0), icon: CheckCircle2, color: "text-emerald-600", bg: "bg-emerald-50" },
                          { label: "ক্যান্সেলড", value: perfData.reduce((s, p) => s + p.cancelled, 0), icon: XCircle, color: "text-destructive", bg: "bg-destructive/10" },
                          { label: "রিটার্নড", value: perfData.reduce((s, p) => s + p.returned, 0), icon: RotateCcw, color: "text-amber-600", bg: "bg-amber-50" },
                          { label: "ডেলিভারড", value: perfData.reduce((s, p) => s + p.delivered, 0), icon: Truck, color: "text-blue-600", bg: "bg-blue-50" },
                          { label: "মোট", value: perfData.reduce((s, p) => s + p.total, 0), icon: ShoppingCart, color: "text-foreground", bg: "bg-secondary" },
                        ].map((s, i) => (
                          <div key={i} className={`${s.bg} rounded-lg p-3 text-center`}>
                            <s.icon className={`h-4 w-4 ${s.color} mx-auto mb-1`} />
                            <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
                            <p className="text-[10px] text-muted-foreground font-medium">{s.label}</p>
                          </div>
                        ))}
                      </div>

                      {/* Per-user table */}
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>ইউজার</TableHead>
                            <TableHead className="text-center"><div className="flex items-center justify-center gap-1"><CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />কনফার্মড</div></TableHead>
                            <TableHead className="text-center"><div className="flex items-center justify-center gap-1"><XCircle className="h-3.5 w-3.5 text-destructive" />ক্যান্সেলড</div></TableHead>
                            <TableHead className="text-center"><div className="flex items-center justify-center gap-1"><RotateCcw className="h-3.5 w-3.5 text-amber-500" />রিটার্নড</div></TableHead>
                            <TableHead className="text-center"><div className="flex items-center justify-center gap-1"><Truck className="h-3.5 w-3.5 text-blue-500" />ডেলিভারড</div></TableHead>
                            <TableHead className="text-center"><div className="flex items-center justify-center gap-1"><ShoppingCart className="h-3.5 w-3.5 text-primary" />ইন কুরিয়ার</div></TableHead>
                            <TableHead className="text-center">মোট</TableHead>
                            <TableHead className="text-center">সাকসেস রেট</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {perfData.map((p) => {
                            const successRate = p.total > 0 ? Math.round(((p.delivered + p.confirmed) / p.total) * 100) : 0;
                            return (
                              <TableRow key={p.user_id}>
                                <TableCell>
                                  <div className="flex items-center gap-2">
                                    <Avatar className="h-8 w-8">
                                      <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">
                                        {(p.user_name || "U").charAt(0).toUpperCase()}
                                      </AvatarFallback>
                                    </Avatar>
                                    <p className="text-sm font-semibold text-foreground">{p.user_name}</p>
                                  </div>
                                </TableCell>
                                <TableCell className="text-center font-bold text-emerald-600">{p.confirmed}</TableCell>
                                <TableCell className="text-center font-bold text-destructive">{p.cancelled}</TableCell>
                                <TableCell className="text-center font-bold text-amber-600">{p.returned}</TableCell>
                                <TableCell className="text-center font-bold text-blue-600">{p.delivered}</TableCell>
                                <TableCell className="text-center font-bold text-primary">{p.in_courier}</TableCell>
                                <TableCell className="text-center font-bold text-foreground">{p.total}</TableCell>
                                <TableCell>
                                  <div className="flex items-center gap-2">
                                    <Progress value={successRate} className="h-2 flex-1" />
                                    <span className="text-xs font-bold text-foreground w-10 text-right">{successRate}%</span>
                                  </div>
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </>
        )}

        {/* ===== LOGIN ACTIVITY TAB ===== */}
        {activeTab === "activity" && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="border-border/40">
                <CardContent className="p-5 flex items-center gap-4">
                  <div className="p-2.5 rounded-xl bg-emerald-500/10"><CheckCircle2 className="h-5 w-5 text-emerald-600" /></div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">{successLogins}</p>
                    <p className="text-sm text-muted-foreground">সফল লগইন</p>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-border/40">
                <CardContent className="p-5 flex items-center gap-4">
                  <div className="p-2.5 rounded-xl bg-destructive/10"><XCircle className="h-5 w-5 text-destructive" /></div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">{failedLogins}</p>
                    <p className="text-sm text-muted-foreground">ব্যর্থ লগইন</p>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-border/40">
                <CardContent className="p-5 flex items-center gap-4">
                  <div className="p-2.5 rounded-xl bg-blue-500/10"><MapPin className="h-5 w-5 text-blue-600" /></div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">{uniqueIPs}</p>
                    <p className="text-sm text-muted-foreground">ইউনিক IP</p>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-border/40">
                <CardContent className="p-5 flex items-center gap-4">
                  <div className="p-2.5 rounded-xl bg-amber-500/10"><AlertCircle className="h-5 w-5 text-amber-600" /></div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">{loginLogs.length}</p>
                    <p className="text-sm text-muted-foreground">মোট অ্যাটেম্পট</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card className="border-border/40">
              <CardHeader>
                <div className="flex items-center gap-2 mb-4">
                  <Monitor className="h-5 w-5 text-muted-foreground" />
                  <CardTitle className="text-lg font-bold">Login Activity Log</CardTitle>
                </div>
                <div className="flex items-center gap-3 flex-wrap">
                  <Select value={activityDateRange} onValueChange={setActivityDateRange}>
                    <SelectTrigger className="w-36">
                      <Calendar className="h-4 w-4 mr-2" />
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {dateFilterOptions.map(opt => (
                        <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={activityStatus} onValueChange={setActivityStatus}>
                    <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">সব অ্যাটেম্পট</SelectItem>
                      <SelectItem value="success">সফল</SelectItem>
                      <SelectItem value="failed">ব্যর্থ</SelectItem>
                    </SelectContent>
                  </Select>
                  <div className="flex-1 flex items-center gap-2 bg-secondary rounded-lg px-3 py-2 border border-border/50 min-w-[200px]">
                    <Search className="h-4 w-4 text-muted-foreground" />
                    <input
                      type="text"
                      placeholder="Email দিয়ে সার্চ..."
                      value={activitySearch}
                      onChange={(e) => setActivitySearch(e.target.value)}
                      className="bg-transparent text-sm outline-none flex-1 text-foreground placeholder:text-muted-foreground"
                    />
                  </div>
                  <Button variant="outline" className="gap-2" onClick={() => refetchActivity()}>
                    <RefreshCw className="h-4 w-4" />Refresh
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {activityLoading ? (
                  <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
                ) : loginLogs.length === 0 ? (
                  <div className="text-center py-10">
                    <Clock className="h-10 w-10 text-muted-foreground/20 mx-auto mb-3" />
                    <p className="text-sm text-muted-foreground">এই সময়ে কোনো লগইন অ্যাক্টিভিটি নেই</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>সময়</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>ডিভাইস</TableHead>
                        <TableHead>ব্রাউজার / OS</TableHead>
                        <TableHead>IP</TableHead>
                        <TableHead>স্ট্যাটাস</TableHead>
                        <TableHead>অ্যাকশন</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {loginLogs.map((log: any) => (
                        <TableRow key={log.id}>
                          <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                            {new Date(log.created_at).toLocaleDateString("en-GB", { day: "2-digit", month: "short" })}{" "}
                            {new Date(log.created_at).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}
                          </TableCell>
                          <TableCell className="text-sm font-medium text-foreground">{log.email || "—"}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                              {log.device_type === "mobile" ? <Smartphone className="h-4 w-4" /> :
                               log.device_type === "tablet" ? <Smartphone className="h-4 w-4" /> :
                               <Laptop className="h-4 w-4" />}
                              {log.device_type || "unknown"}
                            </div>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {log.browser || "—"} / {log.os || "—"}
                          </TableCell>
                          <TableCell className="text-sm font-mono text-muted-foreground">
                            {log.ip_address || "—"}
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary" className={`gap-1 ${
                              log.status === "success"
                                ? "bg-emerald-500/10 text-emerald-600 border-emerald-200/50"
                                : "bg-destructive/10 text-destructive border-destructive/20"
                            }`}>
                              <span className={`h-2 w-2 rounded-full ${
                                log.status === "success" ? "bg-emerald-500" : "bg-destructive"
                              }`} />
                              {log.status === "success" ? "সফল" : "ব্যর্থ"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="gap-1 text-xs text-destructive hover:text-destructive"
                              onClick={async () => {
                                // Block IP
                                if (log.ip_address) {
                                  const { error } = await supabase
                                    .from("blocked_ips")
                                    .insert({ ip_address: log.ip_address, reason: "Blocked from login activity" });
                                  if (error) toast.error(error.message);
                                  else toast.success(`IP ${log.ip_address} ব্লক করা হয়েছে`);
                                }
                              }}
                            >
                              <Ban className="h-3.5 w-3.5" />
                              Block IP
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
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
