import Link from "next/link";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import {
  TEACHING_SUBJECT_GROUPS,
  TEACHING_SUBJECT_LABELS,
  TN_DISTRICTS,
  EMPLOYMENT_TYPE_LABELS,
} from "@/lib/constants";
import type { TeachingSubject } from "@/generated/prisma/enums";

export default async function JobsPage({
  searchParams,
}: {
  searchParams: Promise<{ subject?: string; district?: string }>;
}) {
  const { subject, district } = await searchParams;
  const user = await getCurrentUser();

  const jobVacancies = await db.jobVacancy.findMany({
    where: {
      status: "OPEN",
      ...(subject ? { subject: subject as TeachingSubject } : {}),
      ...(district ? { district } : {}),
    },
    include: { _count: { select: { applications: true } } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 w-full">
      <div className="flex items-center justify-between mb-1 flex-wrap gap-3">
        <h1 className="text-2xl font-bold">Teaching job vacancies</h1>
        {(user?.role === "PRINCIPAL" || user?.role === "COACHING_CENTRE") && (
          <Link
            href="/jobs/new"
            className="bg-brand text-white font-semibold rounded-md px-4 py-2 text-sm hover:bg-brand-dark"
          >
            + Post a job vacancy
          </Link>
        )}
      </div>
      <p className="text-sm text-foreground/60 mb-6">
        Teaching positions posted by schools and coaching centres across Tamil Nadu.
      </p>

      <form className="flex flex-wrap gap-3 mb-6" method="get">
        <select
          name="subject"
          defaultValue={subject ?? ""}
          className="rounded-md border border-border px-3 py-2 text-sm"
        >
          <option value="">All subjects</option>
          {TEACHING_SUBJECT_GROUPS.map((group) => (
            <optgroup key={group.label} label={group.label}>
              {group.keys.map((key) => (
                <option key={key} value={key}>
                  {TEACHING_SUBJECT_LABELS[key]}
                </option>
              ))}
            </optgroup>
          ))}
        </select>
        <select
          name="district"
          defaultValue={district ?? ""}
          className="rounded-md border border-border px-3 py-2 text-sm"
        >
          <option value="">All districts</option>
          {TN_DISTRICTS.map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </select>
        <button
          type="submit"
          className="bg-brand text-white text-sm font-semibold rounded-md px-4 py-2 hover:bg-brand-dark"
        >
          Filter
        </button>
      </form>

      {jobVacancies.length === 0 ? (
        <p className="text-sm text-foreground/60">No open job vacancies found.</p>
      ) : (
        <div className="space-y-3">
          {jobVacancies.map((job) => (
            <Link
              key={job.id}
              href={`/jobs/${job.id}`}
              className="card p-4 flex items-center justify-between gap-4 flex-wrap hover:border-accent transition-colors"
            >
              <div>
                <span className="text-xs font-semibold text-accent uppercase tracking-wide">
                  {TEACHING_SUBJECT_LABELS[job.subject]} &middot; {EMPLOYMENT_TYPE_LABELS[job.employmentType]}
                </span>
                <p className="font-semibold">{job.title}</p>
                <p className="text-xs text-foreground/50">
                  {job.schoolName} &middot; {job.district} District
                  {job.salaryRange ? ` · ${job.salaryRange}` : ""}
                </p>
              </div>
              <span className="text-xs text-foreground/50">{job._count.applications} application(s)</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
