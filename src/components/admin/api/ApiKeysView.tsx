import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { useApiKeys, useCreateApiKey, useUpdateApiKey, useDeleteApiKey, useSyncOrders } from "@/hooks/useApiKeys";
import { Key, Plus, Trash2, Copy, Eye, EyeOff, BookOpen, Code, ArrowLeft, RefreshCw, Globe, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

const ALL_PERMISSIONS = [
  { value: "orders:create", label: "Create Orders" },
  { value: "orders:read", label: "View Orders" },
  { value: "orders:update", label: "Update Orders" },
  { value: "incomplete_orders:create", label: "Create Incomplete Orders" },
  { value: "incomplete_orders:read", label: "View Incomplete Orders" },
];

interface ApiKeysViewProps {
  onBack: () => void;
}

export function ApiKeysView({ onBack }: ApiKeysViewProps) {
  const { data: keys, isLoading } = useApiKeys();
  const createKey = useCreateApiKey();
  const updateKey = useUpdateApiKey();
  const deleteKey = useDeleteApiKey();
  const syncOrders = useSyncOrders();
  const [showCreate, setShowCreate] = useState(false);
  const [newLabel, setNewLabel] = useState("");
  const [newSourceUrl, setNewSourceUrl] = useState("");
  const [newPerms, setNewPerms] = useState<string[]>(["orders:create", "incomplete_orders:create"]);
  const [visibleKeys, setVisibleKeys] = useState<Record<string, boolean>>({});
  const [editingSourceUrl, setEditingSourceUrl] = useState<Record<string, string>>({});
  const [syncingKeyId, setSyncingKeyId] = useState<string | null>(null);

  const apiBaseUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/order-api`;

  const handleCreate = () => {
    if (!newLabel.trim()) { toast.error("Please enter a label"); return; }
    createKey.mutate({ label: newLabel, permissions: newPerms, source_url: newSourceUrl || undefined }, {
      onSuccess: () => { setShowCreate(false); setNewLabel(""); setNewSourceUrl(""); }
    });
  };

  const togglePerm = (perm: string) => {
    setNewPerms(prev => prev.includes(perm) ? prev.filter(p => p !== perm) : [...prev, perm]);
  };

  const handleSync = async (keyId: string) => {
    setSyncingKeyId(keyId);
    try {
      await syncOrders.mutateAsync(keyId);
    } finally {
      setSyncingKeyId(null);
    }
  };

  const saveSourceUrl = (keyId: string) => {
    const url = editingSourceUrl[keyId];
    if (url !== undefined) {
      updateKey.mutate({ id: keyId, updates: { source_url: url || null } as any });
      setEditingSourceUrl(prev => { const n = { ...prev }; delete n[keyId]; return n; });
    }
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
            <p className="text-sm text-muted-foreground">Receive & sync orders from external websites</p>
          </div>
        </div>
        <Dialog open={showCreate} onOpenChange={setShowCreate}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-1" /> New API Key</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Create New API Key</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Label (which site is this for)</Label>
                <Input placeholder="e.g. Main Website, Laravel Site" value={newLabel} onChange={e => setNewLabel(e.target.value)} />
              </div>
              <div>
                <Label>Source URL (for order sync)</Label>
                <Input placeholder="https://yoursite.com/api/orders" value={newSourceUrl} onChange={e => setNewSourceUrl(e.target.value)} />
                <p className="text-xs text-muted-foreground mt-1">External API endpoint to pull orders from. Optional.</p>
              </div>
              <div>
                <Label>Permissions</Label>
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
              <Button onClick={handleCreate} disabled={createKey.isPending}>Create</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="keys">
        <TabsList>
          <TabsTrigger value="keys"><Key className="h-4 w-4 mr-1" /> API Keys</TabsTrigger>
          <TabsTrigger value="docs"><BookOpen className="h-4 w-4 mr-1" /> Documentation</TabsTrigger>
        </TabsList>

        <TabsContent value="keys" className="space-y-4">
          {isLoading ? (
            <div className="text-center py-10 text-muted-foreground">Loading...</div>
          ) : keys?.length === 0 ? (
            <Card><CardContent className="py-10 text-center text-muted-foreground">No API Keys yet. Create a new one.</CardContent></Card>
          ) : (
            keys?.map(key => (
              <Card key={key.id} className="border-border/40">
                <CardContent className="pt-6 space-y-4">
                  {/* Header */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <h3 className="font-semibold">{key.label}</h3>
                      <Badge variant={key.is_active ? "default" : "secondary"}>{key.is_active ? "Active" : "Inactive"}</Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch checked={key.is_active} onCheckedChange={(v) => updateKey.mutate({ id: key.id, updates: { is_active: v } })} />
                      <Button size="icon" variant="ghost" onClick={() => { if (confirm("Delete this key?")) deleteKey.mutate(key.id) }}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>

                  {/* API Key display */}
                  <div className="flex items-center gap-2">
                    <code className="flex-1 text-sm bg-muted p-2 rounded font-mono">
                      {visibleKeys[key.id] ? key.api_key : "••••••••••••••••••••••••"}
                    </code>
                    <Button size="icon" variant="outline" onClick={() => setVisibleKeys(v => ({ ...v, [key.id]: !v[key.id] }))}>
                      {visibleKeys[key.id] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                    <Button size="icon" variant="outline" onClick={() => { navigator.clipboard.writeText(key.api_key); toast.success("Copied!"); }}>
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>

                  {/* Source URL */}
                  <div className="bg-muted/30 rounded-xl p-3 border border-border/40 space-y-2">
                    <div className="flex items-center gap-2">
                      <Globe className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">Source URL (Order Sync)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Input
                        placeholder="https://yoursite.com/api/orders"
                        value={editingSourceUrl[key.id] !== undefined ? editingSourceUrl[key.id] : (key.source_url || "")}
                        onChange={e => setEditingSourceUrl(prev => ({ ...prev, [key.id]: e.target.value }))}
                        className="text-sm"
                      />
                      {editingSourceUrl[key.id] !== undefined && (
                        <Button size="sm" onClick={() => saveSourceUrl(key.id)} disabled={updateKey.isPending}>
                          Save
                        </Button>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="gap-2"
                        disabled={!key.source_url || syncingKeyId === key.id}
                        onClick={() => handleSync(key.id)}
                      >
                        {syncingKeyId === key.id ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <RefreshCw className="h-3.5 w-3.5" />
                        )}
                        {syncingKeyId === key.id ? "Syncing..." : "Sync Orders"}
                      </Button>
                      {key.last_synced_at && (
                        <span className="text-xs text-muted-foreground">
                          Last synced: {new Date(key.last_synced_at).toLocaleString()}
                        </span>
                      )}
                    </div>
                    {!key.source_url && (
                      <p className="text-xs text-muted-foreground">
                        💡 Set a Source URL to enable order syncing from external sites.
                      </p>
                    )}
                  </div>

                  {/* Permissions */}
                  <div className="flex flex-wrap gap-1">
                    {key.permissions.map(p => <Badge key={p} variant="outline" className="text-xs">{p}</Badge>)}
                  </div>

                  {key.last_used_at && (
                    <p className="text-xs text-muted-foreground">Last used: {new Date(key.last_used_at).toLocaleString()}</p>
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
        <CardHeader><CardTitle className="flex items-center gap-2"><Code className="h-5 w-5" /> API Documentation</CardTitle></CardHeader>
        <CardContent className="space-y-6">

          <div className="bg-muted/50 p-4 rounded-lg space-y-2">
            <h3 className="font-bold text-lg">🔗 Base URL</h3>
            <code className="block bg-background p-3 rounded border text-sm break-all">{apiBaseUrl}</code>
          </div>

          <div className="bg-muted/50 p-4 rounded-lg space-y-2">
            <h3 className="font-bold text-lg">🔑 Authentication</h3>
            <p className="text-sm">Include the <code className="bg-background px-1 rounded">X-API-Key</code> header in every request.</p>
            <pre className="bg-background p-3 rounded border text-xs overflow-x-auto">{`Headers:
  X-API-Key: your_api_key_here
  Content-Type: application/json`}</pre>
          </div>

          <div className="bg-muted/50 p-4 rounded-lg space-y-3">
            <h3 className="font-bold text-lg">📦 POST — Create Order</h3>
            <p className="text-sm">Permission: <code className="bg-background px-1 rounded">orders:create</code></p>
            <pre className="bg-background p-3 rounded border text-xs overflow-x-auto">{`POST ${apiBaseUrl}
Content-Type: application/json
X-API-Key: your_api_key_here

{
  "type": "order",
  "customer_name": "John Doe",
  "customer_phone": "01700000000",
  "customer_address": "Dhaka, Bangladesh",
  "product_cost": 500,
  "delivery_charge": 60,
  "discount": 0,
  "total_amount": 560,
  "notes": "Fragile product",
  "items": [
    {
      "product_name": "Smart Watch",
      "product_code": "SW-001",
      "quantity": 1,
      "unit_price": 500,
      "total_price": 500
    }
  ]
}`}</pre>
          </div>

          <div className="bg-muted/50 p-4 rounded-lg space-y-3">
            <h3 className="font-bold text-lg">⚠️ POST — Create Incomplete Order</h3>
            <p className="text-sm">Permission: <code className="bg-background px-1 rounded">incomplete_orders:create</code></p>
            <pre className="bg-background p-3 rounded border text-xs overflow-x-auto">{`POST ${apiBaseUrl}
Content-Type: application/json
X-API-Key: your_api_key_here

{
  "type": "incomplete_order",
  "customer_name": "Jane Doe",
  "customer_phone": "01800000000",
  "customer_address": "Chittagong",
  "product_name": "Bluetooth Speaker",
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
            <h3 className="font-bold text-lg">🔄 Source URL — Order Sync System</h3>
            <p className="text-sm">Set a Source URL on your API Key, then click "Sync Orders" to pull orders from your external site.</p>
            <p className="text-sm font-medium mt-2">Create a GET endpoint on your external site like this:</p>
            <pre className="bg-background p-3 rounded border text-xs overflow-x-auto">{`// Laravel Example - GET /api/orders
Route::get('/api/orders', function(Request $request) {
    $orders = Order::where('synced', false)
        ->orWhere('created_at', '>=', now()->subDay())
        ->get()
        ->map(function($order) {
            return [
                'type' => 'order',
                'order_number' => $order->order_number,
                'customer_name' => $order->customer_name,
                'customer_phone' => $order->customer_phone,
                'customer_address' => $order->customer_address,
                'product_cost' => $order->product_cost,
                'delivery_charge' => $order->delivery_charge,
                'discount' => $order->discount,
                'total_amount' => $order->total_amount,
                'status' => 'processing',
                'items' => $order->items->map(fn($i) => [
                    'product_name' => $i->product_name,
                    'product_code' => $i->product_code,
                    'quantity' => $i->quantity,
                    'unit_price' => $i->unit_price,
                    'total_price' => $i->total_price,
                ])
            ];
        });
    
    Order::where('synced', false)->update(['synced' => true]);
    
    return response()->json(['data' => $orders]);
});`}</pre>
            <div className="mt-3 space-y-1">
              <p className="text-xs font-semibold text-foreground">Supported Response Formats:</p>
              <pre className="bg-background p-2 rounded border text-xs">{`// Format 1: Array
[{ "customer_name": "...", ... }, ...]

// Format 2: data key
{ "data": [{ "customer_name": "...", ... }] }

// Format 3: orders key
{ "orders": [{ "customer_name": "...", ... }] }`}</pre>
            </div>
            <p className="text-xs text-muted-foreground mt-2">💡 Duplicate check: Orders with the same order_number or same phone+name will be skipped.</p>
          </div>

          <div className="bg-muted/50 p-4 rounded-lg space-y-3">
            <h3 className="font-bold text-lg">🛡️ Duplicate Protection (Automatic)</h3>
            <p className="text-sm">When orders are pushed via API, the system automatically checks IP and phone number. Duplicate orders within the configured time window (1-24 hours) will be moved to <strong>Incomplete Orders</strong>.</p>
            <pre className="bg-background p-3 rounded border text-xs overflow-x-auto">{`// Duplicate response (429):
{
  "success": false,
  "blocked": true,
  "duplicate": true,
  "reason": "Duplicate order from same phone within 24 hours",
  "incomplete_order_id": "uuid...",
  "tracking": { "ip": "...", "device": "Mobile | Android | Chrome" }
}`}</pre>
          </div>

          <div className="bg-muted/50 p-4 rounded-lg space-y-3">
            <h3 className="font-bold text-lg">📱 User Tracking (Automatic)</h3>
            <p className="text-sm">Each order automatically tracks:</p>
            <ul className="text-sm list-disc ml-5 space-y-1">
              <li><strong>IP Address</strong> — Client IP</li>
              <li><strong>Device Type</strong> — Mobile / Desktop / Tablet</li>
              <li><strong>OS</strong> — Android 14, iOS 17, Windows 10, etc.</li>
              <li><strong>Browser</strong> — Chrome, Safari, Firefox, Edge</li>
              <li><strong>User-Agent</strong> — Full browser string</li>
              <li><strong>Source</strong> — Which website the order came from</li>
            </ul>
          </div>

          <div className="bg-muted/50 p-4 rounded-lg space-y-3">
            <h3 className="font-bold text-lg">📋 GET — Order List (with pagination)</h3>
            <pre className="bg-background p-3 rounded border text-xs overflow-x-auto">{`// All orders (with order_items)
GET ${apiBaseUrl}?type=orders&limit=50&offset=0
X-API-Key: your_api_key_here

// With filters
GET ${apiBaseUrl}?type=orders&status=processing&phone=01700000000&since=2026-03-01
GET ${apiBaseUrl}?type=incomplete_orders&limit=20&offset=40

// Response:
{ "success": true, "data": [...], "total": 150, "returned": 50, "limit": 50, "offset": 0 }`}</pre>
          </div>

          <div className="bg-muted/50 p-4 rounded-lg space-y-3">
            <h3 className="font-bold text-lg">✏️ PATCH — Update Order Status</h3>
            <pre className="bg-background p-3 rounded border text-xs overflow-x-auto">{`PATCH ${apiBaseUrl}
X-API-Key: your_api_key_here

{
  "order_id": "uuid-of-order",
  "status": "confirmed",
  "notes": "Confirmed via phone"
}`}</pre>
          </div>

          <div className="bg-muted/50 p-4 rounded-lg space-y-3">
            <h3 className="font-bold text-lg">✅ Success Response</h3>
            <pre className="bg-background p-3 rounded border text-xs overflow-x-auto">{`{
  "success": true,
  "data": { ... },
  "order_number": "ORD-00042",
  "order_id": "uuid...",
  "message": "Order created successfully",
  "tracking": {
    "ip": "103.x.x.x",
    "device": "Mobile | Android 14 | Chrome",
    "source": "My Website"
  }
}`}</pre>
          </div>

          <div className="bg-muted/50 p-4 rounded-lg space-y-3">
            <h3 className="font-bold text-lg">❌ Error Responses</h3>
            <pre className="bg-background p-3 rounded border text-xs overflow-x-auto">{`// 400 - Missing required fields
{ "error": "customer_name is required" }

// 401 - Missing API Key
{ "error": "Missing X-API-Key header" }

// 403 - Invalid key or no permission
{ "error": "Invalid or inactive API key" }

// 429 - Duplicate order (blocked)
{ "success": false, "blocked": true, "duplicate": true, ... }

// 500 - Server error
{ "error": "Internal error" }`}</pre>
          </div>

          <div className="bg-muted/50 p-4 rounded-lg space-y-3">
            <h3 className="font-bold text-lg">🔧 Laravel Example</h3>
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
            <h3 className="font-bold text-lg">🌐 JavaScript/Fetch Example</h3>
            <pre className="bg-background p-3 rounded border text-xs overflow-x-auto">{`const response = await fetch('${apiBaseUrl}', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-API-Key': 'your_api_key_here',
  },
  body: JSON.stringify({
    type: 'order',
    customer_name: 'John Doe',
    customer_phone: '01700000000',
    customer_address: 'Dhaka',
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
            <h3 className="font-bold text-lg">🐘 PHP (cURL) Example</h3>
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
        'customer_name' => 'John Doe',
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