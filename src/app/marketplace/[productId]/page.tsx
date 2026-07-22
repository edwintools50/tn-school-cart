import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { addToCartAction } from "@/app/cart/actions";
import { PRODUCT_CATEGORY_LABELS } from "@/lib/constants";

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ productId: string }>;
}) {
  const { productId } = await params;
  const user = await getCurrentUser();

  const product = await db.product.findUnique({
    where: { id: productId },
    include: { supplier: true },
  });

  if (!product || product.status !== "APPROVED") notFound();

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 w-full">
      <Link href="/marketplace" className="text-sm text-brand hover:underline">
        &larr; Back to marketplace
      </Link>

      <div className="grid sm:grid-cols-2 gap-8 mt-4">
        <div className="aspect-square bg-background rounded-md overflow-hidden flex items-center justify-center border border-border">
          {product.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={product.imageUrl}
              alt={product.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <span className="text-sm text-foreground/40">No image</span>
          )}
        </div>

        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-accent uppercase tracking-wide">
              {PRODUCT_CATEGORY_LABELS[product.category]}
            </span>
            {product.isDigital && (
              <span className="text-xs font-semibold text-brand bg-brand/10 rounded-full px-2 py-0.5">
                Digital &mdash; delivered by email
              </span>
            )}
          </div>
          <h1 className="text-2xl font-bold mt-1">{product.title}</h1>
          <p className="text-sm text-foreground/60 mt-1">
            Sold by {product.supplier.businessName ?? product.supplier.name} &middot;{" "}
            {product.supplier.serviceArea}
          </p>

          <p className="text-2xl font-bold mt-4">
            &#8377;{product.price.toFixed(2)}{" "}
            <span className="text-sm font-normal text-foreground/50">/ {product.unit}</span>
          </p>
          <p className="text-sm text-foreground/50 mt-1">
            {product.isDigital ? "Instant download after payment" : `${product.stock} in stock`}
          </p>

          <p className="mt-4 text-sm leading-relaxed">{product.description}</p>

          {user?.role === "PRINCIPAL" && product.stock > 0 && (
            <form action={addToCartAction} className="mt-6 flex items-end gap-3">
              <input type="hidden" name="productId" value={product.id} />
              <div>
                <label className="block text-xs font-medium mb-1" htmlFor="quantity">
                  Quantity
                </label>
                <input
                  id="quantity"
                  name="quantity"
                  type="number"
                  min={1}
                  max={product.stock}
                  defaultValue={1}
                  className="w-24 rounded-md border border-border px-3 py-2 text-sm"
                />
              </div>
              <button
                type="submit"
                className="bg-brand text-white font-semibold rounded-md px-5 py-2 hover:bg-brand-dark transition-colors"
              >
                Add to cart
              </button>
            </form>
          )}

          {!user && (
            <Link
              href="/login"
              className="mt-6 inline-block border border-border font-semibold rounded-md px-5 py-2 hover:border-brand"
            >
              Log in to order
            </Link>
          )}

          {product.stock === 0 && (
            <p className="mt-6 text-sm font-semibold text-red-600">Out of stock</p>
          )}
        </div>
      </div>
    </div>
  );
}
