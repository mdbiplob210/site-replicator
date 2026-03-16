import { useState, useMemo, useRef, useEffect } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import {
  Package, AlertTriangle, History, TrendingDown, TrendingUp, Trash2,
  Plus, Search, BarChart3, Users, ClipboardCheck, Layers, Camera,
  X, Loader2, ArrowDown, ArrowUp, RefreshCw, DollarSign, Eye
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import {
  useInventoryProducts, useLowStockProducts, useUpdateProductInventory,
  useStockMovements, useCreateStockMovement,
  useSuppliers, useCreateSupplier, useDeleteSupplier,
  useStockAudits, useCreateStockAudit, useStockAuditItems,
  useCategoryStockReport
} from "@/hooks/useInventory";

type InvTab = "overview" | "low_stock" | "movements" | "damage" | "suppliers" | "audit" | "category_report" | "profit" | "scanner" | "settings";

export default function AdminInventory() {
  const [tab, setTab] = useState<InvTab>("overview");
  const queryClient = useQueryClient();

  // Data hooks
  const { data: products = [] } = useInventoryProducts();
  const { data: lowStockProducts = [] } = useLowStockProducts();
  const { data: movements = [] } = useStockMovements();
  const { data: suppliers = [] } = useSuppliers();
  const { data: audits = [] } = useStockAudits();
  const { data: categoryReport = [] } = useCategoryStockReport();
  const createMovement = useCreateStockMovement();
  const createSupplier = useCreateSupplier();
  const deleteSupplier = useDeleteSupplier();
  const createAudit = useCreateStockAudit();
  const updateInventory = useUpdateProductInventory();

  // Damage/Loss form
  const [dmgSearch, setDmgSearch] = useState("");
  const [dmgProduct, setDmgProduct] = useState<any>(null);
  const [dmgQty, setDmgQty] = useState("");
  const [dmgType, setDmgType] = useState("damage");
  const [dmgNote, setDmgNote] = useState("");
  const [showDmgDropdown, setShowDmgDropdown] = useState(false);

  // Supplier form
  const [supName, setSupName] = useState("");
  const [supPhone, setSupPhone] = useState("");
  const [supAddress, setSupAddress] = useState("");
  const [supNotes, setSupNotes] = useState("");

  // Audit
  const [selectedAudit, setSelectedAudit] = useState<string | null>(null);
  const { data: auditItems = [] } = useStockAuditItems(selectedAudit || undefined);
  const [auditSearch, setAuditSearch] = useState("");
  const [auditPhysical, setAuditPhysical] = useState("");
  const [auditProduct, setAuditProduct] = useState<any>(null);
  const [showAuditDropdown, setShowAuditDropdown] = useState(false);

  // Settings (batch update thresholds)
  const [settingsSearch, setSettingsSearch] = useState("");
  const [editingProduct, setEditingProduct] = useState<string | null>(null);
  const [editThreshold, setEditThreshold] = useState("");
  const [editReorder, setEditReorder] = useState("");

  // Scanner
  const videoRef = useRef<HTMLVideoElement>(null);
  const [scanning, setScanning] = useState(false);
  const [scanResult, setScanResult] = useState("");

  // Product search filter
  const filterProducts = (q: string) => {
    if (!q) return [];
    const lower = q.toLowerCase();
    return products.filter(p => p.name.toLowerCase().includes(lower) || p.product_code.toLowerCase().includes(lower)).slice(0, 10);
  };

  const fmt = (n: number) => `৳${n.toLocaleString()}`;

  // Overview stats
  const totalProducts = products.length;
  const totalStock = products.reduce((s, p) => s + p.stock_quantity, 0);
  const totalStockValue = products.reduce((s, p) => s + p.stock_quantity * Number(p.purchase_price), 0);
  const outOfStock = products.filter(p => p.stock_quantity === 0).length;
  const lowStockCount = lowStockProducts.length;

  const tabs: { id: InvTab; label: string; icon: any; badge?: number }[] = [
    { id: "overview", label: "Overview", icon: Package },
    { id: "low_stock", label: "Low Stock", icon: AlertTriangle, badge: lowStockCount },
    { id: "movements", label: "History", icon: History },
    { id: "damage", label: "Damage/Loss", icon: TrendingDown },
    { id: "suppliers", label: "Suppliers", icon: Users },
    { id: "audit", label: "Stock Audit", icon: ClipboardCheck },
    { id: "category_report", label: "Category Report", icon: Layers },
    { id: "profit", label: "Profit Analysis", icon: DollarSign },
    { id: "scanner", label: "Scanner", icon: Camera },
    { id: "settings", label: "Settings", icon: RefreshCw },
  ];

  // ── Handle Damage/Loss ──
  const handleDamage = () => {
    if (!dmgProduct || !dmgQty || Number(dmgQty) <= 0) return;
    const qty = Number(dmgQty);
    const prevStock = dmgProduct.stock_quantity;
    const newStock = Math.max(0, prevStock - qty);
    createMovement.mutate({
      product_id: dmgProduct.id,
      product_name: dmgProduct.name,
      movement_type: dmgType,
      quantity: -qty,
      previous_stock: prevStock,
      new_stock: newStock,
      notes: dmgNote || `${dmgType === 'damage' ? 'Damaged' : 'Lost'} items`,
    }, {
      onSuccess: () => {
        setDmgProduct(null); setDmgSearch(""); setDmgQty(""); setDmgNote("");
      }
    });
  };

  // ── Handle Audit Item ──
  const handleAuditItem = async () => {
    if (!selectedAudit || !auditProduct || auditPhysical === "") return;
    const physical = Number(auditPhysical);
    const systemStock = auditProduct.stock_quantity;
    const variance = physical - systemStock;

    const { error } = await supabase
      .from("stock_audit_items" as any)
      .insert({
        audit_id: selectedAudit,
        product_id: auditProduct.id,
        product_name: auditProduct.name,
        product_code: auditProduct.product_code,
        system_stock: systemStock,
        physical_stock: physical,
        variance,
      } as any);

    if (error) { toast.error(error.message); return; }

    // If variance, create stock movement and update product stock
    if (variance !== 0) {
      await supabase.from("stock_movements" as any).insert({
        product_id: auditProduct.id,
        product_name: auditProduct.name,
        movement_type: "audit_correction",
        quantity: variance,
        previous_stock: systemStock,
        new_stock: physical,
        reference_id: selectedAudit,
        notes: `Audit correction: system=${systemStock}, physical=${physical}`,
      } as any);

      await supabase.from("products").update({ stock_quantity: physical }).eq("id", auditProduct.id);
    }

    queryClient.invalidateQueries({ queryKey: ["stock-audit-items"] });
    queryClient.invalidateQueries({ queryKey: ["inventory-products"] });
    queryClient.invalidateQueries({ queryKey: ["stock-movements"] });
    toast.success(`Counted: ${auditProduct.name} (variance: ${variance >= 0 ? '+' : ''}${variance})`);
    setAuditProduct(null); setAuditSearch(""); setAuditPhysical("");
  };

  // ── Scanner ──
  const startScanner = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        setScanning(true);
      }
    } catch {
      toast.error("Camera access denied or not available");
    }
  };

  const stopScanner = () => {
    if (videoRef.current?.srcObject) {
      (videoRef.current.srcObject as MediaStream).getTracks().forEach(t => t.stop());
      videoRef.current.srcObject = null;
    }
    setScanning(false);
  };

  // Manual SKU entry for scanner
  const handleScanLookup = () => {
    if (!scanResult) return;
    const found = products.find(p => p.product_code.toLowerCase() === scanResult.toLowerCase());
    if (found) {
      toast.success(`Found: ${found.name} — Stock: ${found.stock_quantity}`);
    } else {
      toast.error("Product not found with this code");
    }
  };

  const getMovementIcon = (type: string) => {
    if (type.includes("purchase") || type === "return" || type === "audit_correction") return <ArrowDown className="h-3.5 w-3.5 text-emerald-500" />;
    return <ArrowUp className="h-3.5 w-3.5 text-destructive" />;
  };

  const getMovementColor = (qty: number) => qty >= 0 ? "text-emerald-600" : "text-destructive";

  return (
    <AdminLayout>
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Package className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Inventory Management</h1>
            <p className="text-sm text-muted-foreground">Track stock, suppliers, and product movements</p>
          </div>
        </div>

        {/* Overview Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {[
            { label: "Total Products", value: totalProducts, icon: Package },
            { label: "Total Stock", value: totalStock.toLocaleString(), icon: Layers },
            { label: "Stock Value", value: fmt(totalStockValue), icon: DollarSign },
            { label: "Low Stock", value: lowStockCount, icon: AlertTriangle, color: lowStockCount > 0 ? "text-amber-500" : "" },
            { label: "Out of Stock", value: outOfStock, icon: TrendingDown, color: outOfStock > 0 ? "text-destructive" : "" },
          ].map((s, i) => (
            <div key={i} className="bg-card rounded-2xl border border-border p-4">
              <s.icon className={`h-5 w-5 mb-2 ${s.color || "text-muted-foreground"}`} />
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">{s.label}</p>
              <p className={`text-lg font-bold ${s.color || "text-foreground"} mt-1`}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap gap-1 bg-card rounded-2xl border border-border p-2">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-medium transition-all ${
                tab === t.id ? "bg-primary text-primary-foreground shadow-md" : "text-muted-foreground hover:bg-secondary"
              }`}
            >
              <t.icon className="h-3.5 w-3.5" />
              {t.label}
              {t.badge && t.badge > 0 && (
                <span className="ml-1 px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-destructive text-destructive-foreground">{t.badge}</span>
              )}
            </button>
          ))}
        </div>

        {/* ═══ OVERVIEW ═══ */}
        {tab === "overview" && (
          <div className="bg-card rounded-2xl border border-border p-6 space-y-4">
            <p className="font-semibold text-foreground flex items-center gap-2"><Eye className="h-4 w-4" /> Quick Stock Overview</p>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {products.slice(0, 50).map(p => {
                const isLow = p.stock_quantity <= (p as any).low_stock_threshold;
                const isOut = p.stock_quantity === 0;
                return (
                  <div key={p.id} className="flex items-center justify-between p-3 rounded-xl bg-secondary/20 border border-border/40">
                    <div className="flex items-center gap-3">
                      <div className={`h-2 w-2 rounded-full ${isOut ? 'bg-destructive' : isLow ? 'bg-amber-500' : 'bg-emerald-500'}`} />
                      <div>
                        <p className="text-sm font-medium text-foreground">{p.name}</p>
                        <p className="text-xs text-muted-foreground">{p.product_code}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-right">
                      <div>
                        <p className="text-xs text-muted-foreground">Stock</p>
                        <p className={`text-sm font-bold ${isOut ? 'text-destructive' : isLow ? 'text-amber-500' : 'text-foreground'}`}>{p.stock_quantity}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Purchase</p>
                        <p className="text-sm font-semibold text-foreground">{fmt(Number(p.purchase_price))}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Sell</p>
                        <p className="text-sm font-semibold text-foreground">{fmt(Number(p.selling_price))}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ═══ LOW STOCK ALERTS ═══ */}
        {tab === "low_stock" && (
          <div className="bg-card rounded-2xl border border-border p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-lg bg-amber-500/10 flex items-center justify-center"><AlertTriangle className="h-4 w-4 text-amber-500" /></div>
              <div>
                <p className="font-semibold text-foreground">Low Stock Alerts</p>
                <p className="text-xs text-muted-foreground">{lowStockCount} products below threshold</p>
              </div>
            </div>
            {lowStockProducts.length === 0 ? (
              <div className="text-center py-10 text-muted-foreground">
                <Package className="h-10 w-10 mx-auto mb-3 opacity-30" />
                <p className="font-medium">All products have sufficient stock! ✅</p>
              </div>
            ) : (
              <div className="space-y-2">
                {lowStockProducts.map(p => {
                  const needsReorder = p.stock_quantity <= (p as any).reorder_point;
                  return (
                    <div key={p.id} className={`flex items-center justify-between p-3 rounded-xl border ${p.stock_quantity === 0 ? 'bg-destructive/5 border-destructive/20' : 'bg-amber-500/5 border-amber-500/20'}`}>
                      <div>
                        <p className="text-sm font-medium text-foreground">{p.name}</p>
                        <p className="text-xs text-muted-foreground">{p.product_code} · Threshold: {(p as any).low_stock_threshold} · Reorder: {(p as any).reorder_point}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <p className={`text-lg font-bold ${p.stock_quantity === 0 ? 'text-destructive' : 'text-amber-500'}`}>{p.stock_quantity}</p>
                          <p className="text-[10px] text-muted-foreground">in stock</p>
                        </div>
                        {needsReorder && (
                          <span className="px-2 py-1 text-[10px] font-bold rounded-full bg-destructive/10 text-destructive">REORDER NOW</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ═══ STOCK MOVEMENT HISTORY ═══ */}
        {tab === "movements" && (
          <div className="bg-card rounded-2xl border border-border p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-lg bg-secondary flex items-center justify-center"><History className="h-4 w-4 text-foreground" /></div>
              <div>
                <p className="font-semibold text-foreground">Stock Movement History</p>
                <p className="text-xs text-muted-foreground">All stock changes across products</p>
              </div>
            </div>
            {movements.length === 0 ? (
              <div className="text-center py-10 text-muted-foreground">
                <History className="h-10 w-10 mx-auto mb-3 opacity-30" />
                <p className="font-medium">No stock movements recorded yet</p>
              </div>
            ) : (
              <div className="space-y-1.5 max-h-[500px] overflow-y-auto">
                {movements.map((m: any) => (
                  <div key={m.id} className="flex items-center justify-between p-3 rounded-xl bg-secondary/20 border border-border/40">
                    <div className="flex items-center gap-3">
                      {getMovementIcon(m.movement_type)}
                      <div>
                        <p className="text-sm font-medium text-foreground">{m.product_name}</p>
                        <p className="text-xs text-muted-foreground">
                          {m.movement_type.replace(/_/g, ' ')} · {format(new Date(m.created_at), "dd MMM yyyy HH:mm")}
                        </p>
                        {m.notes && <p className="text-xs text-muted-foreground/70 mt-0.5">{m.notes}</p>}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`text-sm font-bold ${getMovementColor(m.quantity)}`}>
                        {m.quantity > 0 ? '+' : ''}{m.quantity}
                      </p>
                      <p className="text-[10px] text-muted-foreground">{m.previous_stock} → {m.new_stock}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ═══ DAMAGE/LOSS TRACKING ═══ */}
        {tab === "damage" && (
          <div className="bg-card rounded-2xl border border-border p-6 space-y-5">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-lg bg-destructive/10 flex items-center justify-center"><TrendingDown className="h-4 w-4 text-destructive" /></div>
              <div><p className="font-semibold text-foreground">Damage / Loss Tracking</p><p className="text-xs text-muted-foreground">Record damaged or lost inventory</p></div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="relative">
                <label className="text-xs font-semibold text-muted-foreground uppercase">Product</label>
                <Input className="mt-1" placeholder="Search product..." value={dmgSearch}
                  onChange={(e) => { setDmgSearch(e.target.value); setShowDmgDropdown(true); }}
                  onFocus={() => setShowDmgDropdown(true)} />
                {showDmgDropdown && dmgSearch && (
                  <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-card border border-border rounded-xl shadow-lg max-h-48 overflow-y-auto">
                    {filterProducts(dmgSearch).map(p => (
                      <button key={p.id} className="w-full text-left px-4 py-2 hover:bg-secondary/50 text-sm"
                        onClick={() => { setDmgProduct(p); setDmgSearch(p.name); setShowDmgDropdown(false); }}>
                        {p.name} <span className="text-muted-foreground">({p.product_code}) — Stock: {p.stock_quantity}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase">Type</label>
                <select value={dmgType} onChange={(e) => setDmgType(e.target.value)}
                  className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                  <option value="damage">Damaged</option>
                  <option value="loss">Lost</option>
                  <option value="adjustment">Manual Adjustment</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase">Quantity</label>
                <Input className="mt-1" type="number" min="1" value={dmgQty} onChange={(e) => setDmgQty(e.target.value)} placeholder="0" />
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase">Note</label>
                <Input className="mt-1" value={dmgNote} onChange={(e) => setDmgNote(e.target.value)} placeholder="Reason..." />
              </div>
            </div>
            {dmgProduct && (
              <div className="text-xs text-muted-foreground p-2 bg-secondary/30 rounded-lg">
                Selected: <span className="font-semibold text-foreground">{dmgProduct.name}</span> — Current Stock: <span className="font-bold">{dmgProduct.stock_quantity}</span>
                {dmgQty && <> → New Stock: <span className="font-bold text-destructive">{Math.max(0, dmgProduct.stock_quantity - Number(dmgQty))}</span></>}
              </div>
            )}
            <Button className="w-full h-11 rounded-2xl bg-destructive hover:bg-destructive/90 text-destructive-foreground"
              onClick={handleDamage} disabled={createMovement.isPending || !dmgProduct || !dmgQty}>
              {createMovement.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Record Damage/Loss"}
            </Button>
          </div>
        )}

        {/* ═══ SUPPLIERS ═══ */}
        {tab === "suppliers" && (
          <div className="space-y-5">
            <div className="bg-card rounded-2xl border border-border p-6 space-y-5">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center"><Users className="h-4 w-4 text-primary" /></div>
                <div><p className="font-semibold text-foreground">Add Supplier</p><p className="text-xs text-muted-foreground">Manage your product suppliers</p></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase">Name *</label>
                  <Input className="mt-1" value={supName} onChange={(e) => setSupName(e.target.value)} placeholder="Supplier name" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase">Phone</label>
                  <Input className="mt-1" value={supPhone} onChange={(e) => setSupPhone(e.target.value)} placeholder="01XXXXXXXXX" />
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase">Address</label>
                <Input className="mt-1" value={supAddress} onChange={(e) => setSupAddress(e.target.value)} placeholder="Address..." />
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase">Notes</label>
                <Textarea className="mt-1" value={supNotes} onChange={(e) => setSupNotes(e.target.value)} placeholder="Additional info..." />
              </div>
              <Button className="w-full h-11 rounded-2xl" onClick={() => {
                if (!supName) return;
                createSupplier.mutate({ name: supName, phone: supPhone || undefined, address: supAddress || undefined, notes: supNotes || undefined });
                setSupName(""); setSupPhone(""); setSupAddress(""); setSupNotes("");
              }} disabled={createSupplier.isPending || !supName}>
                {createSupplier.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Add Supplier"}
              </Button>
            </div>

            {/* Supplier List */}
            <div className="bg-card rounded-2xl border border-border p-6 space-y-3">
              <p className="font-semibold text-foreground">All Suppliers ({suppliers.length})</p>
              {suppliers.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground"><Users className="h-10 w-10 mx-auto mb-3 opacity-30" /><p>No suppliers added yet</p></div>
              ) : suppliers.map((s: any) => (
                <div key={s.id} className="flex items-center justify-between p-3 rounded-xl bg-secondary/20 border border-border/40">
                  <div>
                    <p className="text-sm font-semibold text-foreground">{s.name}</p>
                    <p className="text-xs text-muted-foreground">{[s.phone, s.address].filter(Boolean).join(" · ") || "No contact info"}</p>
                  </div>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => deleteSupplier.mutate(s.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ═══ STOCK AUDIT ═══ */}
        {tab === "audit" && (
          <div className="space-y-5">
            <div className="bg-card rounded-2xl border border-border p-6 space-y-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-lg bg-secondary flex items-center justify-center"><ClipboardCheck className="h-4 w-4 text-foreground" /></div>
                  <div><p className="font-semibold text-foreground">Physical Stock Count</p><p className="text-xs text-muted-foreground">Compare system stock vs physical count</p></div>
                </div>
                <Button className="rounded-xl gap-1.5" onClick={() => createAudit.mutate({ notes: `Audit ${format(new Date(), "dd MMM yyyy")}` })}>
                  <Plus className="h-4 w-4" /> New Audit
                </Button>
              </div>

              {/* Audit list */}
              {audits.length > 0 && (
                <div className="space-y-2">
                  {audits.slice(0, 10).map((a: any) => (
                    <button key={a.id} onClick={() => setSelectedAudit(a.id === selectedAudit ? null : a.id)}
                      className={`w-full text-left p-3 rounded-xl border transition-all ${selectedAudit === a.id ? 'bg-primary/5 border-primary/30' : 'bg-secondary/20 border-border/40 hover:bg-secondary/40'}`}>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-foreground">{a.notes || 'Audit'}</p>
                          <p className="text-xs text-muted-foreground">{format(new Date(a.created_at), "dd MMM yyyy HH:mm")} · {a.status}</p>
                        </div>
                        <span className="text-xs text-muted-foreground">{a.total_items} items counted</span>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {/* Add items to selected audit */}
              {selectedAudit && (
                <div className="border-t border-border pt-4 space-y-4">
                  <p className="text-xs font-semibold text-muted-foreground uppercase">Count a Product</p>
                  <div className="flex items-end gap-3">
                    <div className="flex-1 relative">
                      <Input placeholder="Search product..." value={auditSearch}
                        onChange={(e) => { setAuditSearch(e.target.value); setShowAuditDropdown(true); }}
                        onFocus={() => setShowAuditDropdown(true)} />
                      {showAuditDropdown && auditSearch && (
                        <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-card border border-border rounded-xl shadow-lg max-h-40 overflow-y-auto">
                          {filterProducts(auditSearch).map(p => (
                            <button key={p.id} className="w-full text-left px-4 py-2 hover:bg-secondary/50 text-sm"
                              onClick={() => { setAuditProduct(p); setAuditSearch(p.name); setShowAuditDropdown(false); }}>
                              {p.name} <span className="text-muted-foreground">— System: {p.stock_quantity}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="w-32">
                      <Input type="number" min="0" placeholder="Physical qty" value={auditPhysical} onChange={(e) => setAuditPhysical(e.target.value)} />
                    </div>
                    <Button className="rounded-xl" onClick={handleAuditItem} disabled={!auditProduct || auditPhysical === ""}>
                      Count
                    </Button>
                  </div>

                  {/* Audit items list */}
                  {auditItems.length > 0 && (
                    <div className="space-y-1.5 max-h-64 overflow-y-auto">
                      <div className="grid grid-cols-[1fr_80px_80px_80px] gap-2 text-[10px] font-semibold text-muted-foreground uppercase px-3">
                        <span>Product</span><span className="text-center">System</span><span className="text-center">Physical</span><span className="text-center">Variance</span>
                      </div>
                      {auditItems.map((item: any) => (
                        <div key={item.id} className="grid grid-cols-[1fr_80px_80px_80px] gap-2 items-center p-2 rounded-lg bg-secondary/20">
                          <span className="text-sm text-foreground truncate">{item.product_name}</span>
                          <span className="text-sm text-center text-muted-foreground">{item.system_stock}</span>
                          <span className="text-sm text-center font-medium text-foreground">{item.physical_stock}</span>
                          <span className={`text-sm text-center font-bold ${item.variance === 0 ? 'text-emerald-500' : item.variance > 0 ? 'text-primary' : 'text-destructive'}`}>
                            {item.variance > 0 ? '+' : ''}{item.variance}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ═══ CATEGORY REPORT ═══ */}
        {tab === "category_report" && (
          <div className="bg-card rounded-2xl border border-border p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-lg bg-secondary flex items-center justify-center"><Layers className="h-4 w-4 text-foreground" /></div>
              <div><p className="font-semibold text-foreground">Category-wise Stock Report</p><p className="text-xs text-muted-foreground">Stock distribution across categories</p></div>
            </div>
            {categoryReport.length === 0 ? (
              <div className="text-center py-10 text-muted-foreground"><Layers className="h-10 w-10 mx-auto mb-3 opacity-30" /><p>No data available</p></div>
            ) : (
              <div className="space-y-2">
                {categoryReport.map((cat, i) => {
                  const maxValue = Math.max(...categoryReport.map(c => c.stockValue));
                  const barWidth = maxValue > 0 ? (cat.stockValue / maxValue) * 100 : 0;
                  return (
                    <div key={i} className="p-4 rounded-xl bg-secondary/20 border border-border/40 space-y-2">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-semibold text-foreground">{cat.name}</p>
                          <p className="text-xs text-muted-foreground">{cat.productCount} products · {cat.totalStock} units</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold text-foreground">{fmt(cat.stockValue)}</p>
                          <p className="text-xs text-muted-foreground">Potential: {fmt(cat.potentialRevenue)}</p>
                        </div>
                      </div>
                      <div className="h-2 bg-secondary rounded-full overflow-hidden">
                        <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${barWidth}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ═══ PROFIT ANALYSIS ═══ */}
        {tab === "profit" && (
          <div className="bg-card rounded-2xl border border-border p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-lg bg-emerald-500/10 flex items-center justify-center"><DollarSign className="h-4 w-4 text-emerald-500" /></div>
              <div><p className="font-semibold text-foreground">Profit Per Product</p><p className="text-xs text-muted-foreground">Margin analysis based on current purchase & selling prices</p></div>
            </div>
            <div className="space-y-1.5 max-h-[500px] overflow-y-auto">
              <div className="grid grid-cols-[1fr_90px_90px_90px_70px] gap-2 text-[10px] font-semibold text-muted-foreground uppercase px-3 sticky top-0 bg-card py-1">
                <span>Product</span><span className="text-right">Purchase</span><span className="text-right">Sell</span><span className="text-right">Profit</span><span className="text-right">Margin</span>
              </div>
              {products
                .map(p => ({
                  ...p,
                  profit: Number(p.selling_price) - Number(p.purchase_price),
                  margin: Number(p.selling_price) > 0 ? ((Number(p.selling_price) - Number(p.purchase_price)) / Number(p.selling_price) * 100) : 0,
                }))
                .sort((a, b) => b.margin - a.margin)
                .map(p => (
                  <div key={p.id} className="grid grid-cols-[1fr_90px_90px_90px_70px] gap-2 items-center p-2 rounded-lg bg-secondary/20">
                    <div>
                      <p className="text-sm font-medium text-foreground truncate">{p.name}</p>
                      <p className="text-xs text-muted-foreground">{p.product_code} · Stock: {p.stock_quantity}</p>
                    </div>
                    <p className="text-sm text-right text-muted-foreground">{fmt(Number(p.purchase_price))}</p>
                    <p className="text-sm text-right text-foreground">{fmt(Number(p.selling_price))}</p>
                    <p className={`text-sm text-right font-bold ${p.profit >= 0 ? 'text-emerald-600' : 'text-destructive'}`}>{fmt(p.profit)}</p>
                    <p className={`text-sm text-right font-semibold ${p.margin >= 20 ? 'text-emerald-600' : p.margin >= 10 ? 'text-amber-500' : 'text-destructive'}`}>
                      {p.margin.toFixed(1)}%
                    </p>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* ═══ BARCODE/SKU SCANNER ═══ */}
        {tab === "scanner" && (
          <div className="bg-card rounded-2xl border border-border p-6 space-y-5">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-lg bg-secondary flex items-center justify-center"><Camera className="h-4 w-4 text-foreground" /></div>
              <div><p className="font-semibold text-foreground">Barcode / SKU Scanner</p><p className="text-xs text-muted-foreground">Scan or enter product code to look up stock</p></div>
            </div>

            <div className="flex gap-3">
              <Button variant={scanning ? "destructive" : "default"} className="rounded-xl gap-1.5"
                onClick={scanning ? stopScanner : startScanner}>
                <Camera className="h-4 w-4" />
                {scanning ? "Stop Camera" : "Open Camera"}
              </Button>
            </div>

            {scanning && (
              <div className="rounded-xl overflow-hidden border border-border aspect-video bg-black">
                <video ref={videoRef} className="w-full h-full object-cover" />
              </div>
            )}

            <div className="flex items-end gap-3">
              <div className="flex-1">
                <label className="text-xs font-semibold text-muted-foreground uppercase">Product Code / SKU</label>
                <Input className="mt-1" value={scanResult} onChange={(e) => setScanResult(e.target.value)} placeholder="Enter or scan product code..." />
              </div>
              <Button className="rounded-xl" onClick={handleScanLookup} disabled={!scanResult}>
                <Search className="h-4 w-4 mr-1.5" /> Look Up
              </Button>
            </div>

            {scanResult && (() => {
              const found = products.find(p => p.product_code.toLowerCase() === scanResult.toLowerCase());
              if (!found) return null;
              return (
                <div className="p-4 rounded-xl bg-secondary/30 border border-border/40 space-y-2">
                  <p className="text-lg font-bold text-foreground">{found.name}</p>
                  <div className="grid grid-cols-4 gap-3">
                    <div><p className="text-xs text-muted-foreground">Code</p><p className="text-sm font-semibold">{found.product_code}</p></div>
                    <div><p className="text-xs text-muted-foreground">Stock</p><p className="text-sm font-bold text-foreground">{found.stock_quantity}</p></div>
                    <div><p className="text-xs text-muted-foreground">Purchase</p><p className="text-sm font-semibold">{fmt(Number(found.purchase_price))}</p></div>
                    <div><p className="text-xs text-muted-foreground">Sell</p><p className="text-sm font-semibold">{fmt(Number(found.selling_price))}</p></div>
                  </div>
                </div>
              );
            })()}
          </div>
        )}

        {/* ═══ SETTINGS (Threshold Management) ═══ */}
        {tab === "settings" && (
          <div className="bg-card rounded-2xl border border-border p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-lg bg-secondary flex items-center justify-center"><RefreshCw className="h-4 w-4 text-foreground" /></div>
              <div><p className="font-semibold text-foreground">Inventory Settings</p><p className="text-xs text-muted-foreground">Set low stock thresholds & reorder points per product</p></div>
            </div>
            <Input placeholder="Search products..." value={settingsSearch} onChange={(e) => setSettingsSearch(e.target.value)} />
            <div className="space-y-1.5 max-h-[400px] overflow-y-auto">
              {products
                .filter(p => !settingsSearch || p.name.toLowerCase().includes(settingsSearch.toLowerCase()) || p.product_code.toLowerCase().includes(settingsSearch.toLowerCase()))
                .slice(0, 30)
                .map(p => (
                  <div key={p.id} className="flex items-center justify-between p-3 rounded-xl bg-secondary/20 border border-border/40">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-foreground">{p.name}</p>
                      <p className="text-xs text-muted-foreground">{p.product_code} · Stock: {p.stock_quantity}</p>
                    </div>
                    {editingProduct === p.id ? (
                      <div className="flex items-center gap-2">
                        <div className="w-20">
                          <Input type="number" min="0" value={editThreshold} onChange={(e) => setEditThreshold(e.target.value)} className="h-8 text-xs" placeholder="Threshold" />
                        </div>
                        <div className="w-20">
                          <Input type="number" min="0" value={editReorder} onChange={(e) => setEditReorder(e.target.value)} className="h-8 text-xs" placeholder="Reorder" />
                        </div>
                        <Button size="sm" className="h-8 rounded-lg text-xs" onClick={() => {
                          updateInventory.mutate({ id: p.id, low_stock_threshold: Number(editThreshold), reorder_point: Number(editReorder) });
                          setEditingProduct(null);
                        }}>Save</Button>
                        <Button size="sm" variant="ghost" className="h-8 rounded-lg text-xs" onClick={() => setEditingProduct(null)}>
                          <X className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-3">
                        <div className="text-right text-xs">
                          <span className="text-muted-foreground">Threshold: </span><span className="font-semibold">{(p as any).low_stock_threshold}</span>
                          <span className="text-muted-foreground ml-2">Reorder: </span><span className="font-semibold">{(p as any).reorder_point}</span>
                        </div>
                        <Button size="sm" variant="outline" className="h-7 rounded-lg text-xs" onClick={() => {
                          setEditingProduct(p.id);
                          setEditThreshold(String((p as any).low_stock_threshold));
                          setEditReorder(String((p as any).reorder_point));
                        }}>Edit</Button>
                      </div>
                    )}
                  </div>
                ))}
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
