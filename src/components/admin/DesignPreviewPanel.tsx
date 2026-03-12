import { useState } from "react";
import { LayoutGrid, Globe, Layers, ExternalLink, X, Eye } from "lucide-react";
import { useLandingPages } from "@/hooks/useLandingPages";
import { templateList } from "@/lib/landingPageTemplates";
import { ScrollArea } from "@/components/ui/scroll-area";

const storeTemplates = [
  { id: "1", name: "Modern", color: "from-blue-500 to-indigo-600" },
  { id: "2", name: "Classic", color: "from-gray-700 to-gray-900" },
  { id: "3", name: "Elegant", color: "from-stone-500 to-stone-700" },
  { id: "4", name: "Bold", color: "from-rose-500 to-violet-600" },
  { id: "5", name: "Minimal", color: "from-zinc-600 to-lime-500" },
];

export function DesignPreviewPanel() {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<"website" | "landing">("website");
  const { data: landingPages } = useLandingPages();

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setOpen(true)}
        className="fixed right-0 top-1/2 -translate-y-1/2 z-40 bg-primary text-primary-foreground p-2.5 rounded-l-xl shadow-lg hover:bg-primary/90 transition-all group"
        title="ডিজাইন প্রিভিউ"
      >
        <LayoutGrid className="h-5 w-5" />
      </button>

      {/* Panel */}
      {open && (
        <>
          <div className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <div className="fixed right-0 top-0 bottom-0 z-50 w-80 sm:w-96 bg-card border-l border-border shadow-2xl flex flex-col animate-in slide-in-from-right duration-200">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
              <div className="flex items-center gap-2">
                <Eye className="h-4 w-4 text-primary" />
                <h3 className="text-sm font-bold text-foreground">ডিজাইন প্রিভিউ</h3>
              </div>
              <button onClick={() => setOpen(false)} className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground">
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-border">
              <button
                onClick={() => setTab("website")}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-xs font-semibold transition-colors ${
                  tab === "website" ? "text-primary border-b-2 border-primary" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Globe className="h-3.5 w-3.5" />
                ওয়েবসাইট
              </button>
              <button
                onClick={() => setTab("landing")}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-xs font-semibold transition-colors ${
                  tab === "landing" ? "text-primary border-b-2 border-primary" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Layers className="h-3.5 w-3.5" />
                ল্যান্ডিং পেজ
              </button>
            </div>

            {/* Content */}
            <ScrollArea className="flex-1">
              {tab === "website" ? (
                <div className="p-4 space-y-3">
                  <p className="text-xs text-muted-foreground mb-2">স্টোর টেমপ্লেট ডিজাইন</p>
                  {storeTemplates.map((t) => (
                    <div key={t.id} className="rounded-xl border border-border overflow-hidden group hover:border-primary/50 transition-all">
                      <div className={`h-24 bg-gradient-to-br ${t.color} relative`}>
                        {/* Mini layout preview */}
                        <div className="absolute inset-0 p-2 opacity-60">
                          <div className="h-1.5 w-10 bg-white/30 rounded mb-2" />
                          <div className="h-4 w-3/4 bg-white/15 rounded mx-auto mt-3" />
                          <div className="flex gap-1.5 justify-center mt-3">
                            {[1, 2, 3].map((i) => (
                              <div key={i} className="w-8 h-10 bg-white/20 rounded" />
                            ))}
                          </div>
                        </div>
                        {/* Hover overlay */}
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                          <button
                            onClick={() => window.open(`/store?template=${t.id}`, "_blank")}
                            className="bg-white/90 text-gray-900 px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-md"
                          >
                            <ExternalLink className="h-3 w-3" />
                            প্রিভিউ
                          </button>
                        </div>
                      </div>
                      <div className="px-3 py-2 flex items-center justify-between">
                        <span className="text-sm font-medium text-foreground">{t.name}</span>
                        <span className="text-[10px] text-muted-foreground">Template {t.id}</span>
                      </div>
                    </div>
                  ))}

                  {/* Main site link */}
                  <button
                    onClick={() => window.open("/", "_blank")}
                    className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-secondary hover:bg-secondary/80 text-sm font-medium text-foreground transition-colors"
                  >
                    <Globe className="h-4 w-4" />
                    মেইন ওয়েবসাইট ওপেন করুন
                  </button>
                </div>
              ) : (
                <div className="p-4 space-y-3">
                  {/* LP Templates */}
                  <p className="text-xs text-muted-foreground mb-2">ল্যান্ডিং পেজ টেমপ্লেট</p>
                  <div className="grid grid-cols-2 gap-2">
                    {templateList.map((t) => (
                      <div
                        key={t.id}
                        className="rounded-xl border border-border p-3 text-center hover:border-primary/50 transition-all cursor-default"
                      >
                        <div
                          className="h-12 w-12 rounded-lg mx-auto mb-2 flex items-center justify-center text-xl"
                          style={{ backgroundColor: t.color + "20" }}
                        >
                          {t.preview}
                        </div>
                        <p className="text-xs font-medium text-foreground truncate">{t.name}</p>
                      </div>
                    ))}
                  </div>

                  {/* Active Landing Pages */}
                  {landingPages && landingPages.length > 0 && (
                    <>
                      <div className="border-t border-border pt-3 mt-3">
                        <p className="text-xs text-muted-foreground mb-2">
                          অ্যাক্টিভ ল্যান্ডিং পেজ ({landingPages.filter(lp => lp.is_active).length})
                        </p>
                      </div>
                      {landingPages.filter(lp => lp.is_active).map((lp) => (
                        <div
                          key={lp.id}
                          className="flex items-center gap-3 rounded-xl border border-border p-3 hover:border-primary/50 transition-all group"
                        >
                          <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                            <Layers className="h-4 w-4 text-primary" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-foreground truncate">{lp.title}</p>
                            <p className="text-[10px] text-muted-foreground">/lp/{lp.slug}</p>
                          </div>
                          <button
                            onClick={() => window.open(`/lp/${lp.slug}`, "_blank")}
                            className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground hover:text-primary transition-colors opacity-0 group-hover:opacity-100"
                          >
                            <ExternalLink className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ))}

                      {/* Inactive ones */}
                      {landingPages.filter(lp => !lp.is_active).length > 0 && (
                        <p className="text-[10px] text-muted-foreground text-center pt-1">
                          + {landingPages.filter(lp => !lp.is_active).length}টি ইনঅ্যাক্টিভ পেজ
                        </p>
                      )}
                    </>
                  )}

                  {(!landingPages || landingPages.length === 0) && (
                    <div className="text-center py-6">
                      <Layers className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
                      <p className="text-xs text-muted-foreground">কোনো ল্যান্ডিং পেজ নেই</p>
                    </div>
                  )}
                </div>
              )}
            </ScrollArea>
          </div>
        </>
      )}
    </>
  );
}
