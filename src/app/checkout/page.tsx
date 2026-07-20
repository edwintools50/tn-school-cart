import Link from "next/link";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { placeOrderAction } from "@/app/cart/actions";
import { TN_DISTRICTS } from "@/lib/constants";

export default async function CheckoutPage() {
  const user = await requireUser(["PRINCIPAL"]);

  const cartItems = await db.cartItem.findMany({
    where: { buyerId: user.id },
    include: { product: true },
  });

  if (cartItems.length === 0) redirect("/cart");

  const total = cartItems.reduce((sum, item) => sum + item.product.price * item.quantity, 0);

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 w-full">
      <h1 className="text-2xl font-bold mb-6">Checkout</h1>

      <div className="grid sm:grid-cols-2 gap-8">
        <form action={placeOrderAction} className="space-y-4">
          <h2 className="font-semibold">Delivery details</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1" htmlFor="shippingSchool">
                School name
              </label>
              <input
                id="shippingSchool"
                name="shippingSchool"
                defaultValue={user.schoolName ?? ""}
                required
                className="w-full rounded-md border border-border px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" htmlFor="shippingUdise">
                UDISE number
              </label>
              <input
                id="shippingUdise"
                name="shippingUdise"
                inputMode="numeric"
                pattern="\d{11}"
                maxLength={11}
                placeholder="11-digit code"
                defaultValue={user.udiseNumber ?? ""}
                required
                className="w-full rounded-md border border-border px-3 py-2 text-sm"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1" htmlFor="shippingDistrict">
              District
            </label>
            <select
              id="shippingDistrict"
              name="shippingDistrict"
              defaultValue={user.district ?? ""}
              required
              className="w-full rounded-md border border-border px-3 py-2 text-sm"
            >
              <option value="">Select district</option>
              {TN_DISTRICTS.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1" htmlFor="shippingTaluk">
                Taluk
              </label>
              <input
                id="shippingTaluk"
                name="shippingTaluk"
                required
                className="w-full rounded-md border border-border px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" htmlFor="shippingBlock">
                Block
              </label>
              <input
                id="shippingBlock"
                name="shippingBlock"
                required
                className="w-full rounded-md border border-border px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" htmlFor="shippingPinCode">
                Pin code
              </label>
              <input
                id="shippingPinCode"
                name="shippingPinCode"
                inputMode="numeric"
                pattern="\d{6}"
                maxLength={6}
                required
                className="w-full rounded-md border border-border px-3 py-2 text-sm"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1" htmlFor="shippingAddress">
              Full delivery address
            </label>
            <textarea
              id="shippingAddress"
              name="shippingAddress"
              required
              rows={3}
              className="w-full rounded-md border border-border px-3 py-2 text-sm"
            />
          </div>

          <div className="bg-accent/10 border border-accent/30 rounded-md px-3 py-2 text-xs text-accent-dark">
            Payment is simulated for this demo &mdash; your order will be marked
            as paid immediately, no real payment is collected.
          </div>

          <button
            type="submit"
            className="w-full bg-brand text-white font-semibold rounded-md py-3 hover:bg-brand-dark transition-colors"
          >
            Place order &mdash; &#8377;{total.toFixed(2)}
          </button>
        </form>

        <div>
          <h2 className="font-semibold mb-3">Order summary</h2>
          <div className="card divide-y divide-border">
            {cartItems.map((item) => (
              <div key={item.id} className="p-3 flex justify-between text-sm">
                <span>
                  {item.product.title} &times; {item.quantity}
                </span>
                <span className="font-medium">
                  &#8377;{(item.product.price * item.quantity).toFixed(2)}
                </span>
              </div>
            ))}
            <div className="p-3 flex justify-between font-bold">
              <span>Total</span>
              <span>&#8377;{total.toFixed(2)}</span>
            </div>
          </div>
          <Link href="/cart" className="text-sm text-brand hover:underline mt-3 inline-block">
            &larr; Back to cart
          </Link>
        </div>
      </div>
    </div>
  );
}
