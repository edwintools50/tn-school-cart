import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { GIG_CATEGORY_LABELS } from "@/lib/constants";
import { delistServiceAction } from "./actions";

const statusColor: Record<string, string> = {
  PENDING: "bg-amber-100 text-amber-700",
  APPROVED: "bg-green-100 text-green-700",
  REJECTED: "bg-red-100 text-red-700",
  DELISTED: "bg-gray-200 text-gray-600",
};

export default async function WorkerDashboardPage() {
  const user = await requireUser(["WORKER"]);

  const services = await db.gigService.findMany({
    where: { workerId: user.id },
    orderBy: { createdAt: "desc" },
  });

  const activeOfferCount = await db.gigOffer.count({
    where: { workerId: user.id, status: "PENDING" },
  });

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 w-full">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">Gig worker dashboard</h1>
          <p className="text-sm text-foreground/60">{user.businessName ?? user.name}</p>
        </div>
        <div className="flex gap-3">
          <Link
            href="/dashboard/worker/jobs"
            className="border border-border font-semibold rounded-md px-4 py-2 text-sm hover:border-brand relative"
          >
            My offers & jobs
            {activeOfferCount > 0 && (
              <span className="ml-1 inline-flex items-center justify-center bg-accent text-white text-xs rounded-full h-5 min-w-5 px-1">
                {activeOfferCount}
              </span>
            )}
          </Link>
          <Link
            href="/gigs"
            className="border border-border font-semibold rounded-md px-4 py-2 text-sm hover:border-brand"
          >
            Browse open gigs
          </Link>
          <Link
            href="/dashboard/worker/services/new"
            className="bg-brand text-white font-semibold rounded-md px-4 py-2 text-sm hover:bg-brand-dark"
          >
            + Add service
          </Link>
        </div>
      </div>

      {user.status !== "APPROVED" && (
        <div className="bg-amber-50 border border-amber-200 rounded-md px-4 py-3 text-sm text-amber-800 mb-6">
          Your account is <strong>{user.status.toLowerCase()}</strong>. You can
          still prepare your service listings, but they will only be reviewed
          once your account is approved by the TN School Cart admin team.
        </div>
      )}

      {services.length === 0 ? (
        <div className="card p-8 text-center">
          <p className="text-sm text-foreground/60 mb-4">
            You haven&apos;t listed any services yet.
          </p>
          <Link
            href="/dashboard/worker/services/new"
            className="text-brand font-semibold hover:underline"
          >
            List your first service &rarr;
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {services.map((service) => (
            <div key={service.id} className="card p-4 flex items-center justify-between gap-4 flex-wrap">
              <div>
                <p className="font-semibold">{service.title}</p>
                <p className="text-xs text-foreground/50">
                  {GIG_CATEGORY_LABELS[service.category]} &middot; {service.serviceArea} &middot;{" "}
                  {service.priceType === "QUOTE"
                    ? "Quote per job"
                    : `₹${service.price?.toFixed(2)} ${service.priceType === "HOURLY" ? "/ hr" : ""}`}
                </p>
                {service.status === "REJECTED" && service.rejectionNote && (
                  <p className="text-xs text-red-600 mt-1">Rejected: {service.rejectionNote}</p>
                )}
              </div>
              <div className="flex items-center gap-3">
                <span
                  className={`text-xs font-semibold px-2 py-1 rounded-full ${statusColor[service.status]}`}
                >
                  {service.status}
                </span>
                <Link
                  href={`/dashboard/worker/services/${service.id}/edit`}
                  className="text-xs font-semibold text-brand hover:underline"
                >
                  Edit
                </Link>
                {service.status !== "DELISTED" && (
                  <form action={delistServiceAction}>
                    <input type="hidden" name="serviceId" value={service.id} />
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
