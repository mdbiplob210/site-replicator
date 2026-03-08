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
    <section className="bg-gradient-to-br from-primary/5 via-background to-accent/20 py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-foreground sm:text-4xl">কেন QUICK SHOP BD?</h2>
          <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
            বাংলাদেশের সেরা ই-কমার্স ম্যানেজমেন্ট প্ল্যাটফর্ম বেছে নেওয়ার ৮টি কারণ
          </p>
        </div>

        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {benefits.map((b) => (
            <div
              key={b.title}
              className="rounded-xl border border-border/60 bg-card p-5 text-center transition-all hover:border-primary/30 hover:shadow-md"
            >
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-accent text-primary">
                <b.icon className="h-6 w-6" />
              </div>
              <h3 className="font-semibold text-foreground">{b.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{b.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default WhyChoose;
