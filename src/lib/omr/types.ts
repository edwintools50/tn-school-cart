/**
 * Shared shapes for the ported OMNI OMR Suite logic. These match the field
 * names the original app's pure functions (dashboardStats, progressStats,
 * reportCard) were written against — NOT the OmrResult Prisma model's field
 * names 1:1 (e.g. `timestamp` here vs `createdAt` in the DB, or a single
 * `rollNumber` in the DB vs this shape's entered/detected split). Route
 * handlers that fetch real `OmrResult` rows should map them into this shape
 * at the query boundary rather than changing the ported logic itself — see
 * each Phase 3/4 route for the actual adapter.
 */

export type Subject = { name: string; count: number };

export type MarkingRules = {
  marksCorrect: number;
  marksWrong: number;
  marksUnattempted: number;
  marksMultiple: number;
};

export type QuestionOutcome = "correct" | "wrong" | "unattempted" | "multiple";

export type ScoredQuestionDetail = {
  qNum: number;
  correctLetter: string | null;
  detected: string | null;
  outcome: QuestionOutcome;
  marksAwarded: number;
};

export type OmrResultLike = {
  id: string;
  examTitle: string;
  totalQuestions: number;
  score: number;
  correctCount: number;
  wrongCount: number;
  unattemptedCount: number;
  multipleCount: number;
  details: ScoredQuestionDetail[];
  studentName: string | null;
  rollNumberEntered: string | null;
  rollNumberDetected: string | null;
  detectedSet: string | null;
  timestamp: string;
};

export type Branding = {
  instituteName: string | null;
  primaryColor: string;
  accentColor?: string;
  logoBuffer: Buffer | null;
};
