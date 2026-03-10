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
      toast.error("File size must be under 5MB");
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
      toast.error(err.message || "Upload failed");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const handleDelete = async (banner: any) => {
    try {
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
          <h2 className="text-lg font-bold text-foreground">Banner Management</h2>
          <p className="text-sm text-muted-foreground">Manage the banner slider displayed at the top of the store page</p>
        </div>
        <label>
          <input type="file" accept="image/*" className="hidden" onChange={handleUpload} />
          <Button variant="default" className="gap-2" asChild disabled={uploading}>
            <span><Plus className="h-4 w-4" /> {uploading ? "Uploading..." : "Add Banner"}</span>
          </Button>
        </label>
      </div>

      <p className="text-xs text-muted-foreground bg-secondary/50 rounded-lg px-3 py-2">
        💡 Suggested size: 1920×600px (16:5 ratio). Max 5MB. JPG/PNG/WebP supported.
      </p>

      {isLoading ? (
        <div className="text-center py-8 text-muted-foreground text-sm">Loading...</div>
      ) : banners.length === 0 ? (
        <div className="text-center py-16 border-2 border-dashed border-border rounded-2xl">
          <ImageIcon className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-muted-foreground">No banners yet</p>
          <p className="text-xs text-muted-foreground mt-1">Click the button above to add a banner</p>
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
                    placeholder="Link URL (optional)"
                    value={banner.link_url || ""}
                    onChange={(e) => updateBanner.mutate({ id: banner.id, link_url: e.target.value })}
                    className="h-8 text-xs"
                  />
                </div>
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span>Order: {banner.sort_order}</span>
                </div>
              </div>

              <div className="flex items-center gap-3 flex-shrink-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">{banner.is_active ? "Active" : "Inactive"}</span>
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
