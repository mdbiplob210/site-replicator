import {
  ShieldCheck, Bot, TrendingUp, Package, Truck, Globe, BarChart3,
  Users, CreditCard, MessageSquare, Layers, Smartphone, Lock, Palette
} from "lucide-react";

const features = [
  { icon: ShieldCheck, title: "ফেক অর্ডার ব্লকিং", desc: "AI দিয়ে স্বয়ংক্রিয়ভাবে ফেক অর্ডার শনাক্ত ও ব্লক করুন।", highlight: true },
  { icon: Bot, title: "AI অটোমেশন", desc: "অর্ডার কনফার্মেশন, ফলো-আপ, সব AI করবে।", highlight: true },
  { icon: TrendingUp, title: "রিয়েল-টাইম প্রফিট ট্র্যাকিং", desc: "প্রতিটি অর্ডারের লাভ-ক্ষতি রিয়েল-টাইমে দেখুন।", highlight: false },
  { icon: Package, title: "প্রোডাক্ট ম্যানেজমেন্ট", desc: "সহজে প্রোডাক্ট যোগ, এডিট ও ক্যাটাগরি ম্যানেজ করুন।", highlight: false },
  { icon: Truck, title: "কুরিয়ার ইন্টিগ্রেশন", desc: "Steadfast, Pathao, RedX সহ সব কুরিয়ার এক ক্লিকে।", highlight: true },
  { icon: Globe, title: "ওয়েবসাইট বিল্ডার", desc: "কোডিং ছাড়াই সুন্দর ই-কমার্স ওয়েবসাইট তৈরি করুন।", highlight: false },
  { icon: BarChart3, title: "অ্যানালিটিক্স ড্যাশবোর্ড", desc: "বিক্রি, অর্ডার ও কাস্টমার ডেটা বিশ্লেষণ করুন।", highlight: false },
  { icon: Users, title: "কাস্টমার ম্যানেজমেন্ট", desc: "কাস্টমার তথ্য, অর্ডার হিস্ট্রি সব এক জায়গায়।", highlight: false },
  { icon: CreditCard, title: "পেমেন্ট ট্র্যাকিং", desc: "বকেয়া, পেমেন্ট স্ট্যাটাস সব ট্র্যাক করুন।", highlight: false },
  { icon: MessageSquare, title: "SMS/WhatsApp নোটিফিকেশন", desc: "অটোমেটিক কাস্টমার নোটিফিকেশন পাঠান।", highlight: false },
  { icon: Layers, title: "মাল্টি-স্টোর সাপোর্ট", desc: "একাধিক স্টোর একটি ড্যাশবোর্ড থেকে ম্যানেজ করুন।", highlight: false },
  { icon: Smartphone, title: "মোবাইল ফ্রেন্ডলি", desc: "যেকোনো ডিভাইস থেকে আপনার ব্যবসা চালান।", highlight: false },
  { icon: Lock, title: "ডেটা সিকিউরিটি", desc: "এন্ড-টু-এন্ড এনক্রিপশন দিয়ে আপনার ডেটা সুরক্ষিত।", highlight: false },
  { icon: Palette, title: "কাস্টমাইজেশন", desc: "আপনার ব্র্যান্ড অনুযায়ী সবকিছু কাস্টমাইজ করুন।", highlight: false },
];

const FeaturesSection = () => {
  return (
    <section id="features" className="relative py-24 sm:py-32">
      <div className="absolute inset-0 bg-gradient-to-b from-secondary/40 via-secondary/20 to-transparent" />
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <span className="inline-block rounded-full bg-primary/10 px-4 py-1.5 text-sm font-semibold text-primary">
            ফিচারসমূহ
          </span>
          <h2 className="mt-4 text-3xl font-bold text-foreground sm:text-4xl lg:text-5xl">
            আপনার ব্যবসার জন্য <span className="text-primary">সব টুলস</span>
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            আপনার ই-কমার্স ব্যবসার জন্য প্রয়োজনীয় সব টুলস এক প্ল্যাটফর্মে
          </p>
        </div>

        <div className="mt-16 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {features.map((f) => (
            <div
              key={f.title}
              className={`group relative rounded-2xl border p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl ${
                f.highlight
                  ? "border-primary/20 bg-gradient-to-br from-primary/5 to-card shadow-lg shadow-primary/5"
                  : "border-border/50 bg-card hover:border-primary/20 hover:shadow-primary/5"
              }`}
            >
              <div className={`mb-4 flex h-12 w-12 items-center justify-center rounded-xl transition-colors ${
                f.highlight
                  ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25"
                  : "bg-accent text-primary group-hover:bg-primary group-hover:text-primary-foreground group-hover:shadow-lg group-hover:shadow-primary/25"
              }`}>
                <f.icon className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-semibold text-foreground">{f.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
