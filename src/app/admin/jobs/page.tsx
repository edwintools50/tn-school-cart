import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { TEACHING_SUBJECT_LABELS } from "@/lib/constants";

const statusColor: Record<string, string> = {
  OPEN: "bg-blue-100 text-blue-700",
  FILLED: "bg-green-100 text-green-700",
  CLOSED: "bg-red-100 text-red-700",
};

export default async function AdminJobsPage() {
  await requireAdmin();

  const jobVacancies = await db.jobVacancy.findMany({
    include: { principal: true, _count: { select: { applications: true } } },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 w-full">
      <h1 className="text-2xl font-bold mb-6">All job vacancies</h1>

      {jobVacancies.length === 0 ? (
        <p className="text-sm text-foreground/60">No job vacancies yet.</p>
      ) : (
        <div className="space-y-3">
          {jobVacancies.map((job) => (
            <div key={job.id} className="card p-4 flex items-center justify-between gap-4 flex-wrap">
              <div>
                <span className="text-xs font-semibold text-accent uppercase tracking-wide">
                  {TEACHING_SUBJECT_LABELS[job.subject]}
                </span>
                <p className="font-semibold">{job.title}</p>
                <p className="text-xs text-foreground/50">
                  {job.principal.name} &middot; {job.schoolName} ({job.district}) &middot;{" "}
                  {job._count.applications} application(s)
                </p>
              </div>
              <span className={`text-xs font-semibold px-2 py-1 rounded-full ${statusColor[job.status]}`}>
                {job.status}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
