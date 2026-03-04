import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  MessageSquare, Phone, Smartphone, Search, Target, Sparkles,
  Brain, Zap, Users, Music, BarChart3, Crosshair, Mail, Bot,
  Clock, Rocket, ArrowRight
} from "lucide-react";

const features = [
  {
    title: "Social Media Messaging Automation",
    description: "সোশ্যাল মিডিয়া থেকে আসা মেসেজ অটোমেটিক্যালি ম্যানেজ করুন — Facebook, Instagram, WhatsApp সব এক জায়গায়",
    icon: MessageSquare,
    iconBg: "bg-purple-100",
    iconColor: "text-purple-600",
    borderColor: "from-green-400 via-emerald-400 to-teal-400",
  },
  {
    title: "AI Auto Calling for Order Confirm",
    description: "AI দিয়ে অটোমেটিক কল করে অর্ডার কনফার্ম করুন — সময় ও খরচ বাঁচান",
    icon: Phone,
    iconBg: "bg-red-100",
    iconColor: "text-red-500",
    borderColor: "from-blue-400 via-indigo-400 to-purple-400",
  },
  {
    title: "Mobile Application",
    description: "মোবাইল অ্যাপ দিয়ে যেকোনো জায়গা থেকে আপনার বিজনেস ম্যানেজ করুন",
    icon: Smartphone,
    iconBg: "bg-blue-100",
    iconColor: "text-blue-600",
    borderColor: "from-orange-400 via-red-400 to-pink-400",
  },
  {
    title: "Product Research",
    description: "মার্কেটে কোন প্রোডাক্ট ট্রেন্ডিং তা রিসার্চ করুন এবং সেরা প্রোডাক্ট খুঁজে বের করুন",
    icon: Search,
    iconBg: "bg-cyan-100",
    iconColor: "text-cyan-600",
    borderColor: "from-emerald-400 via-green-400 to-lime-400",
  },
  {
    title: "Competitor Research",
    description: "প্রতিযোগীদের কৌশল বিশ্লেষণ করুন এবং এগিয়ে থাকুন",
    icon: Target,
    iconBg: "bg-orange-100",
    iconColor: "text-orange-500",
    borderColor: "from-blue-400 via-cyan-400 to-teal-400",
  },
  {
    title: "AI High Converting Ads Copy Generation",
    description: "AI দিয়ে হাই কনভার্টিং অ্যাডস কপি তৈরি করুন — বিক্রি বাড়ান অটোমেটিক্যালি",
    icon: Sparkles,
    iconBg: "bg-amber-100",
    iconColor: "text-amber-600",
    borderColor: "from-pink-400 via-rose-400 to-red-400",
  },
  {
    title: "AI Product Research",
    description: "AI দিয়ে মার্কেট প্রোডাক্ট রিসার্চ করুন — ডাটা ড্রিভেন সিদ্ধান্ত নিন",
    icon: Brain,
    iconBg: "bg-pink-100",
    iconColor: "text-pink-500",
    borderColor: "from-violet-400 via-purple-400 to-fuchsia-400",
  },
  {
    title: "AI Driven Clean Quick Dashboard",
    description: "AI চালিত ক্লিন ও দ্রুত ড্যাশবোর্ড — গুরুত্বপূর্ণ তথ্য এক নজরে দেখুন",
    icon: Zap,
    iconBg: "bg-yellow-100",
    iconColor: "text-yellow-600",
    borderColor: "from-cyan-400 via-blue-400 to-indigo-400",
    highlighted: true,
  },
  {
    title: "User & Salary Management",
    description: "টিম মেম্বার ও তাদের স্যালারি সহজে ম্যানেজ করুন",
    icon: Users,
    iconBg: "bg-slate-100",
    iconColor: "text-slate-600",
    borderColor: "from-amber-400 via-orange-400 to-red-400",
  },
  {
    title: "TikTok Ads Tracking",
    description: "TikTok Ads-এর ট্র্যাকিং সেটআপ করুন — Pixel এবং Events API দিয়ে কনভার্সন ট্র্যাক করুন",
    icon: Music,
    iconBg: "bg-violet-100",
    iconColor: "text-violet-600",
    borderColor: "from-green-400 via-teal-400 to-cyan-400",
  },
  {
    title: "TikTok Ads Data & Analytics",
    description: "TikTok Ads-এর ক্যাম্পেইন ডেটা দেখুন — স্পেন্ড, ইম্প্রেশন, কনভার্সন সব এক জায়গায়",
    icon: BarChart3,
    iconBg: "bg-indigo-100",
    iconColor: "text-indigo-600",
    borderColor: "from-rose-400 via-pink-400 to-fuchsia-400",
  },
  {
    title: "Lead Management",
    description: "বিদ্যমান কাস্টমারদের পুনরায় প্রোডাক্ট সেল করুন এবং নতুন নম্বর যুক্ত করে লিড ম্যানেজ করুন",
    icon: Crosshair,
    iconBg: "bg-emerald-100",
    iconColor: "text-emerald-600",
    borderColor: "from-yellow-400 via-amber-400 to-orange-400",
  },
  {
    title: "SMS Marketing",
    description: "বিদ্যমান ক্লায়েন্ট বা নতুন নম্বরে SMS মার্কেটিং ক্যাম্পেইন পরিচালনা করুন",
    icon: Mail,
    iconBg: "bg-teal-100",
    iconColor: "text-teal-600",
    borderColor: "from-indigo-400 via-violet-400 to-purple-400",
  },
  {
    title: "AI Call Marketing",
    description: "নতুন বা বিদ্যমান ক্লায়েন্টের নম্বরে AI অটোমেটিক কল দিয়ে অফার সম্পর্কে জানান",
    icon: Bot,
    iconBg: "bg-green-100",
    iconColor: "text-green-600",
    borderColor: "from-fuchsia-400 via-pink-400 to-rose-400",
  },
];

const AdminComingSoon = () => {
  return (
    <AdminLayout>
      <div className="max-w-[1400px] space-y-8">
        {/* Hero Section */}
        <div className="text-center py-10">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-5 py-2 rounded-full text-sm font-semibold mb-6">
            <Sparkles className="h-4 w-4" />
            আসছে শীঘ্রই
            <Sparkles className="h-4 w-4" />
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold gradient-text mb-4 font-['Hind_Siliguri']">
            🚀 নতুন ফিচার সমূহ
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto font-['Hind_Siliguri']">
            আমরা অসাধারণ কিছু তৈরি করছি! এখানে দেখুন আমাদের আসন্ন ফিচারগুলো ✨
          </p>
          <div className="mt-6 inline-flex items-center gap-3 bg-card border border-border rounded-full px-6 py-3 shadow-sm">
            <Badge variant="secondary" className="bg-primary text-primary-foreground font-bold text-sm px-3 py-1 rounded-full">
              {features.length}
            </Badge>
            <span className="text-sm font-medium text-foreground font-['Hind_Siliguri']">টি নতুন ফিচার আসছে</span>
            <ArrowRight className="h-4 w-4 text-muted-foreground" />
          </div>
        </div>

        {/* Feature Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature) => (
            <Card
              key={feature.title}
              className={`relative overflow-hidden card-hover group border-border/40 ${
                feature.highlighted ? "bg-gradient-to-br from-cyan-50/50 to-card ring-1 ring-cyan-200/50" : ""
              }`}
            >
              {/* Rainbow top border */}
              <div className={`h-1 bg-gradient-to-r ${feature.borderColor}`} />

              {/* Sparkle for highlighted */}
              {feature.highlighted && (
                <div className="absolute top-4 right-4">
                  <Sparkles className="h-4 w-4 text-amber-400" />
                </div>
              )}

              <div className="p-6">
                {/* Icon */}
                <div className={`inline-flex p-3.5 rounded-2xl ${feature.iconBg} mb-4 transition-transform duration-300 group-hover:scale-110`}>
                  <feature.icon className={`h-6 w-6 ${feature.iconColor}`} />
                </div>

                {/* Title */}
                <h3 className="text-base font-bold text-foreground mb-2 leading-snug">
                  {feature.title}
                </h3>

                {/* Description */}
                <p className="text-sm text-muted-foreground leading-relaxed font-['Hind_Siliguri'] mb-4">
                  {feature.description}
                </p>

                {/* Coming Soon Badge */}
                <div className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground bg-secondary/80 px-3 py-1.5 rounded-full border border-border/50">
                  <Clock className="h-3 w-3" />
                  <span className="font-['Hind_Siliguri']">শীঘ্রই আসছে</span>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Stay Tuned Banner */}
        <Card className="p-6 text-center bg-gradient-to-r from-secondary/50 via-card to-secondary/50 border-border/30">
          <div className="flex items-center justify-center gap-2 text-lg font-bold text-foreground mb-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Stay Tuned!
            <Sparkles className="h-5 w-5 text-primary" />
          </div>
          <p className="text-muted-foreground font-['Hind_Siliguri']">
            আমরা প্রতিনিয়ত নতুন ফিচার যোগ করছি। আমাদের সাথে থাকুন! 🚀
          </p>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default AdminComingSoon;
