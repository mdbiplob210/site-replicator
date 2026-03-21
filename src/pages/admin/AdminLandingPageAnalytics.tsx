import { useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import {
  BarChart3, Eye, MousePointerClick, Target, TrendingUp, Users, Globe, Smartphone,
  Monitor, Download, Filter, Activity, ArrowDown, Clock, BarChart2
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  useLandingPageAnalyticsSummary,
  useLandingPageDailyStats,
  useLandingPageFunnel,
  useLandingPageUTM,
  useLandingPageDeviceStats,
  useLandingPageScrollStats,
  useLandingPageLiveVisitors,
  useLandingPageEvents,
} from "@/hooks/useLandingPageAnalytics";
import { useLandingPages } from "@/hooks/useLandingPages";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, Legend, FunnelChart, Funnel, LabelList, Cell, PieChart, Pie,
} from "recharts";
import { toast } from "sonner";

const COLORS = ["hsl(var(--primary))", "#f97316", "#10b981", "#8b5cf6", "#ef4444", "#06b6d4"];

export default function AdminLandingPageAnalytics() {
  const { data: summaries, isLoading } = useLandingPageAnalyticsSummary();
  const { data: pages } = useLandingPages();
  const [selectedPageId, setSelectedPageId] = useState<string>("all");
  const [days, setDays] = useState(7);
  const pageFilter = selectedPageId === "all" ? undefined : selectedPageId;

  const { data: dailyStats } = useLandingPageDailyStats(pageFilter, days);
  const { data: funnelData } = useLandingPageFunnel(pageFilter, days);
  const { data: utmData } = useLandingPageUTM(pageFilter, days);
  const { data: deviceData } = useLandingPageDeviceStats(pageFilter, days);
  const { data: scrollData } = useLandingPageScrollStats(pageFilter, days);
  const { data: liveData } = useLandingPageLiveVisitors(pageFilter);
  const { data: allEvents } = useLandingPageEvents(pageFilter);

  const totalViews = summaries?.reduce((s, p) => s + p.views, 0) || 0;
  const totalClicks = summaries?.reduce((s, p) => s + p.clicks, 0) || 0;
  const totalConversions = summaries?.reduce((s, p) => s + p.conversions, 0) || 0;
  const avgCtr = totalViews > 0 ? (totalClicks / totalViews) * 100 : 0;
  const avgBounce = summaries && summaries.length > 0 ? summaries.reduce((s, p) => s + p.bounceRate, 0) / summaries.length : 0;

  const handleExportCSV = () => {
    if (!allEvents || allEvents.length === 0) { toast.error("কোনো ডেটা নেই"); return; }
    const headers = ["Date", "Event Type", "Event Name", "Visitor ID", "Device", "UTM Source", "UTM Campaign", "Scroll Depth", "Referrer"];
    const rows = allEvents.map((e) => [
      e.created_at, e.event_type, e.event_name || "", e.visitor_id || "",
      e.device_type || "", e.utm_source || "", e.utm_campaign || "",
      e.scroll_depth != null ? String(e.scroll_depth) : "", e.referrer || "",
    ]);
    const csv = [headers.join(","), ...rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `landing-analytics-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("CSV ডাউনলোড হয়েছে!");
  };

  const tooltipStyle = {
    backgroundColor: "hsl(var(--card))",
    border: "1px solid hsl(var(--border))",
    borderRadius: "8px",
    color: "hsl(var(--foreground))",
  };

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-2xl bg-secondary flex items-center justify-center">
              <BarChart3 className="h-6 w-6 text-muted-foreground" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Landing Page Analytics</h1>
              <div className="flex items-center gap-2 mt-1">
                <p className="text-sm text-muted-foreground">অ্যাডভান্সড ট্র্যাকিং ও বিশ্লেষণ</p>
                {liveData && liveData.count > 0 && (
                  <Badge variant="outline" className="text-green-600 border-green-300 animate-pulse">
                    <Activity className="h-3 w-3 mr-1" />
                    {liveData.count} লাইভ
                  </Badge>
                )}
              </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Select value={selectedPageId} onValueChange={setSelectedPageId}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="সব পেজ" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">সব পেজ</SelectItem>
                {pages?.map((p) => (
                  <SelectItem key={p.id} value={p.id}>{p.title}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={String(days)} onValueChange={(v) => setDays(Number(v))}>
              <SelectTrigger className="w-[120px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">৭ দিন</SelectItem>
                <SelectItem value="14">১৪ দিন</SelectItem>
                <SelectItem value="30">৩০ দিন</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm" onClick={handleExportCSV}>
              <Download className="h-4 w-4 mr-1" /> CSV
            </Button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {[
            { label: "মোট ভিউ", value: totalViews, icon: Eye, color: "text-primary" },
            { label: "ক্লিক", value: totalClicks, icon: MousePointerClick, color: "text-orange-500" },
            { label: "কনভার্সন", value: totalConversions, icon: Target, color: "text-green-500" },
            { label: "CTR", value: `${avgCtr.toFixed(1)}%`, icon: TrendingUp, color: "text-purple-500" },
            { label: "বাউন্স রেট", value: `${avgBounce.toFixed(0)}%`, icon: ArrowDown, color: "text-red-500" },
            { label: "লাইভ ভিজিটর", value: liveData?.count || 0, icon: Activity, color: "text-green-600" },
          ].map((card, i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-xs text-muted-foreground">{card.label}</p>
                  <card.icon className={`h-4 w-4 ${card.color}`} />
                </div>
                <p className="text-2xl font-bold text-foreground">
                  {typeof card.value === "number" ? card.value.toLocaleString() : card.value}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Tabs */}
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList className="flex-wrap">
            <TabsTrigger value="overview">ওভারভিউ</TabsTrigger>
            <TabsTrigger value="funnel">ফানেল</TabsTrigger>
            <TabsTrigger value="utm">UTM / সোর্স</TabsTrigger>
            <TabsTrigger value="scroll">স্ক্রল ডেপথ</TabsTrigger>
            <TabsTrigger value="devices">ডিভাইস</TabsTrigger>
            <TabsTrigger value="comparison">তুলনা</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4">
            <Card>
              <CardHeader><CardTitle className="text-base">ডেইলি ট্রেন্ড</CardTitle></CardHeader>
              <CardContent>
                {dailyStats && dailyStats.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={dailyStats}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                      <XAxis dataKey="date" tickFormatter={(d) => { const dt = new Date(d); return `${dt.getDate()}/${dt.getMonth()+1}`; }} fontSize={12} />
                      <YAxis fontSize={12} />
                      <Tooltip contentStyle={tooltipStyle} />
                      <Legend />
                      <Line type="monotone" dataKey="views" stroke="hsl(var(--primary))" name="ভিউ" strokeWidth={2} />
                      <Line type="monotone" dataKey="clicks" stroke="#f97316" name="ক্লিক" strokeWidth={2} />
                      <Line type="monotone" dataKey="conversions" stroke="#10b981" name="কনভার্সন" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                ) : <p className="text-center text-muted-foreground py-10">ডেটা নেই</p>}
              </CardContent>
            </Card>

            {/* Page Table */}
            <Card>
              <CardHeader><CardTitle className="text-base">পেজ পারফরম্যান্স</CardTitle></CardHeader>
              <CardContent className="overflow-x-auto">
                {summaries && summaries.length > 0 ? (
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b text-muted-foreground text-xs">
                        <th className="text-left py-2 px-3">পেজ</th>
                        <th className="text-right py-2 px-3">ভিউ</th>
                        <th className="text-right py-2 px-3">ক্লিক</th>
                        <th className="text-right py-2 px-3">কনভার্সন</th>
                        <th className="text-right py-2 px-3">CTR</th>
                        <th className="text-right py-2 px-3">কনভ. রেট</th>
                        <th className="text-right py-2 px-3">বাউন্স</th>
                        <th className="text-right py-2 px-3">গড় সময়</th>
                      </tr>
                    </thead>
                    <tbody>
                      {summaries.map((s) => (
                        <tr key={s.landing_page_id} className="border-b last:border-0 hover:bg-muted/50">
                          <td className="py-2 px-3">
                            <p className="font-medium text-foreground truncate max-w-[150px]">{s.title}</p>
                            <p className="text-xs text-muted-foreground font-mono">/lp/{s.slug}</p>
                          </td>
                          <td className="text-right py-2 px-3 font-medium">{s.views}</td>
                          <td className="text-right py-2 px-3">{s.clicks}</td>
                          <td className="text-right py-2 px-3 font-medium text-green-600">{s.conversions}</td>
                          <td className="text-right py-2 px-3">{s.ctr.toFixed(1)}%</td>
                          <td className="text-right py-2 px-3">{s.conversionRate.toFixed(1)}%</td>
                          <td className="text-right py-2 px-3">{s.bounceRate.toFixed(0)}%</td>
                          <td className="text-right py-2 px-3">{s.avgTimeOnPage}s</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : <p className="text-center text-muted-foreground py-6">কোনো পেজ নেই</p>}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Funnel Tab */}
          <TabsContent value="funnel" className="space-y-4">
            <Card>
              <CardHeader><CardTitle className="text-base">ভিজিটর ফানেল (ইউনিক ভিজিটর)</CardTitle></CardHeader>
              <CardContent>
                {funnelData && funnelData.length > 0 ? (
                  <div className="space-y-3">
                    {funnelData.map((step, i) => {
                      const maxCount = funnelData[0]?.count || 1;
                      const pct = maxCount > 0 ? (step.count / maxCount) * 100 : 0;
                      const dropOff = i > 0 && funnelData[i-1].count > 0
                        ? (((funnelData[i-1].count - step.count) / funnelData[i-1].count) * 100).toFixed(0)
                        : null;
                      return (
                        <div key={step.step} className="space-y-1">
                          <div className="flex items-center justify-between text-sm">
                            <span className="font-medium text-foreground">{step.label}</span>
                            <div className="flex items-center gap-2">
                              <span className="font-bold">{step.count}</span>
                              {dropOff && <span className="text-xs text-red-500">-{dropOff}%</span>}
                            </div>
                          </div>
                          <div className="h-8 bg-muted rounded-lg overflow-hidden">
                            <div
                              className="h-full rounded-lg transition-all duration-500"
                              style={{
                                width: `${Math.max(pct, 2)}%`,
                                background: `linear-gradient(90deg, ${COLORS[i % COLORS.length]}, ${COLORS[(i+1) % COLORS.length]})`,
                              }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : <p className="text-center text-muted-foreground py-10">ফানেল ডেটা নেই</p>}
              </CardContent>
            </Card>
          </TabsContent>

          {/* UTM Tab */}
          <TabsContent value="utm" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Card>
                <CardHeader><CardTitle className="text-base flex items-center gap-2"><Globe className="h-4 w-4" /> ট্রাফিক সোর্স</CardTitle></CardHeader>
                <CardContent>
                  {utmData?.sources && utmData.sources.length > 0 ? (
                    <div className="space-y-2">
                      {utmData.sources.map((s, i) => (
                        <div key={s.name} className="flex items-center justify-between p-2 rounded-lg border">
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                            <span className="text-sm font-medium">{s.name}</span>
                          </div>
                          <div className="flex items-center gap-3 text-sm">
                            <span className="text-muted-foreground">{s.views} ভিউ</span>
                            <span className="text-green-600 font-medium">{s.conversions} কনভ.</span>
                            <Badge variant="secondary">{s.rate.toFixed(1)}%</Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : <p className="text-center text-muted-foreground py-6">সোর্স ডেটা নেই</p>}
                </CardContent>
              </Card>

              <Card>
                <CardHeader><CardTitle className="text-base flex items-center gap-2"><BarChart2 className="h-4 w-4" /> ক্যাম্পেইন</CardTitle></CardHeader>
                <CardContent>
                  {utmData?.campaigns && utmData.campaigns.length > 0 ? (
                    <div className="space-y-2">
                      {utmData.campaigns.filter(c => c.name !== "none").map((c, i) => (
                        <div key={c.name} className="flex items-center justify-between p-2 rounded-lg border">
                          <span className="text-sm font-medium truncate max-w-[200px]">{c.name}</span>
                          <div className="flex items-center gap-3 text-sm">
                            <span className="text-muted-foreground">{c.views} ভিউ</span>
                            <span className="text-green-600 font-medium">{c.conversions} কনভ.</span>
                            <Badge variant="secondary">{c.rate.toFixed(1)}%</Badge>
                          </div>
                        </div>
                      ))}
                      {utmData.campaigns.filter(c => c.name !== "none").length === 0 && (
                        <p className="text-center text-muted-foreground py-4">কোনো ক্যাম্পেইন ডেটা নেই</p>
                      )}
                    </div>
                  ) : <p className="text-center text-muted-foreground py-6">ক্যাম্পেইন ডেটা নেই</p>}
                </CardContent>
              </Card>
            </div>

            {/* UTM Source Chart */}
            {utmData?.sources && utmData.sources.length > 0 && (
              <Card>
                <CardHeader><CardTitle className="text-base">সোর্স অনুযায়ী ভিউ</CardTitle></CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={utmData.sources.slice(0, 10)}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                      <XAxis dataKey="name" fontSize={11} />
                      <YAxis fontSize={11} />
                      <Tooltip contentStyle={tooltipStyle} />
                      <Bar dataKey="views" fill="hsl(var(--primary))" name="ভিউ" radius={[4,4,0,0]} />
                      <Bar dataKey="conversions" fill="#10b981" name="কনভার্সন" radius={[4,4,0,0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Scroll Depth Tab */}
          <TabsContent value="scroll" className="space-y-4">
            <Card>
              <CardHeader><CardTitle className="text-base">স্ক্রল ডেপথ (ইউনিক ভিজিটর)</CardTitle></CardHeader>
              <CardContent>
                {scrollData && scrollData.length > 0 ? (
                  <div className="space-y-4">
                    {scrollData.map((item, i) => {
                      const maxV = scrollData[0]?.visitors || 1;
                      const pct = maxV > 0 ? (item.visitors / maxV) * 100 : 0;
                      return (
                        <div key={item.milestone} className="space-y-1">
                          <div className="flex justify-between text-sm">
                            <span className="font-medium">{item.milestone} স্ক্রল</span>
                            <span className="font-bold">{item.visitors} জন</span>
                          </div>
                          <div className="h-6 bg-muted rounded-lg overflow-hidden">
                            <div
                              className="h-full rounded-lg transition-all duration-500 flex items-center justify-end pr-2"
                              style={{
                                width: `${Math.max(pct, 5)}%`,
                                background: COLORS[i % COLORS.length],
                              }}
                            >
                              <span className="text-xs font-medium text-white">{pct.toFixed(0)}%</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : <p className="text-center text-muted-foreground py-10">স্ক্রল ডেটা নেই</p>}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Devices Tab */}
          <TabsContent value="devices" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {[
                { title: "ডিভাইস", data: deviceData?.devices, icon: Smartphone },
                { title: "ব্রাউজার", data: deviceData?.browsers, icon: Globe },
                { title: "অপারেটিং সিস্টেম", data: deviceData?.operatingSystems, icon: Monitor },
              ].map((section) => (
                <Card key={section.title}>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <section.icon className="h-4 w-4" /> {section.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {section.data && section.data.length > 0 ? (
                      <div className="space-y-2">
                        {section.data.map((item, i) => {
                          const total = section.data!.reduce((s, d) => s + d.count, 0);
                          const pct = total > 0 ? ((item.count / total) * 100).toFixed(1) : "0";
                          return (
                            <div key={item.name} className="flex items-center justify-between p-2 rounded border">
                              <div className="flex items-center gap-2">
                                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                                <span className="text-sm">{item.name}</span>
                              </div>
                              <div className="flex items-center gap-2 text-sm">
                                <span className="font-medium">{item.count}</span>
                                <span className="text-muted-foreground text-xs">({pct}%)</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : <p className="text-center text-muted-foreground py-4">ডেটা নেই</p>}
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Device Pie Chart */}
            {deviceData?.devices && deviceData.devices.length > 0 && (
              <Card>
                <CardHeader><CardTitle className="text-base">ডিভাইস ব্রেকডাউন</CardTitle></CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie data={deviceData.devices} dataKey="count" nameKey="name" cx="50%" cy="50%" outerRadius={90} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                        {deviceData.devices.map((_, i) => (
                          <Cell key={i} fill={COLORS[i % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={tooltipStyle} />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Comparison Tab */}
          <TabsContent value="comparison" className="space-y-4">
            {summaries && summaries.length > 1 ? (
              <>
                <Card>
                  <CardHeader><CardTitle className="text-base">পেজ তুলনা — ভিউ ও কনভার্সন</CardTitle></CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={summaries}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                        <XAxis dataKey="slug" fontSize={11} />
                        <YAxis fontSize={11} />
                        <Tooltip contentStyle={tooltipStyle} />
                        <Legend />
                        <Bar dataKey="views" fill="hsl(var(--primary))" name="ভিউ" radius={[4,4,0,0]} />
                        <Bar dataKey="conversions" fill="#10b981" name="কনভার্সন" radius={[4,4,0,0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader><CardTitle className="text-base">CTR ও কনভার্সন রেট তুলনা</CardTitle></CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={summaries}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                        <XAxis dataKey="slug" fontSize={11} />
                        <YAxis fontSize={11} unit="%" />
                        <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => `${v.toFixed(1)}%`} />
                        <Legend />
                        <Bar dataKey="ctr" fill="#8b5cf6" name="CTR %" radius={[4,4,0,0]} />
                        <Bar dataKey="conversionRate" fill="#f97316" name="কনভার্সন %" radius={[4,4,0,0]} />
                        <Bar dataKey="bounceRate" fill="#ef4444" name="বাউন্স %" radius={[4,4,0,0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </>
            ) : <Card><CardContent className="py-10 text-center text-muted-foreground">তুলনার জন্য কমপক্ষে ২টি পেজ প্রয়োজন</CardContent></Card>}
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}
