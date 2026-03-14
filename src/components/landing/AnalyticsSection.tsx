import { BarChart3, PieChart, Activity, TrendingUp } from "lucide-react";

const metrics = [
  { icon: BarChart3, title: "বিক্রি বিশ্লেষণ", desc: "দৈনিক, সাপ্তাহিক ও মাসিক বিক্রির ট্রেন্ড দেখুন।" },
  { icon: PieChart, title: "প্রোডাক্ট পারফরম্যান্স", desc: "কোন প্রোডাক্ট সবচেয়ে বেশি বিক্রি হচ্ছে জানুন।" },
  { icon: Activity, title: "রিয়েল-টাইম মনিটরিং", desc: "লাইভ ডেটা দিয়ে আপনার ব্যবসা মনিটর করুন।" },
  { icon: TrendingUp, title: "প্রফিট অ্যানালাইসিস", desc: "প্রতিটি অর্ডারের প্রকৃত লাভ ক্যালকুলেট করুন।" },
];

const AnalyticsSection = () => {
  return (
    <section className="relative py-24 sm:py-32 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-t from-secondary/20 to-transparent" />
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <span className="inline-block rounded-full bg-primary/10 px-4 py-1.5 text-sm font-semibold text-primary">
            ডেটা ড্রিভেন
          </span>
          <h2 className="mt-4 text-3xl font-bold text-foreground sm:text-4xl lg:text-5xl">
            অ্যানালিটিক্স ও <span className="text-primary">ট্র্যাকিং</span>
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            আপনার ব্যবসার প্রতিটি দিক বিশ্লেষণ করুন ডেটা দিয়ে
          </p>
        </div>

        <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {metrics.map((m, i) => (
            <div
              key={m.title}
              className="group rounded-2xl border border-border/50 bg-card p-8 text-center transition-all duration-300 hover:-translate-y-1 hover:border-primary/20 hover:shadow-xl hover:shadow-primary/5"
            >
              <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/10 to-accent text-primary transition-all duration-300 group-hover:from-primary group-hover:to-primary/80 group-hover:text-primary-foreground group-hover:shadow-lg group-hover:shadow-primary/25">
                <m.icon className="h-7 w-7" />
              </div>
              <h3 className="text-lg font-semibold text-foreground">{m.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{m.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default AnalyticsSection;
