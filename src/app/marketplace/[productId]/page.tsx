import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Store, MapPin, Sparkles, PackageCheck, PackageX } from "lucide-react";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { addToCartAction } from "@/app/cart/actions";
import { MARKETPLACE_BUYER_ROLES, PRODUCT_CATEGORY_LABELS, ROLE_LABELS } from "@/lib/constants";
import { PRODUCT_CATEGORY_ICONS } from "@/lib/categoryIcons";
import AddToCartSubmitButton from "@/components/AddToCartSubmitButton";

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

  const CategoryIcon = PRODUCT_CATEGORY_ICONS[product.category];

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 sm:py-8 w-full pb-28 sm:pb-8">
      <Link
        href="/marketplace"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-brand hover:underline"
      >
        <ArrowLeft size={16} />
        Back to marketplace
      </Link>

      <div className="grid sm:grid-cols-2 gap-6 sm:gap-8 mt-4">
        <div className="aspect-square bg-background rounded-2xl overflow-hidden flex items-center justify-center border border-border shadow-sm">
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
          <div className="flex items-center gap-2 flex-wrap">
            <span className="flex items-center gap-1 text-xs font-semibold text-accent uppercase tracking-wide">
              {CategoryIcon && <CategoryIcon size={13} />}
              {PRODUCT_CATEGORY_LABELS[product.category]}
            </span>
            {product.isDigital && (
              <span className="flex items-center gap-1 text-xs font-semibold text-brand bg-brand/10 rounded-full px-2 py-0.5">
                <Sparkles size={12} />
                Digital &mdash; delivered by email
              </span>
            )}
          </div>
          <h1 className="text-xl sm:text-2xl font-bold mt-1.5 leading-snug">
            {product.title}
          </h1>
          <p className="flex items-center gap-1.5 text-sm text-foreground/60 mt-1.5">
            <Store size={14} />
            {product.supplier.businessName ?? product.supplier.name}
            <span className="text-foreground/30">&middot;</span>
            <MapPin size={14} />
            {product.supplier.serviceArea}
          </p>

          <p className="text-2xl font-bold text-brand-dark mt-4">
            &#8377;{product.price.toFixed(2)}{" "}
            <span className="text-sm font-normal text-foreground/50">/ {product.unit}</span>
          </p>
          <p className="flex items-center gap-1.5 text-sm text-foreground/50 mt-1">
            {product.isDigital ? (
              <>
                <Sparkles size={14} />
                Instant download after payment
              </>
            ) : product.stock > 0 ? (
              <>
                <PackageCheck size={14} className="text-accent" />
                {product.stock} in stock
              </>
            ) : (
              <>
                <PackageX size={14} className="text-red-600" />
                Out of stock
              </>
            )}
          </p>

          <p className="mt-4 text-sm leading-relaxed text-foreground/80">
            {product.description}
          </p>

          {/* Desktop / tablet add-to-cart — hidden on mobile in favor of the sticky bar below */}
          {user && MARKETPLACE_BUYER_ROLES.includes(user.role) && product.stock > 0 && (
            <form action={addToCartAction} className="mt-6 hidden sm:flex items-end gap-3">
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
              <AddToCartSubmitButton className="flex items-center gap-2 bg-brand text-white font-semibold rounded-md px-5 py-2 hover:bg-brand-dark transition-colors" />
            </form>
          )}

          {!user && (
            <Link
              href="/login"
              className="mt-6 hidden sm:inline-block border border-border font-semibold rounded-md px-5 py-2 hover:border-brand"
            >
              Log in to order
            </Link>
          )}

          {user && !MARKETPLACE_BUYER_ROLES.includes(user.role) && (
            <p className="mt-6 hidden sm:block text-sm text-foreground/60">
              This account can&apos;t buy from the marketplace &mdash; it&apos;s registered as{" "}
              {ROLE_LABELS[user.role] ?? user.role}.
            </p>
          )}

          {product.stock === 0 && (
            <p className="mt-6 flex items-center gap-1.5 text-sm font-semibold text-red-600">
              <PackageX size={16} />
              Out of stock
            </p>
          )}
        </div>
      </div>

      {/* Mobile sticky action bar — mirrors the four conditions above (add to
          cart / log in / wrong role / out of stock) in a single bar instead
          of stacking separate fixed elements, since more than one can apply
          at once (e.g. a signed-out visitor viewing an out-of-stock item).
          Every product view falls into exactly one of these four states
          (no user, PRINCIPAL, a different role, or out of stock), so the
          bar always has something to show — no outer condition needed. */}
      <div className="sm:hidden fixed bottom-0 left-0 right-0 z-30 bg-surface border-t border-border px-4 py-3 shadow-[0_-4px_12px_rgba(0,0,0,0.06)] flex flex-col gap-2">
        {product.stock === 0 && (
          <p className="flex items-center justify-center gap-1.5 text-sm font-semibold text-red-600">
            <PackageX size={16} />
            Out of stock
          </p>
        )}

        {user && !MARKETPLACE_BUYER_ROLES.includes(user.role) && (
          <p className="text-center text-xs text-foreground/60">
            This account can&apos;t buy from the marketplace &mdash; it&apos;s registered as{" "}
            {ROLE_LABELS[user.role] ?? user.role}.
          </p>
        )}

        {user && MARKETPLACE_BUYER_ROLES.includes(user.role) && product.stock > 0 && (
          <form action={addToCartAction} className="flex items-center gap-3">
            <input type="hidden" name="productId" value={product.id} />
            <input type="hidden" name="quantity" value="1" />
            <div className="flex-1 min-w-0">
              <p className="font-bold text-brand-dark leading-none">
                &#8377;{product.price.toFixed(2)}
              </p>
              <p className="text-[11px] text-foreground/50 mt-0.5 truncate">/ {product.unit}</p>
            </div>
            <AddToCartSubmitButton className="flex items-center gap-2 bg-brand text-white text-sm font-semibold rounded-full px-5 py-2.5 hover:bg-brand-dark active:scale-95 transition-all" />
          </form>
        )}

        {!user && (
          <Link
            href="/login"
            className="flex items-center justify-center w-full border border-border font-semibold rounded-full py-2.5 text-sm hover:border-brand"
          >
            Log in to order
          </Link>
        )}
      </div>
    </div>
  );
}
