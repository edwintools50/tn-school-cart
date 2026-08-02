import Link from "next/link";
import { notFound } from "next/navigation";
import { requireOmrAccess } from "@/lib/omr/access";
import { db } from "@/lib/db";
import { toOmrResultLike } from "@/lib/omr/resultAdapter";
import { studentProgressDetail } from "@/lib/omr/progressStats";

export default async function ProgressDetailPage({
  params,
}: {
  params: Promise<{ rollNumber: string }>;
}) {
  const user = await requireOmrAccess();
  const { rollNumber } = await params;

  const rows = await db.omrResult.findMany({ where: { ownerId: user.id } });
  const detail = studentProgressDetail(rows.map(toOmrResultLike), decodeURIComponent(rollNumber));
  if (detail.rows.length === 0) notFound();

  const W = 560,
    H = 90,
    PAD = 14;
  const n = detail.rows.length;
  const points = detail.rows.map((row, i) => {
    const x = n === 1 ? W / 2 : PAD + (i / (n - 1)) * (W - 2 * PAD);
    const y = PAD + (1 - row.accuracy) * (H - 2 * PAD);
    return [x, y] as const;
  });
  const polyline = points.map((p) => `${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(" ");

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 w-full">
      <h1 className="text-2xl font-bold mb-1">{detail.studentName || "Unnamed student"}</h1>
      <p className="text-sm text-foreground/60 mb-6">
        Roll No: {detail.rollNumber} · {detail.rows.length} attempt{detail.rows.length === 1 ? "" : "s"} tracked
      </p>

      <div className="card p-5 mb-6">
        <h2 className="font-semibold mb-3">Accuracy trend</h2>
        <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} className="max-w-full">
          <line x1={PAD} y1={H - PAD} x2={W - PAD} y2={H - PAD} stroke="#dbe3ee" strokeWidth={1} />
          {n > 1 && <polyline points={polyline} fill="none" stroke="#145c9e" strokeWidth={2.5} />}
          {points.map((p, i) => (
            <circle
              key={i}
              cx={p[0].toFixed(1)}
              cy={p[1].toFixed(1)}
              r={4}
              fill={detail.rows[i].accuracy < 0.4 ? "#dc2626" : "#145c9e"}
            />
          ))}
        </svg>
        <p className="text-xs text-foreground/50 mt-2">
          Each point is one attempt&apos;s accuracy (correct ÷ total questions), oldest to newest, left to right.
        </p>
      </div>

      <div className="card p-5 overflow-x-auto">
        <h2 className="font-semibold mb-3">Attempt history</h2>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-foreground/60">
              <th className="px-2 py-1.5">Date</th>
              <th className="px-2 py-1.5">Exam</th>
              <th className="px-2 py-1.5">Score</th>
              <th className="px-2 py-1.5">Accuracy</th>
              <th className="px-2 py-1.5">Rank in exam</th>
              <th className="px-2 py-1.5"></th>
            </tr>
          </thead>
          <tbody>
            {[...detail.rows].reverse().map((row) => (
              <tr key={row.result.id} className="border-b border-border last:border-0">
                <td className="px-2 py-1.5">{new Date(row.result.timestamp).toLocaleDateString("en-IN")}</td>
                <td className="px-2 py-1.5">{row.result.examTitle}</td>
                <td className="px-2 py-1.5 font-semibold">{row.result.score}</td>
                <td className="px-2 py-1.5">{Math.round(row.accuracy * 100)}%</td>
                <td className="px-2 py-1.5">
                  {row.rankInfo.count > 1 ? `#${row.rankInfo.rank} of ${row.rankInfo.count}` : "—"}
                </td>
                <td className="px-2 py-1.5 space-x-2 whitespace-nowrap">
                  <a href={`/omr/evaluate/results/${row.result.id}`} className="text-brand hover:underline">
                    View
                  </a>
                  <a
                    href={`/omr/evaluate/results/${row.result.id}/report-card`}
                    className="text-brand hover:underline"
                  >
                    Report card
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Link href="/omr/evaluate/progress" className="inline-block mt-6 rounded-md border border-border px-4 py-2 text-sm hover:bg-black/5">
        ← Back to Progress Tracker
      </Link>
    </div>
  );
}
