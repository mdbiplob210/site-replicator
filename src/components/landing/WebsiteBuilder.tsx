import { Globe, Palette, Smartphone, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const features = [
  { icon: Palette, title: "ড্র্যাগ অ্যান্ড ড্রপ", desc: "কোডিং ছাড়াই সুন্দর ওয়েবসাইট" },
  { icon: Smartphone, title: "মোবাইল রেসপন্সিভ", desc: "সব ডিভাইসে পারফেক্ট দেখায়" },
  { icon: Zap, title: "সুপার ফাস্ট", desc: "অপ্টিমাইজড পারফরম্যান্স" },
  { icon: Globe, title: "কাস্টম ডোমেইন", desc: "নিজের ডোমেইন কানেক্ট করুন" },
];

const WebsiteBuilder = () => {
  return (
    <section className="relative py-24 sm:py-32">
      <div className="absolute inset-0 bg-gradient-to-t from-secondary/20 to-transparent" />
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid items-center gap-16 lg:grid-cols-2">
          {/* Website preview mockup */}
          <div className="order-2 lg:order-1">
            <div className="rounded-3xl border border-border/50 bg-card p-2 shadow-2xl shadow-primary/5">
              <div className="flex items-center gap-2 rounded-t-2xl bg-secondary/50 px-4 py-3">
                <div className="flex gap-1.5">
                  <div className="h-3 w-3 rounded-full bg-destructive/60" />
                  <div className="h-3 w-3 rounded-full bg-yellow-400/60" />
                  <div className="h-3 w-3 rounded-full bg-green-400/60" />
                </div>
                <div className="ml-4 flex-1 rounded-lg bg-background/80 px-4 py-1.5 text-xs text-muted-foreground">
                  yourstore.com
                </div>
              </div>
              <div className="rounded-b-2xl bg-gradient-to-br from-primary/5 to-accent/30 p-10 text-center">
                <div className="mx-auto mb-5 h-14 w-14 rounded-2xl bg-primary/15 shadow-inner" />
                <div className="mx-auto mb-3 h-5 w-3/4 rounded-lg bg-foreground/8" />
                <div className="mx-auto mb-6 h-4 w-1/2 rounded-lg bg-foreground/5" />
                <div className="grid grid-cols-3 gap-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="aspect-square rounded-xl bg-card shadow-md border border-border/30" />
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="order-1 lg:order-2">
            <span className="inline-block rounded-full bg-primary/10 px-4 py-1.5 text-sm font-semibold text-primary">
              ওয়েবসাইট বিল্ডার
            </span>
            <h2 className="mt-4 text-3xl font-bold text-foreground sm:text-4xl lg:text-5xl">
              নিজের <span className="text-primary">ই-কমার্স ওয়েবসাইট</span> তৈরি করুন
            </h2>
            <p className="mt-5 text-lg leading-relaxed text-muted-foreground">
              কোনো কোডিং জ্ঞান ছাড়াই মিনিটের মধ্যে আপনার প্রফেশনাল ই-কমার্স ওয়েবসাইট তৈরি করুন।
            </p>

            <div className="mt-8 grid grid-cols-2 gap-5">
              {features.map((f) => (
                <div key={f.title} className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent text-primary">
                    <f.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-foreground">{f.title}</h4>
                    <p className="mt-0.5 text-sm text-muted-foreground">{f.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <Link to="/login">
              <Button className="mt-8 bg-primary px-8 shadow-lg shadow-primary/25 hover:bg-primary/90 hover:shadow-xl transition-all">
                ওয়েবসাইট তৈরি করুন
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};

export default WebsiteBuilder;
