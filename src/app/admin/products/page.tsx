import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { PRODUCT_CATEGORY_LABELS } from "@/lib/constants";
import { approveProductAction, rejectProductAction } from "../actions";

const statusColor: Record<string, string> = {
  PENDING: "bg-amber-100 text-amber-700",
  APPROVED: "bg-green-100 text-green-700",
  REJECTED: "bg-red-100 text-red-700",
  DELISTED: "bg-gray-200 text-gray-600",
};

export default async function AdminProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  await requireAdmin();
  const { status } = await searchParams;

  const products = await db.product.findMany({
    where: status ? { status: status as "PENDING" | "APPROVED" | "REJECTED" | "DELISTED" } : {},
    include: { supplier: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 w-full">
      <h1 className="text-2xl font-bold mb-6">Moderate products</h1>

      <form className="flex flex-wrap gap-3 mb-6" method="get">
        <select name="status" defaultValue={status ?? ""} className="rounded-md border border-border px-3 py-2 text-sm">
          <option value="">All statuses</option>
          <option value="PENDING">Pending</option>
          <option value="APPROVED">Approved</option>
          <option value="REJECTED">Rejected</option>
          <option value="DELISTED">Delisted</option>
        </select>
        <button type="submit" className="bg-brand text-white text-sm font-semibold rounded-md px-4 py-2 hover:bg-brand-dark">
          Filter
        </button>
      </form>

      {products.length === 0 ? (
        <p className="text-sm text-foreground/60">No products found.</p>
      ) : (
        <div className="space-y-3">
          {products.map((p) => (
            <div key={p.id} className="card p-4 flex items-center justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-3">
                {p.imageUrl && (
                  <a href={p.imageUrl} target="_blank" rel="noopener noreferrer">
                    <img
                      src={p.imageUrl}
                      alt={p.title}
                      className="h-14 w-14 object-cover rounded-md border border-border"
                    />
                  </a>
                )}
                <div>
                  <p className="font-semibold">
                    {p.title}
                    {p.isDigital && (
                      <span className="ml-2 text-xs font-semibold text-brand bg-brand/10 rounded-full px-2 py-0.5 align-middle">
                        Digital
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-foreground/50">
                    {PRODUCT_CATEGORY_LABELS[p.category]} &middot; &#8377;{p.price.toFixed(2)} / {p.unit} &middot;{" "}
                    by {p.supplier.businessName ?? p.supplier.name}
                  </p>
                  <p className="text-xs text-foreground/60 mt-1 max-w-xl">{p.description}</p>
                  {p.isDigital && p.fileUrl && (
                    <a
                      href={p.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs font-semibold text-brand hover:underline"
                    >
                      Review digital file &rarr;
                    </a>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className={`text-xs font-semibold px-2 py-1 rounded-full ${statusColor[p.status]}`}>
                  {p.status}
                </span>
                {p.status === "PENDING" && (
                  <>
                    <form action={approveProductAction}>
                      <input type="hidden" name="productId" value={p.id} />
                      <button type="submit" className="text-xs font-semibold text-accent hover:underline">
                        Approve
                      </button>
                    </form>
                    <form action={rejectProductAction} className="flex items-center gap-1">
                      <input type="hidden" name="productId" value={p.id} />
                      <input
                        type="text"
                        name="note"
                        placeholder="Reason"
                        className="rounded-md border border-border px-2 py-1 text-xs w-28"
                      />
                      <button type="submit" className="text-xs font-semibold text-red-600 hover:underline">
                        Reject
                      </button>
                    </form>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
