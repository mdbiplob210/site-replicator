import { AdminLayout } from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Star, Check, X, Trash2, Loader2, MessageSquare } from "lucide-react";
import { useAllReviews, useApproveReview, useDeleteReview } from "@/hooks/useProductReviews";

export default function AdminReviews() {
  const { data: reviews = [], isLoading } = useAllReviews();
  const approveReview = useApproveReview();
  const deleteReview = useDeleteReview();

  const pending = reviews.filter((r: any) => !r.is_approved);
  const approved = reviews.filter((r: any) => r.is_approved);

  return (
    <AdminLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <MessageSquare className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Product Reviews</h1>
            <p className="text-sm text-muted-foreground">Approve, manage customer reviews</p>
          </div>
        </div>

        {/* Pending Reviews */}
        {pending.length > 0 && (
          <div className="bg-card rounded-2xl border border-amber-200 p-6">
            <p className="font-semibold text-foreground mb-4 flex items-center gap-2">
              <Badge variant="secondary" className="bg-amber-100 text-amber-700">{pending.length}</Badge>
              Pending Approval
            </p>
            <div className="space-y-3">
              {pending.map((r: any) => (
                <div key={r.id} className="p-4 rounded-xl border border-border/40 bg-amber-50/30">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-sm">{r.customer_name}</span>
                        <div className="flex gap-0.5">
                          {[1,2,3,4,5].map(i => (
                            <Star key={i} className={`h-3 w-3 ${i <= r.rating ? "fill-amber-400 text-amber-400" : "text-gray-200"}`} />
                          ))}
                        </div>
                        <span className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleDateString()}</span>
                      </div>
                      {r.review_text && <p className="text-sm text-muted-foreground">{r.review_text}</p>}
                    </div>
                    <div className="flex gap-1 ml-3">
                      <Button size="icon" variant="ghost" className="h-8 w-8 text-green-600 hover:bg-green-50"
                        onClick={() => approveReview.mutate({ id: r.id, approved: true })}>
                        <Check className="h-4 w-4" />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive hover:bg-destructive/10"
                        onClick={() => deleteReview.mutate(r.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Approved Reviews */}
        <div className="bg-card rounded-2xl border border-border p-6">
          <p className="font-semibold text-foreground mb-4">Approved Reviews ({approved.length})</p>
          {isLoading ? (
            <div className="flex justify-center py-8"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
          ) : approved.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No approved reviews yet</p>
          ) : (
            <div className="space-y-2">
              {approved.map((r: any) => (
                <div key={r.id} className="flex items-center justify-between p-3 rounded-xl border border-border/40">
                  <div className="flex items-center gap-3">
                    <div className="flex gap-0.5">
                      {[1,2,3,4,5].map(i => (
                        <Star key={i} className={`h-3 w-3 ${i <= r.rating ? "fill-amber-400 text-amber-400" : "text-gray-200"}`} />
                      ))}
                    </div>
                    <span className="text-sm font-medium">{r.customer_name}</span>
                    <span className="text-xs text-muted-foreground truncate max-w-[300px]">{r.review_text || "—"}</span>
                  </div>
                  <div className="flex gap-1">
                    <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => approveReview.mutate({ id: r.id, approved: false })}>
                      <X className="h-3.5 w-3.5" />
                    </Button>
                    <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => deleteReview.mutate(r.id)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
