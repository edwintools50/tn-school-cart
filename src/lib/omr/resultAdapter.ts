/**
 * Bridges a Prisma OmrResult row (single `rollNumber` column, `createdAt`,
 * `bookletSeries`) into the OmrResultLike shape the ported pure-logic
 * modules (dashboardStats, progressStats, reportCard) expect (the entered/
 * detected roll-number split, `timestamp`, `detectedSet`) — see types.ts for
 * why the two shapes were deliberately kept separate instead of changing the
 * ported logic to match the DB. rollNumberEntered is always null here since
 * the DB only ever stores one already-resolved value (student's manual
 * override if given, else the auto-detected one — see scanSheetAction);
 * that still round-trips correctly since every consumer reads
 * `rollNumberEntered || rollNumberDetected`.
 *
 * Typed structurally (not against the generated Prisma model) so this file
 * has no dependency on Prisma's generated client, consistent with the rest
 * of lib/omr.
 */
import type { OmrResultLike, ScoredQuestionDetail } from "./types";

export type OmrResultRow = {
  id: string;
  examTitle: string;
  totalQuestions: number;
  score: number;
  correctCount: number;
  wrongCount: number;
  unattemptedCount: number;
  multipleCount: number;
  details: unknown;
  studentName: string | null;
  rollNumber: string;
  bookletSeries: string | null;
  createdAt: Date;
};

export function toOmrResultLike(r: OmrResultRow): OmrResultLike {
  return {
    id: r.id,
    examTitle: r.examTitle,
    totalQuestions: r.totalQuestions,
    score: r.score,
    correctCount: r.correctCount,
    wrongCount: r.wrongCount,
    unattemptedCount: r.unattemptedCount,
    multipleCount: r.multipleCount,
    details: r.details as ScoredQuestionDetail[],
    studentName: r.studentName,
    rollNumberEntered: null,
    rollNumberDetected: r.rollNumber,
    detectedSet: r.bookletSeries,
    timestamp: r.createdAt.toISOString(),
  };
}
