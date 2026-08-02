/**
 * Cross-test student progress tracking — groups scanned results by student
 * (roll number) ACROSS every exam they've taken, unlike dashboardStats.ts
 * which groups by exam across students. Uses accuracy (correctCount /
 * totalQuestions) rather than raw score as the comparable trend metric,
 * since different exams can have different marking schemes/max marks (not
 * stored per-result) but accuracy is always comparable and always derivable
 * from what IS stored on every record. Ported verbatim from OMNI OMR
 * Suite's evaluator/progressStats.js.
 */
import { computeRankInfo } from "./reportCard";
import { groupKey } from "./dashboardStats";
import type { OmrResultLike } from "./types";

// A result only has a usable student identity if its roll number was
// actually read/entered cleanly — "????????"-style partial reads would
// wrongly bucket unrelated students together under a garbled key.
export function studentKey(r: Pick<OmrResultLike, "rollNumberEntered" | "rollNumberDetected">): string | null {
  const k = (r.rollNumberEntered || r.rollNumberDetected || "").trim();
  return k && !k.includes("?") ? k : null;
}

export function accuracyOf(r: Pick<OmrResultLike, "correctCount" | "totalQuestions">): number {
  return r.totalQuestions > 0 ? r.correctCount / r.totalQuestions : 0;
}

/**
 * One row per distinct roll number seen across all results, most-recently
 * active first. Each row summarizes attempt count, latest/average accuracy,
 * and a simple trend (latest attempt's accuracy minus the one before it).
 */
export function listStudentsWithHistory(results: OmrResultLike[]) {
  const map = new Map<string, OmrResultLike[]>();
  for (const r of results) {
    const key = studentKey(r);
    if (!key) continue;
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(r);
  }

  const students: {
    rollNumber: string;
    studentName: string | null;
    attemptCount: number;
    latestTimestamp: string;
    latestExamTitle: string;
    latestAccuracy: number;
    averageAccuracy: number;
    trend: number | null;
  }[] = [];
  for (const [rollNumber, attempts] of map.entries()) {
    attempts.sort((a, b) => (a.timestamp < b.timestamp ? -1 : 1));
    const latestName = [...attempts].reverse().find((a) => a.studentName)?.studentName || null;
    const accuracies = attempts.map(accuracyOf);
    const latestAccuracy = accuracies[accuracies.length - 1];
    const trend = accuracies.length >= 2 ? latestAccuracy - accuracies[accuracies.length - 2] : null;
    students.push({
      rollNumber,
      studentName: latestName,
      attemptCount: attempts.length,
      latestTimestamp: attempts[attempts.length - 1].timestamp,
      latestExamTitle: attempts[attempts.length - 1].examTitle,
      latestAccuracy,
      averageAccuracy: accuracies.reduce((s, x) => s + x, 0) / accuracies.length,
      trend, // null = only one attempt so far, positive = improving, negative = declining
    });
  }
  return students.sort((a, b) => (a.latestTimestamp < b.latestTimestamp ? 1 : -1));
}

/**
 * Full attempt-by-attempt history for one student, each attempt enriched
 * with its rank/percentile within ITS OWN exam group (reusing the same
 * logic the report card uses, so the two never disagree).
 */
export function studentProgressDetail(allResults: OmrResultLike[], rollNumber: string) {
  const attempts = allResults
    .filter((r) => studentKey(r) === rollNumber)
    .sort((a, b) => (a.timestamp < b.timestamp ? -1 : 1));

  const rows = attempts.map((r) => {
    const examGroupResults = allResults.filter((x) => groupKey(x) === groupKey(r));
    const rankInfo = computeRankInfo(r, examGroupResults);
    return { result: r, accuracy: accuracyOf(r), rankInfo };
  });

  return {
    rollNumber,
    studentName: [...attempts].reverse().find((a) => a.studentName)?.studentName || null,
    rows,
  };
}
