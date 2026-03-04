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
    <section id="how-it-works" className="py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-foreground sm:text-4xl">কিভাবে কাজ করে</h2>
          <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
            মাত্র ৫টি সহজ ধাপে আপনার ব্যবসা অটোমেট করুন
          </p>
        </div>

        <div className="mt-14 grid gap-8 sm:grid-cols-2 lg:grid-cols-5">
          {steps.map((step, index) => (
            <div key={step.title} className="relative text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-primary/70 text-primary-foreground shadow-lg shadow-primary/20">
                <step.icon className="h-7 w-7" />
              </div>
              <div className="absolute -top-2 left-1/2 flex h-7 w-7 -translate-x-1/2 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                {index + 1}
              </div>
              <h3 className="font-semibold text-foreground">{step.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{step.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
