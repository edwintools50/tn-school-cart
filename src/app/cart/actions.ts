"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";

export async function addToCartAction(formData: FormData) {
  const user = await requireUser(["PRINCIPAL"]);
  const productId = String(formData.get("productId"));
  const quantity = Math.max(1, Number(formData.get("quantity")) || 1);

  const product = await db.product.findUnique({ where: { id: productId } });
  if (!product || product.status !== "APPROVED") {
    throw new Error("This product is not available.");
  }

  await db.cartItem.upsert({
    where: { buyerId_productId: { buyerId: user.id, productId } },
    create: { buyerId: user.id, productId, quantity },
    update: { quantity: { increment: quantity } },
  });

  revalidatePath("/cart");
  revalidatePath("/marketplace");
}

export async function updateCartQuantityAction(formData: FormData) {
  const user = await requireUser(["PRINCIPAL"]);
  const cartItemId = String(formData.get("cartItemId"));
  const quantity = Math.max(1, Number(formData.get("quantity")) || 1);

  const item = await db.cartItem.findUnique({ where: { id: cartItemId } });
  if (!item || item.buyerId !== user.id) throw new Error("Not found");

  await db.cartItem.update({ where: { id: cartItemId }, data: { quantity } });
  revalidatePath("/cart");
}

export async function removeCartItemAction(formData: FormData) {
  const user = await requireUser(["PRINCIPAL"]);
  const cartItemId = String(formData.get("cartItemId"));

  const item = await db.cartItem.findUnique({ where: { id: cartItemId } });
  if (!item || item.buyerId !== user.id) throw new Error("Not found");

  await db.cartItem.delete({ where: { id: cartItemId } });
  revalidatePath("/cart");
}

export async function placeOrderAction(formData: FormData) {
  const user = await requireUser(["PRINCIPAL"]);

  const shippingSchool = String(formData.get("shippingSchool") ?? "").trim();
  const shippingDistrict = String(formData.get("shippingDistrict") ?? "").trim();
  const shippingAddress = String(formData.get("shippingAddress") ?? "").trim();

  if (!shippingSchool || !shippingDistrict || !shippingAddress) {
    throw new Error("Please fill in all delivery details.");
  }

  const cartItems = await db.cartItem.findMany({
    where: { buyerId: user.id },
    include: { product: true },
  });
  if (cartItems.length === 0) {
    throw new Error("Your cart is empty.");
  }

  for (const item of cartItems) {
    if (item.product.status !== "APPROVED") {
      throw new Error(`${item.product.title} is no longer available.`);
    }
    if (item.quantity > item.product.stock) {
      throw new Error(`Only ${item.product.stock} of ${item.product.title} left in stock.`);
    }
  }

  const totalAmount = cartItems.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0
  );

  const order = await db.$transaction(async (tx) => {
    const created = await tx.order.create({
      data: {
        buyerId: user.id,
        totalAmount,
        shippingSchool,
        shippingDistrict,
        shippingAddress,
        paid: true,
        items: {
          create: cartItems.map((item) => ({
            productId: item.productId,
            supplierId: item.product.supplierId,
            titleAtOrder: item.product.title,
            priceAtOrder: item.product.price,
            quantity: item.quantity,
          })),
        },
      },
    });

    for (const item of cartItems) {
      await tx.product.update({
        where: { id: item.productId },
        data: { stock: { decrement: item.quantity } },
      });
    }

    await tx.cartItem.deleteMany({ where: { buyerId: user.id } });

    return created;
  });

  revalidatePath("/orders");
  redirect(`/orders/${order.id}`);
}
