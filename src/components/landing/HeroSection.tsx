import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, ShieldCheck, Bot, TrendingUp, Zap } from "lucide-react";
import { Link } from "react-router-dom";

const badges = [
  { icon: ShieldCheck, label: "ফেক অর্ডার ব্লকিং" },
  { icon: Bot, label: "AI অটোমেশন" },
  { icon: TrendingUp, label: "রিয়েল-টাইম প্রফিট" },
  { icon: Zap, label: "সেটআপ ৩০ সেকেন্ডে" },
];

const HeroSection = () => {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-primary/5 via-background to-accent/30 py-20 sm:py-28 lg:py-36">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,hsl(262_83%_58%/0.08),transparent_60%)]" />
      <div className="relative mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
        <div className="mb-6 flex flex-wrap items-center justify-center gap-2">
          {badges.map((badge) => (
            <Badge
              key={badge.label}
              variant="secondary"
              className="gap-1.5 border border-primary/20 bg-accent px-3 py-1.5 text-accent-foreground"
            >
              <badge.icon className="h-3.5 w-3.5" />
              {badge.label}
            </Badge>
          ))}
        </div>

        <h1 className="mx-auto max-w-4xl text-3xl font-bold leading-tight text-foreground sm:text-4xl md:text-5xl lg:text-6xl">
          আপনার ই-কমার্স ব্যবসা
          <span className="bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
            {" "}অটোমেট{" "}
          </span>
          করুন AI দিয়ে
        </h1>

        <p className="mx-auto mt-6 max-w-2xl text-base text-muted-foreground sm:text-lg">
          QUICK SHOP BD হলো বাংলাদেশের প্রথম AI-পাওয়ার্ড ই-কমার্স ম্যানেজমেন্ট প্ল্যাটফর্ম।
          অর্ডার ম্যানেজমেন্ট, কুরিয়ার ইন্টিগ্রেশন, ফেক অর্ডার ডিটেকশন — সব এক জায়গায়।
        </p>

        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link to="/login">
            <Button size="lg" className="gap-2 bg-primary px-8 text-lg hover:bg-primary/90">
              ফ্রি শুরু করুন
              <ArrowRight className="h-5 w-5" />
            </Button>
          </Link>
          <a href="#how-it-works">
            <Button size="lg" variant="outline" className="px-8 text-lg">
              কিভাবে কাজ করে
            </Button>
          </a>
        </div>

        <div className="mt-12 grid grid-cols-2 gap-4 sm:grid-cols-4 sm:gap-8">
          {[
            { value: "৫০০০+", label: "সক্রিয় ব্যবসায়ী" },
            { value: "২ লাখ+", label: "অর্ডার প্রসেসড" },
            { value: "৯৯.৯%", label: "আপটাইম" },
            { value: "৩০ সেকেন্ড", label: "সেটআপ টাইম" },
          ].map((stat) => (
            <div key={stat.label} className="rounded-xl border border-border/50 bg-card/50 p-4 backdrop-blur-sm">
              <div className="text-2xl font-bold text-primary sm:text-3xl">{stat.value}</div>
              <div className="mt-1 text-sm text-muted-foreground">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
