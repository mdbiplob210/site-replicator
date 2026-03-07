import { useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { BarChart3, Eye, MousePointerClick, Target, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  useLandingPageAnalyticsSummary,
  useLandingPageDailyStats,
} from "@/hooks/useLandingPageAnalytics";
import { useLandingPages } from "@/hooks/useLandingPages";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  Legend,
} from "recharts";

export default function AdminLandingPageAnalytics() {
  const { data: summaries, isLoading } = useLandingPageAnalyticsSummary();
  const { data: pages } = useLandingPages();
  const [selectedPageId, setSelectedPageId] = useState<string>("all");
  const [days, setDays] = useState(7);

  const { data: dailyStats } = useLandingPageDailyStats(
    selectedPageId === "all" ? undefined : selectedPageId,
    days
  );

  const totalViews = summaries?.reduce((s, p) => s + p.views, 0) || 0;
  const totalClicks = summaries?.reduce((s, p) => s + p.clicks, 0) || 0;
  const totalConversions = summaries?.reduce((s, p) => s + p.conversions, 0) || 0;
  const avgCtr = totalViews > 0 ? (totalClicks / totalViews) * 100 : 0;

  return (
    <AdminLayout>
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-2xl bg-secondary flex items-center justify-center">
              <BarChart3 className="h-6 w-6 text-muted-foreground" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Landing Page Analytics</h1>
              <p className="text-sm text-muted-foreground">প্রতিটি পেজের ভিউ, ক্লিক ও কনভার্সন ট্র্যাক করুন</p>
            </div>
          </div>
          <div className="flex gap-3">
            <Select value={selectedPageId} onValueChange={setSelectedPageId}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="সব পেজ" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">সব পেজ</SelectItem>
                {pages?.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={String(days)} onValueChange={(v) => setDays(Number(v))}>
              <SelectTrigger className="w-[130px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">৭ দিন</SelectItem>
                <SelectItem value="14">১৪ দিন</SelectItem>
                <SelectItem value="30">৩০ দিন</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">মোট ভিউ</p>
                  <p className="text-3xl font-bold text-foreground">{totalViews.toLocaleString()}</p>
                </div>
                <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Eye className="h-5 w-5 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">মোট ক্লিক</p>
                  <p className="text-3xl font-bold text-foreground">{totalClicks.toLocaleString()}</p>
                </div>
                <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <MousePointerClick className="h-5 w-5 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">কনভার্সন</p>
                  <p className="text-3xl font-bold text-foreground">{totalConversions.toLocaleString()}</p>
                </div>
                <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Target className="h-5 w-5 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">CTR</p>
                  <p className="text-3xl font-bold text-foreground">{avgCtr.toFixed(1)}%</p>
                </div>
                <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <TrendingUp className="h-5 w-5 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Daily Trend Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">ডেইলি ট্রেন্ড</CardTitle>
          </CardHeader>
          <CardContent>
            {dailyStats && dailyStats.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={dailyStats}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis
                    dataKey="date"
                    tickFormatter={(d) => {
                      const date = new Date(d);
                      return `${date.getDate()}/${date.getMonth() + 1}`;
                    }}
                    className="text-muted-foreground"
                    fontSize={12}
                  />
                  <YAxis className="text-muted-foreground" fontSize={12} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                      color: "hsl(var(--foreground))",
                    }}
                  />
                  <Legend />
                  <Line type="monotone" dataKey="views" stroke="hsl(var(--primary))" name="ভিউ" strokeWidth={2} />
                  <Line type="monotone" dataKey="clicks" stroke="hsl(var(--destructive))" name="ক্লিক" strokeWidth={2} />
                  <Line type="monotone" dataKey="conversions" stroke="#10b981" name="কনভার্সন" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-center text-muted-foreground py-10">এখনো কোনো ডেটা নেই</p>
            )}
          </CardContent>
        </Card>

        {/* Per-page breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">পেজ অনুযায়ী পারফরম্যান্স</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p className="text-center text-muted-foreground py-6">লোড হচ্ছে...</p>
            ) : summaries && summaries.length > 0 ? (
              <div className="space-y-0">
                <div className="grid grid-cols-6 gap-4 py-3 px-4 text-xs font-medium text-muted-foreground border-b">
                  <div className="col-span-2">পেজ</div>
                  <div className="text-right">ভিউ</div>
                  <div className="text-right">ক্লিক</div>
                  <div className="text-right">কনভার্সন</div>
                  <div className="text-right">CTR</div>
                </div>
                {summaries.map((s) => (
                  <div
                    key={s.landing_page_id}
                    className="grid grid-cols-6 gap-4 py-3 px-4 text-sm border-b last:border-0 hover:bg-muted/50 transition-colors"
                  >
                    <div className="col-span-2">
                      <p className="font-medium text-foreground truncate">{s.title}</p>
                      <p className="text-xs text-muted-foreground font-mono">/lp/{s.slug}</p>
                    </div>
                    <div className="text-right font-medium text-foreground">{s.views}</div>
                    <div className="text-right font-medium text-foreground">{s.clicks}</div>
                    <div className="text-right font-medium text-foreground">{s.conversions}</div>
                    <div className="text-right font-medium text-foreground">{s.ctr.toFixed(1)}%</div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-6">কোনো পেজ নেই</p>
            )}
          </CardContent>
        </Card>

        {/* Bar chart comparison */}
        {summaries && summaries.length > 1 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">পেজ তুলনা</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={summaries}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="slug" fontSize={12} className="text-muted-foreground" />
                  <YAxis fontSize={12} className="text-muted-foreground" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                      color: "hsl(var(--foreground))",
                    }}
                  />
                  <Legend />
                  <Bar dataKey="views" fill="hsl(var(--primary))" name="ভিউ" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="clicks" fill="hsl(var(--destructive))" name="ক্লিক" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="conversions" fill="#10b981" name="কনভার্সন" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}
      </div>
    </AdminLayout>
  );
}
