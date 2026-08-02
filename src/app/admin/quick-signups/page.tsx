import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  TEACHING_SUBJECT_LABELS,
  GIG_CATEGORY_LABELS,
  PRODUCT_CATEGORY_LABELS,
} from "@/lib/constants";
import { approveQuickSignupAction, rejectQuickSignupAction } from "../actions";

const statusColor: Record<string, string> = {
  PENDING_VERIFICATION: "bg-gray-200 text-gray-600",
  PENDING_APPROVAL: "bg-amber-100 text-amber-700",
  APPROVED: "bg-green-100 text-green-700",
  REJECTED: "bg-red-100 text-red-700",
};

const roleLabel: Record<string, string> = {
  TEACHER: "Teacher",
  WORKER: "Gig Worker",
  SUPPLIER: "Vendor",
};

export default async function AdminQuickSignupsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  await requireAdmin();
  const { status } = await searchParams;

  const signups = await db.quickSignup.findMany({
    where: {
      status: status
        ? (status as "PENDING_VERIFICATION" | "PENDING_APPROVAL" | "APPROVED" | "REJECTED")
        : { in: ["PENDING_APPROVAL", "APPROVED", "REJECTED"] },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 w-full">
      <h1 className="text-2xl font-bold mb-1">Quick Signups</h1>
      <p className="text-sm text-foreground/60 mb-6">
        Submissions from the /join/teacher, /join/worker, and /join/vendor recruitment forms.
        Unverified sign-ups (still waiting on their email code) aren&apos;t shown here.
      </p>

      <form className="flex flex-wrap gap-3 mb-6" method="get">
        <select name="status" defaultValue={status ?? ""} className="rounded-md border border-border px-3 py-2 text-sm">
          <option value="">Pending, approved & rejected</option>
          <option value="PENDING_APPROVAL">Pending review</option>
          <option value="APPROVED">Approved</option>
          <option value="REJECTED">Rejected</option>
        </select>
        <button type="submit" className="bg-brand text-white text-sm font-semibold rounded-md px-4 py-2 hover:bg-brand-dark">
          Filter
        </button>
      </form>

      {signups.length === 0 ? (
        <p className="text-sm text-foreground/60">No quick signups found.</p>
      ) : (
        <div className="space-y-3">
          {signups.map((s) => (
            <div key={s.id} className="card p-4 flex items-start justify-between gap-4 flex-wrap">
              <div>
                <p className="font-semibold">
                  {s.name} <span className="text-xs font-normal text-foreground/50">({roleLabel[s.role] ?? s.role})</span>
                </p>
                <p className="text-xs text-foreground/50">
                  {s.email} &middot; {s.phone} &middot; {s.district}
                </p>
                <p className="text-xs text-foreground/50 mt-1">
                  {s.role === "TEACHER" &&
                    `${s.qualification ?? "-"}${s.subjectSpecialization ? `, ${TEACHING_SUBJECT_LABELS[s.subjectSpecialization]}` : ""}, ${s.experienceYears ?? 0} yrs experience`}
                  {s.role === "WORKER" &&
                    `${s.businessName} — ${s.gigCategory ? GIG_CATEGORY_LABELS[s.gigCategory] : ""}`}
                  {s.role === "SUPPLIER" &&
                    `${s.businessName} — ${s.productCategory ? PRODUCT_CATEGORY_LABELS[s.productCategory] : ""}`}
                </p>
                {(s.role === "WORKER" || s.role === "SUPPLIER") && s.offeringTitle && (
                  <div className="mt-2 rounded-md bg-background border border-border p-2">
                    <p className="text-xs font-semibold">{s.offeringTitle}</p>
                    <p className="text-xs text-foreground/60">{s.offeringDescription}</p>
                    <p className="text-xs text-foreground/50 mt-0.5">
                      {s.offeringPrice ? `₹${s.offeringPrice}` : "Quote on request"}
                      {s.offeringUnit ? ` / ${s.offeringUnit}` : ""}
                      {s.offeringStock ? ` · ${s.offeringStock} in stock` : ""}
                    </p>
                  </div>
                )}
                {s.status === "REJECTED" && s.rejectionNote && (
                  <p className="text-xs text-red-600 mt-1">Reason: {s.rejectionNote}</p>
                )}
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <span className={`text-xs font-semibold px-2 py-1 rounded-full ${statusColor[s.status]}`}>
                  {s.status.replace("_", " ")}
                </span>
                {s.status === "PENDING_APPROVAL" && (
                  <>
                    <form action={approveQuickSignupAction}>
                      <input type="hidden" name="id" value={s.id} />
                      <button type="submit" className="text-xs font-semibold text-accent hover:underline">
                        Approve &amp; list
                      </button>
                    </form>
                    <form action={rejectQuickSignupAction} className="flex items-center gap-1">
                      <input type="hidden" name="id" value={s.id} />
                      <input
                        type="text"
                        name="note"
                        placeholder="Reason (optional)"
                        className="rounded-md border border-border px-2 py-1 text-xs w-32"
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
