import Link from "next/link";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { GIG_CATEGORY_LABELS, TN_DISTRICTS } from "@/lib/constants";
import type { GigCategory } from "@/generated/prisma/enums";

export default async function GigsPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; district?: string }>;
}) {
  const { category, district } = await searchParams;
  const user = await getCurrentUser();

  const gigRequests = await db.gigRequest.findMany({
    where: {
      status: "OPEN",
      ...(category ? { category: category as GigCategory } : {}),
      ...(district ? { district } : {}),
    },
    include: { _count: { select: { offers: true } } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 w-full">
      <div className="flex items-center justify-between mb-1 flex-wrap gap-3">
        <h1 className="text-2xl font-bold">Gig work requests</h1>
        {user?.role === "PRINCIPAL" && (
          <Link
            href="/gigs/new"
            className="bg-brand text-white font-semibold rounded-md px-4 py-2 text-sm hover:bg-brand-dark"
          >
            + Post a gig request
          </Link>
        )}
      </div>
      <p className="text-sm text-foreground/60 mb-6">
        Plumbing, electrical, cleaning and other campus-service jobs posted by
        schools across Tamil Nadu.
      </p>

      <form className="flex flex-wrap gap-3 mb-6" method="get">
        <select
          name="category"
          defaultValue={category ?? ""}
          className="rounded-md border border-border px-3 py-2 text-sm"
        >
          <option value="">All categories</option>
          {Object.entries(GIG_CATEGORY_LABELS).map(([key, label]) => (
            <option key={key} value={key}>
              {label}
            </option>
          ))}
        </select>
        <select
          name="district"
          defaultValue={district ?? ""}
          className="rounded-md border border-border px-3 py-2 text-sm"
        >
          <option value="">All districts</option>
          {TN_DISTRICTS.map((d) => (
            <option key={d} value={d}>
              {d}
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

      {gigRequests.length === 0 ? (
        <p className="text-sm text-foreground/60">No open gig requests found.</p>
      ) : (
        <div className="space-y-3">
          {gigRequests.map((gig) => (
            <Link
              key={gig.id}
              href={`/gigs/${gig.id}`}
              className="card p-4 flex items-center justify-between gap-4 flex-wrap hover:border-accent transition-colors"
            >
              <div>
                <span className="text-xs font-semibold text-accent uppercase tracking-wide">
                  {GIG_CATEGORY_LABELS[gig.category]}
                </span>
                <p className="font-semibold">{gig.title}</p>
                <p className="text-xs text-foreground/50">
                  {gig.schoolName} &middot; {gig.district} District
                  {gig.budget ? ` · Budget ₹${gig.budget.toFixed(0)}` : ""}
                </p>
              </div>
              <span className="text-xs text-foreground/50">{gig._count.offers} offer(s)</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
