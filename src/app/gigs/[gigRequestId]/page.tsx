import { notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { GIG_CATEGORY_LABELS } from "@/lib/constants";
import { whatsappLink } from "@/lib/whatsapp";
import GigOfferForm from "@/components/GigOfferForm";
import { acceptOfferAction, updateGigRequestStatusAction } from "../actions";

const statusColor: Record<string, string> = {
  OPEN: "bg-blue-100 text-blue-700",
  ASSIGNED: "bg-indigo-100 text-indigo-700",
  IN_PROGRESS: "bg-amber-100 text-amber-700",
  COMPLETED: "bg-green-100 text-green-700",
  CANCELLED: "bg-red-100 text-red-700",
};

const offerStatusColor: Record<string, string> = {
  PENDING: "bg-gray-100 text-gray-700",
  ACCEPTED: "bg-green-100 text-green-700",
  REJECTED: "bg-red-100 text-red-700",
  WITHDRAWN: "bg-gray-100 text-gray-500",
};

const nextStatus: Record<string, { value: string; label: string }[]> = {
  ASSIGNED: [
    { value: "IN_PROGRESS", label: "Mark in progress" },
    { value: "CANCELLED", label: "Cancel job" },
  ],
  IN_PROGRESS: [
    { value: "COMPLETED", label: "Mark completed" },
    { value: "CANCELLED", label: "Cancel job" },
  ],
  OPEN: [{ value: "CANCELLED", label: "Cancel request" }],
};

export default async function GigRequestDetailPage({
  params,
}: {
  params: Promise<{ gigRequestId: string }>;
}) {
  const { gigRequestId } = await params;
  const user = await getCurrentUser();

  const gigRequest = await db.gigRequest.findUnique({
    where: { id: gigRequestId },
    include: {
      principal: true,
      offers: { include: { worker: true }, orderBy: { createdAt: "asc" } },
    },
  });

  if (!gigRequest) notFound();

  const isOwner = user?.role === "PRINCIPAL" && user.id === gigRequest.principalId;
  const myOffer = user?.role === "WORKER"
    ? gigRequest.offers.find((o) => o.workerId === user.id)
    : undefined;

  const acceptedOffer = gigRequest.offers.find((o) => o.status === "ACCEPTED");
  const isAssignedWorker = user?.role === "WORKER" && acceptedOffer?.workerId === user.id;
  const canCoordinateOnWhatsApp =
    acceptedOffer && (isOwner || isAssignedWorker) && gigRequest.status !== "OPEN";
  const whatsappHref = canCoordinateOnWhatsApp
    ? whatsappLink(
        `Hi, this is regarding the "${gigRequest.title}" job at ${gigRequest.schoolName} (Status: ${gigRequest.status.replace("_", " ")}). ${
          gigRequest.status === "COMPLETED"
            ? `I'd like to confirm completion and payment of ₹${acceptedOffer.quotedPrice.toFixed(2)}.`
            : "Let's coordinate the work."
        }`
      )
    : null;

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 w-full">
      <div className="flex items-start justify-between gap-4 flex-wrap mb-1">
        <div>
          <span className="text-xs font-semibold text-accent uppercase tracking-wide">
            {GIG_CATEGORY_LABELS[gigRequest.category]}
          </span>
          <h1 className="text-2xl font-bold">{gigRequest.title}</h1>
        </div>
        <div className="flex items-center gap-2">
          {whatsappHref && (
            <a
              href={whatsappHref}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-[#25D366] text-white text-sm font-semibold rounded-md px-3 py-1.5 hover:brightness-95 transition"
            >
              Chat on WhatsApp
            </a>
          )}
          <span className={`text-xs font-semibold px-2 py-1 rounded-full ${statusColor[gigRequest.status]}`}>
            {gigRequest.status.replace("_", " ")}
          </span>
        </div>
      </div>

      <p className="text-sm text-foreground/60 mb-6">
        {gigRequest.schoolName} &middot; {gigRequest.address}, {gigRequest.district} District
        {gigRequest.budget ? ` · Budget ₹${gigRequest.budget.toFixed(0)}` : ""}
        {gigRequest.preferredDate
          ? ` · Preferred ${new Date(gigRequest.preferredDate).toLocaleDateString("en-IN")}`
          : ""}
      </p>

      <div className="card p-4 mb-6">
        <h2 className="font-semibold mb-2 text-sm">Job description</h2>
        <p className="text-sm leading-relaxed">{gigRequest.description}</p>
      </div>

      {isOwner && (
        <div className="mb-6 flex gap-3 flex-wrap">
          {(nextStatus[gigRequest.status] ?? []).map((t) => (
            <form key={t.value} action={updateGigRequestStatusAction}>
              <input type="hidden" name="gigRequestId" value={gigRequest.id} />
              <input type="hidden" name="status" value={t.value} />
              <button
                type="submit"
                className="border border-border font-semibold rounded-md px-4 py-2 text-sm hover:border-brand"
              >
                {t.label}
              </button>
            </form>
          ))}
        </div>
      )}

      {user?.role === "WORKER" && gigRequest.status === "OPEN" && (
        <div className="mb-6">
          <GigOfferForm
            gigRequestId={gigRequest.id}
            existing={myOffer ? { quotedPrice: myOffer.quotedPrice, message: myOffer.message } : null}
          />
        </div>
      )}

      <h2 className="font-semibold mb-3">
        Offers {isOwner ? `(${gigRequest.offers.length})` : ""}
      </h2>

      {isOwner ? (
        gigRequest.offers.length === 0 ? (
          <p className="text-sm text-foreground/60">No offers yet.</p>
        ) : (
          <div className="space-y-3">
            {gigRequest.offers.map((offer) => (
              <div key={offer.id} className="card p-4">
                <div className="flex items-center justify-between gap-4 flex-wrap">
                  <div>
                    <p className="font-semibold">
                      {offer.worker.businessName ?? offer.worker.name}
                    </p>
                    <p className="text-xs text-foreground/50">{offer.worker.serviceArea}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-bold">&#8377;{offer.quotedPrice.toFixed(2)}</span>
                    <span
                      className={`text-xs font-semibold px-2 py-1 rounded-full ${offerStatusColor[offer.status]}`}
                    >
                      {offer.status}
                    </span>
                  </div>
                </div>
                <p className="text-sm mt-2">{offer.message}</p>
                {gigRequest.status === "OPEN" && offer.status === "PENDING" && (
                  <form action={acceptOfferAction} className="mt-3">
                    <input type="hidden" name="offerId" value={offer.id} />
                    <button
                      type="submit"
                      className="bg-brand text-white font-semibold rounded-md px-4 py-2 text-sm hover:bg-brand-dark"
                    >
                      Accept this offer
                    </button>
                  </form>
                )}
              </div>
            ))}
          </div>
        )
      ) : (
        <p className="text-sm text-foreground/60">
          {gigRequest.offers.length} worker(s) have made an offer on this job.
        </p>
      )}
    </div>
  );
}
