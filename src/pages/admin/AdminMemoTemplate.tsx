import { AdminLayout } from "@/components/admin/AdminLayout";
import { Printer, Save, CheckCircle2, Eye } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useSiteSettings, useUpdateSiteSetting } from "@/hooks/useSiteSettings";

const memoTemplates = [
  {
    id: "1",
    name: "Premium Dark",
    desc: "Dark gradient header with gold accents, barcode tracking, and elegant typography",
    headerBg: "bg-gradient-to-br from-slate-900 to-slate-700",
    accent: "text-amber-400",
  },
  {
    id: "2",
    name: "Clean Professional",
    desc: "Minimalist white design with blue accents, clean borders and professional layout",
    headerBg: "bg-gradient-to-br from-blue-600 to-blue-800",
    accent: "text-blue-500",
  },
  {
    id: "3",
    name: "Modern Gradient",
    desc: "Purple-to-pink gradient header with rounded corners and modern card style",
    headerBg: "bg-gradient-to-br from-purple-600 to-pink-500",
    accent: "text-purple-500",
  },
  {
    id: "4",
    name: "Eco Minimal",
    desc: "Green-toned eco-friendly design with minimal borders and soft shadows",
    headerBg: "bg-gradient-to-br from-emerald-600 to-teal-700",
    accent: "text-emerald-500",
  },
  {
    id: "5",
    name: "Bold Corporate",
    desc: "Strong black header with red accents, bold typography for corporate branding",
    headerBg: "bg-gradient-to-br from-gray-900 to-black",
    accent: "text-red-500",
  },
  {
    id: "6",
    name: "POS Receipt",
    desc: "58mm/80mm thermal receipt style — optimized for POS printers with monospace font",
    headerBg: "bg-white border-2 border-dashed border-gray-400",
    accent: "text-gray-800",
    isPOS: true,
  },
];

export default function AdminMemoTemplate() {
  const { data: settings } = useSiteSettings();
  const updateSetting = useUpdateSiteSetting();
  const active = settings?.active_memo_template || "1";
  const posMode = settings?.memo_pos_mode === "true";

  const handleSelectTemplate = (id: string) => {
    updateSetting.mutate(
      { key: "active_memo_template", value: id },
      { onSuccess: () => toast.success("মেমো টেমপ্লেট আপডেট হয়েছে!") }
    );
  };

  const handleTogglePOS = (checked: boolean) => {
    updateSetting.mutate(
      { key: "memo_pos_mode", value: checked ? "true" : "false" },
      { onSuccess: () => toast.success(checked ? "POS মোড চালু হয়েছে" : "POS মোড বন্ধ হয়েছে") }
    );
  };

  return (
    <AdminLayout>
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-2xl bg-secondary flex items-center justify-center">
              <Printer className="h-6 w-6 text-muted-foreground" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Memo Template</h1>
              <p className="text-sm text-muted-foreground">মেমো ডিজাইন এবং POS প্রিন্টিং সেটিংস</p>
            </div>
          </div>
        </div>

        {/* POS Mode Toggle */}
        <div className="rounded-2xl border border-border bg-card p-5">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-foreground flex items-center gap-2">
                🖨️ POS Printer Mode
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                POS/Thermal প্রিন্টারে প্রিন্ট করার জন্য 58mm/80mm রিসিপ্ট ফরম্যাটে প্রিন্ট হবে
              </p>
            </div>
            <Switch checked={posMode} onCheckedChange={handleTogglePOS} />
          </div>
          {posMode && (
            <div className="mt-3 p-3 rounded-xl bg-destructive/10 border border-destructive/20">
              <p className="text-xs text-destructive">
                ⚠️ POS মোড চালু থাকলে সব মেমো 80mm (3 inch) thermal receipt হিসেবে প্রিন্ট হবে। 
                Template #6 (POS Receipt) অটো-সিলেক্ট হবে।
              </p>
            </div>
          )}
        </div>

        {/* Template Grid */}
        <div>
          <h2 className="text-lg font-bold text-foreground mb-1">Memo Design</h2>
          <p className="text-sm text-muted-foreground mb-6">
            যেকোনো একটি ডিজাইন সিলেক্ট করুন — প্রিন্ট এই ডিজাইনে হবে
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {memoTemplates.map((t) => {
              const isActive = posMode ? t.id === "6" : active === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => handleSelectTemplate(t.id)}
                  disabled={posMode && t.id !== "6"}
                  className={`relative rounded-2xl overflow-hidden border-2 transition-all text-left ${
                    isActive
                      ? "border-primary ring-2 ring-primary/20 shadow-lg"
                      : posMode && t.id !== "6"
                      ? "border-border opacity-40 cursor-not-allowed"
                      : "border-border hover:border-primary/50"
                  }`}
                >
                  {/* Preview */}
                  <div className="h-56 bg-card relative overflow-hidden flex flex-col">
                    {/* Mock header */}
                    <div className={`${t.headerBg} px-4 py-3 ${t.isPOS ? "" : "text-white"}`}>
                      <div className="flex justify-between items-center">
                        <div className={`text-xs font-bold ${t.isPOS ? "text-gray-800 font-mono" : ""}`}>
                          {t.isPOS ? "--- STORE ---" : "STORE NAME"}
                        </div>
                        <div className={`text-xs font-bold ${t.isPOS ? "text-gray-600 font-mono" : t.accent}`}>
                          {t.isPOS ? "#12345" : "#12345"}
                        </div>
                      </div>
                    </div>
                    {/* Mock body */}
                    <div className="flex-1 px-4 py-2 space-y-2">
                      {t.isPOS ? (
                        <>
                          <div className="font-mono text-[9px] text-muted-foreground border-b border-dashed border-muted pb-1">
                            Name: Customer Name<br />Phone: 01XXXXXXXXX
                          </div>
                          <div className="font-mono text-[9px] text-muted-foreground">
                            Product A x1 ......৳500<br />
                            Product B x2 ......৳800<br />
                            ─────────────────<br />
                            TOTAL: ৳1,300
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="space-y-1">
                            <div className="h-2 w-16 bg-muted-foreground/10 rounded" />
                            <div className="h-2 w-24 bg-muted-foreground/10 rounded" />
                            <div className="h-2 w-20 bg-muted-foreground/10 rounded" />
                          </div>
                          <div className="border-t border-border pt-1 space-y-1">
                            <div className="flex justify-between">
                              <div className="h-2 w-20 bg-muted-foreground/10 rounded" />
                              <div className="h-2 w-10 bg-muted-foreground/10 rounded" />
                            </div>
                            <div className="flex justify-between">
                              <div className="h-2 w-14 bg-muted-foreground/10 rounded" />
                              <div className="h-2 w-8 bg-muted-foreground/10 rounded" />
                            </div>
                          </div>
                          <div className="border-t-2 border-foreground/20 pt-1">
                            <div className="flex justify-between">
                              <div className="h-3 w-12 bg-foreground/15 rounded" />
                              <div className="h-3 w-14 bg-foreground/15 rounded" />
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                    {/* Active badge */}
                    {isActive && (
                      <div className="absolute top-3 right-3">
                        <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center">
                          <CheckCircle2 className="h-5 w-5 text-primary-foreground" />
                        </div>
                      </div>
                    )}
                    {/* POS badge */}
                    {t.isPOS && (
                      <div className="absolute top-3 left-3">
                        <span className="text-[10px] font-bold bg-accent text-accent-foreground px-2 py-0.5 rounded-full">
                          POS
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="p-4 border-t border-border">
                    <h3 className="font-bold text-sm text-foreground">{t.name}</h3>
                    <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{t.desc}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
