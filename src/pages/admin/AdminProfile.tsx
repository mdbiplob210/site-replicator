import { useState, useEffect, useRef } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { User, Mail, Lock, Loader2, Save, Camera } from "lucide-react";

const AdminProfile = () => {
  const { user } = useAuth();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [nameLoading, setNameLoading] = useState(true);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!user) return;
    setEmail(user.email || "");
    supabase.from("profiles").select("full_name, avatar_url").eq("user_id", user.id).single().then(({ data }) => {
      setFullName(data?.full_name || "");
      setAvatarUrl(data?.avatar_url || null);
      setNameLoading(false);
    });
  }, [user]);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    const { validateFileUpload } = await import("@/lib/security");
    const fileCheck = validateFileUpload(file, { maxSizeMB: 2, allowedTypes: ["image/jpeg", "image/png", "image/webp"] });
    if (!fileCheck.valid) { toast.error(fileCheck.message); return; }

    setUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `avatars/${user.id}.${ext}`;
      const { error: uploadError } = await supabase.storage.from("site-assets").upload(path, file, { upsert: true });
      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage.from("site-assets").getPublicUrl(path);
      const url = `${publicUrl}?t=${Date.now()}`;

      await supabase.from("profiles").update({ avatar_url: url }).eq("user_id", user.id);
      setAvatarUrl(url);
      toast.success("প্রোফাইল ছবি আপলোড হয়েছে!");
    } catch (err: any) {
      toast.error(err.message || "আপলোড ব্যর্থ হয়েছে");
    } finally {
      setUploading(false);
    }
  };

  const handleUpdateProfile = async () => {
    if (!user) return;
    if (newPassword && newPassword !== confirmPassword) {
      toast.error("পাসওয়ার্ড মিলছে না!");
      return;
    }
    if (newPassword) {
      const { validatePassword } = await import("@/lib/security");
      const pwCheck = validatePassword(newPassword);
      if (!pwCheck.valid) {
        toast.error(pwCheck.message);
        return;
      }
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

  const initials = fullName ? fullName.charAt(0).toUpperCase() : (email ? email.charAt(0).toUpperCase() : "?");

  return (
    <AdminLayout>
      <div className="max-w-xl space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">আমার প্রোফাইল</h1>
          <p className="text-muted-foreground text-sm mt-0.5">আপনার নাম, ইমেইল এবং পাসওয়ার্ড পরিবর্তন করুন</p>
        </div>

        {/* Avatar Section */}
        <Card className="border-border/40">
          <CardContent className="pt-6 flex flex-col items-center gap-4">
            <div className="relative group">
              <div className="h-24 w-24 rounded-full overflow-hidden border-4 border-primary/20 bg-muted flex items-center justify-center">
                {avatarUrl ? (
                  <img src={avatarUrl} alt="Avatar" className="h-full w-full object-cover" />
                ) : (
                  <span className="text-3xl font-bold text-muted-foreground">{initials}</span>
                )}
              </div>
              <button
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
                className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
              >
                {uploading ? (
                  <Loader2 className="h-6 w-6 text-white animate-spin" />
                ) : (
                  <Camera className="h-6 w-6 text-white" />
                )}
              </button>
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
            </div>
            <p className="text-xs text-muted-foreground">ছবি পরিবর্তন করতে ক্লিক করুন (সর্বোচ্চ ২MB)</p>
          </CardContent>
        </Card>

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
              <Input className="mt-1.5" placeholder={nameLoading ? "লোড হচ্ছে..." : "আপনার নাম"} value={fullName} onChange={(e) => setFullName(e.target.value)} disabled={nameLoading} />
            </div>
            <div>
              <Label className="text-xs font-semibold text-muted-foreground uppercase flex items-center gap-1.5">
                <Mail className="h-3.5 w-3.5" /> ইমেইল
              </Label>
              <Input className="mt-1.5" type="email" placeholder="your@email.com" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div className="pt-2 border-t border-border/40">
              <Label className="text-xs font-semibold text-muted-foreground uppercase flex items-center gap-1.5">
                <Lock className="h-3.5 w-3.5" /> নতুন পাসওয়ার্ড
              </Label>
              <Input className="mt-1.5" type="password" placeholder="খালি রাখলে আগেরটাই থাকবে" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
            </div>
            {newPassword && (
              <div>
                <Label className="text-xs font-semibold text-muted-foreground uppercase flex items-center gap-1.5">
                  <Lock className="h-3.5 w-3.5" /> পাসওয়ার্ড নিশ্চিত করুন
                </Label>
                <Input className="mt-1.5" type="password" placeholder="আবার পাসওয়ার্ড লিখুন" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
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
