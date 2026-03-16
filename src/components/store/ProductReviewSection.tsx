import { useState } from "react";
import { Star, User, Send } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useProductReviews, useSubmitReview } from "@/hooks/useProductReviews";

interface Props {
  productId: string;
}

export function ProductReviewSection({ productId }: Props) {
  const { data: reviews = [] } = useProductReviews(productId);
  const submitReview = useSubmitReview();
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [rating, setRating] = useState(5);
  const [text, setText] = useState("");

  const avgRating = reviews.length > 0
    ? (reviews.reduce((s: number, r: any) => s + r.rating, 0) / reviews.length).toFixed(1)
    : "0";

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    submitReview.mutate({
      product_id: productId,
      customer_name: name.trim(),
      customer_phone: phone || undefined,
      rating,
      review_text: text || undefined,
    }, {
      onSuccess: () => {
        setShowForm(false);
        setName("");
        setPhone("");
        setRating(5);
        setText("");
      },
    });
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h3 className="text-lg font-bold">রিভিউ</h3>
          {reviews.length > 0 && (
            <div className="flex items-center gap-1 text-sm">
              <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
              <span className="font-bold">{avgRating}</span>
              <span className="text-gray-400">({reviews.length})</span>
            </div>
          )}
        </div>
        <Button variant="outline" size="sm" onClick={() => setShowForm(!showForm)} className="gap-1.5 rounded-full">
          <Send className="h-3.5 w-3.5" /> রিভিউ দিন
        </Button>
      </div>

      {/* Submit Form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="bg-gray-50 rounded-xl p-4 space-y-3 border">
          <div className="flex gap-3">
            <Input placeholder="আপনার নাম *" value={name} onChange={e => setName(e.target.value)} required className="flex-1" />
            <Input placeholder="ফোন (ঐচ্ছিক)" value={phone} onChange={e => setPhone(e.target.value)} className="w-36" />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">রেটিং:</span>
            {[1, 2, 3, 4, 5].map(i => (
              <button key={i} type="button" onClick={() => setRating(i)}>
                <Star className={`h-6 w-6 transition ${i <= rating ? "fill-amber-400 text-amber-400" : "text-gray-300"}`} />
              </button>
            ))}
          </div>
          <Textarea placeholder="আপনার অভিজ্ঞতা লিখুন..." value={text} onChange={e => setText(e.target.value)} rows={3} />
          <Button type="submit" disabled={submitReview.isPending} className="w-full rounded-xl">
            {submitReview.isPending ? "সাবমিট হচ্ছে..." : "রিভিউ সাবমিট করুন"}
          </Button>
        </form>
      )}

      {/* Reviews List */}
      {reviews.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-4">এখনো কোনো রিভিউ নেই। প্রথম রিভিউ দিন!</p>
      ) : (
        <div className="space-y-3">
          {reviews.map((r: any) => (
            <div key={r.id} className="bg-white rounded-xl border p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                    <User className="h-4 w-4 text-gray-400" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold">{r.customer_name}</p>
                    <p className="text-[10px] text-gray-400">
                      {new Date(r.created_at).toLocaleDateString("bn-BD")}
                    </p>
                  </div>
                </div>
                <div className="flex gap-0.5">
                  {[1, 2, 3, 4, 5].map(i => (
                    <Star key={i} className={`h-3.5 w-3.5 ${i <= r.rating ? "fill-amber-400 text-amber-400" : "text-gray-200"}`} />
                  ))}
                </div>
              </div>
              {r.review_text && <p className="text-sm text-gray-600">{r.review_text}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
