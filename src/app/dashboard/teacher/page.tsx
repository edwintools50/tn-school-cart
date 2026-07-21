import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { TEACHING_SUBJECT_LABELS } from "@/lib/constants";

const applicationStatusColor: Record<string, string> = {
  PENDING: "bg-gray-100 text-gray-700",
  HIRED: "bg-green-100 text-green-700",
  REJECTED: "bg-red-100 text-red-700",
  WITHDRAWN: "bg-gray-100 text-gray-500",
};

export default async function TeacherDashboardPage() {
  const user = await requireUser(["TEACHER"]);

  const applications = await db.jobApplication.findMany({
    where: { teacherId: user.id },
    include: { jobVacancy: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 w-full">
      <div className="flex items-center justify-between mb-1 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">Teacher dashboard</h1>
          <p className="text-sm text-foreground/60">
            {user.qualification}
            {user.subjectSpecialization ? ` · ${TEACHING_SUBJECT_LABELS[user.subjectSpecialization]}` : ""}
            {typeof user.experienceYears === "number" ? ` · ${user.experienceYears} yrs experience` : ""}
            {user.serviceArea ? ` · Prefers ${user.serviceArea}` : ""}
          </p>
        </div>
        <Link
          href="/jobs"
          className="bg-brand text-white font-semibold rounded-md px-4 py-2 text-sm hover:bg-brand-dark"
        >
          Browse job vacancies
        </Link>
      </div>

      {user.status !== "APPROVED" && (
        <div className="bg-amber-50 border border-amber-200 rounded-md px-4 py-3 text-sm text-amber-800 my-6">
          Your account is <strong>{user.status.toLowerCase()}</strong>. You can
          browse vacancies now, but you&apos;ll be able to apply once your
          account is approved by the TN School Cart admin team.
        </div>
      )}

      <h2 className="font-semibold mt-8 mb-3">My applications</h2>

      {applications.length === 0 ? (
        <div className="card p-8 text-center">
          <p className="text-sm text-foreground/60 mb-4">
            You haven&apos;t applied to any job vacancies yet.
          </p>
          <Link href="/jobs" className="text-brand font-semibold hover:underline">
            Browse open vacancies &rarr;
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {applications.map((application) => (
            <Link
              key={application.id}
              href={`/jobs/${application.jobVacancyId}`}
              className="card p-4 flex items-center justify-between gap-4 flex-wrap hover:border-brand transition-colors"
            >
              <div>
                <span className="text-xs font-semibold text-accent uppercase tracking-wide">
                  {TEACHING_SUBJECT_LABELS[application.jobVacancy.subject]}
                </span>
                <p className="font-semibold">{application.jobVacancy.title}</p>
                <p className="text-xs text-foreground/50">{application.jobVacancy.schoolName}</p>
              </div>
              <span
                className={`text-xs font-semibold px-2 py-1 rounded-full ${applicationStatusColor[application.status]}`}
              >
                {application.status}
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
