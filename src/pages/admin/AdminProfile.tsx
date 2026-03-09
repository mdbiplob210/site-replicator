import { useState, useEffect } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { User, Mail, Lock, Loader2, Save } from "lucide-react";

const AdminProfile = () => {
  const { user } = useAuth();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [nameLoading, setNameLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    setEmail(user.email || "");
    supabase.from("profiles").select("full_name").eq("user_id", user.id).single().then(({ data }) => {
      setFullName(data?.full_name || "");
      setNameLoading(false);
    });
  }, [user]);

  const handleUpdateProfile = async () => {
    if (!user) return;
    if (newPassword && newPassword !== confirmPassword) {
      toast.error("পাসওয়ার্ড মিলছে না!");
      return;
    }
    if (newPassword && newPassword.length < 6) {
      toast.error("পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে");
      return;
    }
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-update-user`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({
          action: "update_auth",
          target_user_id: user.id,
          email: email !== user.email ? email : undefined,
          password: newPassword || undefined,
          full_name: fullName || undefined,
        }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      toast.success("প্রোফাইল আপডেট হয়েছে!");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminLayout>
      <div className="max-w-xl space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">আমার প্রোফাইল</h1>
          <p className="text-muted-foreground text-sm mt-0.5">আপনার নাম, ইমেইল এবং পাসওয়ার্ড পরিবর্তন করুন</p>
        </div>

        <Card className="border-border/40">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <User className="h-5 w-5 text-primary" />
              ব্যক্তিগত তথ্য
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div>
              <Label className="text-xs font-semibold text-muted-foreground uppercase flex items-center gap-1.5">
                <User className="h-3.5 w-3.5" /> নাম
              </Label>
              <Input
                className="mt-1.5"
                placeholder={nameLoading ? "লোড হচ্ছে..." : "আপনার নাম"}
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                disabled={nameLoading}
              />
            </div>
            <div>
              <Label className="text-xs font-semibold text-muted-foreground uppercase flex items-center gap-1.5">
                <Mail className="h-3.5 w-3.5" /> ইমেইল
              </Label>
              <Input
                className="mt-1.5"
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="pt-2 border-t border-border/40">
              <Label className="text-xs font-semibold text-muted-foreground uppercase flex items-center gap-1.5">
                <Lock className="h-3.5 w-3.5" /> নতুন পাসওয়ার্ড
              </Label>
              <Input
                className="mt-1.5"
                type="password"
                placeholder="খালি রাখলে আগেরটাই থাকবে"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </div>
            {newPassword && (
              <div>
                <Label className="text-xs font-semibold text-muted-foreground uppercase flex items-center gap-1.5">
                  <Lock className="h-3.5 w-3.5" /> পাসওয়ার্ড নিশ্চিত করুন
                </Label>
                <Input
                  className="mt-1.5"
                  type="password"
                  placeholder="আবার পাসওয়ার্ড লিখুন"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>
            )}
            <Button className="w-full h-11 gap-2" onClick={handleUpdateProfile} disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              আপডেট করুন
            </Button>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default AdminProfile;
