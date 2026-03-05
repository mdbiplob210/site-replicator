import { AdminLayout } from "@/components/admin/AdminLayout";
import { ShoppingBag, Save, CheckCircle2, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSiteSettings, useUpdateSiteSetting } from "@/hooks/useSiteSettings";

const checkouts = [
  { id: "1", name: "Standard", desc: "Clean single-page checkout with all fields visible", style: "bg-gradient-to-b from-orange-50 to-white" },
  { id: "2", name: "Compact", desc: "Condensed layout optimized for quick purchases", style: "bg-gradient-to-b from-gray-900 to-gray-800" },
  { id: "3", name: "Minimal", desc: "Single-column streamlined checkout for quick, distraction-free ordering", style: "bg-gradient-to-b from-stone-100 to-white" },
  { id: "4", name: "Modern Dark", desc: "Dark themed checkout with modern card layout", style: "bg-gradient-to-b from-gray-950 to-gray-900" },
  { id: "5", name: "Bold", desc: "Bold brutalist checkout with strong visual hierarchy", style: "bg-gradient-to-b from-zinc-200 to-white" },
];

export default function AdminCheckoutTemplate() {
  const { data: settings } = useSiteSettings();
  const updateSetting = useUpdateSiteSetting();
  const activeCheckout = settings?.active_checkout || "1";

  return (
    <AdminLayout>
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-2xl bg-secondary flex items-center justify-center">
              <ShoppingBag className="h-6 w-6 text-muted-foreground" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Checkout Templates</h1>
              <p className="text-sm text-muted-foreground">Select a checkout page style</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" className="gap-2">
              <Settings className="h-4 w-4" /> Settings
            </Button>
            <Button className="gap-2">
              <Save className="h-4 w-4" /> Save
            </Button>
          </div>
        </div>

        {/* Checkout Templates */}
        <div>
          <h2 className="text-lg font-bold text-foreground mb-1">Checkout Page Template</h2>
          <p className="text-sm text-muted-foreground mb-6">Choose how your customers will complete their orders</p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {checkouts.map((c) => (
              <button
                key={c.id}
                onClick={() => updateSetting.mutate({ key: "active_checkout", value: c.id })}
                className={`relative rounded-2xl overflow-hidden border-2 transition-all text-left ${
                  activeCheckout === c.id
                    ? "border-primary ring-2 ring-primary/20 shadow-lg"
                    : "border-border hover:border-primary/50"
                }`}
              >
                {/* Preview */}
                <div className={`h-48 ${c.style} relative overflow-hidden p-4`}>
                  {/* Mock checkout layout */}
                  <div className="space-y-2">
                    <div className="h-2 w-20 bg-black/10 rounded" />
                    <div className="flex gap-3">
                      <div className="flex-1 space-y-2">
                        <div className="h-6 w-full bg-black/5 rounded border border-black/10" />
                        <div className="h-6 w-full bg-black/5 rounded border border-black/10" />
                        <div className="h-6 w-full bg-black/5 rounded border border-black/10" />
                      </div>
                      <div className="w-24 space-y-2">
                        <div className="h-16 w-full bg-black/5 rounded border border-black/10" />
                        <div className="h-6 w-full bg-primary/20 rounded" />
                      </div>
                    </div>
                  </div>
                  {activeCheckout === c.id && (
                    <div className="absolute inset-0 bg-primary/10 flex items-center justify-center">
                      <div className="h-12 w-12 rounded-full bg-primary flex items-center justify-center">
                        <CheckCircle2 className="h-7 w-7 text-primary-foreground" />
                      </div>
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <h3 className="font-bold text-sm text-foreground">{c.name}</h3>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{c.desc}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
