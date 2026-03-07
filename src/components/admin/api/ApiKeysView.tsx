import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { useApiKeys, useCreateApiKey, useUpdateApiKey, useDeleteApiKey } from "@/hooks/useApiKeys";
import { Key, Plus, Trash2, Copy, Eye, EyeOff, BookOpen, Code, ArrowLeft } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

const ALL_PERMISSIONS = [
  { value: "orders:create", label: "অর্ডার তৈরি" },
  { value: "orders:read", label: "অর্ডার দেখা" },
  { value: "incomplete_orders:create", label: "ইনকমপ্লিট অর্ডার তৈরি" },
  { value: "incomplete_orders:read", label: "ইনকমপ্লিট অর্ডার দেখা" },
];

interface ApiKeysViewProps {
  onBack: () => void;
}

export function ApiKeysView({ onBack }: ApiKeysViewProps) {
  const { data: keys, isLoading } = useApiKeys();
  const createKey = useCreateApiKey();
  const updateKey = useUpdateApiKey();
  const deleteKey = useDeleteApiKey();
  const [showCreate, setShowCreate] = useState(false);
  const [newLabel, setNewLabel] = useState("");
  const [newPerms, setNewPerms] = useState<string[]>(["orders:create", "incomplete_orders:create"]);
  const [visibleKeys, setVisibleKeys] = useState<Record<string, boolean>>({});

  const apiBaseUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/order-api`;

  const handleCreate = () => {
    if (!newLabel.trim()) { toast.error("লেবেল দিন"); return; }
    createKey.mutate({ label: newLabel, permissions: newPerms }, {
      onSuccess: () => { setShowCreate(false); setNewLabel(""); }
    });
  };

  const togglePerm = (perm: string) => {
    setNewPerms(prev => prev.includes(perm) ? prev.filter(p => p !== perm) : [...prev, perm]);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="p-2 rounded-xl hover:bg-secondary/80 transition-all">
            <ArrowLeft className="h-5 w-5 text-foreground" />
          </button>
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-amber-100 to-amber-50">
            <Key className="h-5 w-5 text-amber-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground tracking-tight">Order API Keys</h1>
            <p className="text-sm text-muted-foreground">বাহ্যিক ওয়েবসাইট থেকে অর্ডার রিসিভ করতে API Key ব্যবহার করুন</p>
          </div>
        </div>
        <Dialog open={showCreate} onOpenChange={setShowCreate}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-1" /> নতুন API Key</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>নতুন API Key তৈরি করুন</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>লেবেল</Label>
                <Input placeholder="যেমন: মূল ওয়েবসাইট, Laravel Site" value={newLabel} onChange={e => setNewLabel(e.target.value)} />
              </div>
              <div>
                <Label>পার্মিশন</Label>
                <div className="space-y-2 mt-2">
                  {ALL_PERMISSIONS.map(p => (
                    <div key={p.value} className="flex items-center gap-2">
                      <Checkbox checked={newPerms.includes(p.value)} onCheckedChange={() => togglePerm(p.value)} />
                      <span className="text-sm">{p.label} <code className="text-xs text-muted-foreground">({p.value})</code></span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleCreate} disabled={createKey.isPending}>তৈরি করুন</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="keys">
        <TabsList>
          <TabsTrigger value="keys"><Key className="h-4 w-4 mr-1" /> API Keys</TabsTrigger>
          <TabsTrigger value="docs"><BookOpen className="h-4 w-4 mr-1" /> ডকুমেন্টেশন</TabsTrigger>
        </TabsList>

        <TabsContent value="keys" className="space-y-4">
          {isLoading ? (
            <div className="text-center py-10 text-muted-foreground">লোড হচ্ছে...</div>
          ) : keys?.length === 0 ? (
            <Card><CardContent className="py-10 text-center text-muted-foreground">কোনো API Key নেই। নতুন তৈরি করুন।</CardContent></Card>
          ) : (
            keys?.map(key => (
              <Card key={key.id}>
                <CardContent className="pt-6 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <h3 className="font-semibold">{key.label}</h3>
                      <Badge variant={key.is_active ? "default" : "secondary"}>{key.is_active ? "সক্রিয়" : "নিষ্ক্রিয়"}</Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch checked={key.is_active} onCheckedChange={(v) => updateKey.mutate({ id: key.id, updates: { is_active: v } })} />
                      <Button size="icon" variant="ghost" onClick={() => { if (confirm("ডিলিট করবেন?")) deleteKey.mutate(key.id) }}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 text-sm bg-muted p-2 rounded font-mono">
                      {visibleKeys[key.id] ? key.api_key : "••••••••••••••••••••••••"}
                    </code>
                    <Button size="icon" variant="outline" onClick={() => setVisibleKeys(v => ({ ...v, [key.id]: !v[key.id] }))}>
                      {visibleKeys[key.id] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                    <Button size="icon" variant="outline" onClick={() => { navigator.clipboard.writeText(key.api_key); toast.success("কপি হয়েছে!"); }}>
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {key.permissions.map(p => <Badge key={p} variant="outline" className="text-xs">{p}</Badge>)}
                  </div>
                  {key.last_used_at && (
                    <p className="text-xs text-muted-foreground">সর্বশেষ ব্যবহার: {new Date(key.last_used_at).toLocaleString("bn-BD")}</p>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="docs">
          <ApiDocumentation apiBaseUrl={apiBaseUrl} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function ApiDocumentation({ apiBaseUrl }: { apiBaseUrl: string }) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><Code className="h-5 w-5" /> API ডকুমেন্টেশন</CardTitle></CardHeader>
        <CardContent className="space-y-6">

          <div className="bg-muted/50 p-4 rounded-lg space-y-2">
            <h3 className="font-bold text-lg">🔗 Base URL</h3>
            <code className="block bg-background p-3 rounded border text-sm break-all">{apiBaseUrl}</code>
          </div>

          <div className="bg-muted/50 p-4 rounded-lg space-y-2">
            <h3 className="font-bold text-lg">🔑 Authentication</h3>
            <p className="text-sm">প্রতিটি রিকোয়েস্টে <code className="bg-background px-1 rounded">X-API-Key</code> হেডার পাঠাতে হবে।</p>
            <pre className="bg-background p-3 rounded border text-xs overflow-x-auto">{`Headers:
  X-API-Key: your_api_key_here
  Content-Type: application/json`}</pre>
          </div>

          <div className="bg-muted/50 p-4 rounded-lg space-y-3">
            <h3 className="font-bold text-lg">📦 POST — অর্ডার তৈরি করুন</h3>
            <p className="text-sm">Permission: <code className="bg-background px-1 rounded">orders:create</code></p>
            <pre className="bg-background p-3 rounded border text-xs overflow-x-auto">{`POST ${apiBaseUrl}
Content-Type: application/json
X-API-Key: your_api_key_here

{
  "type": "order",
  "customer_name": "রহিম উদ্দিন",
  "customer_phone": "01700000000",
  "customer_address": "ঢাকা, বাংলাদেশ",
  "product_cost": 500,
  "delivery_charge": 60,
  "discount": 0,
  "total_amount": 560,
  "notes": "ফ্রাজাইল পণ্য",
  "items": [
    {
      "product_name": "স্মার্ট ওয়াচ",
      "product_code": "SW-001",
      "quantity": 1,
      "unit_price": 500,
      "total_price": 500
    }
  ]
}`}</pre>
          </div>

          <div className="bg-muted/50 p-4 rounded-lg space-y-3">
            <h3 className="font-bold text-lg">⚠️ POST — ইনকমপ্লিট অর্ডার তৈরি</h3>
            <p className="text-sm">Permission: <code className="bg-background px-1 rounded">incomplete_orders:create</code></p>
            <pre className="bg-background p-3 rounded border text-xs overflow-x-auto">{`POST ${apiBaseUrl}
Content-Type: application/json
X-API-Key: your_api_key_here

{
  "type": "incomplete_order",
  "customer_name": "করিম সাহেব",
  "customer_phone": "01800000000",
  "customer_address": "চট্টগ্রাম",
  "product_name": "ব্লুটুথ স্পিকার",
  "product_code": "BS-002",
  "quantity": 1,
  "unit_price": 800,
  "total_amount": 860,
  "delivery_charge": 60,
  "block_reason": "api_submission",
  "source": "my-website"
}`}</pre>
          </div>

          <div className="bg-muted/50 p-4 rounded-lg space-y-3">
            <h3 className="font-bold text-lg">📋 GET — অর্ডার লিস্ট দেখুন</h3>
            <pre className="bg-background p-3 rounded border text-xs overflow-x-auto">{`GET ${apiBaseUrl}?type=orders&limit=50&status=processing
X-API-Key: your_api_key_here

GET ${apiBaseUrl}?type=incomplete_orders&limit=50
X-API-Key: your_api_key_here`}</pre>
          </div>

          <div className="bg-muted/50 p-4 rounded-lg space-y-3">
            <h3 className="font-bold text-lg">✅ সফল রেসপন্স</h3>
            <pre className="bg-background p-3 rounded border text-xs overflow-x-auto">{`{
  "success": true,
  "data": { ... },
  "order_number": "ORD-00042",
  "message": "Order created successfully"
}`}</pre>
          </div>

          <div className="bg-muted/50 p-4 rounded-lg space-y-3">
            <h3 className="font-bold text-lg">❌ Error রেসপন্স</h3>
            <pre className="bg-background p-3 rounded border text-xs overflow-x-auto">{`// 401 - Missing API Key
{ "error": "Missing X-API-Key header" }

// 403 - Invalid key or no permission
{ "error": "Invalid or inactive API key" }
{ "error": "Permission denied: orders:create" }

// 500 - Server error
{ "error": "Internal error" }`}</pre>
          </div>

          <div className="bg-muted/50 p-4 rounded-lg space-y-3">
            <h3 className="font-bold text-lg">🔧 Laravel উদাহরণ</h3>
            <pre className="bg-background p-3 rounded border text-xs overflow-x-auto">{`// Laravel Controller Example
use Illuminate\\Support\\Facades\\Http;

$response = Http::withHeaders([
    'X-API-Key' => env('ORDER_PANEL_API_KEY'),
    'Content-Type' => 'application/json',
])->post('${apiBaseUrl}', [
    'type' => 'order',
    'customer_name' => $request->name,
    'customer_phone' => $request->phone,
    'customer_address' => $request->address,
    'total_amount' => $request->total,
    'delivery_charge' => 60,
    'items' => [
        [
            'product_name' => $product->name,
            'product_code' => $product->code,
            'quantity' => $request->qty,
            'unit_price' => $product->price,
            'total_price' => $product->price * $request->qty,
        ]
    ]
]);

if ($response->successful()) {
    $orderNumber = $response->json('order_number');
    // Success!
}`}</pre>
          </div>

          <div className="bg-muted/50 p-4 rounded-lg space-y-3">
            <h3 className="font-bold text-lg">🌐 JavaScript/Fetch উদাহরণ</h3>
            <pre className="bg-background p-3 rounded border text-xs overflow-x-auto">{`const response = await fetch('${apiBaseUrl}', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-API-Key': 'your_api_key_here',
  },
  body: JSON.stringify({
    type: 'order',
    customer_name: 'রহিম',
    customer_phone: '01700000000',
    customer_address: 'ঢাকা',
    total_amount: 560,
    delivery_charge: 60,
    items: [{
      product_name: 'Product A',
      product_code: 'PA-01',
      quantity: 1,
      unit_price: 500,
      total_price: 500,
    }]
  })
});

const result = await response.json();
console.log(result.order_number);`}</pre>
          </div>

          <div className="bg-muted/50 p-4 rounded-lg space-y-3">
            <h3 className="font-bold text-lg">🐘 PHP (cURL) উদাহরণ</h3>
            <pre className="bg-background p-3 rounded border text-xs overflow-x-auto">{`$ch = curl_init('${apiBaseUrl}');
curl_setopt_array($ch, [
    CURLOPT_POST => true,
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_HTTPHEADER => [
        'Content-Type: application/json',
        'X-API-Key: your_api_key_here',
    ],
    CURLOPT_POSTFIELDS => json_encode([
        'type' => 'order',
        'customer_name' => 'রহিম',
        'customer_phone' => '01700000000',
        'total_amount' => 560,
        'items' => [['product_name' => 'Item', 'quantity' => 1, 'unit_price' => 500, 'total_price' => 500]]
    ]),
]);
$response = curl_exec($ch);
$data = json_decode($response, true);`}</pre>
          </div>

        </CardContent>
      </Card>
    </div>
  );
}
