import { AdminLayout } from "@/components/admin/AdminLayout";
import { Gift, Save, CheckCircle2, Eye, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useSiteSettings, useUpdateSiteSetting } from "@/hooks/useSiteSettings";

const productTemplates = [
  { id: "1", name: "Modern", desc: "Clean layout with image gallery, ratings, trust badges, and quantity selector" },
  { id: "2", name: "Classic", desc: "Elegant serif typography with a premium, editorial feel" },
  { id: "3", name: "Minimal", desc: "Centered, stripped-down layout focused on the product itself" },
];

export default function AdminProductTemplate() {
  const { data: settings } = useSiteSettings();
  const updateSetting = useUpdateSiteSetting();
  const active = settings?.active_product_template || "1";

  return (
    <AdminLayout>
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-2xl bg-secondary flex items-center justify-center">
              <Gift className="h-6 w-6 text-muted-foreground" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Product Page Template</h1>
              <p className="text-sm text-muted-foreground">Choose a layout for individual product pages</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" className="gap-2"><Eye className="h-4 w-4" /> Visual Editor</Button>
            <Button variant="outline" className="gap-2"><Sparkles className="h-4 w-4" /> Customize</Button>
            <Button className="gap-2"><Save className="h-4 w-4" /> Save</Button>
          </div>
        </div>

        <div>
          <h2 className="text-lg font-bold text-foreground mb-1">Product Page Template</h2>
          <p className="text-sm text-muted-foreground mb-6">Choose how individual product pages will look on your storefront</p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {productTemplates.map((t) => (
              <button
                key={t.id}
                onClick={() => updateSetting.mutate({ key: "active_product_template", value: t.id }, { onSuccess: () => toast.success("টেমপ্লেট আপডেট হয়েছে!") })}
                className={`relative rounded-2xl overflow-hidden border-2 transition-all text-left ${
                  active === t.id ? "border-primary ring-2 ring-primary/20 shadow-lg" : "border-border hover:border-primary/50"
                }`}
              >
                <div className="h-52 bg-secondary/50 relative overflow-hidden p-4">
                  {/* Mock product page */}
                  <div className="flex gap-3 h-full">
                    <div className="w-1/2 bg-muted rounded-lg flex items-center justify-center">
                      <div className="w-16 h-20 bg-muted-foreground/10 rounded" />
                    </div>
                    <div className="w-1/2 space-y-2 pt-2">
                      <div className="h-3 w-3/4 bg-muted-foreground/15 rounded" />
                      <div className="h-4 w-1/2 bg-muted-foreground/20 rounded" />
                      <div className="h-2 w-full bg-muted-foreground/10 rounded" />
                      <div className="h-2 w-4/5 bg-muted-foreground/10 rounded" />
                      <div className="mt-4 space-y-1.5">
                        <div className="h-7 w-full bg-primary/20 rounded" />
                        <div className="h-7 w-full bg-muted-foreground/10 rounded" />
                      </div>
                    </div>
                  </div>
                  {active === t.id && (
                    <div className="absolute top-3 right-3">
                      <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center">
                        <CheckCircle2 className="h-5 w-5 text-primary-foreground" />
                      </div>
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <h3 className="font-bold text-sm text-foreground">{t.name}</h3>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{t.desc}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
