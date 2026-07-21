import { notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { TEACHING_SUBJECT_LABELS, EMPLOYMENT_TYPE_LABELS } from "@/lib/constants";
import JobApplicationForm from "@/components/JobApplicationForm";
import { hireApplicationAction, updateJobVacancyStatusAction } from "../actions";

const statusColor: Record<string, string> = {
  OPEN: "bg-blue-100 text-blue-700",
  FILLED: "bg-green-100 text-green-700",
  CLOSED: "bg-red-100 text-red-700",
};

const applicationStatusColor: Record<string, string> = {
  PENDING: "bg-gray-100 text-gray-700",
  HIRED: "bg-green-100 text-green-700",
  REJECTED: "bg-red-100 text-red-700",
  WITHDRAWN: "bg-gray-100 text-gray-500",
};

export default async function JobVacancyDetailPage({
  params,
}: {
  params: Promise<{ jobVacancyId: string }>;
}) {
  const { jobVacancyId } = await params;
  const user = await getCurrentUser();

  const jobVacancy = await db.jobVacancy.findUnique({
    where: { id: jobVacancyId },
    include: {
      principal: true,
      applications: { include: { teacher: true }, orderBy: { createdAt: "asc" } },
    },
  });

  if (!jobVacancy) notFound();

  const isOwner = user?.role === "PRINCIPAL" && user.id === jobVacancy.principalId;
  const myApplication = user?.role === "TEACHER"
    ? jobVacancy.applications.find((a) => a.teacherId === user.id)
    : undefined;

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 w-full">
      <div className="flex items-start justify-between gap-4 flex-wrap mb-1">
        <div>
          <span className="text-xs font-semibold text-accent uppercase tracking-wide">
            {TEACHING_SUBJECT_LABELS[jobVacancy.subject]} &middot; {EMPLOYMENT_TYPE_LABELS[jobVacancy.employmentType]}
          </span>
          <h1 className="text-2xl font-bold">{jobVacancy.title}</h1>
        </div>
        <span className={`text-xs font-semibold px-2 py-1 rounded-full ${statusColor[jobVacancy.status]}`}>
          {jobVacancy.status}
        </span>
      </div>

      <p className="text-sm text-foreground/60 mb-1">
        {jobVacancy.schoolName}
        {jobVacancy.udiseNumber ? ` (UDISE: ${jobVacancy.udiseNumber})` : ""} &middot;{" "}
        {jobVacancy.address}
        {jobVacancy.block ? `, ${jobVacancy.block}` : ""}
        {jobVacancy.taluk ? `, ${jobVacancy.taluk}` : ""}, {jobVacancy.district} District
        {jobVacancy.pinCode ? ` - ${jobVacancy.pinCode}` : ""}
      </p>
      <p className="text-sm text-foreground/60 mb-6">
        Qualification: {jobVacancy.qualificationRequired} · Experience: {jobVacancy.experienceRequired}
        {jobVacancy.salaryRange ? ` · ${jobVacancy.salaryRange}` : ""}
      </p>

      <div className="card p-4 mb-6">
        <h2 className="font-semibold mb-2 text-sm">Role description</h2>
        <p className="text-sm leading-relaxed">{jobVacancy.description}</p>
      </div>

      {isOwner && jobVacancy.status === "OPEN" && (
        <div className="mb-6 flex gap-3 flex-wrap">
          <form action={updateJobVacancyStatusAction}>
            <input type="hidden" name="jobVacancyId" value={jobVacancy.id} />
            <input type="hidden" name="status" value="CLOSED" />
            <button
              type="submit"
              className="border border-border font-semibold rounded-md px-4 py-2 text-sm hover:border-brand"
            >
              Close vacancy
            </button>
          </form>
        </div>
      )}

      {user?.role === "TEACHER" && jobVacancy.status === "OPEN" && (
        <div className="mb-6">
          <JobApplicationForm
            jobVacancyId={jobVacancy.id}
            existing={myApplication ? { coverNote: myApplication.coverNote } : null}
          />
        </div>
      )}

      <h2 className="font-semibold mb-3">
        Applications {isOwner ? `(${jobVacancy.applications.length})` : ""}
      </h2>

      {isOwner ? (
        jobVacancy.applications.length === 0 ? (
          <p className="text-sm text-foreground/60">No applications yet.</p>
        ) : (
          <div className="space-y-3">
            {jobVacancy.applications.map((application) => (
              <div key={application.id} className="card p-4">
                <div className="flex items-center justify-between gap-4 flex-wrap">
                  <div>
                    <p className="font-semibold">{application.teacher.name}</p>
                    <p className="text-xs text-foreground/50">
                      {application.teacher.qualification}
                      {application.teacher.subjectSpecialization
                        ? ` · ${TEACHING_SUBJECT_LABELS[application.teacher.subjectSpecialization]}`
                        : ""}
                      {typeof application.teacher.experienceYears === "number"
                        ? ` · ${application.teacher.experienceYears} yrs experience`
                        : ""}
                    </p>
                  </div>
                  <span
                    className={`text-xs font-semibold px-2 py-1 rounded-full ${applicationStatusColor[application.status]}`}
                  >
                    {application.status}
                  </span>
                </div>
                <p className="text-sm mt-2">{application.coverNote}</p>
                {application.teacher.resumeUrl && (
                  <a
                    href={application.teacher.resumeUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-brand hover:underline mt-2 inline-block"
                  >
                    View resume &rarr;
                  </a>
                )}
                {jobVacancy.status === "OPEN" && application.status === "PENDING" && (
                  <form action={hireApplicationAction} className="mt-3">
                    <input type="hidden" name="applicationId" value={application.id} />
                    <button
                      type="submit"
                      className="bg-brand text-white font-semibold rounded-md px-4 py-2 text-sm hover:bg-brand-dark"
                    >
                      Hire this teacher
                    </button>
                  </form>
                )}
              </div>
            ))}
          </div>
        )
      ) : (
        <p className="text-sm text-foreground/60">
          {jobVacancy.applications.length} teacher(s) have applied for this role.
        </p>
      )}
    </div>
  );
}
