import { TrendingUp, Package, Truck, DollarSign } from "lucide-react";

const stats = [
  { icon: DollarSign, value: "৳১,২৫,০০০", label: "মোট বিক্রি", change: "+১২%", color: "text-primary" },
  { icon: Package, value: "১,২৩৪", label: "মোট অর্ডার", change: "+৮%", color: "text-primary" },
  { icon: Truck, value: "৯৫৬", label: "ডেলিভারি সম্পন্ন", change: "+১৫%", color: "text-primary" },
  { icon: TrendingUp, value: "৳৪৫,০০০", label: "নেট প্রফিট", change: "+২০%", color: "text-primary" },
];

const DashboardPreview = () => {
  return (
    <section className="relative py-24 sm:py-32">
      <div className="absolute inset-0 bg-gradient-to-b from-secondary/30 via-secondary/10 to-transparent" />
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <span className="inline-block rounded-full bg-primary/10 px-4 py-1.5 text-sm font-semibold text-primary">
            ড্যাশবোর্ড
          </span>
          <h2 className="mt-4 text-3xl font-bold text-foreground sm:text-4xl lg:text-5xl">
            রিয়েল-টাইম <span className="text-primary">ড্যাশবোর্ড</span>
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            আপনার ব্যবসার সম্পূর্ণ চিত্র এক নজরে দেখুন
          </p>
        </div>

        <div className="mx-auto mt-16 max-w-5xl">
          <div className="rounded-3xl border border-border/50 bg-card p-2 shadow-2xl shadow-primary/5">
            {/* Browser chrome */}
            <div className="flex items-center gap-2 rounded-t-2xl bg-secondary/50 px-4 py-3">
              <div className="flex gap-1.5">
                <div className="h-3 w-3 rounded-full bg-destructive/60" />
                <div className="h-3 w-3 rounded-full bg-yellow-400/60" />
                <div className="h-3 w-3 rounded-full bg-green-400/60" />
              </div>
              <div className="ml-4 flex-1 rounded-lg bg-background/80 px-4 py-1.5 text-xs text-muted-foreground">
                quickshopbd.com/admin/dashboard
              </div>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                {stats.map((stat) => (
                  <div key={stat.label} className="rounded-xl border border-border/50 bg-gradient-to-br from-background to-secondary/30 p-5">
                    <div className="flex items-center justify-between">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                        <stat.icon className="h-5 w-5 text-primary" />
                      </div>
                      <span className="rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-semibold text-green-700">{stat.change}</span>
                    </div>
                    <div className="mt-3 text-2xl font-bold text-foreground">{stat.value}</div>
                    <div className="mt-1 text-xs text-muted-foreground">{stat.label}</div>
                  </div>
                ))}
              </div>

              <div className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-2">
                <div className="rounded-xl border border-border/50 bg-gradient-to-br from-background to-secondary/30 p-5">
                  <h4 className="mb-4 text-sm font-semibold text-foreground">বিক্রি ট্রেন্ড</h4>
                  <div className="flex h-36 items-end gap-1.5">
                    {[40, 65, 45, 80, 55, 90, 70, 85, 60, 95, 75, 88].map((h, i) => (
                      <div
                        key={i}
                        className="flex-1 rounded-t-md bg-gradient-to-t from-primary to-primary/40 transition-all duration-300 hover:from-primary hover:to-primary/60"
                        style={{ height: `${h}%` }}
                      />
                    ))}
                  </div>
                </div>
                <div className="rounded-xl border border-border/50 bg-gradient-to-br from-background to-secondary/30 p-5">
                  <h4 className="mb-4 text-sm font-semibold text-foreground">সাম্প্রতিক অর্ডার</h4>
                  <div className="space-y-2.5">
                    {[
                      { id: "#১২৩৪", customer: "রহিম মিয়া", amount: "৳১,৫০০", status: "ডেলিভারড", statusColor: "bg-green-100 text-green-700" },
                      { id: "#১২৩৫", customer: "করিম সাহেব", amount: "৳২,৩০০", status: "প্রসেসিং", statusColor: "bg-primary/10 text-primary" },
                      { id: "#১২৩৬", customer: "সালমা বেগম", amount: "৳৮৫০", status: "শিপড", statusColor: "bg-accent text-accent-foreground" },
                    ].map((order) => (
                      <div key={order.id} className="flex items-center justify-between rounded-lg bg-background/80 px-4 py-3 text-sm">
                        <span className="font-semibold text-foreground">{order.id}</span>
                        <span className="text-muted-foreground">{order.customer}</span>
                        <span className="font-semibold text-foreground">{order.amount}</span>
                        <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${order.statusColor}`}>{order.status}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default DashboardPreview;
