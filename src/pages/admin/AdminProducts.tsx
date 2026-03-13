import { useState, useEffect } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Package, Layers, Plus, Search, RefreshCw, ArrowLeft,
  Upload, DollarSign, TrendingUp, AlertTriangle, ShoppingCart,
  Image as ImageIcon, Filter, Pencil, Trash2, Loader2, ExternalLink, FileText
} from "lucide-react";
import { generateTemplate, templateList, defaultTemplateConfig, type TemplateConfig } from "@/lib/landingPageTemplates";

type TabType = "products" | "categories";
type ViewType = "list" | "add" | "edit";

interface Product {
  id: string;
  name: string;
  product_code: string;
  purchase_price: number;
  selling_price: number;
  original_price: number;
  additional_cost: number;
  stock_quantity: number;
  status: string;
  category_id: string | null;
  short_description: string | null;
  detailed_description: string | null;
  youtube_url: string | null;
  internal_note: string | null;
  free_delivery: boolean;
  allow_out_of_stock_orders: boolean;
  main_image_url: string | null;
  additional_images: string[] | null;
}

interface Category {
  id: string;
  name: string;
  slug: string;
  parent_id: string | null;
  description: string | null;
  image_url: string | null;
}

const emptyProduct = {
  name: "", product_code: "", purchase_price: "0", selling_price: "0",
  original_price: "0", additional_cost: "0", stock_quantity: "0",
  short_description: "", detailed_description: "", youtube_url: "",
  internal_note: "", free_delivery: false, allow_out_of_stock_orders: false,
  category_id: "", status: "active", slug: "",
};

const AdminProducts = () => {
  const [activeTab, setActiveTab] = useState<TabType>("products");
  const [view, setView] = useState<ViewType>("list");
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showCategoryDialog, setShowCategoryDialog] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all-status");
  const [stockFilter, setStockFilter] = useState("all-stock");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [uploadingMain, setUploadingMain] = useState(false);
  const [uploadingAdditional, setUploadingAdditional] = useState(false);
  const [mainImageUrl, setMainImageUrl] = useState<string>("");
  const [additionalImages, setAdditionalImages] = useState<string[]>([]);

  // Landing page creation from product
  const [lpDialogOpen, setLpDialogOpen] = useState(false);
  const [lpProduct, setLpProduct] = useState<Product | null>(null);
  const [lpTemplateId, setLpTemplateId] = useState("classic-orange");
  const [lpCreating, setLpCreating] = useState(false);
  const [productLandingPages, setProductLandingPages] = useState<any[]>([]);
  // Tiered pricing state
  const [lpTieredEnabled, setLpTieredEnabled] = useState(false);
  const [lpTieredPrice1, setLpTieredPrice1] = useState("");
  const [lpTieredPrice2, setLpTieredPrice2] = useState("");
  const [lpTieredPrice3, setLpTieredPrice3] = useState("");
  const [lpTieredLabel1, setLpTieredLabel1] = useState("");
  const [lpTieredLabel2, setLpTieredLabel2] = useState("");
  const [lpTieredLabel3, setLpTieredLabel3] = useState("");

  const [form, setForm] = useState(emptyProduct);

  // New category form
  const [newCategory, setNewCategory] = useState({ name: "", slug: "", parent_id: "", description: "" });

  const fetchProducts = async () => {
    const { data } = await supabase.from("products").select("*").order("created_at", { ascending: false });
    if (data) setProducts(data as any);
  };

  const fetchCategories = async () => {
    const { data } = await supabase.from("categories").select("*").order("name");
    if (data) setCategories(data as any);
  };

  useEffect(() => {
    setLoading(true);
    Promise.all([fetchProducts(), fetchCategories()]).then(() => setLoading(false));
  }, []);

  const filteredProducts = products.filter(p => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      if (!p.name.toLowerCase().includes(q) && !p.product_code.toLowerCase().includes(q)) return false;
    }
    if (statusFilter !== "all-status" && p.status !== statusFilter) return false;
    if (stockFilter === "in-stock" && p.stock_quantity <= 0) return false;
    if (stockFilter === "out-of-stock" && p.stock_quantity > 0) return false;
    return true;
  });

  const activeProducts = products.filter(p => p.status === "active").length;
  const outOfStock = products.filter(p => p.stock_quantity <= 0).length;
  const totalStock = products.reduce((sum, p) => sum + p.stock_quantity, 0);
  const totalCost = products.reduce((sum, p) => sum + Number(p.purchase_price) * p.stock_quantity, 0);
  const totalSell = products.reduce((sum, p) => sum + Number(p.selling_price) * p.stock_quantity, 0);
  const profit = totalSell - totalCost;

  const profitPerUnit = () => {
    const sell = parseFloat(form.selling_price) || 0;
    const buy = parseFloat(form.purchase_price) || 0;
    const extra = parseFloat(form.additional_cost) || 0;
    return (sell - buy - extra).toFixed(2);
  };

  const uploadImage = async (file: File, folder: string): Promise<string | null> => {
    const ext = file.name.split('.').pop();
    const fileName = `${folder}/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
    const { error } = await supabase.storage.from("product-images").upload(fileName, file);
    if (error) { toast.error("Image upload failed: " + error.message); return null; }
    const { data: urlData } = supabase.storage.from("product-images").getPublicUrl(fileName);
    return urlData.publicUrl;
  };

  const handleMainImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingMain(true);
    const url = await uploadImage(file, "main");
    if (url) setMainImageUrl(url);
    setUploadingMain(false);
  };

  const handleAdditionalImagesUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setUploadingAdditional(true);
    const urls: string[] = [];
    for (const file of Array.from(files)) {
      const url = await uploadImage(file, "additional");
      if (url) urls.push(url);
    }
    setAdditionalImages(prev => [...prev, ...urls]);
    setUploadingAdditional(false);
  };

  const removeAdditionalImage = (index: number) => {
    setAdditionalImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    if (!form.name || !form.product_code) {
      toast.error("Product Name and Code are required");
      return;
    }
    setSaving(true);
    const payload: any = {
      name: form.name,
      product_code: form.product_code,
      purchase_price: parseFloat(form.purchase_price) || 0,
      selling_price: parseFloat(form.selling_price) || 0,
      original_price: parseFloat(form.original_price) || 0,
      additional_cost: parseFloat(form.additional_cost) || 0,
      stock_quantity: parseInt(form.stock_quantity) || 0,
      short_description: form.short_description || null,
      detailed_description: form.detailed_description || null,
      youtube_url: form.youtube_url || null,
      internal_note: form.internal_note || null,
      free_delivery: form.free_delivery,
      allow_out_of_stock_orders: form.allow_out_of_stock_orders,
      category_id: form.category_id || null,
      status: form.status,
      main_image_url: mainImageUrl || null,
      additional_images: additionalImages.length > 0 ? additionalImages : [],
    };
    // Only set slug if user provided one; otherwise let DB trigger auto-generate
    if (form.slug.trim()) {
      payload.slug = form.slug.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    } else if (!editingId) {
      payload.slug = null;
    }

    let error;
    if (editingId) {
      ({ error } = await supabase.from("products").update(payload as any).eq("id", editingId));
    } else {
      ({ error } = await supabase.from("products").insert(payload as any));
    }

    setSaving(false);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success(editingId ? "Product updated!" : "Product saved!");
      setView("list");
      setEditingId(null);
      setForm(emptyProduct);
      setMainImageUrl("");
      setAdditionalImages([]);
      fetchProducts();
    }
  };

  const handleEdit = (p: Product) => {
    setEditingId(p.id);
    setMainImageUrl(p.main_image_url || "");
    setAdditionalImages(p.additional_images || []);
    setForm({
      name: p.name,
      product_code: p.product_code,
      purchase_price: String(p.purchase_price),
      selling_price: String(p.selling_price),
      original_price: String(p.original_price),
      additional_cost: String(p.additional_cost),
      stock_quantity: String(p.stock_quantity),
      short_description: p.short_description || "",
      detailed_description: p.detailed_description || "",
      youtube_url: p.youtube_url || "",
      internal_note: p.internal_note || "",
      free_delivery: p.free_delivery,
      allow_out_of_stock_orders: p.allow_out_of_stock_orders,
      category_id: p.category_id || "",
      status: p.status,
      slug: (p as any).slug || "",
    });
    setView("edit");
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("products").delete().eq("id", id);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Product deleted!");
      fetchProducts();
    }
  };

  const handleDeleteCategory = async (id: string) => {
    const { error } = await supabase.from("categories").delete().eq("id", id);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Category deleted!");
      fetchCategories();
    }
  };

  const saveCategory = async () => {
    if (!newCategory.name) {
      toast.error("Category Name is required");
      return;
    }
    const slug = newCategory.slug || newCategory.name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
    const { error } = await supabase.from("categories").insert({
      name: newCategory.name,
      slug,
      parent_id: newCategory.parent_id || null,
      description: newCategory.description || null,
    } as any);

    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Category created!");
      setShowCategoryDialog(false);
      setNewCategory({ name: "", slug: "", parent_id: "", description: "" });
      fetchCategories();
    }
  };

  // Open landing page dialog for a product
  const openLpDialog = async (p: Product) => {
    setLpProduct(p);
    setLpTemplateId("classic-orange");
    setLpTieredEnabled(false);
    setLpTieredPrice1(String(p.selling_price));
    setLpTieredPrice2(String(Math.round(p.selling_price * 2 * 0.9)));
    setLpTieredPrice3(String(Math.round(p.selling_price * 3 * 0.85)));
    setLpTieredLabel1(`১ পিস - ৳${p.selling_price}`);
    setLpTieredLabel2(`২ পিস - ৳${Math.round(p.selling_price * 2 * 0.9)}`);
    setLpTieredLabel3(`৩ পিস - ৳${Math.round(p.selling_price * 3 * 0.85)}`);
    // Fetch existing landing pages for this product
    const { data: existingLps } = await supabase
      .from("landing_pages" as any)
      .select("id, title, slug, is_active, created_at")
      .or(`slug.ilike.%${p.product_code.toLowerCase()}%,html_content.ilike.%${p.product_code}%`)
      .order("created_at", { ascending: false })
      .limit(10);
    setProductLandingPages(existingLps || []);
    setLpDialogOpen(true);
  };

  const handleCreateLandingPage = async () => {
    if (!lpProduct) return;
    setLpCreating(true);
    try {
      const p = lpProduct;
      const discountPercent = p.original_price > p.selling_price
        ? Math.round(((p.original_price - p.selling_price) / p.original_price) * 100)
        : 0;

      const tplConfig: TemplateConfig = {
        ...defaultTemplateConfig,
        productName: p.name,
        originalPrice: String(p.original_price),
        sellingPrice: String(p.selling_price),
        discountPercent: String(discountPercent),
        productCode: p.product_code,
        imageUrl: p.main_image_url || defaultTemplateConfig.imageUrl,
        subtitle: p.short_description || defaultTemplateConfig.subtitle,
        tieredPricingEnabled: lpTieredEnabled,
        tieredPrice1: lpTieredPrice1,
        tieredPrice2: lpTieredPrice2,
        tieredPrice3: lpTieredPrice3,
        tieredLabel1: lpTieredLabel1,
        tieredLabel2: lpTieredLabel2,
        tieredLabel3: lpTieredLabel3,
      };

      const html = generateTemplate(lpTemplateId, tplConfig);
      const slug = p.product_code.toLowerCase().replace(/[^a-z0-9-]/g, "-").replace(/-+/g, "-");

      const { data, error } = await (supabase.from("landing_pages" as any).insert({
        title: p.name,
        slug,
        html_content: html,
        is_active: true,
      } as any).select("id, slug").single() as any);

      if (error) {
        if (error.message.includes("duplicate") || error.message.includes("unique")) {
          const slugWithTs = `${slug}-${Date.now().toString(36)}`;
          const { error: err2 } = await supabase.from("landing_pages" as any).insert({
            title: p.name,
            slug: slugWithTs,
            html_content: html,
            is_active: true,
          } as any);
          if (err2) throw err2;
          toast.success(`ল্যান্ডিং পেজ তৈরি হয়েছে! Slug: /${slugWithTs}`);
        } else {
          throw error;
        }
      } else {
        toast.success(`ল্যান্ডিং পেজ তৈরি হয়েছে! Slug: /${data.slug}`);
      }
      setLpDialogOpen(false);
    } catch (err: any) {
      toast.error("ল্যান্ডিং পেজ তৈরিতে সমস্যা: " + err.message);
    } finally {
      setLpCreating(false);
    }
  };

  // Add/Edit Product View
  if (view === "add" || view === "edit") {
    return (
      <AdminLayout>
        <div className="max-w-[1400px] space-y-6">
          <div className="flex items-center gap-3">
            <button onClick={() => { setView("list"); setEditingId(null); setForm(emptyProduct); setMainImageUrl(""); setAdditionalImages([]); }} className="p-2 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-foreground">{editingId ? "Edit Product" : "Add New Product"}</h1>
              <p className="text-muted-foreground text-sm">{editingId ? "Update product details" : "Fill in the details to add a new product"}</p>
            </div>
          </div>

          <Card className="border-border/40">
            <CardContent className="p-6 space-y-6">
              {/* Images */}
              <div className="space-y-4">
                <div>
                  <Label className="text-sm font-semibold">Main Image</Label>
                  <div className="mt-2 flex items-center gap-4">
                    {mainImageUrl ? (
                      <div className="relative h-28 w-28 rounded-xl overflow-hidden border border-border">
                        <img src={mainImageUrl} alt="Main" className="w-full h-full object-cover" />
                        <button onClick={() => setMainImageUrl("")} className="absolute top-1 right-1 bg-destructive text-destructive-foreground rounded-full p-0.5">
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    ) : (
                      <label className="mt-0 h-28 w-28 border-2 border-dashed border-border rounded-xl flex flex-col items-center justify-center gap-1 cursor-pointer hover:border-primary/50 transition-colors">
                        {uploadingMain ? <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /> : (
                          <>
                            <Upload className="h-6 w-6 text-muted-foreground" />
                            <span className="text-[11px] text-muted-foreground">Upload</span>
                          </>
                        )}
                        <input type="file" accept="image/*" className="hidden" onChange={handleMainImageUpload} disabled={uploadingMain} />
                      </label>
                    )}
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-semibold">Additional Images</Label>
                  <div className="mt-2 flex items-center gap-3 flex-wrap">
                    {additionalImages.map((url, i) => (
                      <div key={i} className="relative h-20 w-20 rounded-lg overflow-hidden border border-border">
                        <img src={url} alt={`Extra ${i + 1}`} className="w-full h-full object-cover" />
                        <button onClick={() => removeAdditionalImage(i)} className="absolute top-0.5 right-0.5 bg-destructive text-destructive-foreground rounded-full p-0.5">
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                    <label className="h-20 w-20 border-2 border-dashed border-border rounded-lg flex flex-col items-center justify-center gap-0.5 cursor-pointer hover:border-primary/50 transition-colors">
                      {uploadingAdditional ? <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /> : (
                        <>
                          <Plus className="h-5 w-5 text-muted-foreground" />
                          <span className="text-[9px] text-muted-foreground">Add</span>
                        </>
                      )}
                      <input type="file" accept="image/*" multiple className="hidden" onChange={handleAdditionalImagesUpload} disabled={uploadingAdditional} />
                    </label>
                  </div>
                </div>
              </div>

              {/* Row 1 */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <Label className="text-sm font-semibold">Product Name</Label>
                  <Input placeholder="e.g. Smart Watch" value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="mt-1.5" />
                </div>
                <div>
                  <Label className="text-sm font-semibold">URL Slug</Label>
                  <Input placeholder="auto-generated if empty" value={form.slug} onChange={e => setForm({...form, slug: e.target.value})} className="mt-1.5 font-mono text-xs" />
                  <p className="text-[10px] text-muted-foreground mt-1">Leave empty to auto-generate from name</p>
                </div>
                <div>
                  <Label className="text-sm font-semibold">Product Code <span className="text-destructive">*</span></Label>
                  <Input placeholder="e.g. BCGH-001" value={form.product_code} onChange={e => setForm({...form, product_code: e.target.value})} className="mt-1.5 font-mono" />
                </div>
                <div>
                  <Label className="text-sm font-semibold">Purchase Price (৳)</Label>
                  <Input type="number" value={form.purchase_price} onChange={e => setForm({...form, purchase_price: e.target.value})} className="mt-1.5" />
                </div>
              </div>

              {/* Row 2 */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label className="text-sm font-semibold">Selling Price (৳)</Label>
                  <Input type="number" value={form.selling_price} onChange={e => setForm({...form, selling_price: e.target.value})} className="mt-1.5" />
                </div>
                <div>
                  <Label className="text-sm font-semibold">Original Price (৳)</Label>
                  <Input type="number" value={form.original_price} onChange={e => setForm({...form, original_price: e.target.value})} className="mt-1.5" />
                </div>
                <div>
                  <Label className="text-sm font-semibold">Additional Cost (৳)</Label>
                  <Input type="number" value={form.additional_cost} onChange={e => setForm({...form, additional_cost: e.target.value})} className="mt-1.5" />
                </div>
              </div>

              {/* Row 3 */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label className="text-sm font-semibold">Stock Quantity</Label>
                  <Input type="number" value={form.stock_quantity} onChange={e => setForm({...form, stock_quantity: e.target.value})} className="mt-1.5" />
                </div>
                <div>
                  <Label className="text-sm font-semibold">Status</Label>
                  <Select value={form.status} onValueChange={v => setForm({...form, status: v})}>
                    <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-sm font-semibold">Category</Label>
                  <Select value={form.category_id} onValueChange={v => setForm({...form, category_id: v})}>
                    <SelectTrigger className="mt-1.5"><SelectValue placeholder="Select category" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No Category</SelectItem>
                      {categories.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Profit display */}
              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200/60">
                <p className="text-xs font-semibold text-emerald-700 uppercase">Profit per unit</p>
                <p className="text-2xl font-bold text-emerald-700">৳{profitPerUnit()}</p>
              </div>

              {/* Descriptions */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-semibold">Short Description</Label>
                  <Textarea placeholder="Brief description..." value={form.short_description} onChange={e => setForm({...form, short_description: e.target.value})} className="mt-1.5" rows={4} />
                </div>
                <div>
                  <Label className="text-sm font-semibold">Detailed Description</Label>
                  <Textarea placeholder="Full details..." value={form.detailed_description} onChange={e => setForm({...form, detailed_description: e.target.value})} className="mt-1.5" rows={4} />
                </div>
              </div>

              {/* YouTube + Note */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-semibold">YouTube Video URL</Label>
                  <Input placeholder="https://youtube.com/..." value={form.youtube_url} onChange={e => setForm({...form, youtube_url: e.target.value})} className="mt-1.5" />
                </div>
                <div>
                  <Label className="text-sm font-semibold">Internal Note</Label>
                  <Input placeholder="Optional note..." value={form.internal_note} onChange={e => setForm({...form, internal_note: e.target.value})} className="mt-1.5" />
                </div>
              </div>

              {/* Toggles */}
              <div className="space-y-3">
                <div className="flex items-center justify-between p-4 rounded-xl bg-secondary/30 border border-border/40">
                  <div><p className="text-sm font-bold text-foreground">Free Delivery</p><p className="text-xs text-muted-foreground">If enabled, no delivery charge will be added</p></div>
                  <Switch checked={form.free_delivery} onCheckedChange={v => setForm({...form, free_delivery: v})} />
                </div>
                <div className="flex items-center justify-between p-4 rounded-xl bg-secondary/30 border border-border/40">
                  <div><p className="text-sm font-bold text-foreground">Accept Orders When Out of Stock</p><p className="text-xs text-muted-foreground">Customers can order even when stock is 0</p></div>
                  <Switch checked={form.allow_out_of_stock_orders} onCheckedChange={v => setForm({...form, allow_out_of_stock_orders: v})} />
                </div>
              </div>

              <Button onClick={handleSave} disabled={saving} className="w-full h-12 text-base font-semibold">
                {saving ? <><Loader2 className="h-4 w-4 animate-spin" /> Saving...</> : editingId ? "Update Product" : "Save Product"}
              </Button>
            </CardContent>
          </Card>
        </div>
      </AdminLayout>
    );
  }

  // List View
  return (
    <AdminLayout>
      <div className="max-w-[1400px] space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Product & Stock</h1>
            <p className="text-muted-foreground text-sm mt-0.5">Manage products, pricing, and stock</p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" className="gap-2" onClick={() => { setLoading(true); Promise.all([fetchProducts(), fetchCategories()]).then(() => setLoading(false)); }}>
              <RefreshCw className="h-4 w-4" /> Refresh
            </Button>
            <Button className="gap-2" onClick={() => { setForm(emptyProduct); setEditingId(null); setView("add"); }}>
              <Plus className="h-4 w-4" /> Add New Product
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1">
          {([
            { id: "products" as TabType, label: "Products", icon: Package },
            { id: "categories" as TabType, label: "Categories", icon: Layers },
          ]).map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id)} className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all ${activeTab === t.id ? "bg-card border border-border shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"}`}>
              <t.icon className="h-4 w-4" />{t.label}
            </button>
          ))}
        </div>

        {activeTab === "products" && (
          <>
            {/* Stats Row 1 */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="border-border/40"><CardContent className="p-5 flex items-center gap-4">
                <div className="p-2.5 rounded-xl bg-emerald-50"><Package className="h-5 w-5 text-emerald-600" /></div>
                <div><p className="text-2xl font-bold text-foreground">{activeProducts}</p><p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Active Products</p></div>
              </CardContent></Card>
              <Card className="border-border/40"><CardContent className="p-5 flex items-center gap-4">
                <div className="p-2.5 rounded-xl bg-red-50"><AlertTriangle className="h-5 w-5 text-red-500" /></div>
                <div><p className="text-2xl font-bold text-foreground">{outOfStock}</p><p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Out of Stock</p></div>
              </CardContent></Card>
              <Card className="border-border/40"><CardContent className="p-5 flex items-center gap-4">
                <div className="p-2.5 rounded-xl bg-blue-50"><ShoppingCart className="h-5 w-5 text-blue-600" /></div>
                <div><p className="text-2xl font-bold text-foreground">{totalStock}</p><p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Total in Stock</p></div>
              </CardContent></Card>
              <Card className="border-border/40"><CardContent className="p-5 flex items-center gap-4">
                <div className="p-2.5 rounded-xl bg-purple-50"><Package className="h-5 w-5 text-purple-600" /></div>
                <div><p className="text-2xl font-bold text-foreground">{products.length}</p><p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Total Products</p></div>
              </CardContent></Card>
            </div>

            {/* Stats Row 2 */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <Card className="border-border/40"><CardContent className="p-5 flex items-center gap-4">
                <div className="p-2.5 rounded-xl bg-amber-50"><DollarSign className="h-5 w-5 text-amber-600" /></div>
                <div><p className="text-2xl font-bold text-foreground">৳{totalCost.toLocaleString()}</p><p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Total Cost Value</p></div>
              </CardContent></Card>
              <Card className="border-border/40"><CardContent className="p-5 flex items-center gap-4">
                <div className="p-2.5 rounded-xl bg-blue-50"><DollarSign className="h-5 w-5 text-blue-600" /></div>
                <div><p className="text-2xl font-bold text-foreground">৳{totalSell.toLocaleString()}</p><p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Total Sell Value</p></div>
              </CardContent></Card>
              <Card className="border-border/40"><CardContent className="p-5 flex items-center gap-4">
                <div className="p-2.5 rounded-xl bg-emerald-50"><TrendingUp className="h-5 w-5 text-emerald-600" /></div>
                <div><p className="text-2xl font-bold text-foreground">৳{profit.toLocaleString()}</p><p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Potential Profit</p></div>
              </CardContent></Card>
            </div>

            {/* Search & Filters */}
            <div className="flex items-center gap-3">
              <div className="flex-1 flex items-center gap-2 bg-card rounded-lg px-4 py-2.5 border border-border/50">
                <Search className="h-4 w-4 text-muted-foreground" />
                <input type="text" placeholder="Search by name or code..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="bg-transparent text-sm outline-none flex-1 text-foreground placeholder:text-muted-foreground" />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-32"><Filter className="h-3.5 w-3.5 mr-1" /><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all-status">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
              <Select value={stockFilter} onValueChange={setStockFilter}>
                <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all-stock">All Stock</SelectItem>
                  <SelectItem value="in-stock">In Stock</SelectItem>
                  <SelectItem value="out-of-stock">Out of Stock</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Products List */}
            <Card className="border-border/40">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Package className="h-5 w-5 text-muted-foreground" />
                  <CardTitle className="text-lg font-bold">Products ({filteredProducts.length})</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex justify-center py-8"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
                ) : filteredProducts.length === 0 ? (
                  <p className="text-center text-muted-foreground py-10">No products found.</p>
                ) : (
                  <div className="space-y-2">
                    {filteredProducts.map(p => (
                      <div key={p.id} className="flex items-center justify-between p-4 rounded-xl border border-border/40 hover:bg-secondary/30 transition-colors">
                        <div>
                          <p className="text-sm font-semibold text-foreground">{p.name}</p>
                          <p className="text-xs text-muted-foreground font-mono">{p.product_code}</p>
                        </div>
                        <div className="flex items-center gap-4 text-sm">
                          <span className="text-muted-foreground">Stock: {p.stock_quantity}</span>
                          <span className="font-semibold text-foreground">৳{Number(p.selling_price).toLocaleString()}</span>
                          <Badge variant={p.status === "active" ? "default" : "secondary"}>{p.status}</Badge>
                          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg" title="Landing Page" onClick={() => openLpDialog(p)}>
                            <Layers className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg" onClick={() => handleEdit(p)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg text-destructive hover:bg-destructive/10" onClick={() => handleDelete(p.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}

        {/* Categories Tab */}
        {activeTab === "categories" && (
          <>
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-foreground">Categories</h2>
                <p className="text-sm text-muted-foreground">Organize products into categories</p>
              </div>
              <Button className="gap-2" onClick={() => setShowCategoryDialog(true)}>
                <Plus className="h-4 w-4" /> New Category
              </Button>
            </div>
            <Card className="border-border/40">
              <CardContent className="p-6">
                {categories.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-center">
                    <Layers className="h-12 w-12 text-muted-foreground/30 mb-4" />
                    <p className="text-sm font-semibold text-foreground mb-1">No categories yet</p>
                    <Button variant="outline" className="gap-2 mt-4" onClick={() => setShowCategoryDialog(true)}><Plus className="h-4 w-4" /> Create Category</Button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {categories.map(c => (
                      <div key={c.id} className="flex items-center justify-between p-4 rounded-xl border border-border/40 hover:bg-secondary/30 transition-colors">
                        <div>
                          <p className="text-sm font-semibold text-foreground">{c.name}</p>
                          <p className="text-xs text-muted-foreground">/{c.slug}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          {c.description && <p className="text-xs text-muted-foreground max-w-xs truncate mr-4">{c.description}</p>}
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive/10" onClick={() => handleDeleteCategory(c.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* New Category Dialog */}
      <Dialog open={showCategoryDialog} onOpenChange={setShowCategoryDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>New Category</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <Label className="text-sm font-semibold">Category Name <span className="text-destructive">*</span></Label>
              <Input placeholder="e.g. Electronics" value={newCategory.name} onChange={e => setNewCategory({...newCategory, name: e.target.value})} className="mt-1.5" />
            </div>
            <div>
              <Label className="text-sm font-semibold">Parent Category</Label>
              <Select value={newCategory.parent_id} onValueChange={v => setNewCategory({...newCategory, parent_id: v})}>
                <SelectTrigger className="mt-1.5"><SelectValue placeholder="None (Top-level)" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None (Top-level)</SelectItem>
                  {categories.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-sm font-semibold">Slug</Label>
              <Input placeholder="category-slug" value={newCategory.slug} onChange={e => setNewCategory({...newCategory, slug: e.target.value})} className="mt-1.5" />
            </div>
            <div>
              <Label className="text-sm font-semibold">Description</Label>
              <Textarea placeholder="Optional..." value={newCategory.description} onChange={e => setNewCategory({...newCategory, description: e.target.value})} className="mt-1.5" rows={3} />
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <Button variant="outline" onClick={() => setShowCategoryDialog(false)}>Cancel</Button>
              <Button onClick={saveCategory}>Create</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Landing Page Creation Dialog */}
      <Dialog open={lpDialogOpen} onOpenChange={setLpDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Layers className="h-5 w-5 text-primary" />
              ল্যান্ডিং পেজ তৈরি করুন
            </DialogTitle>
          </DialogHeader>
          {lpProduct && (
            <div className="space-y-4 mt-2">
              {/* Product Info */}
              <div className="flex items-center gap-3 p-3 rounded-xl bg-secondary/30 border border-border/40">
                {lpProduct.main_image_url ? (
                  <img src={lpProduct.main_image_url} alt="" className="w-12 h-12 rounded-lg object-cover border border-border/50" />
                ) : (
                  <div className="w-12 h-12 rounded-lg bg-secondary flex items-center justify-center">
                    <Package className="h-6 w-6 text-muted-foreground" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-foreground truncate">{lpProduct.name}</p>
                  <p className="text-xs text-muted-foreground">{lpProduct.product_code} • ৳{Number(lpProduct.selling_price).toLocaleString()}</p>
                </div>
                <Badge variant="outline">Stock: {lpProduct.stock_quantity}</Badge>
              </div>

              {/* Existing Landing Pages */}
              {productLandingPages.length > 0 && (
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-muted-foreground">এই প্রোডাক্টের বিদ্যমান ল্যান্ডিং পেজ</Label>
                  <div className="space-y-1">
                    {productLandingPages.map((lp: any) => (
                      <div key={lp.id} className="flex items-center justify-between p-2 rounded-lg bg-secondary/20 border border-border/30 text-xs">
                        <div className="flex items-center gap-2">
                          <Badge variant={lp.is_active ? "default" : "secondary"} className="text-[9px]">{lp.is_active ? "Active" : "Inactive"}</Badge>
                          <span className="font-medium">{lp.title}</span>
                        </div>
                        <a href={`/lp/${lp.slug}`} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline flex items-center gap-1">
                          /{lp.slug} <ExternalLink className="h-3 w-3" />
                        </a>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Template Selection */}
              <div className="space-y-2">
                <Label className="text-sm font-semibold">টেমপ্লেট সিলেক্ট করুন</Label>
                <div className="grid grid-cols-2 gap-2">
                  {templateList.map(t => (
                    <button
                      key={t.id}
                      onClick={() => setLpTemplateId(t.id)}
                      className={`flex items-center gap-2.5 p-3 rounded-xl border-2 text-left transition-all ${
                        lpTemplateId === t.id
                          ? "border-primary bg-primary/5 shadow-sm"
                          : "border-border/40 hover:border-border"
                      }`}
                    >
                      <span className="text-xl">{t.preview}</span>
                      <div>
                        <p className="text-xs font-bold text-foreground">{t.name}</p>
                        <p className="text-[10px] text-muted-foreground leading-tight">{t.description}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Tiered Pricing Toggle */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-semibold">টায়ার্ড প্রাইসিং</Label>
                  <Switch checked={lpTieredEnabled} onCheckedChange={setLpTieredEnabled} />
                </div>
                {lpTieredEnabled && (
                  <div className="space-y-2 p-3 rounded-xl bg-secondary/30 border border-border/40">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label className="text-[10px] text-muted-foreground">১ পিস দাম</Label>
                        <Input value={lpTieredPrice1} onChange={e => setLpTieredPrice1(e.target.value)} placeholder="৬৯০" className="h-8 text-xs" />
                      </div>
                      <div>
                        <Label className="text-[10px] text-muted-foreground">১ পিস লেবেল</Label>
                        <Input value={lpTieredLabel1} onChange={e => setLpTieredLabel1(e.target.value)} placeholder="১ পিস - ৳৬৯০" className="h-8 text-xs" />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label className="text-[10px] text-muted-foreground">২ পিস দাম</Label>
                        <Input value={lpTieredPrice2} onChange={e => setLpTieredPrice2(e.target.value)} placeholder="১২৮০" className="h-8 text-xs" />
                      </div>
                      <div>
                        <Label className="text-[10px] text-muted-foreground">২ পিস লেবেল</Label>
                        <Input value={lpTieredLabel2} onChange={e => setLpTieredLabel2(e.target.value)} placeholder="২ পিস - ৳১২৮০" className="h-8 text-xs" />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label className="text-[10px] text-muted-foreground">৩ পিস দাম</Label>
                        <Input value={lpTieredPrice3} onChange={e => setLpTieredPrice3(e.target.value)} placeholder="১৮০০" className="h-8 text-xs" />
                      </div>
                      <div>
                        <Label className="text-[10px] text-muted-foreground">৩ পিস লেবেল</Label>
                        <Input value={lpTieredLabel3} onChange={e => setLpTieredLabel3(e.target.value)} placeholder="৩ পিস - ৳১৮০০" className="h-8 text-xs" />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="p-3 rounded-xl bg-primary/5 border border-primary/20 text-xs text-muted-foreground space-y-1">
                <p>✅ প্রোডাক্টের নাম, দাম, ছবি, কোড অটো-ফিল হবে</p>
                <p>✅ অর্ডার আসলে স্টক অটো মাইনাস হবে (in_courier এ)</p>
                <p>✅ ল্যান্ডিং পেজ পরে এডিট করতে পারবেন</p>
              </div>

              <Button
                className="w-full gap-2"
                onClick={handleCreateLandingPage}
                disabled={lpCreating}
              >
                {lpCreating ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />}
                ল্যান্ডিং পেজ তৈরি করুন
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default AdminProducts;
