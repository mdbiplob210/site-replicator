import { AdminLayout } from "@/components/admin/AdminLayout";
import { Heart, Save, CheckCircle2, Eye } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useSiteSettings, useUpdateSiteSetting } from "@/hooks/useSiteSettings";

const thankYouTemplates = [
  { id: "1", name: "Warm Celebration", desc: "Warm-toned confirmation page with green checkmark, confetti animation, and golden CTA button" },
  { id: "2", name: "Clean Minimal", desc: "Simple white confirmation with order details and tracking info" },
  { id: "3", name: "Dark Premium", desc: "Elegant dark themed confirmation with premium feel" },
];

export default function AdminThankYouTemplate() {
  const { data: settings } = useSiteSettings();
  const updateSetting = useUpdateSiteSetting();
  const active = settings?.active_thankyou_template || "1";

  return (
    <AdminLayout>
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-2xl bg-secondary flex items-center justify-center">
              <Heart className="h-6 w-6 text-muted-foreground" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Thank You Page</h1>
              <p className="text-sm text-muted-foreground">Choose the order confirmation page your customers see</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" className="gap-2"><Eye className="h-4 w-4" /> Visual Editor</Button>
            <Button className="gap-2"><Save className="h-4 w-4" /> Save</Button>
          </div>
        </div>

        <div>
          <h2 className="text-lg font-bold text-foreground mb-1">Thank You Page Template</h2>
          <p className="text-sm text-muted-foreground mb-6">Choose what customers see after placing an order</p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {thankYouTemplates.map((t) => (
              <button
                key={t.id}
                onClick={() => updateSetting.mutate({ key: "active_thankyou_template", value: t.id }, { onSuccess: () => toast.success("টেমপ্লেট আপডেট হয়েছে!") })}
                className={`relative rounded-2xl overflow-hidden border-2 transition-all text-left ${
                  active === t.id ? "border-primary ring-2 ring-primary/20 shadow-lg" : "border-border hover:border-primary/50"
                }`}
              >
                <div className="h-52 bg-gradient-to-b from-green-50 to-white relative overflow-hidden flex items-center justify-center">
                  <div className="text-center space-y-2">
                    <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center mx-auto">
                      <CheckCircle2 className="h-6 w-6 text-green-500" />
                    </div>
                    <div className="h-3 w-24 bg-muted-foreground/15 rounded mx-auto" />
                    <div className="h-2 w-32 bg-muted-foreground/10 rounded mx-auto" />
                    <div className="h-6 w-20 bg-primary/20 rounded mx-auto mt-2" />
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
