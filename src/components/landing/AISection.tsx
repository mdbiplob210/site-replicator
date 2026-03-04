import { Bot, CheckCircle } from "lucide-react";

const stats = [
  { value: "80%", label: "সময় সাশ্রয়" },
  { value: "95%", label: "ফেক অর্ডার ডিটেকশন" },
  { value: "10x", label: "দ্রুত অর্ডার প্রসেসিং" },
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
    <section id="ai-automation" className="bg-gradient-to-br from-primary/5 via-background to-accent/20 py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <div>
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-accent px-4 py-1.5 text-sm font-medium text-accent-foreground">
              <Bot className="h-4 w-4" />
              AI পাওয়ার্ড
            </div>
            <h2 className="text-3xl font-bold text-foreground sm:text-4xl">
              AI অটোমেশন দিয়ে
              <br />
              <span className="text-primary">ব্যবসা ১০ গুণ দ্রুত</span> করুন
            </h2>
            <p className="mt-4 text-muted-foreground">
              আমাদের অত্যাধুনিক AI সিস্টেম আপনার ই-কমার্স অপারেশনের ৮০% কাজ অটোমেট করে,
              যাতে আপনি ব্যবসার গ্রোথে ফোকাস করতে পারেন।
            </p>

            <ul className="mt-6 space-y-3">
              {aiFeatures.map((feature) => (
                <li key={feature} className="flex items-center gap-2 text-sm text-foreground">
                  <CheckCircle className="h-4 w-4 shrink-0 text-primary" />
                  {feature}
                </li>
              ))}
            </ul>
          </div>

          <div className="grid grid-cols-3 gap-4">
            {stats.map((stat) => (
              <div
                key={stat.label}
                className="rounded-2xl border border-border/60 bg-card p-6 text-center shadow-sm"
              >
                <div className="text-3xl font-bold text-primary sm:text-4xl">{stat.value}</div>
                <div className="mt-2 text-sm text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default AISection;
