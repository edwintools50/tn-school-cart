/**
 * Compares detected answers against the configured answer key and applies
 * the (user-editable) marking rules to compute a score. Ported verbatim from
 * the OMNI OMR Suite desktop app's evaluator/scoring.js.
 */
import type { MarkingRules, QuestionOutcome, ScoredQuestionDetail } from "./types";

type DetectedAnswer = { detected: string | null; status: "answered" | "unattempted" | "multiple" };

export function scoreExam(
  answers: Record<number, DetectedAnswer>,
  answerKey: Record<number, string>,
  rules: MarkingRules,
  totalQuestions: number
) {
  let score = 0;
  let correctCount = 0;
  let wrongCount = 0;
  let unattemptedCount = 0;
  let multipleCount = 0;
  const details: ScoredQuestionDetail[] = [];

  for (let qNum = 1; qNum <= totalQuestions; qNum++) {
    const a = answers[qNum] || { detected: null, status: "unattempted" as const };
    const correctLetter = answerKey[qNum] || null;
    let marksAwarded = 0;
    let outcome: QuestionOutcome;

    if (a.status === "unattempted") {
      outcome = "unattempted";
      marksAwarded = rules.marksUnattempted;
      unattemptedCount++;
    } else if (a.status === "multiple") {
      outcome = "multiple";
      marksAwarded = rules.marksMultiple;
      multipleCount++;
    } else if (correctLetter && a.detected === correctLetter) {
      outcome = "correct";
      marksAwarded = rules.marksCorrect;
      correctCount++;
    } else {
      outcome = "wrong";
      marksAwarded = rules.marksWrong;
      wrongCount++;
    }

    score += marksAwarded;
    details.push({ qNum, correctLetter, detected: a.detected, outcome, marksAwarded });
  }

  return { score, correctCount, wrongCount, unattemptedCount, multipleCount, details };
}
