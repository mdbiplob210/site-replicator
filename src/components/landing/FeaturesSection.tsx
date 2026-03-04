import {
  ShieldCheck, Bot, TrendingUp, Package, Truck, Globe, BarChart3,
  Users, CreditCard, MessageSquare, Layers, Smartphone, Lock, Palette
} from "lucide-react";

const features = [
  { icon: ShieldCheck, title: "ফেক অর্ডার ব্লকিং", desc: "AI দিয়ে স্বয়ংক্রিয়ভাবে ফেক অর্ডার শনাক্ত ও ব্লক করুন।" },
  { icon: Bot, title: "AI অটোমেশন", desc: "অর্ডার কনফার্মেশন, ফলো-আপ, সব AI করবে।" },
  { icon: TrendingUp, title: "রিয়েল-টাইম প্রফিট ট্র্যাকিং", desc: "প্রতিটি অর্ডারের লাভ-ক্ষতি রিয়েল-টাইমে দেখুন।" },
  { icon: Package, title: "প্রোডাক্ট ম্যানেজমেন্ট", desc: "সহজে প্রোডাক্ট যোগ, এডিট ও ক্যাটাগরি ম্যানেজ করুন।" },
  { icon: Truck, title: "কুরিয়ার ইন্টিগ্রেশন", desc: "Steadfast, Pathao, RedX সহ সব কুরিয়ার এক ক্লিকে।" },
  { icon: Globe, title: "ওয়েবসাইট বিল্ডার", desc: "কোডিং ছাড়াই সুন্দর ই-কমার্স ওয়েবসাইট তৈরি করুন।" },
  { icon: BarChart3, title: "অ্যানালিটিক্স ড্যাশবোর্ড", desc: "বিক্রি, অর্ডার ও কাস্টমার ডেটা বিশ্লেষণ করুন।" },
  { icon: Users, title: "কাস্টমার ম্যানেজমেন্ট", desc: "কাস্টমার তথ্য, অর্ডার হিস্ট্রি সব এক জায়গায়।" },
  { icon: CreditCard, title: "পেমেন্ট ট্র্যাকিং", desc: "বকেয়া, পেমেন্ট স্ট্যাটাস সব ট্র্যাক করুন।" },
  { icon: MessageSquare, title: "SMS/WhatsApp নোটিফিকেশন", desc: "অটোমেটিক কাস্টমার নোটিফিকেশন পাঠান।" },
  { icon: Layers, title: "মাল্টি-স্টোর সাপোর্ট", desc: "একাধিক স্টোর একটি ড্যাশবোর্ড থেকে ম্যানেজ করুন।" },
  { icon: Smartphone, title: "মোবাইল ফ্রেন্ডলি", desc: "যেকোনো ডিভাইস থেকে আপনার ব্যবসা চালান।" },
  { icon: Lock, title: "ডেটা সিকিউরিটি", desc: "এন্ড-টু-এন্ড এনক্রিপশন দিয়ে আপনার ডেটা সুরক্ষিত।" },
  { icon: Palette, title: "কাস্টমাইজেশন", desc: "আপনার ব্র্যান্ড অনুযায়ী সবকিছু কাস্টমাইজ করুন।" },
];

const FeaturesSection = () => {
  return (
    <section id="features" className="bg-secondary/30 py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-foreground sm:text-4xl">ফিচারসমূহ</h2>
          <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
            আপনার ই-কমার্স ব্যবসার জন্য প্রয়োজনীয় সব টুলস এক প্ল্যাটফর্মে
          </p>
        </div>

        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {features.map((f) => (
            <div
              key={f.title}
              className="group rounded-xl border border-border/60 bg-card p-5 transition-all hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5"
            >
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-accent text-primary">
                <f.icon className="h-5 w-5" />
              </div>
              <h3 className="font-semibold text-foreground">{f.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
