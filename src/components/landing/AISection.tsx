import { Bot, CheckCircle, Sparkles } from "lucide-react";

const stats = [
  { value: "80%", label: "সময় সাশ্রয়", color: "from-primary to-primary/60" },
  { value: "95%", label: "ফেক অর্ডার ডিটেকশন", color: "from-destructive/80 to-destructive/50" },
  { value: "10x", label: "দ্রুত অর্ডার প্রসেসিং", color: "from-green-500 to-green-400" },
];

const aiFeatures = [
  "অটোমেটিক অর্ডার কনফার্মেশন কল",
  "ফেক কাস্টমার আইডেন্টিফিকেশন",
  "স্মার্ট কুরিয়ার সিলেকশন",
  "প্রাইস ও ডিসকাউন্ট অপ্টিমাইজেশন",
  "কাস্টমার বিহেভিয়ার অ্যানালাইসিস",
  "অটোমেটিক ফলো-আপ মেসেজ",
];

const AISection = () => {
  return (
    <section id="ai-automation" className="relative py-24 sm:py-32 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-accent/10" />
      <div className="absolute top-20 right-0 h-[400px] w-[400px] rounded-full bg-primary/5 blur-3xl" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid items-center gap-16 lg:grid-cols-2">
          <div>
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-5 py-2 text-sm font-semibold text-primary">
              <Sparkles className="h-4 w-4" />
              AI পাওয়ার্ড
            </div>
            <h2 className="text-3xl font-bold leading-tight text-foreground sm:text-4xl lg:text-5xl">
              AI অটোমেশন দিয়ে
              <br />
              <span className="text-primary">ব্যবসা ১০ গুণ দ্রুত</span> করুন
            </h2>
            <p className="mt-5 text-lg leading-relaxed text-muted-foreground">
              আমাদের অত্যাধুনিক AI সিস্টেম আপনার ই-কমার্স অপারেশনের ৮০% কাজ অটোমেট করে,
              যাতে আপনি ব্যবসার গ্রোথে ফোকাস করতে পারেন।
            </p>

            <ul className="mt-8 space-y-4">
              {aiFeatures.map((feature) => (
                <li key={feature} className="flex items-center gap-3 text-foreground">
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10">
                    <CheckCircle className="h-4 w-4 text-primary" />
                  </div>
                  <span className="text-sm font-medium">{feature}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="space-y-5">
            {stats.map((stat) => (
              <div
                key={stat.label}
                className="group rounded-2xl border border-border/50 bg-card p-8 transition-all duration-300 hover:shadow-xl hover:border-primary/20"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium text-muted-foreground">{stat.label}</div>
                    <div className="mt-1 text-4xl font-extrabold text-foreground lg:text-5xl">{stat.value}</div>
                  </div>
                  <div className={`flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br ${stat.color} text-primary-foreground shadow-lg`}>
                    <Bot className="h-7 w-7" />
                  </div>
                </div>
                <div className="mt-4 h-2 overflow-hidden rounded-full bg-secondary">
                  <div
                    className={`h-full rounded-full bg-gradient-to-r ${stat.color} transition-all duration-1000`}
                    style={{ width: stat.value }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default AISection;
