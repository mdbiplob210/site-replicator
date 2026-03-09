import { useState } from "react";
import { useBanners, useAddBanner, useDeleteBanner, useUpdateBanner } from "@/hooks/useBanners";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Upload, Trash2, GripVertical, ImageIcon, Link, Plus } from "lucide-react";
import { toast } from "sonner";

export default function BannerSettings() {
  const { data: banners = [], isLoading } = useBanners();
  const addBanner = useAddBanner();
  const deleteBanner = useDeleteBanner();
  const updateBanner = useUpdateBanner();
  const [uploading, setUploading] = useState(false);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error("ফাইল সাইজ সর্বোচ্চ 5MB হতে হবে");
      return;
    }
    setUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const filePath = `banners/${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from("site-assets")
        .upload(filePath, file, { upsert: true });
      if (uploadError) throw uploadError;
      const { data: urlData } = supabase.storage.from("site-assets").getPublicUrl(filePath);
      const nextOrder = banners.length > 0 ? Math.max(...banners.map((b: any) => b.sort_order)) + 1 : 0;
      await addBanner.mutateAsync({ image_url: urlData.publicUrl, sort_order: nextOrder });
    } catch (err: any) {
      toast.error(err.message || "আপলোড ব্যর্থ");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const handleDelete = async (banner: any) => {
    try {
      // Try to delete from storage
      const url = banner.image_url as string;
      const parts = url.split("/site-assets/");
      if (parts[1]) {
        await supabase.storage.from("site-assets").remove([parts[1].split("?")[0]]);
      }
      await deleteBanner.mutateAsync(banner.id);
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-foreground">ব্যানার ম্যানেজমেন্ট</h2>
          <p className="text-sm text-muted-foreground">স্টোর পেজের টপে যে ব্যানার স্লাইডার দেখাবে সেটি পরিচালনা করুন</p>
        </div>
        <label>
          <input type="file" accept="image/*" className="hidden" onChange={handleUpload} />
          <Button variant="default" className="gap-2" asChild disabled={uploading}>
            <span><Plus className="h-4 w-4" /> {uploading ? "আপলোড হচ্ছে..." : "ব্যানার যোগ করুন"}</span>
          </Button>
        </label>
      </div>

      <p className="text-xs text-muted-foreground bg-secondary/50 rounded-lg px-3 py-2">
        💡 সাজেস্টেড সাইজ: 1920×600px (16:5 রেশিও)। সর্বোচ্চ 5MB। JPG/PNG/WebP সাপোর্টেড।
      </p>

      {isLoading ? (
        <div className="text-center py-8 text-muted-foreground text-sm">লোড হচ্ছে...</div>
      ) : banners.length === 0 ? (
        <div className="text-center py-16 border-2 border-dashed border-border rounded-2xl">
          <ImageIcon className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-muted-foreground">কোনো ব্যানার নেই</p>
          <p className="text-xs text-muted-foreground mt-1">উপরের বাটনে ক্লিক করে ব্যানার যোগ করুন</p>
        </div>
      ) : (
        <div className="space-y-3">
          {banners.map((banner: any, idx: number) => (
            <div key={banner.id} className="bg-card border border-border rounded-xl p-4 flex items-center gap-4">
              <div className="text-muted-foreground cursor-grab">
                <GripVertical className="h-5 w-5" />
              </div>

              <div className="h-16 w-28 rounded-lg overflow-hidden bg-secondary flex-shrink-0">
                <img src={banner.image_url} alt={`Banner ${idx + 1}`} className="w-full h-full object-cover" />
              </div>

              <div className="flex-1 min-w-0 space-y-2">
                <div className="flex items-center gap-2">
                  <Link className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                  <Input
                    placeholder="লিংক URL (ঐচ্ছিক)"
                    value={banner.link_url || ""}
                    onChange={(e) => updateBanner.mutate({ id: banner.id, link_url: e.target.value })}
                    className="h-8 text-xs"
                  />
                </div>
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span>ক্রম: {banner.sort_order}</span>
                </div>
              </div>

              <div className="flex items-center gap-3 flex-shrink-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">{banner.is_active ? "সক্রিয়" : "নিষ্ক্রিয়"}</span>
                  <Switch
                    checked={banner.is_active}
                    onCheckedChange={(checked) => updateBanner.mutate({ id: banner.id, is_active: checked })}
                  />
                </div>
                <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => handleDelete(banner)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
