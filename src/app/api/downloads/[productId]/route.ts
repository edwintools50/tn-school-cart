import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";

/**
 * Gates digital-product files behind purchase verification instead of
 * exposing the permanent public Blob URL directly in email/order pages —
 * only a signed-in buyer with a paid order for this exact product is ever
 * handed the real file location.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ productId: string }> }
) {
  const { productId } = await params;
  const user = await getCurrentUser();

  if (!user) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", `/api/downloads/${productId}`);
    return NextResponse.redirect(loginUrl);
  }

  const orderItem = await db.orderItem.findFirst({
    where: {
      productId,
      order: { buyerId: user.id, paid: true },
    },
    include: { product: true },
  });

  if (!orderItem || !orderItem.product.isDigital || !orderItem.product.fileUrl) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }

  return NextResponse.redirect(orderItem.product.fileUrl);
}
