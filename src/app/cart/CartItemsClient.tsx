"use client";

import { useOptimistic } from "react";
import Link from "next/link";
import { ShoppingBag, Store, Trash2, ArrowRight } from "lucide-react";
import { updateCartQuantityAction, removeCartItemAction } from "./actions";

type CartItemView = {
  id: string;
  productId: string;
  quantity: number;
  product: {
    title: string;
    imageUrl: string | null;
    price: number;
    unit: string;
    stock: number;
    supplier: { businessName: string | null; name: string };
  };
};

type OptimisticAction =
  | { type: "quantity"; id: string; quantity: number }
  | { type: "remove"; id: string };

function cartReducer(state: CartItemView[], action: OptimisticAction): CartItemView[] {
  if (action.type === "quantity") {
    return state.map((item) =>
      item.id === action.id ? { ...item, quantity: action.quantity } : item
    );
  }
  return state.filter((item) => item.id !== action.id);
}

export default function CartItemsClient({ initialItems }: { initialItems: CartItemView[] }) {
  const [items, applyOptimistic] = useOptimistic(initialItems, cartReducer);
  const total = items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);

  async function handleUpdate(formData: FormData) {
    const id = String(formData.get("cartItemId"));
    const quantity = Math.max(1, Number(formData.get("quantity")) || 1);
    applyOptimistic({ type: "quantity", id, quantity });
    await updateCartQuantityAction(formData);
  }

  async function handleRemove(formData: FormData) {
    const id = String(formData.get("cartItemId"));
    applyOptimistic({ type: "remove", id });
    await removeCartItemAction(formData);
  }

  if (items.length === 0) {
    return (
      <div className="card p-8 flex flex-col items-center text-center rounded-2xl">
        <ShoppingBag size={36} className="mb-3 text-foreground/30" />
        <p className="text-sm text-foreground/60 mb-4">Your cart is empty.</p>
        <Link href="/marketplace" className="text-brand font-semibold hover:underline">
          Browse the marketplace &rarr;
        </Link>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-3">
        {items.map((item) => (
          <div key={item.id} className="card p-3 sm:p-4 rounded-2xl flex gap-3">
            <div className="w-20 h-20 sm:w-24 sm:h-24 shrink-0 rounded-xl overflow-hidden bg-background border border-border flex items-center justify-center">
              {item.product.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={item.product.imageUrl}
                  alt={item.product.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <ShoppingBag size={20} className="text-foreground/30" />
              )}
            </div>

            <div className="flex-1 min-w-0 flex flex-col">
              <Link
                href={`/marketplace/${item.productId}`}
                className="font-semibold text-sm hover:text-brand line-clamp-2 leading-snug"
              >
                {item.product.title}
              </Link>
              <p className="flex items-center gap-1 text-[11px] text-foreground/50 mt-0.5">
                <Store size={11} />
                <span className="line-clamp-1">
                  {item.product.supplier.businessName ?? item.product.supplier.name}
                </span>
              </p>
              <p className="text-xs text-foreground/60 mt-0.5">
                &#8377;{item.product.price.toFixed(2)} / {item.product.unit}
              </p>

              <div className="flex items-center justify-between gap-2 mt-auto pt-2">
                <form action={handleUpdate} className="flex items-center gap-1.5">
                  <input type="hidden" name="cartItemId" value={item.id} />
                  <input
                    type="number"
                    name="quantity"
                    min={1}
                    max={item.product.stock}
                    defaultValue={item.quantity}
                    className="w-14 rounded-md border border-border px-2 py-1 text-xs"
                  />
                  <button
                    type="submit"
                    className="text-[11px] font-semibold text-brand hover:underline"
                  >
                    Update
                  </button>
                </form>

                <form action={handleRemove}>
                  <input type="hidden" name="cartItemId" value={item.id} />
                  <button
                    type="submit"
                    aria-label="Remove item"
                    className="flex items-center gap-1 text-[11px] font-semibold text-red-600 hover:underline"
                  >
                    <Trash2 size={13} />
                    Remove
                  </button>
                </form>
              </div>
            </div>

            <span className="hidden sm:block font-bold text-brand-dark self-start">
              &#8377;{(item.product.price * item.quantity).toFixed(2)}
            </span>
          </div>
        ))}

        {/* Desktop/tablet total + checkout */}
        <div className="hidden sm:block space-y-3">
          <div className="card p-4 rounded-2xl flex items-center justify-between">
            <span className="font-semibold">Total</span>
            <span className="text-xl font-bold text-brand-dark">&#8377;{total.toFixed(2)}</span>
          </div>
          <Link
            href="/checkout"
            className="flex items-center justify-center gap-2 bg-brand text-white font-semibold rounded-xl py-3 hover:bg-brand-dark transition-colors"
          >
            Proceed to checkout
            <ArrowRight size={18} />
          </Link>
        </div>
      </div>

      {/* Mobile sticky checkout bar */}
      <div className="sm:hidden fixed bottom-0 left-0 right-0 z-30 bg-surface border-t border-border px-4 py-3 flex items-center gap-3 shadow-[0_-4px_12px_rgba(0,0,0,0.06)]">
        <div className="flex-1 min-w-0">
          <p className="text-[11px] text-foreground/50 leading-none">Total</p>
          <p className="font-bold text-brand-dark leading-none mt-0.5">
            &#8377;{total.toFixed(2)}
          </p>
        </div>
        <Link
          href="/checkout"
          className="flex items-center gap-2 bg-brand text-white text-sm font-semibold rounded-full px-5 py-2.5 hover:bg-brand-dark active:scale-95 transition-all"
        >
          Checkout
          <ArrowRight size={16} />
        </Link>
      </div>
    </>
  );
}
