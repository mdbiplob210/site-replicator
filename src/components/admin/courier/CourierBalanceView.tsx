import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useCourierBalance } from "@/hooks/useCourierBalance";
import { Wallet, RefreshCw, Truck, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";

export function CourierBalanceView() {
  const { data: balances = [], isLoading, refetch, isFetching } = useCourierBalance();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold flex items-center gap-2">
          <Wallet className="h-5 w-5 text-primary" /> কুরিয়ার COD ব্যালেন্স
        </h2>
        <Button
          variant="outline"
          size="sm"
          onClick={() => refetch()}
          disabled={isFetching}
          className="gap-1.5"
        >
          {isFetching ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
          রিফ্রেশ
        </Button>
      </div>

      {isLoading ? (
        <div className="text-center py-8 text-muted-foreground">
          <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
          ব্যালেন্স লোড হচ্ছে...
        </div>
      ) : balances.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            কোন সক্রিয় কুরিয়ার প্রোভাইডার পাওয়া যায়নি
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {balances.map((b) => (
            <Card key={b.provider_id} className="border-border/40 overflow-hidden">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center justify-between">
                  <span className="text-base font-bold">{b.provider_name}</span>
                  <Badge variant="outline" className="text-xs capitalize">{b.slug}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* API Balance (only for Steadfast) */}
                {b.api_balance !== null && (
                  <div className="flex items-center justify-between p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                      <span className="text-sm font-medium text-emerald-700 dark:text-emerald-400">API ব্যালেন্স</span>
                    </div>
                    <span className="text-lg font-bold text-emerald-700 dark:text-emerald-400">
                      ৳{Number(b.api_balance).toLocaleString("bn-BD")}
                    </span>
                  </div>
                )}

                {/* Estimated from orders */}
                <div className="p-3 rounded-xl bg-secondary/50 border border-border/40 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-muted-foreground">মোট পাওনা (এস্টিমেট)</span>
                    <span className="text-lg font-bold text-foreground">
                      ৳{b.estimated_balance.toLocaleString("bn-BD")}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <Truck className="h-3.5 w-3.5 text-violet-500" />
                      <span>কুরিয়ারে: ৳{(b.in_courier_amount || 0).toLocaleString("bn-BD")}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                      <span>ডেলিভার্ড: ৳{(b.delivered_amount || 0).toLocaleString("bn-BD")}</span>
                    </div>
                  </div>
                </div>

                {/* Error/Info */}
                {b.error && b.api_balance === null && (
                  <div className="flex items-start gap-2 text-xs text-muted-foreground">
                    <AlertCircle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                    <span>{b.error}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
