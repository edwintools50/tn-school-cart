import { ShoppingBag } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { MARKETPLACE_BUYER_ROLES } from "@/lib/constants";
import CartItemsClient from "./CartItemsClient";

export default async function CartPage() {
  const user = await requireUser(MARKETPLACE_BUYER_ROLES);

  const cartItems = await db.cartItem.findMany({
    where: { buyerId: user.id },
    include: { product: { include: { supplier: true } } },
    orderBy: { createdAt: "asc" },
  });

  return (
    <div
      className={`mx-auto max-w-4xl px-4 py-6 sm:py-8 w-full ${cartItems.length > 0 ? "pb-28 sm:pb-8" : ""}`}
    >
      <h1 className="flex items-center gap-2 text-xl sm:text-2xl font-bold mb-6">
        <ShoppingBag size={22} className="text-brand" />
        Your cart
      </h1>

      <CartItemsClient initialItems={cartItems} />
    </div>
  );
}
