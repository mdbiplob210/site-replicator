import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useCourierProviders, useUpdateCourierProvider, type ApiConfig } from "@/hooks/useCourier";
import { Truck, Plus, Trash2, Save, Globe, Copy } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function AdminCourier() {
  const { data: providers, isLoading } = useCourierProviders();
  const updateProvider = useUpdateCourierProvider();

  const webhookBaseUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/courier-webhook`;

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Truck className="h-6 w-6" /> কুরিয়ার ম্যানেজমেন্ট
            </h1>
            <p className="text-muted-foreground">কুরিয়ার সার্ভিস API কনফিগারেশন ও ওয়েবহুক সেটআপ</p>
          </div>
        </div>

        {/* Webhook URL section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Globe className="h-5 w-5" /> ওয়েবহুক URL
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              কুরিয়ার সার্ভিসের ড্যাশবোর্ডে এই ওয়েবহুক URL সেট করুন। ডেলিভারি/রিটার্ন স্ট্যাটাস অটো-আপডেট হবে।
            </p>
            {["pathao", "redx", "steadfast", "ecourier"].map((slug) => (
              <div key={slug} className="flex items-center gap-2">
                <Label className="w-28 capitalize font-medium">{slug}:</Label>
                <code className="flex-1 text-xs bg-muted p-2 rounded truncate">
                  {webhookBaseUrl}?courier={slug}
                </code>
                <Button
                  size="icon"
                  variant="outline"
                  onClick={() => {
                    navigator.clipboard.writeText(`${webhookBaseUrl}?courier=${slug}`);
                    toast.success("কপি হয়েছে!");
                  }}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Provider cards */}
        {isLoading ? (
          <div className="text-center py-10 text-muted-foreground">লোড হচ্ছে...</div>
        ) : (
          <div className="grid gap-4">
            {providers?.map((provider) => (
              <CourierProviderCard
                key={provider.id}
                provider={provider}
                onUpdate={updateProvider.mutate}
                isUpdating={updateProvider.isPending}
              />
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

function CourierProviderCard({
  provider,
  onUpdate,
  isUpdating,
}: {
  provider: any;
  onUpdate: (args: any) => void;
  isUpdating: boolean;
}) {
  const [configs, setConfigs] = useState<ApiConfig[]>(provider.api_configs || []);
  const [isActive, setIsActive] = useState(provider.is_active);
  const [showDialog, setShowDialog] = useState(false);

  const addConfig = () => {
    setConfigs([...configs, { label: "", base_url: "", api_key: "", secret_key: "" }]);
  };

  const removeConfig = (idx: number) => {
    setConfigs(configs.filter((_, i) => i !== idx));
  };

  const updateConfig = (idx: number, field: string, value: string) => {
    const updated = [...configs];
    (updated[idx] as any)[field] = value;
    setConfigs(updated);
  };

  const handleSave = () => {
    onUpdate({
      id: provider.id,
      updates: { api_configs: configs, is_active: isActive },
    });
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex items-center gap-3">
          <CardTitle className="text-lg">{provider.name}</CardTitle>
          <Badge variant={isActive ? "default" : "secondary"}>
            {isActive ? "সক্রিয়" : "নিষ্ক্রিয়"}
          </Badge>
          <Badge variant="outline">{configs.length} API</Badge>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Label className="text-sm">সক্রিয়</Label>
            <Switch checked={isActive} onCheckedChange={setIsActive} />
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {configs.map((config, idx) => (
          <div key={idx} className="border rounded-lg p-4 space-y-3 bg-muted/30">
            <div className="flex items-center justify-between">
              <h4 className="font-medium text-sm">API #{idx + 1}</h4>
              <Button size="icon" variant="ghost" onClick={() => removeConfig(idx)}>
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">লেবেল</Label>
                <Input
                  placeholder="যেমন: Production API"
                  value={config.label}
                  onChange={(e) => updateConfig(idx, "label", e.target.value)}
                />
              </div>
              <div>
                <Label className="text-xs">Base URL</Label>
                <Input
                  placeholder="https://api.pathao.com"
                  value={config.base_url}
                  onChange={(e) => updateConfig(idx, "base_url", e.target.value)}
                />
              </div>
              <div>
                <Label className="text-xs">API Key</Label>
                <Input
                  type="password"
                  placeholder="API Key"
                  value={config.api_key}
                  onChange={(e) => updateConfig(idx, "api_key", e.target.value)}
                />
              </div>
              <div>
                <Label className="text-xs">Secret Key (ঐচ্ছিক)</Label>
                <Input
                  type="password"
                  placeholder="Secret Key"
                  value={config.secret_key || ""}
                  onChange={(e) => updateConfig(idx, "secret_key", e.target.value)}
                />
              </div>
            </div>
          </div>
        ))}

        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={addConfig}>
            <Plus className="h-4 w-4 mr-1" /> API যোগ করুন
          </Button>
          <Button size="sm" onClick={handleSave} disabled={isUpdating}>
            <Save className="h-4 w-4 mr-1" /> সেভ করুন
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
