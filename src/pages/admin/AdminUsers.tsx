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
import { useToast } from "@/hooks/use-toast";
import {
  Shield, Trash2, Users, UserPlus, Lock, Eye, Edit,
  Activity, Clock, AlertCircle, XCircle, Monitor, RefreshCw,
  Search, ChevronDown
} from "lucide-react";

interface UserProfile {
  id: string;
  user_id: string;
  full_name: string | null;
  created_at: string;
  roles: string[];
}

type TabType = "users" | "tracking" | "activity";

const AdminUsers = () => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>("users");
  const { toast } = useToast();

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
      toast({ title: "ত্রুটি", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "সফল!", description: `রোল "${role}" অ্যাসাইন হয়েছে` });
      fetchUsers();
    }
  };

  const removeRole = async (userId: string, role: "admin" | "moderator" | "user") => {
    const { error } = await supabase
      .from("user_roles")
      .delete()
      .eq("user_id", userId)
      .eq("role", role as any);

    if (error) {
      toast({ title: "ত্রুটি", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "সফল!", description: `রোল "${role}" রিমুভ হয়েছে` });
      fetchUsers();
    }
  };

  const adminCount = users.filter(u => u.roles.includes("admin")).length;
  const modCount = users.filter(u => u.roles.includes("moderator")).length;

  const tabs = [
    { id: "users" as TabType, label: "Users", icon: Users },
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
            <p className="text-muted-foreground text-sm mt-0.5">Manage businesses, team members, and roles</p>
          </div>
          <Button variant="outline" className="gap-2">
            <Lock className="h-4 w-4" />
            Change Password
          </Button>
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

        {/* Users Tab */}
        {activeTab === "users" && (
          <>
            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="border-border/40">
                <CardContent className="p-5 flex items-center gap-4">
                  <div className="p-2.5 rounded-xl bg-blue-50">
                    <Users className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total Users</p>
                    <p className="text-2xl font-bold text-foreground">{users.length}</p>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-border/40">
                <CardContent className="p-5 flex items-center gap-4">
                  <div className="p-2.5 rounded-xl bg-red-50">
                    <Shield className="h-5 w-5 text-red-500" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Admins</p>
                    <p className="text-2xl font-bold text-foreground">{adminCount}</p>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-border/40">
                <CardContent className="p-5 flex items-center gap-4">
                  <div className="p-2.5 rounded-xl bg-amber-50">
                    <Users className="h-5 w-5 text-amber-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Moderators</p>
                    <p className="text-2xl font-bold text-foreground">{modCount}</p>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-border/40">
                <CardContent className="p-5 flex items-center gap-4">
                  <div className="p-2.5 rounded-xl bg-emerald-50">
                    <Clock className="h-5 w-5 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Active</p>
                    <p className="text-2xl font-bold text-foreground">{users.length}/{users.length}</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Team Members Table */}
            <Card className="border-border/40">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg font-bold">Team Members — Quick-shopbd</CardTitle>
                <Button className="gap-2 bg-primary text-primary-foreground">
                  <UserPlus className="h-4 w-4" />
                  Add User
                </Button>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>UID</TableHead>
                        <TableHead>User</TableHead>
                        <TableHead>Username</TableHead>
                        <TableHead>Phone</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {users.map((user) => (
                        <TableRow key={user.id}>
                          <TableCell className="text-sm text-muted-foreground font-mono">
                            {user.user_id.substring(0, 4).toUpperCase()}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <Avatar className="h-8 w-8">
                                <AvatarFallback className="bg-secondary text-foreground text-xs font-bold">
                                  {(user.full_name || "U").charAt(0).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="text-sm font-semibold text-foreground">{user.full_name || "Unknown"}</p>
                                <p className="text-[11px] text-muted-foreground truncate max-w-[180px]">{user.user_id.substring(0, 20)}...</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="text-sm text-primary">
                            @{(user.full_name || "user").toLowerCase().replace(/\s/g, "")}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">—</TableCell>
                          <TableCell>
                            {user.roles.length > 0 ? (
                              <div className="flex gap-1 flex-wrap">
                                {user.roles.map((role) => (
                                  <Badge
                                    key={role}
                                    variant={role === "admin" ? "default" : "secondary"}
                                    className="text-xs"
                                  >
                                    {role}
                                  </Badge>
                                ))}
                              </div>
                            ) : (
                              <span className="text-muted-foreground text-sm">—</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <Switch defaultChecked />
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <button className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors">
                                <Eye className="h-4 w-4" />
                              </button>
                              <button className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors">
                                <Lock className="h-4 w-4" />
                              </button>
                              <button className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors">
                                <Edit className="h-4 w-4" />
                              </button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                      {users.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
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

        {/* User Tracking Tab */}
        {activeTab === "tracking" && (
          <>
            {/* Date Filter */}
            <Card className="border-border/40">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="p-2 rounded-lg bg-secondary">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </div>
                <Select defaultValue="today">
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="Today" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="today">Today</SelectItem>
                    <SelectItem value="yesterday">Yesterday</SelectItem>
                    <SelectItem value="week">This Week</SelectItem>
                    <SelectItem value="month">This Month</SelectItem>
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>

            {/* Tracking Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="border-border/40">
                <CardContent className="p-5 flex items-center gap-4">
                  <div className="p-2.5 rounded-xl bg-blue-50">
                    <Users className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total Users</p>
                    <p className="text-2xl font-bold text-foreground">{users.length}</p>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-border/40">
                <CardContent className="p-5 flex items-center gap-4">
                  <div className="p-2.5 rounded-xl bg-emerald-50">
                    <Activity className="h-5 w-5 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Active Now</p>
                    <p className="text-2xl font-bold text-emerald-600">{users.length}</p>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-border/40">
                <CardContent className="p-5 flex items-center gap-4">
                  <div className="p-2.5 rounded-xl bg-amber-50">
                    <Clock className="h-5 w-5 text-amber-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Idle</p>
                    <p className="text-2xl font-bold text-amber-600">0</p>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-border/40">
                <CardContent className="p-5 flex items-center gap-4">
                  <div className="p-2.5 rounded-xl bg-red-50">
                    <XCircle className="h-5 w-5 text-red-500" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Inactive / Offline</p>
                    <p className="text-2xl font-bold text-red-500">0</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Sub tabs */}
            <div className="flex items-center justify-center gap-1">
              <button className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium bg-card border border-border shadow-sm text-foreground">
                <Activity className="h-4 w-4" />
                Live Status
              </button>
              <button className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground">
                <Activity className="h-4 w-4" />
                Order Performance
              </button>
            </div>

            {/* Live Status Table */}
            <Card className="border-border/40">
              <CardHeader>
                <CardTitle className="text-lg font-bold">Live User Status</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>UID</TableHead>
                      <TableHead>User</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Last Activity</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-mono text-sm text-muted-foreground">
                          {user.user_id.substring(0, 4).toUpperCase()}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8">
                              <AvatarFallback className="bg-secondary text-foreground text-xs font-bold">
                                {(user.full_name || "U").charAt(0).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="text-sm font-semibold text-foreground">{user.full_name || "Unknown"}</p>
                              <p className="text-[11px] text-muted-foreground">@{(user.full_name || "user").toLowerCase().replace(/\s/g, "")}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="bg-emerald-50 text-emerald-600 border-emerald-200">
                            <span className="h-2 w-2 rounded-full bg-emerald-500 mr-1.5" />
                            Active
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                        </TableCell>
                        <TableCell>
                          <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground">
                            <Eye className="h-4 w-4" />
                            View Details
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </>
        )}

        {/* Login Activity Tab */}
        {activeTab === "activity" && (
          <>
            {/* Activity Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="border-border/40">
                <CardContent className="p-5 flex items-center gap-4">
                  <div className="p-2.5 rounded-xl bg-violet-50">
                    <Shield className="h-5 w-5 text-violet-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">1</p>
                    <p className="text-sm text-muted-foreground">আজকের Login</p>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-border/40">
                <CardContent className="p-5 flex items-center gap-4">
                  <div className="p-2.5 rounded-xl bg-red-50">
                    <XCircle className="h-5 w-5 text-red-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">0</p>
                    <p className="text-sm text-muted-foreground">Failed Login</p>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-border/40">
                <CardContent className="p-5 flex items-center gap-4">
                  <div className="p-2.5 rounded-xl bg-amber-50">
                    <AlertCircle className="h-5 w-5 text-amber-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">0</p>
                    <p className="text-sm text-muted-foreground">Suspicious</p>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-border/40 flex items-center justify-center">
                <CardContent className="p-5">
                  <Button variant="outline" className="gap-2">
                    <Lock className="h-4 w-4" />
                    Unlock Account
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Login Activity Log */}
            <Card className="border-border/40">
              <CardHeader>
                <div className="flex items-center gap-2 mb-4">
                  <Monitor className="h-5 w-5 text-muted-foreground" />
                  <CardTitle className="text-lg font-bold">Login Activity Log</CardTitle>
                </div>
                <div className="flex items-center gap-3">
                  <Select defaultValue="all">
                    <SelectTrigger className="w-36">
                      <SelectValue placeholder="All Attempts" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Attempts</SelectItem>
                      <SelectItem value="success">Success</SelectItem>
                      <SelectItem value="failed">Failed</SelectItem>
                    </SelectContent>
                  </Select>
                  <div className="flex-1 flex items-center gap-2 bg-secondary rounded-lg px-3 py-2 border border-border/50">
                    <Search className="h-4 w-4 text-muted-foreground" />
                    <input
                      type="text"
                      placeholder="Search by email..."
                      className="bg-transparent text-sm outline-none flex-1 text-foreground placeholder:text-muted-foreground"
                    />
                  </div>
                  <Button variant="outline" className="gap-2">
                    <RefreshCw className="h-4 w-4" />
                    Refresh
                  </Button>
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
                      <TableHead>Alert</TableHead>
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
                          <Monitor className="h-4 w-4" />
                          Chrome/Windows
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">—</TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="bg-emerald-50 text-emerald-600 border-emerald-200 gap-1">
                          <span className="h-2 w-2 rounded-full bg-emerald-500" />
                          Success
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">—</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminUsers;
