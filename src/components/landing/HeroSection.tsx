import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, ShieldCheck, Bot, TrendingUp, Zap, Play } from "lucide-react";
import { Link } from "react-router-dom";

const badges = [
  { icon: ShieldCheck, label: "ফেক অর্ডার ব্লকিং" },
  { icon: Bot, label: "AI অটোমেশন" },
  { icon: TrendingUp, label: "রিয়েল-টাইম প্রফিট" },
  { icon: Zap, label: "সেটআপ ৩০ সেকেন্ডে" },
];

const HeroSection = () => {
  return (
    <section className="relative overflow-hidden py-24 sm:py-32 lg:py-40">
      {/* Decorative blobs */}
      <div className="absolute -top-40 -right-40 h-[500px] w-[500px] rounded-full bg-primary/5 blur-3xl" />
      <div className="absolute -bottom-40 -left-40 h-[500px] w-[500px] rounded-full bg-accent/30 blur-3xl" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[600px] w-[600px] rounded-full bg-primary/3 blur-3xl" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid items-center gap-16 lg:grid-cols-2">
          {/* Left content */}
          <div className="text-center lg:text-left">
            <div className="mb-8 flex flex-wrap items-center justify-center gap-2 lg:justify-start">
              {badges.map((badge) => (
                <Badge
                  key={badge.label}
                  variant="secondary"
                  className="gap-1.5 border border-primary/15 bg-primary/5 px-3.5 py-1.5 text-sm text-primary backdrop-blur-sm"
                >
                  <badge.icon className="h-3.5 w-3.5" />
                  {badge.label}
                </Badge>
              ))}
            </div>

            <h1 className="text-4xl font-extrabold leading-[1.15] tracking-tight text-foreground sm:text-5xl lg:text-6xl xl:text-7xl">
              আপনার ই-কমার্স
              <br />
              ব্যবসা
              <span className="relative inline-block">
                <span className="bg-gradient-to-r from-primary via-primary/80 to-primary/60 bg-clip-text text-transparent">
                  {" "}অটোমেট{" "}
                </span>
                <svg className="absolute -bottom-1 left-0 w-full" viewBox="0 0 200 8" fill="none">
                  <path d="M2 6c50-4 100-4 196 0" stroke="hsl(var(--primary))" strokeWidth="3" strokeLinecap="round" opacity="0.3"/>
                </svg>
              </span>
              করুন
            </h1>

            <p className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-muted-foreground lg:mx-0 lg:text-xl">
              QUICK SHOP BD হলো বাংলাদেশের প্রথম AI-পাওয়ার্ড ই-কমার্স ম্যানেজমেন্ট প্ল্যাটফর্ম।
              অর্ডার, কুরিয়ার, ফেক ডিটেকশন — সব এক জায়গায়।
            </p>

            <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row lg:justify-start">
              <Link to="/login">
                <Button
                  size="lg"
                  className="gap-2 bg-primary px-10 text-lg shadow-xl shadow-primary/25 hover:bg-primary/90 hover:shadow-2xl hover:shadow-primary/30 transition-all duration-300"
                >
                  ফ্রি শুরু করুন
                  <ArrowRight className="h-5 w-5" />
                </Button>
              </Link>
              <a href="#how-it-works">
                <Button size="lg" variant="ghost" className="gap-2 px-8 text-lg text-muted-foreground hover:text-foreground">
                  <Play className="h-4 w-4 fill-current" />
                  কিভাবে কাজ করে
                </Button>
              </a>
            </div>
          </div>

          {/* Right - Stats grid */}
          <div className="relative">
            <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-primary/10 via-transparent to-accent/20 blur-2xl" />
            <div className="relative grid grid-cols-2 gap-5">
              {[
                { value: "৫০০০+", label: "সক্রিয় ব্যবসায়ী", accent: true },
                { value: "২ লাখ+", label: "অর্ডার প্রসেসড", accent: false },
                { value: "৯৯.৯%", label: "আপটাইম", accent: false },
                { value: "৩০ সেকেন্ড", label: "সেটআপ টাইম", accent: true },
              ].map((stat, i) => (
                <div
                  key={stat.label}
                  className={`group rounded-2xl border p-7 transition-all duration-300 hover:scale-[1.02] hover:shadow-xl ${
                    stat.accent
                      ? "border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10 shadow-lg shadow-primary/5"
                      : "border-border/50 bg-card/80 backdrop-blur-sm"
                  }`}
                >
                  <div className={`text-3xl font-extrabold sm:text-4xl ${stat.accent ? "text-primary" : "text-foreground"}`}>
                    {stat.value}
                  </div>
                  <div className="mt-2 text-sm font-medium text-muted-foreground">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
