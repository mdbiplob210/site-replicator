import { AdminLayout } from "@/components/admin/AdminLayout";
import { Grid3X3, Save, CheckCircle2, Eye, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useSiteSettings, useUpdateSiteSetting } from "@/hooks/useSiteSettings";

const categoryTemplates = [
  { id: "1", name: "Grid", desc: "Responsive product grid with filters, sorting, and pagination" },
  { id: "2", name: "List", desc: "Horizontal product cards with descriptions, great for detailed browsing" },
  { id: "3", name: "Magazine", desc: "Editorial-style layout with a featured hero product and asymmetric grid" },
];

export default function AdminCategoryTemplate() {
  const { data: settings } = useSiteSettings();
  const updateSetting = useUpdateSiteSetting();
  const active = settings?.active_category_template || "1";

  return (
    <AdminLayout>
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-2xl bg-secondary flex items-center justify-center">
              <Grid3X3 className="h-6 w-6 text-muted-foreground" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Category Page Template</h1>
              <p className="text-sm text-muted-foreground">Choose a layout for category/collection pages</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" className="gap-2"><Eye className="h-4 w-4" /> Visual Editor</Button>
            <Button variant="outline" className="gap-2"><Sparkles className="h-4 w-4" /> Customize</Button>
            <Button className="gap-2"><Save className="h-4 w-4" /> Save</Button>
          </div>
        </div>

        <div>
          <h2 className="text-lg font-bold text-foreground mb-1">Category Page Template</h2>
          <p className="text-sm text-muted-foreground mb-6">Choose how category/collection pages will look on your storefront</p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {categoryTemplates.map((t) => (
              <button
                key={t.id}
                onClick={() => updateSetting.mutate({ key: "active_category_template", value: t.id }, { onSuccess: () => toast.success("টেমপ্লেট আপডেট হয়েছে!") })}
                className={`relative rounded-2xl overflow-hidden border-2 transition-all text-left ${
                  active === t.id ? "border-primary ring-2 ring-primary/20 shadow-lg" : "border-border hover:border-primary/50"
                }`}
              >
                <div className="h-52 bg-secondary/50 relative overflow-hidden p-4">
                  {/* Mock category layout */}
                  <div className="space-y-2">
                    <div className="h-3 w-20 bg-muted-foreground/15 rounded" />
                    <div className="grid grid-cols-3 gap-2">
                      {[1, 2, 3, 4, 5, 6].map((i) => (
                        <div key={i} className="aspect-square bg-muted rounded" />
                      ))}
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
