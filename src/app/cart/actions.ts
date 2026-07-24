"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { notifyNewOrder, notifyOrderPlaced } from "@/lib/whatsapp-notify";
import { createRazorpayOrder, isRazorpayConfigured } from "@/lib/razorpay";
import { sendDigitalDeliveryEmail } from "@/lib/email";

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

  const cartItems = await db.cartItem.findMany({
    where: { buyerId: user.id },
    include: { product: { include: { supplier: true } } },
  });
  if (cartItems.length === 0) {
    throw new Error("Your cart is empty.");
  }
  const allDigital = cartItems.every((item) => item.product.isDigital);

  let shippingSchool = String(formData.get("shippingSchool") ?? "").trim();
  const shippingUdise = String(formData.get("shippingUdise") ?? "").trim();
  let shippingDistrict = String(formData.get("shippingDistrict") ?? "").trim();
  const shippingTaluk = String(formData.get("shippingTaluk") ?? "").trim();
  const shippingBlock = String(formData.get("shippingBlock") ?? "").trim();
  const shippingPinCode = String(formData.get("shippingPinCode") ?? "").trim();
  let shippingAddress = String(formData.get("shippingAddress") ?? "").trim();

  if (allDigital) {
    shippingSchool ||= user.schoolName ?? "N/A (digital order)";
    shippingDistrict ||= user.district ?? "N/A";
    shippingAddress ||= "Digital delivery — no physical address required.";
  } else {
    if (
      !shippingSchool ||
      !shippingDistrict ||
      !shippingAddress ||
      !shippingTaluk ||
      !shippingBlock
    ) {
      throw new Error("Please fill in all delivery details.");
    }
    if (!/^\d{11}$/.test(shippingUdise)) {
      throw new Error("Enter a valid 11-digit UDISE number.");
    }
    if (!/^\d{6}$/.test(shippingPinCode)) {
      throw new Error("Enter a valid 6-digit pin code.");
    }
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

  // Payment is only "simulated" (marked paid immediately) when Razorpay isn't
  // configured, so the site keeps working end-to-end before you've set up
  // real payment credentials. Once configured, the order is created unpaid
  // and the buyer completes a real Razorpay payment on the order page.
  const razorpayReady = isRazorpayConfigured();

  const order = await db.$transaction(async (tx) => {
    const created = await tx.order.create({
      data: {
        buyerId: user.id,
        totalAmount,
        shippingSchool,
        shippingUdise,
        shippingDistrict,
        shippingTaluk,
        shippingBlock,
        shippingPinCode,
        shippingAddress,
        paid: !razorpayReady,
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

  if (razorpayReady) {
    const razorpayOrderId = await createRazorpayOrder(totalAmount, order.id);
    await db.order.update({ where: { id: order.id }, data: { razorpayOrderId } });
  } else {
    const orderShortId = order.id.slice(-8);

    await notifyOrderPlaced({
      phone: user.phone,
      buyerName: user.name,
      orderShortId,
      totalAmount,
    });

    for (const item of cartItems) {
      await notifyNewOrder({
        phone: item.product.supplier.phone,
        supplierName: item.product.supplier.businessName ?? item.product.supplier.name,
        quantity: item.quantity,
        itemTitle: item.product.title,
        schoolName: shippingSchool,
        orderShortId,
      });
    }

    const digitalItems = cartItems
      .filter((item) => item.product.isDigital && item.product.fileUrl)
      .map((item) => ({ title: item.product.title, productId: item.productId }));
    await sendDigitalDeliveryEmail(user.email, user.name, orderShortId, digitalItems);
  }

  revalidatePath("/orders");
  redirect(`/orders/${order.id}`);
}
