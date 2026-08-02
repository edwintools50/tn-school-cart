import Link from "next/link";
import { Search, ShoppingCart, Store, PackageSearch, Sparkles } from "lucide-react";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { addToCartAction } from "@/app/cart/actions";
import { PRODUCT_CATEGORY_LABELS } from "@/lib/constants";
import { PRODUCT_CATEGORY_ICONS } from "@/lib/categoryIcons";
import type { ProductCategory } from "@/generated/prisma/enums";

function categoryHref(key: string, q?: string) {
  const params = new URLSearchParams();
  if (key) params.set("category", key);
  if (q) params.set("q", q);
  const qs = params.toString();
  return `/marketplace${qs ? `?${qs}` : ""}`;
}

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
    <div className="mx-auto max-w-6xl px-4 py-6 sm:py-8 w-full">
      <h1 className="text-xl sm:text-2xl font-bold mb-1">Marketplace</h1>
      <p className="text-sm text-foreground/60 mb-5">
        Stationery, furniture, books &amp; supplies from verified suppliers.
      </p>

      <form method="get" className="relative mb-4">
        {category && <input type="hidden" name="category" value={category} />}
        <Search
          size={18}
          className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-foreground/40"
        />
        <input
          type="text"
          name="q"
          defaultValue={q}
          placeholder="Search products..."
          className="w-full rounded-full border border-border bg-surface pl-10 pr-4 py-2.5 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-brand/40 focus:border-brand"
        />
      </form>

      <div className="flex gap-2 overflow-x-auto pb-1 mb-6 -mx-4 px-4 sm:mx-0 sm:px-0 sm:flex-wrap [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <Link
          href={categoryHref("", q)}
          className={`shrink-0 flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold border transition-colors ${
            !category
              ? "bg-brand text-white border-brand"
              : "bg-surface text-foreground/70 border-border hover:border-brand"
          }`}
        >
          All
        </Link>
        {Object.entries(PRODUCT_CATEGORY_LABELS).map(([key, label]) => {
          const Icon = PRODUCT_CATEGORY_ICONS[key];
          const active = category === key;
          return (
            <Link
              key={key}
              href={categoryHref(key, q)}
              className={`shrink-0 flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold border transition-colors ${
                active
                  ? "bg-brand text-white border-brand"
                  : "bg-surface text-foreground/70 border-border hover:border-brand"
              }`}
            >
              {Icon && <Icon size={14} />}
              {label}
            </Link>
          );
        })}
      </div>

      {products.length === 0 ? (
        <div className="flex flex-col items-center justify-center text-center py-16 text-foreground/50">
          <PackageSearch size={40} className="mb-3 opacity-60" />
          <p className="text-sm">No products found.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-5">
          {products.map((product) => {
            const CategoryIcon = PRODUCT_CATEGORY_ICONS[product.category];
            return (
              <div
                key={product.id}
                className="card overflow-hidden flex flex-col rounded-2xl shadow-sm hover:shadow-md active:scale-[0.98] transition-all"
              >
                <div className="aspect-square bg-background overflow-hidden flex items-center justify-center border-b border-border">
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
                <div className="p-3 flex flex-col gap-1.5 flex-1">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="flex items-center gap-1 text-[10px] font-semibold text-accent uppercase tracking-wide">
                      {CategoryIcon && <CategoryIcon size={11} />}
                      <span className="line-clamp-1">
                        {PRODUCT_CATEGORY_LABELS[product.category]}
                      </span>
                    </span>
                    {product.isDigital && (
                      <span className="flex items-center gap-0.5 text-[10px] font-semibold text-brand bg-brand/10 rounded-full px-1.5 py-0.5">
                        <Sparkles size={10} />
                        Digital
                      </span>
                    )}
                  </div>
                  <Link
                    href={`/marketplace/${product.id}`}
                    className="font-semibold text-sm hover:text-brand line-clamp-2 leading-snug"
                  >
                    {product.title}
                  </Link>
                  <p className="flex items-center gap-1 text-[11px] text-foreground/50">
                    <Store size={11} />
                    <span className="line-clamp-1">
                      {product.supplier.businessName ?? product.supplier.name}
                    </span>
                  </p>
                  <div className="flex items-baseline justify-between mt-0.5">
                    <span className="font-bold text-brand-dark">
                      &#8377;{product.price.toFixed(2)}
                    </span>
                    <span className="text-[10px] text-foreground/50">
                      /{product.unit}
                    </span>
                  </div>
                  <p className="text-[10px] text-foreground/50 -mt-1">
                    {product.isDigital ? "Instant download" : `${product.stock} in stock`}
                  </p>

                  {user?.role === "PRINCIPAL" ? (
                    <form action={addToCartAction} className="mt-auto pt-1.5">
                      <input type="hidden" name="productId" value={product.id} />
                      <input type="hidden" name="quantity" value="1" />
                      <button
                        type="submit"
                        className="w-full flex items-center justify-center gap-1.5 bg-brand text-white text-xs font-semibold rounded-lg py-2 hover:bg-brand-dark active:scale-95 transition-all"
                      >
                        <ShoppingCart size={13} />
                        Add to cart
                      </button>
                    </form>
                  ) : !user ? (
                    <Link
                      href="/login"
                      className="mt-auto pt-1.5 text-center w-full border border-border text-xs font-semibold rounded-lg py-2 hover:border-brand block"
                    >
                      Log in to order
                    </Link>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
