import { BarChart3, PieChart, Activity, TrendingUp } from "lucide-react";

const metrics = [
  { icon: BarChart3, title: "বিক্রি বিশ্লেষণ", desc: "দৈনিক, সাপ্তাহিক ও মাসিক বিক্রির ট্রেন্ড দেখুন।" },
  { icon: PieChart, title: "প্রোডাক্ট পারফরম্যান্স", desc: "কোন প্রোডাক্ট সবচেয়ে বেশি বিক্রি হচ্ছে জানুন।" },
  { icon: Activity, title: "রিয়েল-টাইম মনিটরিং", desc: "লাইভ ডেটা দিয়ে আপনার ব্যবসা মনিটর করুন।" },
  { icon: TrendingUp, title: "প্রফিট অ্যানালাইসিস", desc: "প্রতিটি অর্ডারের প্রকৃত লাভ ক্যালকুলেট করুন।" },
];

const AnalyticsSection = () => {
  return (
    <section className="py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-foreground sm:text-4xl">অ্যানালিটিক্স ও ট্র্যাকিং</h2>
          <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
            আপনার ব্যবসার প্রতিটি দিক বিশ্লেষণ করুন ডেটা দিয়ে
          </p>
        </div>

        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {metrics.map((m) => (
            <div
              key={m.title}
              className="rounded-xl border border-border/60 bg-card p-6 text-center transition-all hover:border-primary/30 hover:shadow-md"
            >
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-accent text-primary">
                <m.icon className="h-6 w-6" />
              </div>
              <h3 className="font-semibold text-foreground">{m.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{m.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default AnalyticsSection;
