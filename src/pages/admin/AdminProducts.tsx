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
import { useToast } from "@/hooks/use-toast";
import {
  Package, Layers, Plus, Search, RefreshCw, ArrowLeft,
  Upload, DollarSign, TrendingUp, AlertTriangle, ShoppingCart,
  Image as ImageIcon, Filter
} from "lucide-react";

type TabType = "products" | "categories";
type ViewType = "list" | "add";

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
}

interface Category {
  id: string;
  name: string;
  slug: string;
  parent_id: string | null;
  description: string | null;
  image_url: string | null;
}

const AdminProducts = () => {
  const [activeTab, setActiveTab] = useState<TabType>("products");
  const [view, setView] = useState<ViewType>("list");
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCategoryDialog, setShowCategoryDialog] = useState(false);
  const { toast } = useToast();

  // New product form
  const [newProduct, setNewProduct] = useState({
    name: "", product_code: "", purchase_price: "0.00", selling_price: "0.00",
    original_price: "0.00", additional_cost: "0", stock_quantity: "0",
    short_description: "", detailed_description: "", youtube_url: "",
    internal_note: "", free_delivery: false, allow_out_of_stock_orders: false,
    category_id: "",
  });

  // New category form
  const [newCategory, setNewCategory] = useState({
    name: "", slug: "", parent_id: "", description: "",
  });

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

  const activeProducts = products.filter(p => p.status === "active").length;
  const outOfStock = products.filter(p => p.stock_quantity <= 0).length;
  const totalStock = products.reduce((sum, p) => sum + p.stock_quantity, 0);
  const totalCost = products.reduce((sum, p) => sum + Number(p.purchase_price) * p.stock_quantity, 0);
  const totalSell = products.reduce((sum, p) => sum + Number(p.selling_price) * p.stock_quantity, 0);
  const profit = totalSell - totalCost;

  const profitPerUnit = (p: typeof newProduct) => {
    const sell = parseFloat(p.selling_price) || 0;
    const buy = parseFloat(p.purchase_price) || 0;
    const extra = parseFloat(p.additional_cost) || 0;
    return (sell - buy - extra).toFixed(2);
  };

  const saveProduct = async () => {
    if (!newProduct.name || !newProduct.product_code) {
      toast({ title: "ত্রুটি", description: "Product Name এবং Code আবশ্যক", variant: "destructive" });
      return;
    }
    const { error } = await supabase.from("products").insert({
      name: newProduct.name,
      product_code: newProduct.product_code,
      purchase_price: parseFloat(newProduct.purchase_price) || 0,
      selling_price: parseFloat(newProduct.selling_price) || 0,
      original_price: parseFloat(newProduct.original_price) || 0,
      additional_cost: parseFloat(newProduct.additional_cost) || 0,
      stock_quantity: parseInt(newProduct.stock_quantity) || 0,
      short_description: newProduct.short_description || null,
      detailed_description: newProduct.detailed_description || null,
      youtube_url: newProduct.youtube_url || null,
      internal_note: newProduct.internal_note || null,
      free_delivery: newProduct.free_delivery,
      allow_out_of_stock_orders: newProduct.allow_out_of_stock_orders,
      category_id: newProduct.category_id || null,
    } as any);

    if (error) {
      toast({ title: "ত্রুটি", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "সফল!", description: "প্রোডাক্ট সেভ হয়েছে" });
      setView("list");
      fetchProducts();
    }
  };

  const saveCategory = async () => {
    if (!newCategory.name) {
      toast({ title: "ত্রুটি", description: "Category Name আবশ্যক", variant: "destructive" });
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
      toast({ title: "ত্রুটি", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "সফল!", description: "ক্যাটেগরি তৈরি হয়েছে" });
      setShowCategoryDialog(false);
      setNewCategory({ name: "", slug: "", parent_id: "", description: "" });
      fetchCategories();
    }
  };

  // Add New Product View
  if (view === "add") {
    return (
      <AdminLayout>
        <div className="max-w-[1400px] space-y-6">
          <div className="flex items-center gap-3">
            <button onClick={() => setView("list")} className="p-2 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Add New Product</h1>
              <p className="text-muted-foreground text-sm">Fill in the details to add a new product to your inventory</p>
            </div>
          </div>

          <Card className="border-border/40">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Plus className="h-5 w-5 text-muted-foreground" />
                <CardTitle className="text-lg font-bold">Add New Product</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Images */}
              <div className="space-y-4">
                <div>
                  <Label className="text-sm font-semibold">Main Image</Label>
                  <div className="mt-2 h-28 w-28 border-2 border-dashed border-border rounded-xl flex flex-col items-center justify-center gap-1 cursor-pointer hover:border-primary/50 transition-colors">
                    <ImageIcon className="h-6 w-6 text-muted-foreground" />
                    <span className="text-[11px] text-muted-foreground">Upload</span>
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-semibold">Additional Images (0/5)</Label>
                  <div className="mt-2 h-16 w-16 border-2 border-dashed border-border rounded-xl flex items-center justify-center cursor-pointer hover:border-primary/50 transition-colors">
                    <ImageIcon className="h-5 w-5 text-muted-foreground" />
                  </div>
                </div>
              </div>

              {/* Row 1: Name, Code, Purchase Price */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label className="text-sm font-semibold">Product Name</Label>
                  <Input placeholder="e.g. Smart Watch" value={newProduct.name} onChange={e => setNewProduct({...newProduct, name: e.target.value})} className="mt-1.5" />
                </div>
                <div>
                  <Label className="text-sm font-semibold">Product Code <span className="text-destructive">*</span></Label>
                  <Input placeholder="e.g. BCGH-001" value={newProduct.product_code} onChange={e => setNewProduct({...newProduct, product_code: e.target.value})} className="mt-1.5 font-mono" />
                  <p className="text-[11px] text-muted-foreground mt-1">Used for Meta Ads campaign matching. Must be unique.</p>
                </div>
                <div>
                  <Label className="text-sm font-semibold">Purchase Price (৳)</Label>
                  <Input type="number" value={newProduct.purchase_price} onChange={e => setNewProduct({...newProduct, purchase_price: e.target.value})} className="mt-1.5" />
                </div>
              </div>

              {/* Row 2: Selling, Original, Additional Cost */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label className="text-sm font-semibold">Selling Price (৳)</Label>
                  <Input type="number" value={newProduct.selling_price} onChange={e => setNewProduct({...newProduct, selling_price: e.target.value})} className="mt-1.5" />
                </div>
                <div>
                  <Label className="text-sm font-semibold">Original Price (৳)</Label>
                  <Input type="number" value={newProduct.original_price} onChange={e => setNewProduct({...newProduct, original_price: e.target.value})} className="mt-1.5" />
                  <p className="text-[11px] text-muted-foreground mt-1 font-['Hind_Siliguri']">এটি সেলিং প্রাইসের চেয়ে বেশি হলে ওয়েবসাইটে কেটে দেখাবে</p>
                </div>
                <div>
                  <Label className="text-sm font-semibold">Additional Cost (৳)</Label>
                  <Input type="number" value={newProduct.additional_cost} onChange={e => setNewProduct({...newProduct, additional_cost: e.target.value})} className="mt-1.5" />
                </div>
              </div>

              {/* Row 3: Stock, Profit */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-semibold">Stock Quantity</Label>
                  <Input type="number" value={newProduct.stock_quantity} onChange={e => setNewProduct({...newProduct, stock_quantity: e.target.value})} className="mt-1.5" />
                </div>
                <div>
                  <Label className="text-sm font-semibold">Profit/Unit</Label>
                  <div className="mt-1.5 h-10 px-3 rounded-md border border-border bg-emerald-50 flex items-center text-emerald-700 font-bold">
                    ৳{profitPerUnit(newProduct)}
                  </div>
                </div>
              </div>

              {/* Descriptions */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-semibold">Short Description</Label>
                  <Textarea placeholder="Brief product description for listings..." value={newProduct.short_description} onChange={e => setNewProduct({...newProduct, short_description: e.target.value})} className="mt-1.5" rows={4} />
                </div>
                <div>
                  <Label className="text-sm font-semibold">Detailed Description</Label>
                  <Textarea placeholder="Full product details, specs, features..." value={newProduct.detailed_description} onChange={e => setNewProduct({...newProduct, detailed_description: e.target.value})} className="mt-1.5" rows={4} />
                </div>
              </div>

              {/* YouTube + Internal Note */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-semibold">YouTube Video URL</Label>
                  <Input placeholder="https://www.youtube.com/watch?v=..." value={newProduct.youtube_url} onChange={e => setNewProduct({...newProduct, youtube_url: e.target.value})} className="mt-1.5" />
                </div>
                <div>
                  <Label className="text-sm font-semibold">Internal Note</Label>
                  <Input placeholder="Optional internal note..." value={newProduct.internal_note} onChange={e => setNewProduct({...newProduct, internal_note: e.target.value})} className="mt-1.5" />
                </div>
              </div>

              {/* Toggles */}
              <div className="space-y-3">
                <div className="flex items-center justify-between p-4 rounded-xl bg-secondary/30 border border-border/40">
                  <div>
                    <p className="text-sm font-bold text-foreground font-['Hind_Siliguri']">ফ্রি ডেলিভারি</p>
                    <p className="text-xs text-muted-foreground font-['Hind_Siliguri']">এটি চালু থাকলে এই প্রোডাক্টে ডেলিভারি চার্জ যোগ হবে না</p>
                  </div>
                  <Switch checked={newProduct.free_delivery} onCheckedChange={v => setNewProduct({...newProduct, free_delivery: v})} />
                </div>
                <div className="flex items-center justify-between p-4 rounded-xl bg-secondary/30 border border-border/40">
                  <div>
                    <p className="text-sm font-bold text-foreground font-['Hind_Siliguri']">স্টক শেষ হলেও অর্ডার নিন</p>
                    <p className="text-xs text-muted-foreground font-['Hind_Siliguri']">এটি চালু থাকলে স্টক ০ হলেও কাস্টমার অর্ডার দিতে পারবে</p>
                  </div>
                  <Switch checked={newProduct.allow_out_of_stock_orders} onCheckedChange={v => setNewProduct({...newProduct, allow_out_of_stock_orders: v})} />
                </div>
              </div>

              {/* Save */}
              <Button onClick={saveProduct} className="w-full h-12 text-base font-semibold bg-primary text-primary-foreground">
                Save Product
              </Button>

              <p className="text-center text-sm text-muted-foreground font-['Hind_Siliguri']">
                প্রথমে প্রোডাক্ট সেভ করুন, তারপর Attribute (Color/Size) ও Variant যোগ করতে পারবেন।
              </p>
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
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Product & Stock</h1>
            <p className="text-muted-foreground text-sm mt-0.5">Manage products, pricing, and stock</p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" className="gap-2">
              <RefreshCw className="h-4 w-4" />
              Product Sync
            </Button>
            <Button className="gap-2 bg-primary text-primary-foreground" onClick={() => setView("add")}>
              <Plus className="h-4 w-4" />
              Add New Product
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1">
          {([
            { id: "products" as TabType, label: "Products", icon: Package },
            { id: "categories" as TabType, label: "Categories", icon: Layers },
          ]).map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all ${
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

        {/* Products Tab */}
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
                <div><p className="text-2xl font-bold text-foreground">৳{totalCost}</p><p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Total Cost Value</p></div>
              </CardContent></Card>
              <Card className="border-border/40"><CardContent className="p-5 flex items-center gap-4">
                <div className="p-2.5 rounded-xl bg-blue-50"><DollarSign className="h-5 w-5 text-blue-600" /></div>
                <div><p className="text-2xl font-bold text-foreground">৳{totalSell}</p><p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Total Sell Value</p></div>
              </CardContent></Card>
              <Card className="border-border/40"><CardContent className="p-5 flex items-center gap-4">
                <div className="p-2.5 rounded-xl bg-emerald-50"><TrendingUp className="h-5 w-5 text-emerald-600" /></div>
                <div><p className="text-2xl font-bold text-foreground">৳{profit}</p><p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Potential Profit</p></div>
              </CardContent></Card>
            </div>

            {/* Search & Filters */}
            <div className="flex items-center gap-3">
              <div className="flex-1 flex items-center gap-2 bg-card rounded-lg px-4 py-2.5 border border-border/50">
                <Search className="h-4 w-4 text-muted-foreground" />
                <input type="text" placeholder="Search by name or code..." className="bg-transparent text-sm outline-none flex-1 text-foreground placeholder:text-muted-foreground" />
              </div>
              <Select defaultValue="all-status">
                <SelectTrigger className="w-32"><Filter className="h-3.5 w-3.5 mr-1" /><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all-status">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
              <Select defaultValue="all-stock">
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
                  <CardTitle className="text-lg font-bold">Products ({products.length})</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
                  </div>
                ) : products.length === 0 ? (
                  <p className="text-center text-muted-foreground py-10">No products yet. Add your first product above.</p>
                ) : (
                  <div className="space-y-2">
                    {products.map(p => (
                      <div key={p.id} className="flex items-center justify-between p-4 rounded-xl border border-border/40 hover:bg-secondary/30 transition-colors">
                        <div>
                          <p className="text-sm font-semibold text-foreground">{p.name}</p>
                          <p className="text-xs text-muted-foreground font-mono">{p.product_code}</p>
                        </div>
                        <div className="flex items-center gap-6 text-sm">
                          <span className="text-muted-foreground">Stock: {p.stock_quantity}</span>
                          <span className="font-semibold text-foreground">৳{p.selling_price}</span>
                          <Badge variant={p.status === "active" ? "default" : "secondary"}>{p.status}</Badge>
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
                <p className="text-sm text-muted-foreground">Organize products into categories and subcategories</p>
              </div>
              <Button className="gap-2 bg-primary text-primary-foreground" onClick={() => setShowCategoryDialog(true)}>
                <Plus className="h-4 w-4" />
                New Category
              </Button>
            </div>

            <Card className="border-border/40">
              <CardContent className="p-6">
                {categories.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-center">
                    <Layers className="h-12 w-12 text-muted-foreground/30 mb-4" />
                    <p className="text-sm font-semibold text-foreground mb-1">No categories yet</p>
                    <p className="text-xs text-muted-foreground mb-4">Create your first category to organize products</p>
                    <Button variant="outline" className="gap-2" onClick={() => setShowCategoryDialog(true)}>
                      <Plus className="h-4 w-4" />
                      Create Category
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {categories.map(c => (
                      <div key={c.id} className="flex items-center justify-between p-4 rounded-xl border border-border/40 hover:bg-secondary/30 transition-colors">
                        <div>
                          <p className="text-sm font-semibold text-foreground">{c.name}</p>
                          <p className="text-xs text-muted-foreground">/{c.slug}</p>
                        </div>
                        {c.description && <p className="text-xs text-muted-foreground max-w-xs truncate">{c.description}</p>}
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
            <p className="text-sm text-muted-foreground">Create a new category with image and custom link</p>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <Label className="text-sm font-semibold">Category Name <span className="text-destructive">*</span></Label>
              <Input placeholder="e.g. Electronics, Clothing" value={newCategory.name} onChange={e => setNewCategory({...newCategory, name: e.target.value})} className="mt-1.5" />
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
              <p className="text-[11px] text-muted-foreground mt-1">Select a parent to make this a subcategory</p>
            </div>
            <div>
              <Label className="text-sm font-semibold">Category Link (Slug)</Label>
              <div className="flex items-center mt-1.5">
                <span className="text-sm text-muted-foreground mr-1">/</span>
                <Input placeholder="category-slug" value={newCategory.slug} onChange={e => setNewCategory({...newCategory, slug: e.target.value})} />
              </div>
              <p className="text-[11px] text-muted-foreground mt-1">This URL path will be used for the category page</p>
            </div>
            <div>
              <Label className="text-sm font-semibold">Description</Label>
              <Textarea placeholder="Optional description..." value={newCategory.description} onChange={e => setNewCategory({...newCategory, description: e.target.value})} className="mt-1.5" rows={3} />
            </div>
            <div>
              <Label className="text-sm font-semibold">Category Image</Label>
              <div className="mt-2 h-24 border-2 border-dashed border-border rounded-xl flex flex-col items-center justify-center gap-1 cursor-pointer hover:border-primary/50 transition-colors">
                <Upload className="h-5 w-5 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">Click to upload image</span>
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <Button variant="outline" onClick={() => setShowCategoryDialog(false)}>Cancel</Button>
              <Button onClick={saveCategory} className="bg-primary text-primary-foreground">Create</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default AdminProducts;
