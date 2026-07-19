import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { PRODUCT_CATEGORY_LABELS } from "@/lib/constants";
import { delistProductAction } from "./actions";

const statusColor: Record<string, string> = {
  PENDING: "bg-amber-100 text-amber-700",
  APPROVED: "bg-green-100 text-green-700",
  REJECTED: "bg-red-100 text-red-700",
  DELISTED: "bg-gray-200 text-gray-600",
};

export default async function SupplierDashboardPage() {
  const user = await requireUser(["SUPPLIER"]);

  const products = await db.product.findMany({
    where: { supplierId: user.id },
    orderBy: { createdAt: "desc" },
  });

  const pendingOrderCount = await db.orderItem.count({
    where: { supplierId: user.id, status: "PLACED" },
  });

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 w-full">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">Supplier dashboard</h1>
          <p className="text-sm text-foreground/60">{user.businessName ?? user.name}</p>
        </div>
        <div className="flex gap-3">
          <Link
            href="/dashboard/supplier/orders"
            className="border border-border font-semibold rounded-md px-4 py-2 text-sm hover:border-brand relative"
          >
            Orders
            {pendingOrderCount > 0 && (
              <span className="ml-1 inline-flex items-center justify-center bg-accent text-white text-xs rounded-full h-5 min-w-5 px-1">
                {pendingOrderCount}
              </span>
            )}
          </Link>
          <Link
            href="/dashboard/supplier/products/new"
            className="bg-brand text-white font-semibold rounded-md px-4 py-2 text-sm hover:bg-brand-dark"
          >
            + Add product
          </Link>
        </div>
      </div>

      {user.status !== "APPROVED" && (
        <div className="bg-amber-50 border border-amber-200 rounded-md px-4 py-3 text-sm text-amber-800 mb-6">
          Your supplier account is <strong>{user.status.toLowerCase()}</strong>.
          You can still prepare product listings, but they will only be
          reviewed once your account is approved by the TN School Cart admin
          team.
        </div>
      )}

      {products.length === 0 ? (
        <div className="card p-8 text-center">
          <p className="text-sm text-foreground/60 mb-4">
            You haven&apos;t listed any products yet.
          </p>
          <Link
            href="/dashboard/supplier/products/new"
            className="text-brand font-semibold hover:underline"
          >
            List your first product &rarr;
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {products.map((product) => (
            <div key={product.id} className="card p-4 flex items-center justify-between gap-4 flex-wrap">
              <div>
                <p className="font-semibold">{product.title}</p>
                <p className="text-xs text-foreground/50">
                  {PRODUCT_CATEGORY_LABELS[product.category]} &middot; &#8377;
                  {product.price.toFixed(2)} / {product.unit} &middot; {product.stock} in stock
                </p>
                {product.status === "REJECTED" && product.rejectionNote && (
                  <p className="text-xs text-red-600 mt-1">
                    Rejected: {product.rejectionNote}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-3">
                <span
                  className={`text-xs font-semibold px-2 py-1 rounded-full ${statusColor[product.status]}`}
                >
                  {product.status}
                </span>
                <Link
                  href={`/dashboard/supplier/products/${product.id}/edit`}
                  className="text-xs font-semibold text-brand hover:underline"
                >
                  Edit
                </Link>
                {product.status !== "DELISTED" && (
                  <form action={delistProductAction}>
                    <input type="hidden" name="productId" value={product.id} />
                    <button type="submit" className="text-xs font-semibold text-red-600 hover:underline">
                      Delist
                    </button>
                  </form>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
