import { requireOmrAccess } from "@/lib/omr/access";
import { db } from "@/lib/db";
import { toOmrResultLike } from "@/lib/omr/resultAdapter";
import { listStudentsWithHistory } from "@/lib/omr/progressStats";

export default async function ProgressListPage() {
  const user = await requireOmrAccess();
  const rows = await db.omrResult.findMany({ where: { ownerId: user.id } });
  const students = listStudentsWithHistory(rows.map(toOmrResultLike));

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 w-full">
      <h1 className="text-2xl font-bold mb-1">Progress Tracker</h1>
      <p className="text-sm text-foreground/60 mb-6">
        Every student&apos;s performance across all the exams they&apos;ve taken, tracked by roll number.
      </p>

      {students.length === 0 ? (
        <p className="text-sm text-foreground/50">
          No students with a readable roll number yet. Roll numbers with partly-unreadable digits (&ldquo;?&rdquo;)
          aren&apos;t tracked here since they can&apos;t be reliably matched across attempts.
        </p>
      ) : (
        <div className="card p-4 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-foreground/60">
                <th className="px-2 py-1.5">Student</th>
                <th className="px-2 py-1.5">Roll No.</th>
                <th className="px-2 py-1.5">Attempts</th>
                <th className="px-2 py-1.5">Latest Exam</th>
                <th className="px-2 py-1.5">Latest Accuracy</th>
                <th className="px-2 py-1.5">Trend</th>
                <th className="px-2 py-1.5"></th>
              </tr>
            </thead>
            <tbody>
              {students.map((s) => (
                <tr key={s.rollNumber} className="border-b border-border last:border-0">
                  <td className="px-2 py-1.5">{s.studentName || "—"}</td>
                  <td className="px-2 py-1.5 font-mono text-xs">{s.rollNumber}</td>
                  <td className="px-2 py-1.5">{s.attemptCount}</td>
                  <td className="px-2 py-1.5">{s.latestExamTitle}</td>
                  <td className="px-2 py-1.5 font-semibold">{Math.round(s.latestAccuracy * 100)}%</td>
                  <td className="px-2 py-1.5">
                    {s.trend === null ? (
                      <span className="text-foreground/40 text-xs">first attempt</span>
                    ) : s.trend > 0.01 ? (
                      <span className="text-green-700 font-semibold">▲ +{Math.round(s.trend * 100)}%</span>
                    ) : s.trend < -0.01 ? (
                      <span className="text-red-600 font-semibold">▼ {Math.round(s.trend * 100)}%</span>
                    ) : (
                      <span className="text-foreground/40 text-xs">▬ flat</span>
                    )}
                  </td>
                  <td className="px-2 py-1.5">
                    <a
                      href={`/omr/evaluate/progress/${encodeURIComponent(s.rollNumber)}`}
                      className="text-brand hover:underline"
                    >
                      View history
                    </a>
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
