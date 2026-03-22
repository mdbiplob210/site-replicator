import React, { useState, useMemo } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import {
  BarChart3, Eye, MousePointerClick, Target, TrendingUp, Download, Activity,
  ArrowDown, Smartphone, Globe, Monitor, Users, Clock, Zap, Brain, BarChart2,
  MousePointer, RefreshCw,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  useLandingPageAnalyticsSummary, useLandingPageDailyStats, useLandingPageFunnel,
  useLandingPageUTM, useLandingPageDeviceStats, useLandingPageScrollStats,
  useLandingPageLiveVisitors, useLandingPageEvents, useLandingPageHeatmap,
  useLandingPageHourlyStats, useLandingPageCohort, useLandingPageRealtimeFeed,
} from "@/hooks/useLandingPageAnalytics";
import { useLandingPages } from "@/hooks/useLandingPages";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, Legend, Cell, PieChart, Pie, ScatterChart, Scatter, ZAxis,
} from "recharts";
import { toast } from "sonner";
import { AnalyticsAIInsights } from "@/components/admin/analytics/AnalyticsAIInsights";

const COLORS = ["hsl(var(--primary))", "#f97316", "#10b981", "#8b5cf6", "#ef4444", "#06b6d4"];
const tooltipStyle = { backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", color: "hsl(var(--foreground))" };

export default function AdminLandingPageAnalytics() {
  const { data: pages } = useLandingPages();
  const [selectedPageId, setSelectedPageId] = useState<string>("all");
  const [days, setDays] = useState(7);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const pageFilter = selectedPageId === "all" ? undefined : selectedPageId;
  const useCustomDate = startDate && endDate;

  const { data: summaries, isLoading } = useLandingPageAnalyticsSummary(days, useCustomDate ? startDate : undefined, useCustomDate ? endDate : undefined);
  const { data: dailyStats } = useLandingPageDailyStats(pageFilter, days, useCustomDate ? startDate : undefined, useCustomDate ? endDate : undefined);
  const { data: funnelData } = useLandingPageFunnel(pageFilter, days, useCustomDate ? startDate : undefined, useCustomDate ? endDate : undefined);
  const { data: utmData } = useLandingPageUTM(pageFilter, days, useCustomDate ? startDate : undefined, useCustomDate ? endDate : undefined);
  const { data: deviceData } = useLandingPageDeviceStats(pageFilter, days, useCustomDate ? startDate : undefined, useCustomDate ? endDate : undefined);
  const { data: scrollData } = useLandingPageScrollStats(pageFilter, days, useCustomDate ? startDate : undefined, useCustomDate ? endDate : undefined);
  const { data: liveData } = useLandingPageLiveVisitors(pageFilter);
  const { data: allEvents } = useLandingPageEvents(pageFilter, days, useCustomDate ? startDate : undefined, useCustomDate ? endDate : undefined);
  const { data: heatmapData } = useLandingPageHeatmap(pageFilter, days, useCustomDate ? startDate : undefined, useCustomDate ? endDate : undefined);
  const { data: hourlyData } = useLandingPageHourlyStats(pageFilter, days, useCustomDate ? startDate : undefined, useCustomDate ? endDate : undefined);
  const { data: cohortData } = useLandingPageCohort(pageFilter, 4, useCustomDate ? startDate : undefined, useCustomDate ? endDate : undefined);
  const { data: feedData } = useLandingPageRealtimeFeed(pageFilter, useCustomDate ? startDate : undefined, useCustomDate ? endDate : undefined);

  const filteredSummaries = useMemo(() => {
    if (!summaries) return [];
    if (!pageFilter) return summaries;
    return summaries.filter((s) => s.landing_page_id === pageFilter);
  }, [summaries, pageFilter]);

  const totalViews = filteredSummaries.reduce((s, p) => s + p.views, 0);
  const totalOrderClicks = filteredSummaries.reduce((s, p) => s + p.orderClicks, 0);
  const totalConversions = filteredSummaries.reduce((s, p) => s + p.conversions, 0);
  const totalClicks = filteredSummaries.reduce((s, p) => s + p.clicks, 0);
  const avgCtr = totalViews > 0 ? (totalOrderClicks / totalViews) * 100 : 0;
  const avgBounce = filteredSummaries.length > 0 ? filteredSummaries.reduce((s, p) => s + p.bounceRate, 0) / filteredSummaries.length : 0;

  const handleExportCSV = () => {
    if (!allEvents || allEvents.length === 0) { toast.error("কোনো ডেটা নেই"); return; }
    const headers = ["Date","Event Type","Event Name","Visitor ID","Device","UTM Source","UTM Campaign","Scroll Depth","Referrer","Click Element"];
    const rows = allEvents.map((e) => [
      e.created_at, e.event_type, e.event_name || "", e.visitor_id || "",
      e.device_type || "", e.utm_source || "", e.utm_campaign || "",
      e.scroll_depth != null ? String(e.scroll_depth) : "", e.referrer || "", e.click_element || "",
    ]);
    const csv = [headers.join(","), ...rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url;
    a.download = `landing-analytics-${new Date().toISOString().split("T")[0]}.csv`;
    a.click(); URL.revokeObjectURL(url);
    toast.success("CSV ডাউনলোড হয়েছে!");
  };

  // Event type icon/color map
  const eventMeta: Record<string, { icon: string; color: string }> = {
    view: { icon: "👁️", color: "bg-blue-100 text-blue-700" },
    click: { icon: "🖱️", color: "bg-orange-100 text-orange-700" },
    conversion: { icon: "✅", color: "bg-green-100 text-green-700" },
    scroll: { icon: "📜", color: "bg-purple-100 text-purple-700" },
    funnel: { icon: "🔥", color: "bg-red-100 text-red-700" },
    exit: { icon: "🚪", color: "bg-gray-100 text-gray-700" },
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
                <p className="text-sm text-muted-foreground">অ্যাডভান্সড ট্র্যাকিং</p>
                {liveData && liveData.count > 0 && (
                  <Badge variant="outline" className="text-green-600 border-green-300 animate-pulse">
                    <Activity className="h-3 w-3 mr-1" />{liveData.count} লাইভ
                  </Badge>
                )}
              </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 items-end">
            <Select value={selectedPageId} onValueChange={setSelectedPageId}>
              <SelectTrigger className="w-[160px]"><SelectValue placeholder="সব পেজ" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">সব পেজ</SelectItem>
                {pages?.map((p) => <SelectItem key={p.id} value={p.id}>{p.title}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={String(days)} onValueChange={(v) => setDays(Number(v))}>
              <SelectTrigger className="w-[100px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="7">৭ দিন</SelectItem>
                <SelectItem value="14">১৪ দিন</SelectItem>
                <SelectItem value="30">৩০ দিন</SelectItem>
                <SelectItem value="90">৯০ দিন</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex gap-1">
              <Input type="date" className="w-[130px] text-xs" value={startDate} onChange={(e) => setStartDate(e.target.value)} placeholder="শুরু" />
              <Input type="date" className="w-[130px] text-xs" value={endDate} onChange={(e) => setEndDate(e.target.value)} placeholder="শেষ" />
              {useCustomDate && <Button size="sm" variant="ghost" onClick={() => { setStartDate(""); setEndDate(""); }}>✕</Button>}
            </div>
            <Button variant="outline" size="sm" onClick={handleExportCSV}>
              <Download className="h-4 w-4 mr-1" />CSV
            </Button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3">
          {[
            { label: "পেজ ভিজিট", value: totalViews, icon: Eye, color: "text-primary" },
            { label: "মোট ক্লিক", value: totalClicks, icon: MousePointerClick, color: "text-orange-500" },
            { label: "অর্ডার ক্লিক", value: totalOrderClicks, icon: Target, color: "text-blue-500" },
            { label: "অর্ডার সম্পন্ন", value: totalConversions, icon: Zap, color: "text-green-500" },
            { label: "কনভার্সন %", value: `${(totalViews > 0 ? (totalConversions / totalViews) * 100 : 0).toFixed(1)}%`, icon: TrendingUp, color: "text-purple-500" },
            { label: "বাউন্স রেট", value: `${avgBounce.toFixed(0)}%`, icon: ArrowDown, color: "text-red-500" },
            { label: "লাইভ", value: liveData?.count || 0, icon: Activity, color: "text-green-600" },
          ].map((c, i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-xs text-muted-foreground">{c.label}</p>
                  <c.icon className={`h-4 w-4 ${c.color}`} />
                </div>
                <p className="text-2xl font-bold text-foreground">{typeof c.value === "number" ? c.value.toLocaleString() : c.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Tabs */}
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList className="flex-wrap h-auto gap-1">
            <TabsTrigger value="overview">ওভারভিউ</TabsTrigger>
            <TabsTrigger value="funnel">ফানেল</TabsTrigger>
            <TabsTrigger value="heatmap">হিটম্যাপ</TabsTrigger>
            <TabsTrigger value="utm">UTM</TabsTrigger>
            <TabsTrigger value="cohort">কোহর্ট</TabsTrigger>
            <TabsTrigger value="devices">ডিভাইস</TabsTrigger>
            <TabsTrigger value="scroll">স্ক্রল</TabsTrigger>
            <TabsTrigger value="feed">লাইভ ফিড</TabsTrigger>
            <TabsTrigger value="hourly">আওয়ারলি</TabsTrigger>
            <TabsTrigger value="comparison">তুলনা</TabsTrigger>
            <TabsTrigger value="ai">AI ইনসাইট</TabsTrigger>
          </TabsList>

          {/* ══════ Overview ══════ */}
          <TabsContent value="overview" className="space-y-4">
            <Card>
              <CardHeader><CardTitle className="text-base">ডেইলি ট্রেন্ড</CardTitle></CardHeader>
              <CardContent>
                {dailyStats && dailyStats.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={dailyStats}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                      <XAxis dataKey="date" tickFormatter={(d) => `${new Date(d).getDate()}/${new Date(d).getMonth()+1}`} fontSize={12} />
                      <YAxis fontSize={12} /><Tooltip contentStyle={tooltipStyle} /><Legend />
                      <Line type="monotone" dataKey="views" stroke="hsl(var(--primary))" name="ভিউ" strokeWidth={2} />
                      <Line type="monotone" dataKey="clicks" stroke="#f97316" name="ক্লিক" strokeWidth={2} />
                      <Line type="monotone" dataKey="conversions" stroke="#10b981" name="কনভার্সন" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                ) : <p className="text-center text-muted-foreground py-10">ডেটা নেই</p>}
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="text-base">পেজ পারফরম্যান্স</CardTitle></CardHeader>
              <CardContent className="overflow-x-auto">
                {filteredSummaries.length > 0 ? (
                  <table className="w-full text-sm">
                    <thead><tr className="border-b text-muted-foreground text-xs">
                      <th className="text-left py-2 px-2">পেজ</th>
                      <th className="text-right py-2 px-2">ভিজিট</th>
                      <th className="text-right py-2 px-2">মোট ক্লিক</th>
                      <th className="text-right py-2 px-2">অর্ডার ক্লিক</th>
                      <th className="text-right py-2 px-2">অর্ডার</th>
                      <th className="text-right py-2 px-2">কনভ.%</th>
                      <th className="text-right py-2 px-2">বাউন্স</th>
                      <th className="text-right py-2 px-2">সময়</th>
                    </tr></thead>
                    <tbody>{filteredSummaries.map((s) => (
                      <tr key={s.landing_page_id} className="border-b last:border-0 hover:bg-muted/50">
                        <td className="py-2 px-2"><p className="font-medium text-foreground truncate max-w-[120px]">{s.title}</p><p className="text-xs text-muted-foreground font-mono">/lp/{s.slug}</p></td>
                        <td className="text-right py-2 px-2 font-medium">{s.views}</td>
                        <td className="text-right py-2 px-2">{s.clicks}</td>
                        <td className="text-right py-2 px-2 text-blue-600 font-medium">{s.orderClicks}</td>
                        <td className="text-right py-2 px-2 font-medium text-green-600">{s.conversions}</td>
                        <td className="text-right py-2 px-2">{s.conversionRate.toFixed(1)}%</td>
                        <td className="text-right py-2 px-2">{s.bounceRate.toFixed(0)}%</td>
                        <td className="text-right py-2 px-2">{s.avgTimeOnPage}s</td>
                      </tr>
                    ))}</tbody>
                  </table>
                ) : <p className="text-center text-muted-foreground py-6">পেজ নেই</p>}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ══════ Funnel ══════ */}
          <TabsContent value="funnel" className="space-y-4">
            <Card>
              <CardHeader><CardTitle className="text-base">ভিজিটর ফানেল</CardTitle></CardHeader>
              <CardContent>
                {funnelData && funnelData.length > 0 ? (
                  <div className="space-y-3">
                    {funnelData.map((step, i) => {
                      const maxC = funnelData[0]?.count || 1;
                      const pct = maxC > 0 ? (step.count / maxC) * 100 : 0;
                      const drop = i > 0 && funnelData[i-1].count > 0 ? (((funnelData[i-1].count - step.count) / funnelData[i-1].count) * 100).toFixed(0) : null;
                      return (
                        <div key={step.step} className="space-y-1">
                          <div className="flex items-center justify-between text-sm">
                            <span className="font-medium text-foreground">{step.label}</span>
                            <div className="flex items-center gap-2">
                              <span className="font-bold">{step.count}</span>
                              {drop && <span className="text-xs text-red-500">-{drop}%</span>}
                            </div>
                          </div>
                          <div className="h-8 bg-muted rounded-lg overflow-hidden">
                            <div className="h-full rounded-lg transition-all duration-500"
                              style={{ width: `${Math.max(pct, 2)}%`, background: `linear-gradient(90deg, ${COLORS[i % COLORS.length]}, ${COLORS[(i+1) % COLORS.length]})` }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : <p className="text-center text-muted-foreground py-10">ফানেল ডেটা নেই</p>}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ══════ Heatmap ══════ */}
          <TabsContent value="heatmap" className="space-y-4">
            <Card>
              <CardHeader><CardTitle className="text-base flex items-center gap-2"><MousePointer className="h-4 w-4" /> ক্লিক হিটম্যাপ</CardTitle></CardHeader>
              <CardContent>
                {heatmapData && heatmapData.length > 0 ? (
                  <div className="space-y-4">
                    <div className="relative bg-muted rounded-xl overflow-hidden" style={{ height: 500 }}>
                      {/* Page representation */}
                      <div className="absolute inset-0 bg-gradient-to-b from-background to-muted/50 border rounded-xl">
                        <div className="absolute top-4 left-4 text-xs text-muted-foreground">পেজের উপর (0%)</div>
                        <div className="absolute bottom-4 left-4 text-xs text-muted-foreground">পেজের নিচ (100%)</div>
                      </div>
                      {/* Click dots */}
                      {heatmapData.slice(0, 200).map((click, i) => (
                        <div key={i} className="absolute rounded-full"
                          style={{
                            left: `${Math.min(Math.max(click.click_x, 1), 99)}%`,
                            top: `${Math.min(Math.max(click.click_y, 1), 99) / 100 * 500}px`,
                            width: 12, height: 12,
                            background: click.event_type === "conversion" ? "rgba(16,185,129,0.6)" : "rgba(239,68,68,0.4)",
                            boxShadow: click.event_type === "conversion" ? "0 0 8px rgba(16,185,129,0.5)" : "0 0 6px rgba(239,68,68,0.3)",
                            transform: "translate(-50%, -50%)",
                          }}
                          title={click.click_element || "click"}
                        />
                      ))}
                    </div>
                    <div className="flex gap-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1"><div className="w-3 h-3 rounded-full bg-red-400" /> ক্লিক ({heatmapData.filter(c => c.event_type === "click").length})</span>
                      <span className="flex items-center gap-1"><div className="w-3 h-3 rounded-full bg-green-500" /> কনভার্সন ({heatmapData.filter(c => c.event_type === "conversion").length})</span>
                      <span>মোট: {heatmapData.length} ক্লিক</span>
                    </div>

                    {/* Top clicked elements */}
                    <div className="mt-4">
                      <h4 className="text-sm font-medium mb-2">সবচেয়ে বেশি ক্লিক হওয়া এলিমেন্ট</h4>
                      <div className="space-y-1">
                        {(() => {
                          const elMap = new Map<string, number>();
                          heatmapData.forEach((c) => {
                            const el = c.click_element || "unknown";
                            elMap.set(el, (elMap.get(el) || 0) + 1);
                          });
                          return Array.from(elMap.entries())
                            .sort((a, b) => b[1] - a[1])
                            .slice(0, 10)
                            .map(([el, count]) => (
                              <div key={el} className="flex justify-between text-sm p-2 rounded border">
                                <span className="truncate max-w-[300px] font-mono text-xs">{el}</span>
                                <Badge variant="secondary">{count}</Badge>
                              </div>
                            ));
                        })()}
                      </div>
                    </div>
                  </div>
                ) : <p className="text-center text-muted-foreground py-10">ক্লিক ডেটা নেই — ল্যান্ডিং পেজে ক্লিক হলে এখানে দেখাবে</p>}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ══════ UTM ══════ */}
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
                  {utmData?.campaigns && utmData.campaigns.filter(c => c.name !== "none").length > 0 ? (
                    <div className="space-y-2">
                      {utmData.campaigns.filter(c => c.name !== "none").map((c, i) => (
                        <div key={c.name} className="flex items-center justify-between p-2 rounded-lg border">
                          <span className="text-sm font-medium truncate max-w-[180px]">{c.name}</span>
                          <div className="flex items-center gap-3 text-sm">
                            <span className="text-muted-foreground">{c.views}</span>
                            <span className="text-green-600 font-medium">{c.conversions}</span>
                            <Badge variant="secondary">{c.rate.toFixed(1)}%</Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : <p className="text-center text-muted-foreground py-6">ক্যাম্পেইন ডেটা নেই</p>}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* ══════ Cohort ══════ */}
          <TabsContent value="cohort" className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">মোট ভিজিটর</p><p className="text-2xl font-bold">{cohortData?.totalVisitors || 0}</p></CardContent></Card>
              <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">নতুন ভিজিটর</p><p className="text-2xl font-bold text-primary">{cohortData?.newVisitors || 0}</p></CardContent></Card>
              <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">রিটার্নিং ({cohortData?.retentionRate.toFixed(0) || 0}%)</p><p className="text-2xl font-bold text-green-600">{cohortData?.returningVisitors || 0}</p></CardContent></Card>
            </div>
            <Card>
              <CardHeader><CardTitle className="text-base flex items-center gap-2"><Users className="h-4 w-4" /> সাপ্তাহিক কোহর্ট রিটেনশন</CardTitle></CardHeader>
              <CardContent className="overflow-x-auto">
                {cohortData?.cohorts && cohortData.cohorts.length > 0 ? (
                  <table className="w-full text-sm">
                    <thead><tr className="border-b text-xs text-muted-foreground">
                      <th className="text-left py-2 px-2">কোহর্ট</th>
                      <th className="text-center py-2 px-2">মোট</th>
                      {Array.from({ length: 4 }).map((_, i) => <th key={i} className="text-center py-2 px-2">সপ্তাহ {i}</th>)}
                    </tr></thead>
                    <tbody>
                      {cohortData.cohorts.map((c) => (
                        <tr key={c.week} className="border-b">
                          <td className="py-2 px-2 font-medium">{c.week}</td>
                          <td className="text-center py-2 px-2">{c.total}</td>
                          {c.retention.map((r, ri) => (
                            <td key={ri} className="text-center py-2 px-2">
                              <span className="inline-block px-2 py-1 rounded text-xs font-medium"
                                style={{ backgroundColor: `rgba(16,185,129,${r / 100 * 0.8})`, color: r > 40 ? "#fff" : "inherit" }}>
                                {r}%
                              </span>
                            </td>
                          ))}
                          {Array.from({ length: 4 - c.retention.length }).map((_, i) => <td key={`empty-${i}`} className="text-center py-2 px-2 text-muted-foreground">—</td>)}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : <p className="text-center text-muted-foreground py-6">কোহর্ট ডেটা নেই</p>}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ══════ Devices ══════ */}
          <TabsContent value="devices" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {[
                { title: "ডিভাইস", data: deviceData?.devices, icon: Smartphone },
                { title: "ব্রাউজার", data: deviceData?.browsers, icon: Globe },
                { title: "OS", data: deviceData?.operatingSystems, icon: Monitor },
              ].map((sec) => (
                <Card key={sec.title}>
                  <CardHeader><CardTitle className="text-base flex items-center gap-2"><sec.icon className="h-4 w-4" />{sec.title}</CardTitle></CardHeader>
                  <CardContent>
                    {sec.data && sec.data.length > 0 ? (
                      <div className="space-y-2">
                        {sec.data.map((item, i) => {
                          const total = sec.data!.reduce((s, d) => s + d.count, 0);
                          return (
                            <div key={item.name} className="flex items-center justify-between p-2 rounded border">
                              <div className="flex items-center gap-2">
                                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                                <span className="text-sm">{item.name}</span>
                              </div>
                              <span className="text-sm font-medium">{item.count} <span className="text-xs text-muted-foreground">({(item.count/total*100).toFixed(0)}%)</span></span>
                            </div>
                          );
                        })}
                      </div>
                    ) : <p className="text-center text-muted-foreground py-4">ডেটা নেই</p>}
                  </CardContent>
                </Card>
              ))}
            </div>
            {deviceData?.devices && deviceData.devices.length > 0 && (
              <Card>
                <CardHeader><CardTitle className="text-base">ডিভাইস চার্ট</CardTitle></CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie data={deviceData.devices} dataKey="count" nameKey="name" cx="50%" cy="50%" outerRadius={90} label={({ name, percent }) => `${name} ${(percent*100).toFixed(0)}%`}>
                        {deviceData.devices.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                      </Pie>
                      <Tooltip contentStyle={tooltipStyle} />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* ══════ Scroll ══════ */}
          <TabsContent value="scroll" className="space-y-4">
            <Card>
              <CardHeader><CardTitle className="text-base">স্ক্রল ডেপথ</CardTitle></CardHeader>
              <CardContent>
                {scrollData && scrollData.length > 0 ? (
                  <div className="space-y-4">
                    {scrollData.map((item, i) => {
                      const maxV = scrollData[0]?.visitors || 1;
                      const pct = maxV > 0 ? (item.visitors / maxV) * 100 : 0;
                      return (
                        <div key={item.milestone} className="space-y-1">
                          <div className="flex justify-between text-sm"><span className="font-medium">{item.milestone} স্ক্রল</span><span className="font-bold">{item.visitors} জন</span></div>
                          <div className="h-6 bg-muted rounded-lg overflow-hidden">
                            <div className="h-full rounded-lg transition-all duration-500 flex items-center justify-end pr-2"
                              style={{ width: `${Math.max(pct, 5)}%`, background: COLORS[i % COLORS.length] }}>
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

          {/* ══════ Live Feed ══════ */}
          <TabsContent value="feed" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Zap className="h-4 w-4 text-yellow-500" /> রিয়েলটাইম ইভেন্ট ফিড
                  <Badge variant="outline" className="ml-auto text-xs"><RefreshCw className="h-3 w-3 mr-1" />১০s</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {feedData && feedData.length > 0 ? (
                  <div className="space-y-1 max-h-[500px] overflow-y-auto">
                    {feedData.map((ev) => {
                      const meta = eventMeta[ev.event_type] || { icon: "📌", color: "bg-muted text-muted-foreground" };
                      const time = new Date(ev.created_at);
                      const timeStr = `${time.getHours().toString().padStart(2, "0")}:${time.getMinutes().toString().padStart(2, "0")}:${time.getSeconds().toString().padStart(2, "0")}`;
                      return (
                        <div key={ev.id} className="flex items-center gap-3 p-2 rounded-lg border hover:bg-muted/30 transition-colors">
                          <span className="text-lg">{meta.icon}</span>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className={`text-xs ${meta.color}`}>{ev.event_type}</Badge>
                              {ev.event_name && <span className="text-xs text-muted-foreground truncate">{ev.event_name}</span>}
                            </div>
                            <div className="flex items-center gap-2 mt-0.5 text-xs text-muted-foreground">
                              {ev.device_type && <span>{ev.device_type === "mobile" ? "📱" : "💻"} {ev.device_type}</span>}
                              {ev.utm_source && <span>via {ev.utm_source}</span>}
                              {ev.click_element && <span className="truncate max-w-[150px] font-mono">{ev.click_element}</span>}
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-xs font-mono text-muted-foreground">{timeStr}</p>
                            <p className="text-xs text-muted-foreground truncate max-w-[80px]">{ev.visitor_id?.substring(0, 8)}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : <p className="text-center text-muted-foreground py-10">ইভেন্ট নেই</p>}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ══════ Hourly Heatmap ══════ */}
          <TabsContent value="hourly" className="space-y-4">
            <Card>
              <CardHeader><CardTitle className="text-base flex items-center gap-2"><Clock className="h-4 w-4" /> ঘণ্টাভিত্তিক ভিজিটর হিটম্যাপ</CardTitle></CardHeader>
              <CardContent className="overflow-x-auto">
                {hourlyData && hourlyData.length > 0 ? (
                  <div>
                    <div className="grid gap-0.5" style={{ gridTemplateColumns: "60px repeat(24, 1fr)" }}>
                      <div />
                      {Array.from({ length: 24 }).map((_, h) => (
                        <div key={h} className="text-center text-xs text-muted-foreground py-1">{h}</div>
                      ))}
                      {(() => {
                        const maxCount = Math.max(...hourlyData.map((d) => d.count), 1);
                        return ["রবি", "সোম", "মঙ্গল", "বুধ", "বৃহ", "শুক্র", "শনি"].map((day, di) => (
                          <React.Fragment key={`row-${di}`}>
                            <div className="text-xs text-muted-foreground flex items-center">{day}</div>
                            {Array.from({ length: 24 }).map((_, h) => {
                              const item = hourlyData.find((d) => d.day === day && d.hour === h);
                              const count = item?.count || 0;
                              const intensity = count / maxCount;
                              return (
                                <div key={`${di}-${h}`}
                                  className="aspect-square rounded-sm cursor-default transition-colors"
                                  style={{ backgroundColor: count > 0 ? `rgba(16,185,129,${0.15 + intensity * 0.85})` : "hsl(var(--muted))" }}
                                  title={`${day} ${h}:00 — ${count} ভিজিটর`}
                                />
                              );
                            })}
                          </React.Fragment>
                        ));
                      })()}
                    </div>
                    <div className="flex items-center gap-2 mt-4 text-xs text-muted-foreground">
                      <span>কম</span>
                      {[0.1, 0.3, 0.5, 0.7, 0.9].map((v) => (
                        <div key={v} className="w-4 h-4 rounded-sm" style={{ backgroundColor: `rgba(16,185,129,${v})` }} />
                      ))}
                      <span>বেশি</span>
                    </div>
                  </div>
                ) : <p className="text-center text-muted-foreground py-10">ডেটা নেই</p>}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ══════ Comparison ══════ */}
          <TabsContent value="comparison" className="space-y-4">
            {summaries && summaries.length > 1 ? (
              <>
                <Card>
                  <CardHeader><CardTitle className="text-base">পেজ তুলনা</CardTitle></CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={summaries}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                        <XAxis dataKey="slug" fontSize={11} /><YAxis fontSize={11} />
                        <Tooltip contentStyle={tooltipStyle} /><Legend />
                        <Bar dataKey="views" fill="hsl(var(--primary))" name="ভিউ" radius={[4,4,0,0]} />
                        <Bar dataKey="conversions" fill="#10b981" name="কনভার্সন" radius={[4,4,0,0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader><CardTitle className="text-base">রেট তুলনা</CardTitle></CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={summaries}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                        <XAxis dataKey="slug" fontSize={11} /><YAxis fontSize={11} unit="%" />
                        <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => `${v.toFixed(1)}%`} /><Legend />
                        <Bar dataKey="ctr" fill="#8b5cf6" name="CTR" radius={[4,4,0,0]} />
                        <Bar dataKey="conversionRate" fill="#f97316" name="কনভ.%" radius={[4,4,0,0]} />
                        <Bar dataKey="bounceRate" fill="#ef4444" name="বাউন্স%" radius={[4,4,0,0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </>
            ) : <Card><CardContent className="py-10 text-center text-muted-foreground">তুলনার জন্য ২+ পেজ প্রয়োজন</CardContent></Card>}
          </TabsContent>

          {/* ══════ AI Insights ══════ */}
          <TabsContent value="ai" className="space-y-4">
            <AnalyticsAIInsights summaries={filteredSummaries} funnelData={funnelData} cohortData={cohortData} utmData={utmData} />
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}
