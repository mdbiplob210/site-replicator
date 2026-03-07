import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Layers, Plus, Search, Edit, Trash2, ExternalLink, Copy, BarChart3 } from "lucide-react";
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
import {
  useLandingPages,
  useCreateLandingPage,
  useUpdateLandingPage,
  useDeleteLandingPage,
  LandingPage,
} from "@/hooks/useLandingPages";

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
};

export default function AdminLandingPages() {
  const navigate = useNavigate();
  const { data: pages, isLoading } = useLandingPages();
  const createMutation = useCreateLandingPage();
  const updateMutation = useUpdateLandingPage();
  const deleteMutation = useDeleteLandingPage();

  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPage, setEditingPage] = useState<Partial<LandingPage> | null>(null);
  const [form, setForm] = useState<Partial<LandingPage>>(emptyPage);

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
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.title || !form.slug) {
      toast.error("টাইটেল ও স্লাগ আবশ্যক!");
      return;
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
              <p className="text-sm text-muted-foreground">HTML কোড পেস্ট করে landing page ও checkout page তৈরি করুন</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="gap-2" onClick={() => navigate("/admin/website/landing-pages/analytics")}>
              <BarChart3 className="h-4 w-4" /> Analytics
            </Button>
            <Button className="gap-2" onClick={openCreate}>
              <Plus className="h-4 w-4" /> নতুন তৈরি করুন
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
                      {page.checkout_html && (
                        <Badge variant="outline" className="text-xs">Checkout</Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-sm text-muted-foreground">
                      <span className="font-mono">/lp/{page.slug}</span>
                      {page.checkout_html && <span className="font-mono">/lp/{page.slug}/checkout</span>}
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
              <TabsTrigger value="landing">Landing Page</TabsTrigger>
              <TabsTrigger value="checkout">Checkout Page</TabsTrigger>
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
                <Label>Landing Page HTML কোড</Label>
                <Textarea
                  value={form.html_content || ""}
                  onChange={(e) => setForm({ ...form, html_content: e.target.value })}
                  placeholder="এখানে আপনার Landing Page এর সম্পূর্ণ HTML কোড পেস্ট করুন..."
                  className="min-h-[400px] font-mono text-sm"
                />
                <div className="bg-muted/50 border rounded-lg p-4 space-y-2">
                  <p className="text-sm font-semibold text-foreground">🔗 Checkout এ রিডাইরেক্ট করতে:</p>
                  <p className="text-xs text-muted-foreground">
                    Landing page এর "অর্ডার করুন" বাটনে এই লিংক দিন:
                  </p>
                  <div className="bg-background border rounded p-3 font-mono text-xs">
                    <p className="text-primary">{`<a href="/lp/${form.slug || "your-slug"}/checkout">অর্ডার করুন</a>`}</p>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="checkout" className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label>Checkout Page HTML কোড</Label>
                <Textarea
                  value={form.checkout_html || ""}
                  onChange={(e) => setForm({ ...form, checkout_html: e.target.value })}
                  placeholder="এখানে আপনার Checkout Page এর HTML কোড পেস্ট করুন..."
                  className="min-h-[350px] font-mono text-sm"
                />
              </div>
              <div className="bg-muted/50 border rounded-lg p-4 space-y-3">
                <p className="text-sm font-semibold text-foreground">📋 Checkout Form ব্যবহারবিধি:</p>
                <p className="text-xs text-muted-foreground">
                  আপনার HTML এ form ট্যাগে <code className="bg-background px-1 rounded">data-checkout-form</code> attribute যোগ করুন।
                  ফর্ম সাবমিট হলে অটোমেটিক অর্ডার তৈরি হয়ে Admin Panel এ চলে যাবে।
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
                  <p className="text-primary/80">✅ অর্ডার সাবমিট হলে FB Purchase ও TikTok CompletePayment ইভেন্ট অটো ফায়ার হবে</p>
                </div>
              </div>
              {!form.checkout_html && (
                <div className="bg-muted/30 border border-dashed rounded-lg p-6 text-center">
                  <p className="text-sm text-muted-foreground">Checkout HTML না দিলে শুধু Landing Page কাজ করবে</p>
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
              {editingPage && (
                <div className="p-4 border rounded-lg space-y-2">
                  <Label>পেজ URLs</Label>
                  <p className="text-sm font-mono text-primary">{baseUrl}/lp/{form.slug}</p>
                  {form.checkout_html && (
                    <p className="text-sm font-mono text-primary">{baseUrl}/lp/{form.slug}/checkout</p>
                  )}
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
    </AdminLayout>
  );
}
