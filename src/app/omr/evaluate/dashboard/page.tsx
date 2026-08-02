import { requireOmrAccess } from "@/lib/omr/access";
import { db } from "@/lib/db";
import { toOmrResultLike } from "@/lib/omr/resultAdapter";
import { groupKey, listExamGroups, computeDashboardStats } from "@/lib/omr/dashboardStats";

export default async function EvaluateDashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ exam?: string }>;
}) {
  const user = await requireOmrAccess();
  const { exam: examFilter = "all" } = await searchParams;

  const rows = await db.omrResult.findMany({ where: { ownerId: user.id }, orderBy: { createdAt: "desc" } });
  const allResults = rows.map(toOmrResultLike);
  const groups = listExamGroups(allResults);
  const filtered = examFilter === "all" ? allResults : allResults.filter((r) => groupKey(r) === examFilter);
  const stats = computeDashboardStats(filtered);

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 w-full">
      <h1 className="text-2xl font-bold mb-1">Dashboard</h1>
      <p className="text-sm text-foreground/60 mb-6">
        Top, bottom, and average scores across scanned sheets — pick an exam below.
      </p>

      <form method="get" className="card p-4 mb-6">
        <label className="block text-sm font-medium mb-1" htmlFor="exam">
          Exam
        </label>
        {/* Plain select + native form GET submit — no client JS needed for a simple filter. */}
        <select
          id="exam"
          name="exam"
          defaultValue={examFilter}
          className="w-full rounded-md border border-border px-3 py-2 text-sm"
        >
          <option value="all">
            All exams ({allResults.length} sheet{allResults.length === 1 ? "" : "s"})
          </option>
          {groups.map((g) => (
            <option key={g.key} value={g.key}>
              {g.examTitle} ({g.totalQuestions}Q) — {g.count} sheet{g.count === 1 ? "" : "s"}
            </option>
          ))}
        </select>
        <noscript>
          <button type="submit" className="mt-2 rounded-md border border-border px-3 py-1.5 text-sm">
            Apply
          </button>
        </noscript>
      </form>

      {stats.count === 0 ? (
        <p className="text-sm text-foreground/50">No sheets scanned yet for this exam.</p>
      ) : (
        <>
          <div className="card p-5 mb-6 grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-xl font-bold text-brand-dark">{stats.count}</div>
              <div className="text-xs text-foreground/50">Sheets scanned</div>
            </div>
            <div>
              <div className="text-xl font-bold">{stats.average?.toFixed(1)}</div>
              <div className="text-xs text-foreground/50">Average score</div>
            </div>
            <div>
              <div className="text-xl font-bold text-green-700">{stats.highestScore}</div>
              <div className="text-xs text-foreground/50">Highest score</div>
            </div>
            <div>
              <div className="text-xl font-bold text-red-600">{stats.lowestScore}</div>
              <div className="text-xs text-foreground/50">Lowest score</div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            <div className="card p-4">
              <h2 className="font-semibold mb-2">🏆 Top performers</h2>
              <ResultMiniTable rows={stats.topPerformers} />
            </div>
            <div className="card p-4">
              <h2 className="font-semibold mb-2">⚠️ Needs attention (lowest)</h2>
              <ResultMiniTable rows={stats.bottomPerformers} />
            </div>
          </div>

          <div className="card p-4 overflow-x-auto">
            <h2 className="font-semibold mb-3">Leaderboard</h2>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-foreground/60">
                  <th className="px-2 py-1.5">#</th>
                  <th className="px-2 py-1.5">When</th>
                  <th className="px-2 py-1.5">Student</th>
                  <th className="px-2 py-1.5">Roll No.</th>
                  <th className="px-2 py-1.5">Score</th>
                  <th className="px-2 py-1.5">Correct</th>
                  <th className="px-2 py-1.5">Wrong</th>
                  <th className="px-2 py-1.5"></th>
                </tr>
              </thead>
              <tbody>
                {stats.leaderboard.map((r, i) => (
                  <tr key={r.id} className="border-b border-border last:border-0">
                    <td className="px-2 py-1">#{i + 1}</td>
                    <td className="px-2 py-1 text-xs text-foreground/50">{new Date(r.timestamp).toLocaleString("en-IN")}</td>
                    <td className="px-2 py-1">{r.studentName || "—"}</td>
                    <td className="px-2 py-1 font-mono text-xs">{r.rollNumberEntered || r.rollNumberDetected || "—"}</td>
                    <td className="px-2 py-1 font-semibold">{r.score}</td>
                    <td className="px-2 py-1">{r.correctCount}</td>
                    <td className="px-2 py-1">{r.wrongCount}</td>
                    <td className="px-2 py-1">
                      <a href={`/omr/evaluate/results/${r.id}`} className="text-brand hover:underline">
                        View
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

function ResultMiniTable({ rows }: { rows: ReturnType<typeof toOmrResultLike>[] }) {
  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="border-b border-border text-left text-foreground/60">
          <th className="px-2 py-1">Student</th>
          <th className="px-2 py-1">Roll No.</th>
          <th className="px-2 py-1">Score</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((r) => (
          <tr key={r.id} className="border-b border-border last:border-0">
            <td className="px-2 py-1">
              <a href={`/omr/evaluate/results/${r.id}`} className="text-brand hover:underline">
                {r.studentName || "—"}
              </a>
            </td>
            <td className="px-2 py-1 font-mono text-xs">{r.rollNumberEntered || r.rollNumberDetected || "—"}</td>
            <td className="px-2 py-1 font-semibold">{r.score}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
