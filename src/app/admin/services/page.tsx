import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { GIG_CATEGORY_LABELS } from "@/lib/constants";
import { approveServiceAction, rejectServiceAction } from "../actions";

const statusColor: Record<string, string> = {
  PENDING: "bg-amber-100 text-amber-700",
  APPROVED: "bg-green-100 text-green-700",
  REJECTED: "bg-red-100 text-red-700",
  DELISTED: "bg-gray-200 text-gray-600",
};

export default async function AdminServicesPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  await requireAdmin();
  const { status } = await searchParams;

  const services = await db.gigService.findMany({
    where: status ? { status: status as "PENDING" | "APPROVED" | "REJECTED" | "DELISTED" } : {},
    include: { worker: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 w-full">
      <h1 className="text-2xl font-bold mb-6">Moderate gig services</h1>

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

      {services.length === 0 ? (
        <p className="text-sm text-foreground/60">No services found.</p>
      ) : (
        <div className="space-y-3">
          {services.map((s) => (
            <div key={s.id} className="card p-4 flex items-center justify-between gap-4 flex-wrap">
              <div>
                <p className="font-semibold">{s.title}</p>
                <p className="text-xs text-foreground/50">
                  {GIG_CATEGORY_LABELS[s.category]} &middot; {s.serviceArea} &middot; by{" "}
                  {s.worker.businessName ?? s.worker.name}
                </p>
                <p className="text-xs text-foreground/60 mt-1 max-w-xl">{s.description}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className={`text-xs font-semibold px-2 py-1 rounded-full ${statusColor[s.status]}`}>
                  {s.status}
                </span>
                {s.status === "PENDING" && (
                  <>
                    <form action={approveServiceAction}>
                      <input type="hidden" name="serviceId" value={s.id} />
                      <button type="submit" className="text-xs font-semibold text-accent hover:underline">
                        Approve
                      </button>
                    </form>
                    <form action={rejectServiceAction} className="flex items-center gap-1">
                      <input type="hidden" name="serviceId" value={s.id} />
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
