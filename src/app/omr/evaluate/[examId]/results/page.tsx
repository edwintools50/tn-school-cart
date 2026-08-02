import { notFound } from "next/navigation";
import { requireOmrAccess } from "@/lib/omr/access";
import { db } from "@/lib/db";

export default async function ResultsListPage({ params }: { params: Promise<{ examId: string }> }) {
  const user = await requireOmrAccess();
  const { examId } = await params;

  const config = await db.omrExamConfig.findUnique({ where: { id: examId } });
  if (!config || config.ownerId !== user.id) notFound();

  const results = await db.omrResult.findMany({
    where: { examConfigId: examId },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 w-full">
      <div className="flex items-start justify-between gap-4 mb-1">
        <h1 className="text-2xl font-bold">Results</h1>
        <a
          href={`/omr/evaluate/${examId}/export/csv`}
          className="rounded-md border border-border px-3 py-1.5 text-sm hover:bg-black/5 shrink-0"
        >
          Export CSV
        </a>
      </div>
      <p className="text-sm text-foreground/60 mb-6">{config.examTitle}</p>

      {results.length === 0 ? (
        <p className="text-sm text-foreground/50">
          No sheets scanned yet —{" "}
          <a href={`/omr/evaluate/${examId}/upload`} className="text-brand hover:underline">
            scan one
          </a>
          .
        </p>
      ) : (
        <div className="overflow-x-auto card">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-foreground/60">
                <th className="px-4 py-2">Student</th>
                <th className="px-4 py-2">Roll No.</th>
                <th className="px-4 py-2">Set</th>
                <th className="px-4 py-2">Score</th>
                <th className="px-4 py-2">Scanned</th>
              </tr>
            </thead>
            <tbody>
              {results.map((r) => (
                <tr key={r.id} className="border-b border-border last:border-0 hover:bg-black/5">
                  <td className="px-4 py-2">
                    <a href={`/omr/evaluate/${examId}/results/${r.id}`} className="text-brand hover:underline">
                      {r.studentName || "Unnamed student"}
                    </a>
                  </td>
                  <td className="px-4 py-2 font-mono text-xs">{r.rollNumber || "—"}</td>
                  <td className="px-4 py-2">{r.bookletSeries || "—"}</td>
                  <td className="px-4 py-2 font-semibold">{r.score}</td>
                  <td className="px-4 py-2 text-foreground/50 text-xs">
                    {r.createdAt.toLocaleString("en-IN")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
