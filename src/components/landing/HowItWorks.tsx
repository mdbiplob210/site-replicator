import { UserPlus, Settings, ShoppingCart, Truck, BarChart3 } from "lucide-react";

const steps = [
  { icon: UserPlus, title: "অ্যাকাউন্ট তৈরি করুন", desc: "৩০ সেকেন্ডে ফ্রি অ্যাকাউন্ট খুলুন।" },
  { icon: Settings, title: "স্টোর সেটআপ করুন", desc: "প্রোডাক্ট, কুরিয়ার ও পেমেন্ট সেটআপ করুন।" },
  { icon: ShoppingCart, title: "অর্ডার নিন", desc: "ওয়েবসাইট বা সোশ্যাল মিডিয়া থেকে অর্ডার গ্রহণ করুন।" },
  { icon: Truck, title: "AI প্রসেস করবে", desc: "অর্ডার ভেরিফিকেশন, কুরিয়ার অ্যাসাইন সব অটোমেটিক।" },
  { icon: BarChart3, title: "প্রফিট দেখুন", desc: "রিয়েল-টাইম ড্যাশবোর্ডে আপনার লাভ ট্র্যাক করুন।" },
];

const HowItWorks = () => {
  return (
    <section id="how-it-works" className="relative py-24 sm:py-32 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-background via-primary/3 to-background" />
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <span className="inline-block rounded-full bg-primary/10 px-4 py-1.5 text-sm font-semibold text-primary">
            স্টেপ বাই স্টেপ
          </span>
          <h2 className="mt-4 text-3xl font-bold text-foreground sm:text-4xl lg:text-5xl">
            কিভাবে কাজ করে
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            মাত্র ৫টি সহজ ধাপে আপনার ব্যবসা অটোমেট করুন
          </p>
        </div>

        <div className="mt-20 relative">
          {/* Connection line - desktop only */}
          <div className="absolute top-10 left-[10%] right-[10%] hidden h-0.5 bg-gradient-to-r from-primary/20 via-primary/40 to-primary/20 lg:block" />

          <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-5 lg:gap-6">
            {steps.map((step, index) => (
              <div key={step.title} className="relative text-center group">
                <div className="relative mx-auto mb-5">
                  <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-primary/70 text-primary-foreground shadow-xl shadow-primary/20 transition-transform duration-300 group-hover:scale-110 group-hover:shadow-2xl group-hover:shadow-primary/30">
                    <step.icon className="h-8 w-8" />
                  </div>
                  <div className="absolute -top-2 -right-2 flex h-8 w-8 items-center justify-center rounded-full bg-card text-sm font-bold text-primary shadow-md border-2 border-primary/20">
                    {index + 1}
                  </div>
                </div>
                <h3 className="text-lg font-semibold text-foreground">{step.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
