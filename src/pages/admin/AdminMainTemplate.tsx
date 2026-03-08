import { AdminLayout } from "@/components/admin/AdminLayout";
import { Layout, Globe, CheckCircle2, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSiteSettings, useUpdateSiteSetting } from "@/hooks/useSiteSettings";

const templates = [
  { id: "1", name: "Modern", desc: "Clean modern design with bold typography and smooth animations", color: "from-blue-500 to-indigo-600" },
  { id: "2", name: "Classic", desc: "Traditional elegant layout with refined aesthetics", color: "from-gray-700 to-gray-900" },
  { id: "3", name: "Elegant", desc: "Sophisticated design with premium feel and subtle details", color: "from-stone-500 to-stone-700" },
  { id: "4", name: "Bold", desc: "Eye-catching bold design with vibrant colors and strong visuals", color: "from-rose-500 to-violet-600" },
  { id: "5", name: "Minimal", desc: "Ultra clean minimal layout focused on content", color: "from-zinc-600 to-lime-500" },
];

export default function AdminMainTemplate() {
  const { data: settings } = useSiteSettings();
  const updateSetting = useUpdateSiteSetting();
  const activeTemplate = settings?.active_template || "1";

  return (
    <AdminLayout>
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-2xl bg-secondary flex items-center justify-center">
              <Layout className="h-6 w-6 text-muted-foreground" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Website Templates</h1>
              <p className="text-sm text-muted-foreground">Choose a design for your storefront</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <a href="/" target="_blank" rel="noreferrer">
              <Button variant="outline" className="gap-2">
                <Globe className="h-4 w-4" /> Open Public Store
              </Button>
            </a>
            <Button className="gap-2">
              <Save className="h-4 w-4" /> Save
            </Button>
          </div>
        </div>

        {/* Templates Section */}
        <div>
          <h2 className="text-lg font-bold text-foreground mb-1">Website Templates</h2>
          <p className="text-sm text-muted-foreground mb-6">Choose a design template for your storefront</p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-5">
            {templates.map((t) => (
              <button
                key={t.id}
                onClick={() => updateSetting.mutate({ key: "active_template", value: t.id })}
                className={`relative rounded-2xl overflow-hidden border-2 transition-all text-left group ${
                  activeTemplate === t.id
                    ? "border-primary ring-2 ring-primary/20 shadow-lg"
                    : "border-border hover:border-primary/50"
                }`}
              >
                {/* Preview area */}
                <div className={`h-40 bg-gradient-to-br ${t.color} relative overflow-hidden`}>
                  {/* Mock layout */}
                  <div className="absolute inset-0 p-3">
                    <div className="flex items-center justify-between mb-3">
                      <div className="h-2 w-16 bg-white/30 rounded" />
                      <div className="flex gap-2">
                        <div className="h-2 w-8 bg-white/20 rounded" />
                        <div className="h-2 w-8 bg-white/20 rounded" />
                        <div className="h-2 w-8 bg-white/20 rounded" />
                      </div>
                    </div>
                    <div className="h-8 w-3/4 bg-white/15 rounded mb-2 mx-auto mt-6" />
                    <div className="h-3 w-1/2 bg-white/10 rounded mx-auto mb-4" />
                    <div className="flex gap-2 justify-center mt-4">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="w-12 h-16 bg-white/20 rounded" />
                      ))}
                    </div>
                  </div>
                  {/* Selected overlay */}
                  {activeTemplate === t.id && (
                    <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                      <div className="h-12 w-12 rounded-full bg-primary flex items-center justify-center">
                        <CheckCircle2 className="h-7 w-7 text-primary-foreground" />
                      </div>
                    </div>
                  )}
                </div>
                {/* Info */}
                <div className="p-4">
                  <h3 className="font-bold text-sm text-foreground">{t.name}</h3>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{t.desc}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Live Preview Link */}
        <div className="bg-card rounded-2xl border border-border p-6 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-foreground">লাইভ প্রিভিউ</h3>
            <p className="text-sm text-muted-foreground">সিলেক্ট করা টেমপ্লেট দেখুন</p>
          </div>
          <a href="/" target="_blank" rel="noreferrer">
            <Button variant="outline" className="gap-2">
              <Globe className="h-4 w-4" /> Store দেখুন
            </Button>
          </a>
        </div>
      </div>
    </AdminLayout>
  );
}
