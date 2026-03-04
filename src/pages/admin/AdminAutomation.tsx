import { useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Zap, Phone, Megaphone, ShoppingCart, Truck, BarChart3, CheckCircle2
} from "lucide-react";

type AutomationTab = "automation" | "aicall";

const automationModules = [
  {
    title: "Ads Automation",
    description: "Automatically fetch ad spend from Meta Ads and track spend by product, campaign, and date.",
    icon: Megaphone,
    tag: "AUTO",
    enabled: true,
  },
  {
    title: "Orders Automation",
    description: "Automatically track orders per product, cancellations, and shipments from existing order data.",
    icon: ShoppingCart,
    tag: "AUTO",
    enabled: true,
  },
  {
    title: "Courier Automation",
    description: "Automatically sync delivery, return, and lost data from the courier integration.",
    icon: Truck,
    tag: "AUTO",
    enabled: true,
  },
  {
    title: "Reports & Analytics Automation",
    description: "Auto-generate daily reports and profit calculations from connected data sources.",
    icon: BarChart3,
    tag: "AUTO",
    enabled: true,
  },
];

const automationCategories = [
  { label: "Ads", icon: Megaphone },
  { label: "Orders", icon: ShoppingCart },
  { label: "Courier", icon: Truck },
  { label: "Reports & Analytics", icon: BarChart3 },
];

const voicePlaceholders = [
  "{customer_name}",
  "{product_names}",
  "{total}",
  "{address}",
  "{phone}",
  "{order_number}",
];

const voiceFields = [
  { label: "কাস্টমারের নাম", checked: true },
  { label: "প্রোডাক্টের নাম", checked: true },
  { label: "মোট মূল্য", checked: true },
  { label: "ডেলিভারি ঠিকানা", checked: true },
  { label: "ফোন নম্বর", checked: true },
  { label: "অর্ডার নম্বর", checked: true },
];

const AdminAutomation = () => {
  const [activeTab, setActiveTab] = useState<AutomationTab>("automation");
  const [modules, setModules] = useState(automationModules);
  const [aiCallEnabled, setAiCallEnabled] = useState(true);
  const [voiceScript, setVoiceScript] = useState(
    "প্রিয় {customer_name}, আপনার অর্ডার নম্বর {order_number} সফলভাবে গ্রহণ করা হয়েছে। আপনার অর্ডারে রয়েছে: {product_names}। মোট মূল্য: {total} টাকা। ডেলিভারি ঠিকানা: {address}। অনুগ্রহ করে অর্ডারটি নিশ্চিত করুন।"
  );

  const toggleModule = (index: number) => {
    const updated = [...modules];
    updated[index].enabled = !updated[index].enabled;
    setModules(updated);
  };

  const tabs = [
    { id: "automation" as AutomationTab, label: "Automation", icon: Zap },
    { id: "aicall" as AutomationTab, label: "AI Call", icon: Phone },
  ];

  return (
    <AdminLayout>
      <div className="max-w-[1400px] space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-primary/10">
            <Zap className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Automation Settings</h1>
            <p className="text-muted-foreground text-sm mt-0.5">Control which modules use automated data vs manual entry</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center justify-center gap-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                activeTab === tab.id
                  ? "bg-card border border-border shadow-sm text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Automation Tab */}
        {activeTab === "automation" && (
          <Card className="border-border/40">
            <CardContent className="p-6 space-y-6">
              {/* Status */}
              <div>
                <h3 className="text-base font-bold text-foreground mb-2">Automation Status</h3>
                <p className="text-sm text-emerald-600 bg-emerald-50 inline-block px-3 py-1 rounded-md font-medium mb-4">
                  Full automation is enabled across all modules
                </p>
                <div className="flex flex-wrap gap-2">
                  {automationCategories.map((cat) => (
                    <Badge key={cat.label} variant="secondary" className="gap-1.5 px-3 py-1.5 text-emerald-600 bg-emerald-50/50 border-emerald-200/50">
                      <cat.icon className="h-3.5 w-3.5" />
                      {cat.label}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Module Cards */}
              <div className="space-y-4">
                {modules.map((mod, i) => (
                  <div key={mod.title} className="flex items-center justify-between p-5 rounded-xl border border-border/40 bg-secondary/20 hover:bg-secondary/30 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="p-2.5 rounded-xl bg-emerald-50">
                        <Zap className="h-5 w-5 text-emerald-600" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-bold text-foreground">{mod.title}</h4>
                          <Badge variant="secondary" className="text-[10px] px-2 py-0.5 bg-emerald-50 text-emerald-600 font-bold">
                            {mod.tag}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">{mod.description}</p>
                      </div>
                    </div>
                    <Switch checked={mod.enabled} onCheckedChange={() => toggleModule(i)} />
                  </div>
                ))}
              </div>

              {/* Dependencies */}
              <div className="pt-4 border-t border-border/40">
                <h3 className="text-base font-bold text-foreground mb-3">Automation Dependencies</h3>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• <strong className="text-foreground">Reports Automation</strong> works best when Ads, Orders, and Courier are also automated.</li>
                  <li>• <strong className="text-foreground">Estimated Profit</strong> requires Ads + Orders data (auto or manual).</li>
                  <li>• <strong className="text-foreground">Final Profit</strong> requires Courier delivery data (auto or manual).</li>
                  <li>• Values are clearly labeled as <span className="text-emerald-600 font-medium">Auto</span> or Manual throughout the app.</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        )}

        {/* AI Call Tab */}
        {activeTab === "aicall" && (
          <Card className="border-border/40">
            <CardContent className="p-6 space-y-6">
              {/* AI Order Confirmation */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="p-2.5 rounded-xl bg-primary/10">
                    <Phone className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-foreground">AI Order Confirmation</h3>
                    <p className="text-sm text-muted-foreground font-['Hind_Siliguri']">
                      অর্ডারের পর কাস্টমারকে AI ভয়েসে অর্ডার ডিটেইলস শোনাবে এবং বাটনে Confirm করাবে
                    </p>
                  </div>
                </div>
                <Switch checked={aiCallEnabled} onCheckedChange={setAiCallEnabled} />
              </div>

              {/* Voice Script Template */}
              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-foreground">Voice Script Template</h4>
                <textarea
                  value={voiceScript}
                  onChange={(e) => setVoiceScript(e.target.value)}
                  rows={5}
                  className="w-full p-4 rounded-xl border border-border bg-card text-sm text-foreground resize-y font-['Hind_Siliguri'] leading-relaxed focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
                <p className="text-xs text-muted-foreground">
                  Placeholders: {voicePlaceholders.join(" ")}
                </p>
              </div>

              {/* Fields */}
              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-foreground font-['Hind_Siliguri']">কোন তথ্য বলবে / দেখাবে</h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {voiceFields.map((field) => (
                    <label key={field.label} className="flex items-center gap-2.5 text-sm text-foreground cursor-pointer font-['Hind_Siliguri']">
                      <Checkbox defaultChecked={field.checked} className="data-[state=checked]:bg-primary data-[state=checked]:border-primary" />
                      {field.label}
                    </label>
                  ))}
                </div>
              </div>

              {/* Note */}
              <div className="p-4 rounded-xl bg-secondary/50 border border-border/40">
                <p className="text-sm text-muted-foreground font-['Hind_Siliguri']">
                  • <strong className="text-foreground">AI Order Confirmation</strong> Thank You পেজে কাস্টমারকে voice + button দিয়ে অর্ডার confirm করাবে।
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminAutomation;
