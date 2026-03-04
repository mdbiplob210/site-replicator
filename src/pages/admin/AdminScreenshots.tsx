import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Camera, Trash2, ExternalLink, Loader2, X } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";

const AdminScreenshots = () => {
  const [url, setUrl] = useState("");
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: screenshots = [], isLoading } = useQuery({
    queryKey: ["screenshots"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("screenshots")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const captureMutation = useMutation({
    mutationFn: async (targetUrl: string) => {
      const { data, error } = await supabase.functions.invoke("capture-screenshot", {
        body: { url: targetUrl },
      });
      if (error) throw error;
      if (!data.success) throw new Error(data.error);
      return data.data;
    },
    onSuccess: () => {
      toast({ title: "সফল!", description: "স্ক্রিনশট সেভ হয়েছে" });
      setUrl("");
      queryClient.invalidateQueries({ queryKey: ["screenshots"] });
    },
    onError: (err: Error) => {
      toast({ title: "ত্রুটি", description: err.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("screenshots").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "ডিলিট হয়েছে" });
      queryClient.invalidateQueries({ queryKey: ["screenshots"] });
    },
  });

  const handleCapture = (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;
    captureMutation.mutate(url.trim());
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">স্ক্রিনশট ক্যাপচার</h1>
          <p className="text-muted-foreground">যেকোনো ওয়েবসাইটের স্ক্রিনশট নিন এবং সেভ করুন</p>
        </div>

        {/* Capture Form */}
        <form onSubmit={handleCapture} className="flex gap-3">
          <Input
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://example.com"
            className="flex-1"
            disabled={captureMutation.isPending}
          />
          <Button type="submit" disabled={captureMutation.isPending || !url.trim()}>
            {captureMutation.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Camera className="mr-2 h-4 w-4" />
            )}
            {captureMutation.isPending ? "ক্যাপচার হচ্ছে..." : "স্ক্রিনশট নিন"}
          </Button>
        </form>

        {/* Gallery */}
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : screenshots.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Camera className="mx-auto h-12 w-12 mb-3 opacity-50" />
            <p>কোনো স্ক্রিনশট নেই। উপরে URL দিয়ে শুরু করুন!</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {screenshots.map((shot: any) => (
              <Card key={shot.id} className="overflow-hidden group border-border/60">
                <div
                  className="relative cursor-pointer aspect-video bg-muted"
                  onClick={() => setSelectedImage(shot.image_url)}
                >
                  <img
                    src={shot.image_url}
                    alt={shot.title || shot.url}
                    className="w-full h-full object-cover object-top"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                </div>
                <CardContent className="p-3">
                  <p className="text-sm font-medium truncate text-foreground" title={shot.title}>
                    {shot.title || "Untitled"}
                  </p>
                  <div className="flex items-center justify-between mt-2">
                    <a
                      href={shot.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1 truncate max-w-[70%]"
                    >
                      <ExternalLink className="h-3 w-3 shrink-0" />
                      <span className="truncate">{shot.url}</span>
                    </a>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-destructive hover:text-destructive"
                      onClick={() => deleteMutation.mutate(shot.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {new Date(shot.created_at).toLocaleString("bn-BD")}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Lightbox */}
        <Dialog open={!!selectedImage} onOpenChange={() => setSelectedImage(null)}>
          <DialogContent className="max-w-4xl p-0 overflow-hidden">
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-2 right-2 z-10 bg-background/80"
              onClick={() => setSelectedImage(null)}
            >
              <X className="h-4 w-4" />
            </Button>
            {selectedImage && (
              <img src={selectedImage} alt="Screenshot" className="w-full h-auto" />
            )}
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
};

export default AdminScreenshots;
