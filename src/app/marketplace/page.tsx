import Link from "next/link";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { addToCartAction } from "@/app/cart/actions";
import { PRODUCT_CATEGORY_LABELS } from "@/lib/constants";
import type { ProductCategory } from "@/generated/prisma/enums";

export default async function MarketplacePage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; q?: string }>;
}) {
  const { category, q } = await searchParams;
  const user = await getCurrentUser();

  const products = await db.product.findMany({
    where: {
      status: "APPROVED",
      stock: { gt: 0 },
      ...(category ? { category: category as ProductCategory } : {}),
      ...(q
        ? {
            OR: [
              { title: { contains: q } },
              { description: { contains: q } },
            ],
          }
        : {}),
    },
    include: { supplier: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 w-full">
      <h1 className="text-2xl font-bold mb-1">Marketplace</h1>
      <p className="text-sm text-foreground/60 mb-6">
        Stationery, furniture, notebooks, educational content and health &
        hygiene supplies from verified suppliers.
      </p>

      <form className="flex flex-wrap gap-3 mb-6" method="get">
        <input
          type="text"
          name="q"
          defaultValue={q}
          placeholder="Search products..."
          className="flex-1 min-w-[200px] rounded-md border border-border px-3 py-2 text-sm"
        />
        <select
          name="category"
          defaultValue={category ?? ""}
          className="rounded-md border border-border px-3 py-2 text-sm"
        >
          <option value="">All categories</option>
          {Object.entries(PRODUCT_CATEGORY_LABELS).map(([key, label]) => (
            <option key={key} value={key}>
              {label}
            </option>
          ))}
        </select>
        <button
          type="submit"
          className="bg-brand text-white text-sm font-semibold rounded-md px-4 py-2 hover:bg-brand-dark"
        >
          Filter
        </button>
      </form>

      {products.length === 0 ? (
        <p className="text-sm text-foreground/60">No products found.</p>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {products.map((product) => (
            <div key={product.id} className="card p-4 flex flex-col gap-2">
              <div className="aspect-video bg-background rounded-md overflow-hidden flex items-center justify-center border border-border">
                {product.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={product.imageUrl}
                    alt={product.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-xs text-foreground/40">No image</span>
                )}
              </div>
              <span className="text-xs font-semibold text-accent uppercase tracking-wide">
                {PRODUCT_CATEGORY_LABELS[product.category]}
              </span>
              <Link
                href={`/marketplace/${product.id}`}
                className="font-semibold hover:text-brand line-clamp-1"
              >
                {product.title}
              </Link>
              <p className="text-xs text-foreground/60 line-clamp-2">
                {product.description}
              </p>
              <p className="text-xs text-foreground/50">
                Sold by {product.supplier.businessName ?? product.supplier.name}
              </p>
              <div className="flex items-center justify-between mt-1">
                <span className="font-bold">
                  &#8377;{product.price.toFixed(2)} / {product.unit}
                </span>
                <span className="text-xs text-foreground/50">{product.stock} in stock</span>
              </div>

              {user?.role === "PRINCIPAL" ? (
                <form action={addToCartAction} className="mt-1">
                  <input type="hidden" name="productId" value={product.id} />
                  <input type="hidden" name="quantity" value="1" />
                  <button
                    type="submit"
                    className="w-full bg-brand text-white text-sm font-semibold rounded-md py-2 hover:bg-brand-dark transition-colors"
                  >
                    Add to cart
                  </button>
                </form>
              ) : !user ? (
                <Link
                  href="/login"
                  className="mt-1 text-center w-full border border-border text-sm font-semibold rounded-md py-2 hover:border-brand"
                >
                  Log in to order
                </Link>
              ) : null}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
