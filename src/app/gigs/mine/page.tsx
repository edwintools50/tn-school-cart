import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { GIG_CATEGORY_LABELS } from "@/lib/constants";

const statusColor: Record<string, string> = {
  OPEN: "bg-blue-100 text-blue-700",
  ASSIGNED: "bg-indigo-100 text-indigo-700",
  IN_PROGRESS: "bg-amber-100 text-amber-700",
  COMPLETED: "bg-green-100 text-green-700",
  CANCELLED: "bg-red-100 text-red-700",
};

export default async function MyGigRequestsPage() {
  const user = await requireUser(["PRINCIPAL"]);

  const gigRequests = await db.gigRequest.findMany({
    where: { principalId: user.id },
    include: { _count: { select: { offers: true } } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 w-full">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <h1 className="text-2xl font-bold">My gig requests</h1>
        <Link
          href="/gigs/new"
          className="bg-brand text-white font-semibold rounded-md px-4 py-2 text-sm hover:bg-brand-dark"
        >
          + Post a gig request
        </Link>
      </div>

      {gigRequests.length === 0 ? (
        <div className="card p-8 text-center">
          <p className="text-sm text-foreground/60 mb-4">
            You haven&apos;t posted any gig requests yet.
          </p>
          <Link href="/gigs/new" className="text-brand font-semibold hover:underline">
            Post your first request &rarr;
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {gigRequests.map((gig) => (
            <Link
              key={gig.id}
              href={`/gigs/${gig.id}`}
              className="card p-4 flex items-center justify-between gap-4 flex-wrap hover:border-brand transition-colors"
            >
              <div>
                <span className="text-xs font-semibold text-accent uppercase tracking-wide">
                  {GIG_CATEGORY_LABELS[gig.category]}
                </span>
                <p className="font-semibold">{gig.title}</p>
                <p className="text-xs text-foreground/50">{gig._count.offers} offer(s)</p>
              </div>
              <span className={`text-xs font-semibold px-2 py-1 rounded-full ${statusColor[gig.status]}`}>
                {gig.status.replace("_", " ")}
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
