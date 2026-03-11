import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Layers, Plus, Search, Edit, Trash2, ExternalLink, Copy, BarChart3, Upload, Image, X, GripVertical, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  useLandingPages,
  useCreateLandingPage,
  useUpdateLandingPage,
  useDeleteLandingPage,
  LandingPage,
} from "@/hooks/useLandingPages";
import { getProductLandingTemplate } from "@/lib/landingPageTemplates";

type LandingPageImage = {
  id: string;
  landing_page_id: string;
  image_url: string;
  file_name: string;
  sort_order: number;
  created_at: string;
};

const emptyPage: Partial<LandingPage> = {
  title: "",
  slug: "",
  html_content: "",
  checkout_html: "",
  is_active: true,
  fb_pixel_id: "",
  tiktok_pixel_id: "",
  gtm_id: "",
  custom_head_scripts: "",
  exit_popup_enabled: false,
  exit_popup_discount: 50,
  exit_popup_timer: 300,
  exit_popup_message: "এই ছাড়টি শুধু আপনার জন্য!",
};

export default function AdminLandingPages() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: pages, isLoading } = useLandingPages();
  const createMutation = useCreateLandingPage();
  const updateMutation = useUpdateLandingPage();
  const deleteMutation = useDeleteLandingPage();

  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPage, setEditingPage] = useState<Partial<LandingPage> | null>(null);
  const [form, setForm] = useState<Partial<LandingPage>>(emptyPage);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [templateDialogOpen, setTemplateDialogOpen] = useState(false);
  const [tplForm, setTplForm] = useState({
    productName: "",
    subtitle: "",
    originalPrice: "",
    sellingPrice: "",
    discountPercent: "",
    deliveryCharge: "60",
    productCode: "",
    phoneNumber: "",
    imageUrl: "",
  });

  // Fetch images for the editing page
  const { data: pageImages } = useQuery({
    queryKey: ["landing-page-images", editingPage?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("landing_page_images" as any)
        .select("*")
        .eq("landing_page_id", editingPage!.id!)
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return data as unknown as LandingPageImage[];
    },
    enabled: !!editingPage?.id,
  });

  const handleImageUpload = async (files: FileList | null) => {
    if (!files || !editingPage?.id) return;
    setUploading(true);
    try {
      const currentMax = pageImages?.length ? Math.max(...pageImages.map(i => i.sort_order)) : -1;
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const ext = file.name.split(".").pop();
        const path = `${editingPage.id}/${Date.now()}-${i}.${ext}`;

        const { error: uploadError } = await supabase.storage
          .from("landing-page-images")
          .upload(path, file, { upsert: true });
        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from("landing-page-images")
          .getPublicUrl(path);

        await supabase.from("landing_page_images" as any).insert({
          landing_page_id: editingPage.id,
          image_url: urlData.publicUrl,
          file_name: file.name,
          sort_order: currentMax + 1 + i,
        } as any);
      }
      queryClient.invalidateQueries({ queryKey: ["landing-page-images", editingPage.id] });
      toast.success(`${files.length}টি ছবি আপলোড হয়েছে!`);
    } catch (err: any) {
      toast.error("ছবি আপলোড ব্যর্থ: " + err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteImage = async (img: LandingPageImage) => {
    try {
      // Extract path from URL
      const urlParts = img.image_url.split("/landing-page-images/");
      if (urlParts[1]) {
        await supabase.storage.from("landing-page-images").remove([urlParts[1]]);
      }
      await supabase.from("landing_page_images" as any).delete().eq("id", img.id);
      queryClient.invalidateQueries({ queryKey: ["landing-page-images", editingPage?.id] });
      toast.success("ছবি ডিলিট হয়েছে!");
    } catch (err: any) {
      toast.error("ডিলিট ব্যর্থ: " + err.message);
    }
  };

  const filtered = pages?.filter(
    (p) =>
      p.title.toLowerCase().includes(search.toLowerCase()) ||
      p.slug.toLowerCase().includes(search.toLowerCase())
  );

  const openCreate = () => {
    setEditingPage(null);
    setForm(emptyPage);
    setDialogOpen(true);
  };

  const openCreateFromTemplate = () => {
    setTemplateDialogOpen(true);
  };

  const handleGenerateTemplate = () => {
    const html = getProductLandingTemplate(tplForm);
    const slug = tplForm.productName
      ? tplForm.productName.replace(/[^a-z0-9\s-]/gi, "").replace(/\s+/g, "-").toLowerCase().slice(0, 40)
      : "product-offer";
    setForm({
      ...emptyPage,
      title: tplForm.productName || "Product Landing Page",
      slug,
      html_content: html,
    });
    setEditingPage(null);
    setTemplateDialogOpen(false);
    setDialogOpen(true);
    toast.success("টেমপ্লেট তৈরি হয়েছে! প্রয়োজনে HTML এডিট করুন।");
  };

  const openEdit = (page: LandingPage) => {
    setEditingPage(page);
    setForm({
      title: page.title,
      slug: page.slug,
      html_content: page.html_content,
      checkout_html: page.checkout_html || "",
      is_active: page.is_active,
      fb_pixel_id: page.fb_pixel_id || "",
      tiktok_pixel_id: page.tiktok_pixel_id || "",
      gtm_id: page.gtm_id || "",
      custom_head_scripts: page.custom_head_scripts || "",
      exit_popup_enabled: page.exit_popup_enabled ?? false,
      exit_popup_discount: page.exit_popup_discount ?? 50,
      exit_popup_timer: page.exit_popup_timer ?? 300,
      exit_popup_message: page.exit_popup_message || "এই ছাড়টি শুধু আপনার জন্য!",
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.title || !form.slug) {
      toast.error("টাইটেল ও স্লাগ আবশ্যক!");
      return;
    }

    // Warn about cdn.tailwindcss.com
    const cdnPattern = /cdn\.tailwindcss\.com/i;
    const hasCdnInHtml = cdnPattern.test(form.html_content || "");
    const hasCdnInScripts = cdnPattern.test(form.custom_head_scripts || "");
    if (hasCdnInHtml || hasCdnInScripts) {
      toast.warning("⚠️ আপনার HTML এ cdn.tailwindcss.com পাওয়া গেছে। এটি production এ console warning তৈরি করে। সেভ করা হচ্ছে, তবে এটি রিমুভ করা উচিত।", { duration: 8000 });
    }

    const cleanSlug = form.slug!.replace(/[^a-z0-9-]/g, "").toLowerCase();
    const payload = { ...form, slug: cleanSlug };

    if (editingPage?.id) {
      await updateMutation.mutateAsync({ id: editingPage.id, ...payload });
    } else {
      await createMutation.mutateAsync(payload);
    }
    setDialogOpen(false);
  };

  const handleDelete = async (id: string) => {
    if (confirm("নিশ্চিত ডিলিট করতে চান?")) {
      await deleteMutation.mutateAsync(id);
    }
  };

  const baseUrl = window.location.origin;

  return (
    <AdminLayout>
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-2xl bg-secondary flex items-center justify-center">
              <Layers className="h-6 w-6 text-muted-foreground" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Landing Pages</h1>
              <p className="text-sm text-muted-foreground">HTML কোড পেস্ট করে landing page তৈরি করুন — চেকআউট ফর্ম একই HTML এ থাকবে</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="gap-2" onClick={() => navigate("/admin/website/landing-pages/analytics")}>
              <BarChart3 className="h-4 w-4" /> Analytics
            </Button>
            <Button variant="outline" className="gap-2" onClick={openCreateFromTemplate}>
              <FileText className="h-4 w-4" /> টেমপ্লেট থেকে তৈরি
            </Button>
            <Button className="gap-2" onClick={openCreate}>
              <Plus className="h-4 w-4" /> কাস্টম HTML
            </Button>
          </div>
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search landing pages..." className="pl-10" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>

        {/* List */}
        {isLoading ? (
          <p className="text-muted-foreground text-center py-10">লোড হচ্ছে...</p>
        ) : filtered && filtered.length > 0 ? (
          <div className="grid gap-4">
            {filtered.map((page) => (
              <Card key={page.id}>
                <CardContent className="flex items-center justify-between p-4">
                  <div className="space-y-1 flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-foreground truncate">{page.title}</h3>
                      <Badge variant={page.is_active ? "default" : "secondary"}>
                        {page.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-muted-foreground">
                      <span className="font-mono">/lp/{page.slug}</span>
                      <div className="flex gap-1.5">
                        {page.fb_pixel_id && <Badge variant="outline" className="text-xs">FB</Badge>}
                        {page.tiktok_pixel_id && <Badge variant="outline" className="text-xs">TikTok</Badge>}
                        {page.gtm_id && <Badge variant="outline" className="text-xs">GTM</Badge>}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" onClick={() => { navigator.clipboard.writeText(`${baseUrl}/lp/${page.slug}`); toast.success("লিংক কপি হয়েছে!"); }}>
                      <Copy className="h-4 w-4" />
                    </Button>
                    <a href={`/lp/${page.slug}`} target="_blank" rel="noopener noreferrer">
                      <Button variant="ghost" size="icon"><ExternalLink className="h-4 w-4" /></Button>
                    </a>
                    <Button variant="ghost" size="icon" onClick={() => openEdit(page)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDelete(page.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="h-16 w-16 rounded-2xl bg-secondary flex items-center justify-center mb-4">
              <Layers className="h-8 w-8 text-muted-foreground/50" />
            </div>
            <h3 className="text-lg font-bold text-foreground mb-1">কোনো landing page নেই</h3>
            <p className="text-sm text-muted-foreground mb-6">প্রথম landing page তৈরি করুন</p>
            <Button className="gap-2" onClick={openCreate}>
              <Plus className="h-4 w-4" /> নতুন তৈরি করুন
            </Button>
          </div>
        )}
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingPage ? "Landing Page এডিট করুন" : "নতুন Landing Page"}</DialogTitle>
          </DialogHeader>

          <Tabs defaultValue="landing" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="landing">HTML কোড</TabsTrigger>
              <TabsTrigger value="images">ছবি</TabsTrigger>
              <TabsTrigger value="tracking">ট্র্যাকিং</TabsTrigger>
              <TabsTrigger value="settings">সেটিংস</TabsTrigger>
            </TabsList>

            <TabsContent value="landing" className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>টাইটেল *</Label>
                  <Input value={form.title || ""} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="My Landing Page" />
                </div>
                <div className="space-y-2">
                  <Label>স্লাগ (URL) *</Label>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">/lp/</span>
                    <Input
                      value={form.slug || ""}
                      onChange={(e) => setForm({ ...form, slug: e.target.value.replace(/[^a-z0-9-]/g, "").toLowerCase() })}
                      placeholder="my-offer"
                    />
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <Label>সম্পূর্ণ HTML কোড (Landing Page + Checkout Form)</Label>
                <Textarea
                  value={form.html_content || ""}
                  onChange={(e) => setForm({ ...form, html_content: e.target.value })}
                  placeholder="এখানে আপনার সম্পূর্ণ HTML কোড পেস্ট করুন — Landing Page ও Checkout Form একসাথে..."
                  className="min-h-[400px] font-mono text-sm"
                />
                <div className="bg-muted/50 border rounded-lg p-4 space-y-3">
                  <p className="text-sm font-semibold text-foreground">📋 Checkout Form ব্যবহারবিধি:</p>
                  <p className="text-xs text-muted-foreground">
                    আপনার HTML এর মধ্যে <code className="bg-background px-1 rounded">data-checkout-form</code> attribute সহ একটি form যোগ করুন।
                    ফর্ম সাবমিট হলে অটোমেটিক অর্ডার তৈরি হয়ে সরাসরি Admin Panel এ চলে যাবে।
                  </p>
                  <div className="bg-background border rounded p-3 font-mono text-xs space-y-1 overflow-x-auto">
                    <p className="text-primary">{`<form data-checkout-form`}</p>
                    <p className="text-primary pl-4">{`data-product-name="প্রোডাক্ট নাম"`}</p>
                    <p className="text-primary pl-4">{`data-product-code="SKU001"`}</p>
                    <p className="text-primary pl-4">{`data-unit-price="1200"`}</p>
                    <p className="text-primary pl-4">{`data-delivery-charge="60"`}</p>
                    <p className="text-primary">{`>`}</p>
                    <p className="text-muted-foreground pl-4">{`<input name="customer_name" placeholder="আপনার নাম" required />`}</p>
                    <p className="text-muted-foreground pl-4">{`<input name="customer_phone" placeholder="ফোন নম্বর" required />`}</p>
                    <p className="text-muted-foreground pl-4">{`<input name="customer_address" placeholder="ঠিকানা" />`}</p>
                    <p className="text-muted-foreground pl-4">{`<select name="quantity">`}</p>
                    <p className="text-muted-foreground pl-8">{`<option value="1">১ পিস</option>`}</p>
                    <p className="text-muted-foreground pl-8">{`<option value="2">২ পিস</option>`}</p>
                    <p className="text-muted-foreground pl-4">{`</select>`}</p>
                    <p className="text-muted-foreground pl-4">{`<textarea name="notes" placeholder="নোট"></textarea>`}</p>
                    <p className="text-muted-foreground pl-4">{`<button type="submit">অর্ডার করুন</button>`}</p>
                    <p className="text-primary">{`</form>`}</p>
                  </div>
                  <div className="text-xs text-muted-foreground space-y-1 mt-2">
                    <p><strong>Required fields:</strong> customer_name, customer_phone</p>
                    <p><strong>Optional fields:</strong> customer_address, quantity, notes</p>
                    <p><strong>Form attributes:</strong> data-product-name, data-product-code, data-unit-price, data-delivery-charge, data-discount</p>
                    <p><strong>Success handling:</strong> data-success-url="/thank-you" অথবা data-success-message="ধন্যবাদ!"</p>
                    <p className="text-primary/80">✅ অর্ডার সাবমিট হলে সরাসরি Admin Panel এ অর্ডার আসবে + FB Purchase ও TikTok CompletePayment ইভেন্ট অটো ফায়ার হবে</p>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="images" className="space-y-4 mt-4">
              {!editingPage?.id ? (
                <div className="bg-muted/30 border border-dashed rounded-lg p-8 text-center">
                  <Image className="h-10 w-10 mx-auto text-muted-foreground/40 mb-3" />
                  <p className="text-sm text-muted-foreground">প্রথমে পেজটি সেভ করুন, তারপর ছবি আপলোড করতে পারবেন</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Upload Area */}
                  <div
                    className="border-2 border-dashed rounded-xl p-6 text-center cursor-pointer hover:border-primary/40 hover:bg-muted/30 transition-colors"
                    onClick={() => fileInputRef.current?.click()}
                    onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
                    onDrop={(e) => { e.preventDefault(); e.stopPropagation(); handleImageUpload(e.dataTransfer.files); }}
                  >
                    <Upload className="h-8 w-8 mx-auto text-muted-foreground/50 mb-2" />
                    <p className="text-sm font-medium text-foreground">ছবি আপলোড করুন</p>
                    <p className="text-xs text-muted-foreground mt-1">ক্লিক করুন বা ড্র্যাগ করে ছেড়ে দিন • একসাথে একাধিক ছবি আপলোড করা যাবে</p>
                    {uploading && <p className="text-xs text-primary mt-2">আপলোড হচ্ছে...</p>}
                    <input
                      ref={fileInputRef}
                      type="file"
                      multiple
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handleImageUpload(e.target.files)}
                    />
                  </div>

                  {/* Image Grid */}
                  {pageImages && pageImages.length > 0 ? (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label className="text-sm">আপলোড করা ছবি ({pageImages.length}টি)</Label>
                      </div>
                      <div className="grid grid-cols-3 gap-3">
                        {pageImages.map((img) => (
                          <div key={img.id} className="group relative border rounded-lg overflow-hidden bg-muted/30">
                            <img
                              src={img.image_url}
                              alt={img.file_name}
                              className="w-full h-32 object-cover"
                            />
                            <div className="absolute inset-0 bg-foreground/0 group-hover:bg-foreground/40 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                              <Button
                                size="icon"
                                variant="destructive"
                                className="h-8 w-8 rounded-full"
                                onClick={() => handleDeleteImage(img)}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                            <div className="p-1.5 flex items-center justify-between">
                              <p className="text-[10px] text-muted-foreground truncate flex-1">{img.file_name}</p>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-5 w-5 shrink-0"
                                onClick={() => {
                                  navigator.clipboard.writeText(img.image_url);
                                  toast.success("Image URL কপি হয়েছে!");
                                }}
                              >
                                <Copy className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="bg-muted/50 border rounded-lg p-3 mt-3">
                        <p className="text-xs font-semibold text-foreground mb-1">🖼️ HTML এ ছবি ব্যবহার করুন:</p>
                        <p className="text-[11px] text-muted-foreground">প্রতিটি ছবির Copy বাটনে ক্লিক করে URL কপি করুন এবং আপনার HTML এ এভাবে ব্যবহার করুন:</p>
                        <div className="bg-background border rounded p-2 mt-1 font-mono text-[11px] text-primary">
                          {`<img src="IMAGE_URL_HERE" alt="ছবি" />`}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-4">এখনো কোনো ছবি আপলোড করা হয়নি</p>
                  )}
                </div>
              )}
            </TabsContent>

            <TabsContent value="tracking" className="space-y-4 mt-4">
              <Card>
                <CardHeader><CardTitle className="text-base">Facebook Pixel</CardTitle></CardHeader>
                <CardContent>
                  <Input value={form.fb_pixel_id || ""} onChange={(e) => setForm({ ...form, fb_pixel_id: e.target.value })} placeholder="Facebook Pixel ID (যেমন: 123456789012345)" />
                  <p className="text-xs text-muted-foreground mt-1">Facebook Events Manager থেকে Pixel ID কপি করুন</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader><CardTitle className="text-base">TikTok Pixel</CardTitle></CardHeader>
                <CardContent>
                  <Input value={form.tiktok_pixel_id || ""} onChange={(e) => setForm({ ...form, tiktok_pixel_id: e.target.value })} placeholder="TikTok Pixel ID (যেমন: CXXXXXXXXXXXXXXXXX)" />
                  <p className="text-xs text-muted-foreground mt-1">TikTok Ads Manager → Events → Website Pixel থেকে Pixel ID কপি করুন</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader><CardTitle className="text-base">Google Tag Manager</CardTitle></CardHeader>
                <CardContent>
                  <Input value={form.gtm_id || ""} onChange={(e) => setForm({ ...form, gtm_id: e.target.value })} placeholder="GTM ID (যেমন: GTM-XXXXXXX)" />
                </CardContent>
              </Card>
              <Card>
                <CardHeader><CardTitle className="text-base">কাস্টম Head Scripts</CardTitle></CardHeader>
                <CardContent>
                  <Textarea value={form.custom_head_scripts || ""} onChange={(e) => setForm({ ...form, custom_head_scripts: e.target.value })} placeholder="যেকোনো কাস্টম script ট্যাগ..." className="min-h-[120px] font-mono text-sm" />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="settings" className="space-y-4 mt-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <Label>পেজ অ্যাক্টিভ</Label>
                  <p className="text-sm text-muted-foreground">বন্ধ করলে পেজ দেখা যাবে না</p>
                </div>
                <Switch checked={form.is_active ?? true} onCheckedChange={(v) => setForm({ ...form, is_active: v })} />
              </div>

              {/* Exit Intent Popup Settings */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">🎯 Exit Intent Popup</CardTitle>
                    <Switch
                      checked={form.exit_popup_enabled ?? false}
                      onCheckedChange={(v) => setForm({ ...form, exit_popup_enabled: v })}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">ভিজিটর পেজ ছেড়ে যাওয়ার সময় ডিসকাউন্ট অফার দেখাবে</p>
                </CardHeader>
                {(form.exit_popup_enabled) && (
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>ডিসকাউন্ট পরিমাণ (৳)</Label>
                        <Input
                          type="number"
                          min={0}
                          value={form.exit_popup_discount ?? 50}
                          onChange={(e) => setForm({ ...form, exit_popup_discount: Number(e.target.value) })}
                          placeholder="50"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>টাইমার (সেকেন্ড)</Label>
                        <Input
                          type="number"
                          min={30}
                          max={3600}
                          value={form.exit_popup_timer ?? 300}
                          onChange={(e) => setForm({ ...form, exit_popup_timer: Number(e.target.value) })}
                          placeholder="300"
                        />
                        <p className="text-[11px] text-muted-foreground">{Math.floor((form.exit_popup_timer || 300) / 60)} মিনিট {(form.exit_popup_timer || 300) % 60} সেকেন্ড</p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>পপআপ মেসেজ</Label>
                      <Input
                        value={form.exit_popup_message || ""}
                        onChange={(e) => setForm({ ...form, exit_popup_message: e.target.value })}
                        placeholder="এই ছাড়টি শুধু আপনার জন্য!"
                      />
                    </div>
                  </CardContent>
                )}
              </Card>

              {editingPage && (
                <div className="p-4 border rounded-lg space-y-2">
                  <Label>পেজ URL</Label>
                  <p className="text-sm font-mono text-primary">{baseUrl}/lp/{form.slug}</p>
                </div>
              )}
            </TabsContent>
          </Tabs>

          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" onClick={() => setDialogOpen(false)}>বাতিল</Button>
            <Button onClick={handleSave} disabled={createMutation.isPending || updateMutation.isPending}>
              {createMutation.isPending || updateMutation.isPending ? "সেভ হচ্ছে..." : "সেভ করুন"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Template Config Dialog */}
      <Dialog open={templateDialogOpen} onOpenChange={setTemplateDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>📄 টেমপ্লেট থেকে Landing Page তৈরি করুন</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">প্রোডাক্ট নাম *</Label>
                <Input value={tplForm.productName} onChange={(e) => setTplForm({ ...tplForm, productName: e.target.value })} placeholder="যেমন: Aluminum Juicer" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">সাবটাইটেল</Label>
                <Input value={tplForm.subtitle} onChange={(e) => setTplForm({ ...tplForm, subtitle: e.target.value })} placeholder="যেমন: (বড় সাইজ)" />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">আসল দাম (৳)</Label>
                <Input value={tplForm.originalPrice} onChange={(e) => setTplForm({ ...tplForm, originalPrice: e.target.value })} placeholder="৯৯০" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">বিক্রয় দাম (৳)</Label>
                <Input value={tplForm.sellingPrice} onChange={(e) => setTplForm({ ...tplForm, sellingPrice: e.target.value })} placeholder="৬৯০" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">ছাড় (%)</Label>
                <Input value={tplForm.discountPercent} onChange={(e) => setTplForm({ ...tplForm, discountPercent: e.target.value })} placeholder="৩০" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">ডেলিভারি চার্জ (৳)</Label>
                <Input value={tplForm.deliveryCharge} onChange={(e) => setTplForm({ ...tplForm, deliveryCharge: e.target.value })} placeholder="60" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">প্রোডাক্ট কোড</Label>
                <Input value={tplForm.productCode} onChange={(e) => setTplForm({ ...tplForm, productCode: e.target.value })} placeholder="SKU001" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">ফোন নম্বর (কল বাটনের জন্য)</Label>
              <Input value={tplForm.phoneNumber} onChange={(e) => setTplForm({ ...tplForm, phoneNumber: e.target.value })} placeholder="01XXXXXXXXX" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">প্রোডাক্ট ছবির URL (পরে ছবি ট্যাব থেকে চেঞ্জ করতে পারবেন)</Label>
              <Input value={tplForm.imageUrl} onChange={(e) => setTplForm({ ...tplForm, imageUrl: e.target.value })} placeholder="https://example.com/product.jpg" />
            </div>
            <div className="bg-muted/50 border rounded-lg p-3">
              <p className="text-xs text-muted-foreground">✅ টেমপ্লেটে অটো থাকবে: কাউন্টডাউন, ট্রাস্ট ব্যাজ, ফিচার কার্ড, পপআপ চেকআউট ফর্ম, অর্ডার সামারি। তৈরি হওয়ার পর HTML কোড এডিট করে কাস্টমাইজ করতে পারবেন।</p>
            </div>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setTemplateDialogOpen(false)}>বাতিল</Button>
              <Button onClick={handleGenerateTemplate} disabled={!tplForm.productName}>
                🚀 টেমপ্লেট তৈরি করুন
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
