import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { useCourierProviders, useUpdateCourierProvider, type ApiConfig } from "@/hooks/useCourier";
import { Truck, Plus, Trash2, Save, Globe, Copy, Shield, Eye, EyeOff, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { CourierBalanceView } from "./CourierBalanceView";

interface CourierSettingsViewProps {
  onBack: () => void;
}

export function CourierSettingsView({ onBack }: CourierSettingsViewProps) {
  const { data: providers, isLoading } = useCourierProviders();
  const updateProvider = useUpdateCourierProvider();

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const webhookBaseUrl = `${supabaseUrl}/functions/v1/courier-webhook`;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="p-2 rounded-xl hover:bg-secondary/80 transition-all">
          <ArrowLeft className="h-5 w-5 text-foreground" />
        </button>
        <div className="p-2.5 rounded-xl bg-gradient-to-br from-violet-100 to-violet-50">
          <Truck className="h-5 w-5 text-violet-600" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-foreground tracking-tight">Courier Management</h1>
          <p className="text-sm text-muted-foreground">API configuration, webhooks & authorization tokens</p>
        </div>
      </div>

      <CourierBalanceView />

      <Card className="border-border/40">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Globe className="h-4 w-4 text-primary" /> Webhook Callback URL
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-xs text-muted-foreground">
            Set this URL in your courier service dashboard. Delivery, return, and price change updates will be automatic.
          </p>
          <Badge variant="outline" className="text-xs">
            🌐 {supabaseUrl}
          </Badge>
          {providers?.map((p) => (
            <div key={p.slug} className="flex items-center gap-2">
              <Label className="w-24 capitalize font-medium text-xs">{p.slug}:</Label>
              <code className="flex-1 text-[11px] bg-muted p-2 rounded-lg truncate font-mono">
                {webhookBaseUrl}?courier={p.slug}{p.auth_token ? `&token=${p.auth_token}` : ''}
              </code>
              <Button
                size="icon"
                variant="outline"
                className="h-8 w-8 rounded-lg"
                onClick={() => {
                  const url = `${webhookBaseUrl}?courier=${p.slug}${p.auth_token ? `&token=${p.auth_token}` : ''}`;
                  navigator.clipboard.writeText(url);
                  toast.success("Copied!");
                }}
              >
                <Copy className="h-3.5 w-3.5" />
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card className="border-border/40">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">📊 Tracked Data</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {[
              "Delivery Status", "Tracking ID", "Delivery Fee/Charge", "COD Amount",
              "Rider Name & Phone", "Weight", "Area/District", "Delivery Date",
              "Return Reason", "Price Change", "Hub Info", "Raw Status"
            ].map((item) => (
              <div key={item} className="flex items-center gap-1.5 text-xs p-2 rounded-lg bg-secondary/30 border border-border/30">
                <span className="text-primary">✓</span> {item}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="text-center py-10 text-muted-foreground">Loading...</div>
      ) : (
        <div className="space-y-4">
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
  const [showToken, setShowToken] = useState(false);

  const addConfig = () => {
    setConfigs([...configs, { label: "", base_url: "", api_key: "", secret_key: "", client_id: "", store_id: "" }]);
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

  const getPlaceholders = (slug: string) => {
    switch (slug) {
      case 'pathao': return { base_url: 'https://api-hermes.pathao.com', extra: ['Client ID', 'Store ID'] };
      case 'redx': return { base_url: 'https://openapi.redx.com.bd/v1.0.0-beta', extra: [] };
      case 'steadfast': return { base_url: 'https://portal.steadfast.com.bd/api/v1', extra: [] };
      case 'ecourier': return { base_url: 'https://backoffice.ecourier.com.bd/api', extra: ['User ID'] };
      default: return { base_url: 'https://api.example.com', extra: [] };
    }
  };

  const hints = getPlaceholders(provider.slug);

  return (
    <Card className="border-border/40">
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-secondary/60">
            <Truck className="h-4 w-4 text-muted-foreground" />
          </div>
          <div>
            <CardTitle className="text-base">{provider.name}</CardTitle>
            <p className="text-xs text-muted-foreground">{provider.slug}</p>
          </div>
          <Badge variant={isActive ? "default" : "secondary"} className="text-xs">
            {isActive ? "Active" : "Inactive"}
          </Badge>
          <Badge variant="outline" className="text-xs">{configs.length} API</Badge>
        </div>
        <div className="flex items-center gap-2">
          <Label className="text-xs">Active</Label>
          <Switch checked={isActive} onCheckedChange={setIsActive} />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="p-3 rounded-xl bg-secondary/30 border border-border/40 space-y-2">
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-primary" />
            <Label className="text-xs font-semibold">Authorization Token</Label>
          </div>
          <div className="flex items-center gap-2">
            <code className="flex-1 text-xs bg-muted p-2 rounded font-mono">
              {showToken ? (provider.auth_token || 'N/A') : '••••••••••••••••••••'}
            </code>
            <Button size="icon" variant="outline" className="h-8 w-8" onClick={() => setShowToken(!showToken)}>
              {showToken ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
            </Button>
            <Button size="icon" variant="outline" className="h-8 w-8" onClick={() => {
              navigator.clipboard.writeText(provider.auth_token || '');
              toast.success("Token copied!");
            }}>
              <Copy className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>

        {configs.map((config, idx) => (
          <div key={idx} className="border border-border/40 rounded-xl p-4 space-y-3 bg-muted/20">
            <div className="flex items-center justify-between">
              <h4 className="font-medium text-sm">API #{idx + 1} {config.label && `— ${config.label}`}</h4>
              <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => removeConfig(idx)}>
                <Trash2 className="h-3.5 w-3.5 text-destructive" />
              </Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Label</Label>
                <Input placeholder="Production API" value={config.label} onChange={(e) => updateConfig(idx, "label", e.target.value)} className="rounded-lg" />
              </div>
              <div>
                <Label className="text-xs">Base URL</Label>
                <Input placeholder={hints.base_url} value={config.base_url} onChange={(e) => updateConfig(idx, "base_url", e.target.value)} className="rounded-lg" />
              </div>
              <div>
                <Label className="text-xs">API Key / Token</Label>
                <Input type="password" placeholder="API Key" value={config.api_key} onChange={(e) => updateConfig(idx, "api_key", e.target.value)} className="rounded-lg" />
              </div>
              <div>
                <Label className="text-xs">Secret Key (optional)</Label>
                <Input type="password" placeholder="Secret Key" value={config.secret_key || ""} onChange={(e) => updateConfig(idx, "secret_key", e.target.value)} className="rounded-lg" />
              </div>
              {(provider.slug === 'pathao' || provider.slug === 'ecourier') && (
                <>
                  <div>
                    <Label className="text-xs">{provider.slug === 'pathao' ? 'Client ID' : 'User ID'}</Label>
                    <Input placeholder={provider.slug === 'pathao' ? 'Pathao Client ID' : 'eCourier User ID'} value={config.client_id || ""} onChange={(e) => updateConfig(idx, "client_id", e.target.value)} className="rounded-lg" />
                  </div>
                  {provider.slug === 'pathao' && (
                    <div>
                      <Label className="text-xs">Store ID</Label>
                      <Input placeholder="Pathao Store ID" value={config.store_id || ""} onChange={(e) => updateConfig(idx, "store_id", e.target.value)} className="rounded-lg" />
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        ))}

        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={addConfig} className="rounded-lg">
            <Plus className="h-4 w-4 mr-1" /> Add API
          </Button>
          <Button size="sm" onClick={handleSave} disabled={isUpdating} className="rounded-lg">
            <Save className="h-4 w-4 mr-1" /> Save
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}