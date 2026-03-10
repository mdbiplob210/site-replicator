import { useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { useWebsiteAnalytics } from "@/hooks/useWebsiteAnalytics";
import { useApiKeys } from "@/hooks/useApiKeys";
import { AnalyticsSnippetGenerator } from "@/components/admin/analytics/AnalyticsSnippetGenerator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Eye, Users, MousePointerClick, ShoppingCart, TrendingUp, Monitor, Smartphone, Tablet, Globe, BarChart3, Clock, ArrowUpDown } from "lucide-react";
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";

const COLORS = ["hsl(var(--primary))", "hsl(var(--destructive))", "#10b981", "#f59e0b", "#8b5cf6", "#ec4899"];

const DeviceIcon = ({ type }: { type: string }) => {
  if (type === "mobile") return <Smartphone className="h-4 w-4" />;
  if (type === "tablet") return <Tablet className="h-4 w-4" />;
  return <Monitor className="h-4 w-4" />;
};

export default function AdminWebsiteAnalytics() {
  const [days, setDays] = useState(7);
  const { data, isLoading } = useWebsiteAnalytics(days);
  const { data: apiKeys } = useApiKeys();
  const firstActiveKey = apiKeys?.find((k) => k.is_active)?.api_key || "";
  const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID || "";

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center">
              <BarChart3 className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">ওয়েবসাইট অ্যানালিটিক্স</h1>
              <p className="text-sm text-muted-foreground">ভিজিটর, পেজ ভিউ, প্রোডাক্ট পারফরম্যান্স ও কনভার্সন ট্র্যাকিং</p>
            </div>
          </div>
          <Select value={String(days)} onValueChange={(v) => setDays(Number(v))}>
            <SelectTrigger className="w-[130px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">৭ দিন</SelectItem>
              <SelectItem value="14">১৪ দিন</SelectItem>
              <SelectItem value="30">৩০ দিন</SelectItem>
              <SelectItem value="60">৬০ দিন</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {isLoading ? (
          <div className="text-center py-20 text-muted-foreground">লোড হচ্ছে...</div>
        ) : !data ? (
          <div className="text-center py-20 text-muted-foreground">ডেটা পাওয়া যায়নি</div>
        ) : (
          <>
            {/* Summary Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
              <SummaryCard icon={Eye} label="পেজ ভিউ" value={data.totalPageViews} />
              <SummaryCard icon={Users} label="ইউনিক ভিজিটর" value={data.uniqueVisitors} />
              <SummaryCard icon={MousePointerClick} label="প্রোডাক্ট ভিউ" value={data.totalProductViews} />
              <SummaryCard icon={ShoppingCart} label="Add to Cart" value={data.totalAddToCart} />
              <SummaryCard icon={TrendingUp} label="পার্চেজ" value={data.totalPurchases} />
              <SummaryCard icon={ArrowUpDown} label="কনভার্সন রেট" value={`${data.conversionRate.toFixed(1)}%`} />
            </div>

            {/* Daily Trend + Device Breakdown */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card className="lg:col-span-2">
                <CardHeader><CardTitle className="text-base">ডেইলি ট্রেন্ড</CardTitle></CardHeader>
                <CardContent>
                  {data.dailyTrend.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={data.dailyTrend}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                        <XAxis dataKey="date" tickFormatter={(d) => { const dt = new Date(d); return `${dt.getDate()}/${dt.getMonth()+1}`; }} fontSize={12} />
                        <YAxis fontSize={12} />
                        <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", color: "hsl(var(--foreground))" }} />
                        <Legend />
                        <Line type="monotone" dataKey="page_views" stroke="hsl(var(--primary))" name="পেজ ভিউ" strokeWidth={2} />
                        <Line type="monotone" dataKey="product_views" stroke="#f59e0b" name="প্রোডাক্ট ভিউ" strokeWidth={2} />
                        <Line type="monotone" dataKey="purchases" stroke="#10b981" name="পার্চেজ" strokeWidth={2} />
                      </LineChart>
                    </ResponsiveContainer>
                  ) : <p className="text-center text-muted-foreground py-10">ডেটা নেই</p>}
                </CardContent>
              </Card>

              <Card>
                <CardHeader><CardTitle className="text-base">ডিভাইস ব্রেকডাউন</CardTitle></CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {data.deviceBreakdown.map((d) => (
                      <div key={d.device} className="flex items-center gap-3">
                        <DeviceIcon type={d.device} />
                        <div className="flex-1">
                          <div className="flex justify-between text-sm mb-1">
                            <span className="capitalize font-medium text-foreground">{d.device}</span>
                            <span className="text-muted-foreground">{d.percentage.toFixed(1)}%</span>
                          </div>
                          <div className="h-2 rounded-full bg-muted overflow-hidden">
                            <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${d.percentage}%` }} />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 pt-4 border-t flex justify-between text-sm text-muted-foreground">
                    <span>বাউন্স রেট</span>
                    <span className="font-medium text-foreground">{data.bounceRate.toFixed(1)}%</span>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Top Products */}
            <Card>
              <CardHeader><CardTitle className="text-base">টপ প্রোডাক্ট পারফরম্যান্স</CardTitle></CardHeader>
              <CardContent>
                {data.topProducts.length > 0 ? (
                  <div className="overflow-x-auto">
                    <div className="min-w-[600px]">
                      <div className="grid grid-cols-5 gap-4 py-3 px-4 text-xs font-medium text-muted-foreground border-b">
                        <div className="col-span-2">প্রোডাক্ট</div>
                        <div className="text-right">ভিউ</div>
                        <div className="text-right">পার্চেজ</div>
                        <div className="text-right">কনভার্সন</div>
                      </div>
                      {data.topProducts.map((p, i) => (
                        <div key={i} className="grid grid-cols-5 gap-4 py-3 px-4 text-sm border-b last:border-0 hover:bg-muted/50 transition-colors">
                          <div className="col-span-2">
                            <p className="font-medium text-foreground truncate">{p.name}</p>
                            {p.code && <p className="text-xs text-muted-foreground font-mono">{p.code}</p>}
                          </div>
                          <div className="text-right font-medium text-foreground">{p.views}</div>
                          <div className="text-right font-medium text-foreground">{p.purchases}</div>
                          <div className="text-right">
                            <span className={`font-medium ${p.conversionRate > 5 ? "text-green-600" : p.conversionRate > 0 ? "text-yellow-600" : "text-muted-foreground"}`}>
                              {p.conversionRate.toFixed(1)}%
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : <p className="text-center text-muted-foreground py-6">এখনো কোনো প্রোডাক্ট ভিউ নেই</p>}
              </CardContent>
            </Card>

            {/* Top Pages + Referrers */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader><CardTitle className="text-base">টপ পেজ</CardTitle></CardHeader>
                <CardContent>
                  {data.topPages.length > 0 ? (
                    <div className="space-y-3">
                      {data.topPages.map((p, i) => (
                        <div key={i} className="flex items-center justify-between">
                          <span className="text-sm font-mono text-foreground truncate max-w-[70%]">{p.path}</span>
                          <span className="text-sm font-medium text-muted-foreground">{p.views} ভিউ</span>
                        </div>
                      ))}
                    </div>
                  ) : <p className="text-center text-muted-foreground py-6">ডেটা নেই</p>}
                </CardContent>
              </Card>

              <Card>
                <CardHeader><CardTitle className="text-base flex items-center gap-2"><Globe className="h-4 w-4" /> ট্রাফিক সোর্স</CardTitle></CardHeader>
                <CardContent>
                  {data.referrerBreakdown.length > 0 ? (
                    <div className="space-y-3">
                      {data.referrerBreakdown.map((r, i) => (
                        <div key={i} className="flex items-center justify-between">
                          <span className="text-sm text-foreground truncate max-w-[70%]">{r.source}</span>
                          <span className="text-sm font-medium text-muted-foreground">{r.count}</span>
                        </div>
                      ))}
                    </div>
                  ) : <p className="text-center text-muted-foreground py-6">ডেটা নেই</p>}
                </CardContent>
              </Card>
            </div>

            {/* Hourly Heatmap */}
            <Card>
              <CardHeader><CardTitle className="text-base flex items-center gap-2"><Clock className="h-4 w-4" /> ঘণ্টা অনুযায়ী ভিজিটর অ্যাক্টিভিটি</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={data.hourlyHeatmap}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis dataKey="hour" tickFormatter={(h) => `${h}:00`} fontSize={11} />
                    <YAxis fontSize={11} />
                    <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", color: "hsl(var(--foreground))" }} labelFormatter={(h) => `${h}:00 - ${h}:59`} />
                    <Bar dataKey="count" fill="hsl(var(--primary))" name="ইভেন্ট" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Funnel */}
            <Card>
              <CardHeader><CardTitle className="text-base">কনভার্সন ফানেল</CardTitle></CardHeader>
              <CardContent>
                <div className="flex items-end justify-center gap-4 h-[200px]">
                  {[
                    { label: "পেজ ভিউ", value: data.totalPageViews, color: "bg-primary" },
                    { label: "প্রোডাক্ট ভিউ", value: data.totalProductViews, color: "bg-yellow-500" },
                    { label: "Add to Cart", value: data.totalAddToCart, color: "bg-orange-500" },
                    { label: "পার্চেজ", value: data.totalPurchases, color: "bg-green-500" },
                  ].map((step, i) => {
                    const maxVal = Math.max(data.totalPageViews, 1);
                    const height = Math.max((step.value / maxVal) * 160, 20);
                    const prevValue = i === 0 ? step.value : [data.totalPageViews, data.totalProductViews, data.totalAddToCart, data.totalPurchases][i - 1];
                    const dropRate = prevValue > 0 ? ((1 - step.value / prevValue) * 100).toFixed(0) : "0";
                    return (
                      <div key={step.label} className="flex flex-col items-center gap-2 flex-1">
                        <span className="text-lg font-bold text-foreground">{step.value}</span>
                        <div className={`w-full max-w-[80px] rounded-t-lg ${step.color}`} style={{ height: `${height}px` }} />
                        <span className="text-xs text-muted-foreground text-center">{step.label}</span>
                        {i > 0 && <span className="text-xs text-destructive">-{dropRate}%</span>}
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </AdminLayout>
  );
}

function SummaryCard({ icon: Icon, label, value }: { icon: any; label: string; value: number | string }) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className="text-2xl font-bold text-foreground">{typeof value === "number" ? value.toLocaleString() : value}</p>
          </div>
          <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center">
            <Icon className="h-4 w-4 text-primary" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
