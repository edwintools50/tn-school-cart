/**
 * Pure stats helpers for the Results Dashboard — grouping scanned results by
 * exam (since different exams have different answer keys/section counts, so
 * lumping all-time scores together wouldn't be meaningful) and computing
 * top/bottom/average for a given set. Ported verbatim from OMNI OMR Suite's
 * evaluator/dashboardStats.js.
 */
import type { OmrResultLike } from "./types";

export function groupKey(r: Pick<OmrResultLike, "examTitle" | "totalQuestions">): string {
  return r.examTitle + "|" + r.totalQuestions;
}

// Exam groups present in the results, most-recently-scanned first.
export function listExamGroups(results: OmrResultLike[]) {
  const map = new Map<
    string,
    { key: string; examTitle: string; totalQuestions: number; count: number; latest: string }
  >();
  for (const r of results) {
    const key = groupKey(r);
    if (!map.has(key)) {
      map.set(key, { key, examTitle: r.examTitle, totalQuestions: r.totalQuestions, count: 0, latest: r.timestamp });
    }
    const g = map.get(key)!;
    g.count++;
    if (r.timestamp > g.latest) g.latest = r.timestamp;
  }
  return [...map.values()].sort((a, b) => (a.latest < b.latest ? 1 : -1));
}

export function computeDashboardStats(results: OmrResultLike[]) {
  if (results.length === 0) {
    return {
      count: 0,
      average: null as number | null,
      highestScore: null as number | null,
      lowestScore: null as number | null,
      topPerformers: [] as OmrResultLike[],
      bottomPerformers: [] as OmrResultLike[],
      leaderboard: [] as OmrResultLike[],
    };
  }
  const leaderboard = [...results].sort((a, b) => b.score - a.score);
  const average = results.reduce((s, r) => s + r.score, 0) / results.length;
  const highestScore = leaderboard[0].score;
  const lowestScore = leaderboard[leaderboard.length - 1].score;
  return {
    count: results.length,
    average,
    highestScore,
    lowestScore,
    topPerformers: leaderboard.filter((r) => r.score === highestScore),
    bottomPerformers: leaderboard.filter((r) => r.score === lowestScore),
    leaderboard,
  };
}
