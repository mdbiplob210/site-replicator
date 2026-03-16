import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tag, Check, X, Loader2 } from "lucide-react";
import { validateCoupon } from "@/hooks/useCoupons";

interface Props {
  orderTotal: number;
  onApply: (discount: number, couponId: string) => void;
  onRemove: () => void;
  appliedCouponCode?: string;
}

export function CouponInput({ orderTotal, onApply, onRemove, appliedCouponCode }: Props) {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [isValid, setIsValid] = useState(false);

  const handleApply = async () => {
    if (!code.trim()) return;
    setLoading(true);
    setMessage("");
    try {
      const result = await validateCoupon(code, orderTotal);
      setMessage(result.message);
      setIsValid(result.valid);
      if (result.valid && result.couponId) {
        onApply(result.discount, result.couponId);
      }
    } catch {
      setMessage("সমস্যা হয়েছে");
      setIsValid(false);
    } finally {
      setLoading(false);
    }
  };

  if (appliedCouponCode) {
    return (
      <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-xl px-3 py-2">
        <div className="flex items-center gap-2">
          <Check className="h-4 w-4 text-green-600" />
          <span className="text-sm font-medium text-green-700">কুপন: {appliedCouponCode}</span>
        </div>
        <button onClick={() => { onRemove(); setCode(""); setMessage(""); setIsValid(false); }} className="p-1 hover:bg-green-100 rounded-full transition">
          <X className="h-3.5 w-3.5 text-green-600" />
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-1.5">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Tag className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
          <Input
            placeholder="কুপন কোড"
            value={code}
            onChange={e => { setCode(e.target.value.toUpperCase()); setMessage(""); }}
            className="pl-9 h-10 rounded-xl text-sm uppercase"
            onKeyDown={e => e.key === "Enter" && (e.preventDefault(), handleApply())}
          />
        </div>
        <Button variant="outline" onClick={handleApply} disabled={loading || !code.trim()} className="h-10 rounded-xl px-4">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Apply"}
        </Button>
      </div>
      {message && (
        <p className={`text-xs ${isValid ? "text-green-600" : "text-red-500"}`}>{message}</p>
      )}
    </div>
  );
}
