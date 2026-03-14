import {
  Shield, Zap, HeadphonesIcon, TrendingUp,
  Clock, Users, Award, Heart
} from "lucide-react";

const benefits = [
  { icon: Shield, title: "১০০% নিরাপদ", desc: "এন্ড-টু-এন্ড এনক্রিপশন" },
  { icon: Zap, title: "সুপার ফাস্ট", desc: "৩০ সেকেন্ডে সেটআপ" },
  { icon: HeadphonesIcon, title: "২৪/৭ সাপোর্ট", desc: "সবসময় পাশে আছি" },
  { icon: TrendingUp, title: "গ্রোথ ফোকাসড", desc: "ব্যবসা বাড়াতে সাহায্য করি" },
  { icon: Clock, title: "সময় সাশ্রয়", desc: "৮০% কাজ অটোমেটিক" },
  { icon: Users, title: "৫০০০+ ব্যবসায়ী", desc: "বিশ্বস্ত কমিউনিটি" },
  { icon: Award, title: "বেস্ট ইন ক্লাস", desc: "সর্বোচ্চ মানের সেবা" },
  { icon: Heart, title: "মেড ইন বাংলাদেশ", desc: "দেশীয় প্ল্যাটফর্ম" },
];

const WhyChoose = () => {
  return (
    <section className="relative py-24 sm:py-32 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/3 via-background to-accent/10" />
      <div className="absolute -bottom-32 -left-32 h-[400px] w-[400px] rounded-full bg-primary/5 blur-3xl" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <span className="inline-block rounded-full bg-primary/10 px-4 py-1.5 text-sm font-semibold text-primary">
            কেন আমরা
          </span>
          <h2 className="mt-4 text-3xl font-bold text-foreground sm:text-4xl lg:text-5xl">
            কেন <span className="text-primary">QUICK SHOP BD</span>?
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            বাংলাদেশের সেরা ই-কমার্স ম্যানেজমেন্ট প্ল্যাটফর্ম বেছে নেওয়ার ৮টি কারণ
          </p>
        </div>

        <div className="mt-16 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {benefits.map((b, i) => (
            <div
              key={b.title}
              className="group rounded-2xl border border-border/50 bg-card/80 backdrop-blur-sm p-7 text-center transition-all duration-300 hover:-translate-y-1 hover:border-primary/20 hover:shadow-xl hover:shadow-primary/5"
            >
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-accent text-primary transition-all duration-300 group-hover:bg-primary group-hover:text-primary-foreground group-hover:shadow-lg group-hover:shadow-primary/25 group-hover:scale-110">
                <b.icon className="h-7 w-7" />
              </div>
              <h3 className="text-lg font-semibold text-foreground">{b.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{b.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default WhyChoose;
