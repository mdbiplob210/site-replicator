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
    <section className="py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <div className="order-2 lg:order-1">
            <div className="rounded-2xl border border-border/60 bg-card p-4 shadow-lg">
              <div className="mb-3 flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-destructive" />
                <div className="h-3 w-3 rounded-full bg-yellow-400" />
                <div className="h-3 w-3 rounded-full bg-green-400" />
              </div>
              <div className="rounded-xl bg-gradient-to-br from-primary/10 to-accent p-8 text-center">
                <div className="mx-auto mb-4 h-12 w-12 rounded-xl bg-primary/20" />
                <div className="mx-auto mb-2 h-4 w-3/4 rounded bg-foreground/10" />
                <div className="mx-auto mb-4 h-3 w-1/2 rounded bg-foreground/5" />
                <div className="grid grid-cols-3 gap-2">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="aspect-square rounded-lg bg-card shadow-sm" />
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="order-1 lg:order-2">
            <h2 className="text-3xl font-bold text-foreground sm:text-4xl">
              নিজের <span className="text-primary">ই-কমার্স ওয়েবসাইট</span> তৈরি করুন
            </h2>
            <p className="mt-4 text-muted-foreground">
              কোনো কোডিং জ্ঞান ছাড়াই মিনিটের মধ্যে আপনার প্রফেশনাল ই-কমার্স ওয়েবসাইট তৈরি করুন।
            </p>

            <div className="mt-6 grid grid-cols-2 gap-4">
              {features.map((f) => (
                <div key={f.title} className="flex items-start gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent text-primary">
                    <f.icon className="h-4 w-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-foreground">{f.title}</h4>
                    <p className="text-xs text-muted-foreground">{f.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <Link to="/login">
              <Button className="mt-6 bg-primary hover:bg-primary/90">ওয়েবসাইট তৈরি করুন</Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};

export default WebsiteBuilder;
