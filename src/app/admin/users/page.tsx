import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { ROLE_LABELS } from "@/lib/constants";
import {
  approveUserAction,
  rejectUserAction,
  suspendUserAction,
  reinstateUserAction,
} from "../actions";

const statusColor: Record<string, string> = {
  PENDING: "bg-amber-100 text-amber-700",
  APPROVED: "bg-green-100 text-green-700",
  REJECTED: "bg-red-100 text-red-700",
  SUSPENDED: "bg-gray-300 text-gray-700",
};

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; role?: string }>;
}) {
  await requireAdmin();
  const { status, role } = await searchParams;

  const users = await db.user.findMany({
    where: {
      role: { not: "ADMIN" },
      ...(status ? { status: status as "PENDING" | "APPROVED" | "REJECTED" | "SUSPENDED" } : {}),
      ...(role ? { role: role as "PRINCIPAL" | "SUPPLIER" | "WORKER" } : {}),
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 w-full">
      <h1 className="text-2xl font-bold mb-6">Manage users</h1>

      <form className="flex flex-wrap gap-3 mb-6" method="get">
        <select name="status" defaultValue={status ?? ""} className="rounded-md border border-border px-3 py-2 text-sm">
          <option value="">All statuses</option>
          <option value="PENDING">Pending</option>
          <option value="APPROVED">Approved</option>
          <option value="REJECTED">Rejected</option>
          <option value="SUSPENDED">Suspended</option>
        </select>
        <select name="role" defaultValue={role ?? ""} className="rounded-md border border-border px-3 py-2 text-sm">
          <option value="">All roles</option>
          <option value="PRINCIPAL">Principal</option>
          <option value="SUPPLIER">Supplier</option>
          <option value="WORKER">Gig Worker</option>
        </select>
        <button type="submit" className="bg-brand text-white text-sm font-semibold rounded-md px-4 py-2 hover:bg-brand-dark">
          Filter
        </button>
      </form>

      {users.length === 0 ? (
        <p className="text-sm text-foreground/60">No users found.</p>
      ) : (
        <div className="space-y-3">
          {users.map((u) => (
            <div key={u.id} className="card p-4 flex items-center justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-3">
                {u.verificationPhotoUrl && (
                  <a href={u.verificationPhotoUrl} target="_blank" rel="noopener noreferrer">
                    <img
                      src={u.verificationPhotoUrl}
                      alt="School verification photo"
                      className="h-14 w-14 object-cover rounded-md border border-border"
                    />
                  </a>
                )}
                <div>
                  <p className="font-semibold">
                    {u.name} <span className="text-xs font-normal text-foreground/50">({ROLE_LABELS[u.role]})</span>
                  </p>
                  <p className="text-xs text-foreground/50">
                    {u.email} &middot; {u.phone}
                  </p>
                  <p className="text-xs text-foreground/50">
                    {u.role === "PRINCIPAL" ? `${u.schoolName}, ${u.district}` : `${u.businessName}, ${u.serviceArea}`}
                  </p>
                  {u.status === "REJECTED" && u.rejectionNote && (
                    <p className="text-xs text-red-600 mt-1">Reason: {u.rejectionNote}</p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className={`text-xs font-semibold px-2 py-1 rounded-full ${statusColor[u.status]}`}>
                  {u.status}
                </span>
                {u.status === "PENDING" && (
                  <>
                    <form action={approveUserAction}>
                      <input type="hidden" name="userId" value={u.id} />
                      <button type="submit" className="text-xs font-semibold text-accent hover:underline">
                        Approve
                      </button>
                    </form>
                    <form action={rejectUserAction} className="flex items-center gap-1">
                      <input type="hidden" name="userId" value={u.id} />
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
                {u.status === "APPROVED" && (
                  <form action={suspendUserAction}>
                    <input type="hidden" name="userId" value={u.id} />
                    <button type="submit" className="text-xs font-semibold text-red-600 hover:underline">
                      Suspend
                    </button>
                  </form>
                )}
                {(u.status === "SUSPENDED" || u.status === "REJECTED") && (
                  <form action={reinstateUserAction}>
                    <input type="hidden" name="userId" value={u.id} />
                    <button type="submit" className="text-xs font-semibold text-accent hover:underline">
                      Reinstate
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
