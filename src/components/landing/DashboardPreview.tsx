import { TrendingUp, Package, Truck, DollarSign } from "lucide-react";

const stats = [
  { icon: DollarSign, value: "৳১,২৫,০০০", label: "মোট বিক্রি", change: "+১২%" },
  { icon: Package, value: "১,২৩৪", label: "মোট অর্ডার", change: "+৮%" },
  { icon: Truck, value: "৯৫৬", label: "ডেলিভারি সম্পন্ন", change: "+১৫%" },
  { icon: TrendingUp, value: "৳৪৫,০০০", label: "নেট প্রফিট", change: "+২০%" },
];

const DashboardPreview = () => {
  return (
    <section className="bg-secondary/30 py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-foreground sm:text-4xl">রিয়েল-টাইম ড্যাশবোর্ড</h2>
          <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
            আপনার ব্যবসার সম্পূর্ণ চিত্র এক নজরে দেখুন
          </p>
        </div>

        <div className="mx-auto mt-12 max-w-4xl rounded-2xl border border-border/60 bg-card p-6 shadow-xl shadow-primary/5">
          <div className="mb-4 flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-destructive" />
            <div className="h-3 w-3 rounded-full bg-yellow-400" />
            <div className="h-3 w-3 rounded-full bg-green-400" />
            <span className="ml-2 text-sm text-muted-foreground">QUICK SHOP BD Dashboard</span>
          </div>

          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {stats.map((stat) => (
              <div key={stat.label} className="rounded-xl border border-border/60 bg-secondary/50 p-4">
                <div className="flex items-center justify-between">
                  <stat.icon className="h-5 w-5 text-primary" />
                  <span className="text-xs font-medium text-green-600">{stat.change}</span>
                </div>
                <div className="mt-2 text-xl font-bold text-foreground">{stat.value}</div>
                <div className="text-xs text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>

          <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
            <div className="rounded-xl border border-border/60 bg-secondary/50 p-4">
              <h4 className="mb-3 text-sm font-semibold text-foreground">বিক্রি ট্রেন্ড</h4>
              <div className="flex h-32 items-end gap-1">
                {[40, 65, 45, 80, 55, 90, 70, 85, 60, 95, 75, 88].map((h, i) => (
                  <div
                    key={i}
                    className="flex-1 rounded-t bg-gradient-to-t from-primary to-primary/60"
                    style={{ height: `${h}%` }}
                  />
                ))}
              </div>
            </div>
            <div className="rounded-xl border border-border/60 bg-secondary/50 p-4">
              <h4 className="mb-3 text-sm font-semibold text-foreground">সাম্প্রতিক অর্ডার</h4>
              <div className="space-y-2">
                {[
                  { id: "#১২৩৪", customer: "রহিম মিয়া", amount: "৳১,৫০০", status: "ডেলিভারড" },
                  { id: "#১২৩৫", customer: "করিম সাহেব", amount: "৳২,৩০০", status: "প্রসেসিং" },
                  { id: "#১২৩৬", customer: "সালমা বেগম", amount: "৳৮৫০", status: "শিপড" },
                ].map((order) => (
                  <div key={order.id} className="flex items-center justify-between rounded-lg bg-background/50 px-3 py-2 text-sm">
                    <span className="font-medium text-foreground">{order.id}</span>
                    <span className="text-muted-foreground">{order.customer}</span>
                    <span className="font-medium text-foreground">{order.amount}</span>
                    <span className="rounded-full bg-accent px-2 py-0.5 text-xs text-accent-foreground">{order.status}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default DashboardPreview;
