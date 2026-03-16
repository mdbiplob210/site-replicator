import { useProductVariants } from "@/hooks/useProductVariants";

interface Props {
  productId: string;
  selectedVariant: any | null;
  onSelect: (variant: any | null) => void;
}

export function VariantSelector({ productId, selectedVariant, onSelect }: Props) {
  const { data: variants = [] } = useProductVariants(productId);

  if (variants.length === 0) return null;

  // Group by variant_name
  const groups = variants.reduce((acc: Record<string, any[]>, v: any) => {
    if (!acc[v.variant_name]) acc[v.variant_name] = [];
    acc[v.variant_name].push(v);
    return acc;
  }, {});

  return (
    <div className="space-y-3">
      {Object.entries(groups).map(([groupName, options]) => (
        <div key={groupName}>
          <p className="text-sm font-semibold text-gray-700 mb-2">{groupName}:</p>
          <div className="flex flex-wrap gap-2">
            {options.map((v: any) => {
              const isSelected = selectedVariant?.id === v.id;
              const outOfStock = v.stock_quantity <= 0;
              return (
                <button
                  key={v.id}
                  onClick={() => onSelect(isSelected ? null : v)}
                  disabled={outOfStock}
                  className={`px-4 py-2 rounded-lg border-2 text-sm font-medium transition-all ${
                    isSelected
                      ? "border-green-500 bg-green-50 text-green-700"
                      : outOfStock
                        ? "border-gray-200 bg-gray-100 text-gray-300 cursor-not-allowed"
                        : "border-gray-200 hover:border-gray-400 text-gray-700"
                  }`}
                >
                  {v.variant_value}
                  {v.price_adjustment > 0 && <span className="text-xs ml-1">(+৳{v.price_adjustment})</span>}
                  {v.price_adjustment < 0 && <span className="text-xs ml-1">(-৳{Math.abs(v.price_adjustment)})</span>}
                  {outOfStock && <span className="text-[10px] block text-red-400">স্টক নেই</span>}
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
