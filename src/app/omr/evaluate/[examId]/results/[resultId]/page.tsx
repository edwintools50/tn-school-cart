import { notFound } from "next/navigation";
import { requireOmrAccess } from "@/lib/omr/access";
import { db } from "@/lib/db";
import type { ScoredQuestionDetail } from "@/lib/omr/types";

export default async function ResultDetailPage({
  params,
}: {
  params: Promise<{ examId: string; resultId: string }>;
}) {
  const user = await requireOmrAccess();
  const { examId, resultId } = await params;

  const result = await db.omrResult.findUnique({ where: { id: resultId } });
  if (!result || result.ownerId !== user.id || result.examConfigId !== examId) notFound();

  const details = result.details as unknown as ScoredQuestionDetail[];

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 w-full">
      <h1 className="text-2xl font-bold mb-1">{result.studentName || "Unnamed student"}</h1>
      <p className="text-sm text-foreground/60 mb-1">
        {result.examTitle} · Roll No: {result.rollNumber || "—"} · {result.createdAt.toLocaleString("en-IN")}
        {result.bookletSeries && <> · <span className="text-brand font-medium">Set {result.bookletSeries}</span></>}
      </p>

      {result.setWarning && (
        <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-md px-3 py-2 mb-4">
          {result.setWarning}
        </p>
      )}

      <div className="card p-6 mb-6">
        <div className="grid grid-cols-2 sm:grid-cols-6 gap-4 text-center">
          <div>
            <div className="text-3xl font-bold text-brand-dark">{result.score}</div>
            <div className="text-xs text-foreground/50">Score</div>
          </div>
          <div>
            <div className="text-xl font-semibold">{result.correctCount}</div>
            <div className="text-xs text-foreground/50">Correct</div>
          </div>
          <div>
            <div className="text-xl font-semibold">{result.wrongCount}</div>
            <div className="text-xs text-foreground/50">Wrong</div>
          </div>
          <div>
            <div className="text-xl font-semibold">{result.unattemptedCount}</div>
            <div className="text-xs text-foreground/50">Unattempted</div>
          </div>
          <div>
            <div className="text-xl font-semibold">{result.multipleCount}</div>
            <div className="text-xs text-foreground/50">Multiple</div>
          </div>
          <div>
            <div className="text-xl font-semibold">{result.totalQuestions}</div>
            <div className="text-xs text-foreground/50">Total</div>
          </div>
        </div>
      </div>

      <div className="card p-6 mb-6">
        <h2 className="font-semibold mb-3">Scanned sheet (green = correct, red = wrong, amber = blank/ambiguous)</h2>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={result.overlayImageUrl}
          alt="Overlay of detected marks"
          className="w-full max-w-xl rounded-md border border-border"
        />
        <a
          href={result.uploadImageUrl}
          target="_blank"
          rel="noreferrer"
          className="text-xs text-brand hover:underline inline-block mt-2"
        >
          View original uploaded photo
        </a>
      </div>

      <div className="card p-6 mb-6 overflow-x-auto">
        <h2 className="font-semibold mb-3">Per-question detail</h2>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-foreground/60">
              <th className="px-2 py-1.5">Q</th>
              <th className="px-2 py-1.5">Correct</th>
              <th className="px-2 py-1.5">Detected</th>
              <th className="px-2 py-1.5">Outcome</th>
              <th className="px-2 py-1.5">Marks</th>
            </tr>
          </thead>
          <tbody>
            {details.map((d) => (
              <tr key={d.qNum} className="border-b border-border last:border-0">
                <td className="px-2 py-1">{d.qNum}</td>
                <td className="px-2 py-1">{d.correctLetter || "—"}</td>
                <td className="px-2 py-1">{d.detected || (d.outcome === "multiple" ? "multiple" : "—")}</td>
                <td
                  className={`px-2 py-1 font-medium ${
                    d.outcome === "correct"
                      ? "text-green-700"
                      : d.outcome === "wrong"
                        ? "text-red-600"
                        : "text-amber-700"
                  }`}
                >
                  {d.outcome}
                </td>
                <td className="px-2 py-1">{d.marksAwarded}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex flex-wrap gap-2">
        <a
          href={`/omr/evaluate/${examId}/results`}
          className="rounded-md border border-border px-4 py-2 text-sm hover:bg-black/5"
        >
          ← Back to results
        </a>
        <a
          href={`/omr/evaluate/results/${result.id}/report-card`}
          className="rounded-md border border-border px-4 py-2 text-sm hover:bg-black/5"
        >
          📄 Download Report Card (PDF)
        </a>
        {result.rollNumber && !result.rollNumber.includes("?") && (
          <a
            href={`/omr/evaluate/progress/${encodeURIComponent(result.rollNumber)}`}
            className="rounded-md border border-border px-4 py-2 text-sm hover:bg-black/5"
          >
            📈 View Progress History
          </a>
        )}
        <a
          href={`/omr/evaluate/${examId}/upload`}
          className="bg-brand text-white font-semibold rounded-md px-4 py-2 text-sm hover:bg-brand-dark transition-colors"
        >
          Scan another sheet
        </a>
      </div>
    </div>
  );
}
