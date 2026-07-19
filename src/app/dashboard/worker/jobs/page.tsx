import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { GIG_CATEGORY_LABELS } from "@/lib/constants";

const offerStatusColor: Record<string, string> = {
  PENDING: "bg-gray-100 text-gray-700",
  ACCEPTED: "bg-green-100 text-green-700",
  REJECTED: "bg-red-100 text-red-700",
  WITHDRAWN: "bg-gray-100 text-gray-500",
};

const requestStatusColor: Record<string, string> = {
  OPEN: "bg-blue-100 text-blue-700",
  ASSIGNED: "bg-indigo-100 text-indigo-700",
  IN_PROGRESS: "bg-amber-100 text-amber-700",
  COMPLETED: "bg-green-100 text-green-700",
  CANCELLED: "bg-red-100 text-red-700",
};

export default async function WorkerJobsPage() {
  const user = await requireUser(["WORKER"]);

  const offers = await db.gigOffer.findMany({
    where: { workerId: user.id },
    include: { gigRequest: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 w-full">
      <h1 className="text-2xl font-bold mb-6">My offers & jobs</h1>

      {offers.length === 0 ? (
        <div className="card p-8 text-center">
          <p className="text-sm text-foreground/60 mb-4">
            You haven&apos;t submitted any offers yet.
          </p>
          <Link href="/gigs" className="text-brand font-semibold hover:underline">
            Browse open gig requests &rarr;
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {offers.map((offer) => (
            <Link
              key={offer.id}
              href={`/gigs/${offer.gigRequestId}`}
              className="card p-4 flex items-center justify-between gap-4 flex-wrap hover:border-brand transition-colors"
            >
              <div>
                <span className="text-xs font-semibold text-accent uppercase tracking-wide">
                  {GIG_CATEGORY_LABELS[offer.gigRequest.category]}
                </span>
                <p className="font-semibold">{offer.gigRequest.title}</p>
                <p className="text-xs text-foreground/50">
                  {offer.gigRequest.schoolName} &middot; Your quote &#8377;
                  {offer.quotedPrice.toFixed(2)}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className={`text-xs font-semibold px-2 py-1 rounded-full ${offerStatusColor[offer.status]}`}
                >
                  Offer: {offer.status}
                </span>
                <span
                  className={`text-xs font-semibold px-2 py-1 rounded-full ${requestStatusColor[offer.gigRequest.status]}`}
                >
                  Job: {offer.gigRequest.status.replace("_", " ")}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
