import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { updateCartQuantityAction, removeCartItemAction } from "./actions";

export default async function CartPage() {
  const user = await requireUser(["PRINCIPAL"]);

  const cartItems = await db.cartItem.findMany({
    where: { buyerId: user.id },
    include: { product: { include: { supplier: true } } },
    orderBy: { createdAt: "asc" },
  });

  const total = cartItems.reduce((sum, item) => sum + item.product.price * item.quantity, 0);

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 w-full">
      <h1 className="text-2xl font-bold mb-6">Your cart</h1>

      {cartItems.length === 0 ? (
        <div className="card p-8 text-center">
          <p className="text-sm text-foreground/60 mb-4">Your cart is empty.</p>
          <Link href="/marketplace" className="text-brand font-semibold hover:underline">
            Browse the marketplace &rarr;
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {cartItems.map((item) => (
            <div key={item.id} className="card p-4 flex items-center gap-4">
              <div className="flex-1">
                <Link
                  href={`/marketplace/${item.productId}`}
                  className="font-semibold hover:text-brand"
                >
                  {item.product.title}
                </Link>
                <p className="text-xs text-foreground/50">
                  Sold by {item.product.supplier.businessName ?? item.product.supplier.name}
                </p>
                <p className="text-sm mt-1">
                  &#8377;{item.product.price.toFixed(2)} / {item.product.unit}
                </p>
              </div>

              <form action={updateCartQuantityAction} className="flex items-center gap-2">
                <input type="hidden" name="cartItemId" value={item.id} />
                <input
                  type="number"
                  name="quantity"
                  min={1}
                  max={item.product.stock}
                  defaultValue={item.quantity}
                  className="w-16 rounded-md border border-border px-2 py-1 text-sm"
                />
                <button
                  type="submit"
                  className="text-xs font-semibold text-brand hover:underline"
                >
                  Update
                </button>
              </form>

              <span className="font-semibold w-24 text-right">
                &#8377;{(item.product.price * item.quantity).toFixed(2)}
              </span>

              <form action={removeCartItemAction}>
                <input type="hidden" name="cartItemId" value={item.id} />
                <button
                  type="submit"
                  className="text-xs font-semibold text-red-600 hover:underline"
                >
                  Remove
                </button>
              </form>
            </div>
          ))}

          <div className="card p-4 flex items-center justify-between">
            <span className="font-semibold">Total</span>
            <span className="text-xl font-bold">&#8377;{total.toFixed(2)}</span>
          </div>

          <Link
            href="/checkout"
            className="block text-center bg-brand text-white font-semibold rounded-md py-3 hover:bg-brand-dark transition-colors"
          >
            Proceed to checkout
          </Link>
        </div>
      )}
    </div>
  );
}
