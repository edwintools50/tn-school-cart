import Link from "next/link";
import { requireOmrAccess } from "@/lib/omr/access";
import { db } from "@/lib/db";
import { createExamConfigAction, deleteExamConfigAction } from "./actions";

export default async function EvaluateHomePage() {
  const user = await requireOmrAccess();
  const exams = await db.omrExamConfig.findMany({
    where: { ownerId: user.id },
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { results: true } } },
  });

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 w-full">
      <div className="flex items-start justify-between gap-4 mb-1">
        <h1 className="text-2xl font-bold">Evaluate</h1>
        <div className="flex gap-2 shrink-0">
          <Link href="/omr/evaluate/dashboard" className="rounded-md border border-border px-3 py-1.5 text-sm hover:bg-black/5">
            Dashboard
          </Link>
          <Link href="/omr/evaluate/progress" className="rounded-md border border-border px-3 py-1.5 text-sm hover:bg-black/5">
            Progress Tracker
          </Link>
          <Link href="/omr/branding" className="rounded-md border border-border px-3 py-1.5 text-sm hover:bg-black/5">
            Branding
          </Link>
        </div>
      </div>
      <p className="text-sm text-foreground/60 mb-6">
        Scan and auto-grade filled OMR sheets against an exam&apos;s answer key.
      </p>

      <div className="card p-6 mb-8">
        <h2 className="text-lg font-semibold mb-3">Create a new exam</h2>
        <form action={createExamConfigAction} className="flex gap-2">
          <input
            name="examTitle"
            placeholder="e.g. NEET Mock Test — Set 1"
            className="flex-1 rounded-md border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
          />
          <button
            type="submit"
            className="bg-brand text-white font-semibold rounded-md px-4 py-2 text-sm hover:bg-brand-dark transition-colors shrink-0"
          >
            Create
          </button>
        </form>
      </div>

      {exams.length === 0 ? (
        <p className="text-sm text-foreground/50">No exams yet — create one above to get started.</p>
      ) : (
        <ul className="space-y-3">
          {exams.map((exam) => (
            <li key={exam.id} className="card p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="font-semibold truncate">{exam.examTitle}</p>
                  <p className="text-xs text-foreground/50">
                    {exam._count.results} scanned · created {exam.createdAt.toLocaleDateString("en-IN")}
                  </p>
                </div>
                <form action={deleteExamConfigAction}>
                  <input type="hidden" name="examId" value={exam.id} />
                  <button type="submit" className="text-xs text-red-600 hover:underline shrink-0">
                    Delete
                  </button>
                </form>
              </div>
              <div className="mt-3 flex flex-wrap gap-2 text-sm">
                <a
                  href={`/omr/evaluate/${exam.id}/settings`}
                  className="rounded-md border border-border px-3 py-1.5 hover:bg-black/5"
                >
                  Rules &amp; Answer Key
                </a>
                <a
                  href={`/omr/evaluate/${exam.id}/upload`}
                  className="rounded-md border border-border px-3 py-1.5 hover:bg-black/5"
                >
                  Scan a Sheet
                </a>
                <a
                  href={`/omr/evaluate/${exam.id}/results`}
                  className="rounded-md border border-border px-3 py-1.5 hover:bg-black/5"
                >
                  Results
                </a>
                <a
                  href={`/omr/evaluate/${exam.id}/export/csv`}
                  className="rounded-md border border-border px-3 py-1.5 hover:bg-black/5"
                >
                  Export CSV
                </a>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
