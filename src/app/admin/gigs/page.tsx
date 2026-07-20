import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { GIG_CATEGORY_LABELS } from "@/lib/constants";

const statusColor: Record<string, string> = {
  OPEN: "bg-blue-100 text-blue-700",
  ASSIGNED: "bg-indigo-100 text-indigo-700",
  IN_PROGRESS: "bg-amber-100 text-amber-700",
  COMPLETED: "bg-green-100 text-green-700",
  CANCELLED: "bg-red-100 text-red-700",
};

export default async function AdminGigsPage() {
  await requireAdmin();

  const gigRequests = await db.gigRequest.findMany({
    include: { principal: true, _count: { select: { offers: true } } },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 w-full">
      <h1 className="text-2xl font-bold mb-6">All gig requests</h1>

      {gigRequests.length === 0 ? (
        <p className="text-sm text-foreground/60">No gig requests yet.</p>
      ) : (
        <div className="space-y-3">
          {gigRequests.map((gig) => (
            <div key={gig.id} className="card p-4 flex items-center justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-3">
                {(gig.photoUrl || gig.completionPhotoUrl) && (
                  <div className="flex gap-1">
                    {gig.photoUrl && (
                      <a href={gig.photoUrl} target="_blank" rel="noopener noreferrer">
                        <img
                          src={gig.photoUrl}
                          alt="Job photo"
                          className="h-14 w-14 object-cover rounded-md border border-border"
                        />
                      </a>
                    )}
                    {gig.completionPhotoUrl && (
                      <a href={gig.completionPhotoUrl} target="_blank" rel="noopener noreferrer">
                        <img
                          src={gig.completionPhotoUrl}
                          alt="Completion proof"
                          className="h-14 w-14 object-cover rounded-md border border-border"
                        />
                      </a>
                    )}
                  </div>
                )}
                <div>
                  <span className="text-xs font-semibold text-accent uppercase tracking-wide">
                    {GIG_CATEGORY_LABELS[gig.category]}
                  </span>
                  <p className="font-semibold">{gig.title}</p>
                  <p className="text-xs text-foreground/50">
                    {gig.principal.name} &middot; {gig.schoolName} ({gig.district}) &middot; {gig._count.offers} offer(s)
                  </p>
                </div>
              </div>
              <span className={`text-xs font-semibold px-2 py-1 rounded-full ${statusColor[gig.status]}`}>
                {gig.status.replace("_", " ")}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
