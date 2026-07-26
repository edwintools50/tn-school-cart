import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { TEACHING_SUBJECT_LABELS } from "@/lib/constants";

const statusColor: Record<string, string> = {
  OPEN: "bg-blue-100 text-blue-700",
  FILLED: "bg-green-100 text-green-700",
  CLOSED: "bg-red-100 text-red-700",
};

export default async function MyJobVacanciesPage() {
  const user = await requireUser(["PRINCIPAL", "COACHING_CENTRE"]);

  const jobVacancies = await db.jobVacancy.findMany({
    where: { principalId: user.id },
    include: { _count: { select: { applications: true } } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 w-full">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <h1 className="text-2xl font-bold">My job vacancies</h1>
        <Link
          href="/jobs/new"
          className="bg-brand text-white font-semibold rounded-md px-4 py-2 text-sm hover:bg-brand-dark"
        >
          + Post a job vacancy
        </Link>
      </div>

      {jobVacancies.length === 0 ? (
        <div className="card p-8 text-center">
          <p className="text-sm text-foreground/60 mb-4">
            You haven&apos;t posted any job vacancies yet.
          </p>
          <Link href="/jobs/new" className="text-brand font-semibold hover:underline">
            Post your first vacancy &rarr;
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {jobVacancies.map((job) => (
            <Link
              key={job.id}
              href={`/jobs/${job.id}`}
              className="card p-4 flex items-center justify-between gap-4 flex-wrap hover:border-brand transition-colors"
            >
              <div>
                <span className="text-xs font-semibold text-accent uppercase tracking-wide">
                  {TEACHING_SUBJECT_LABELS[job.subject]}
                </span>
                <p className="font-semibold">{job.title}</p>
                <p className="text-xs text-foreground/50">{job._count.applications} application(s)</p>
              </div>
              <span className={`text-xs font-semibold px-2 py-1 rounded-full ${statusColor[job.status]}`}>
                {job.status}
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
