/**
 * Small shared shapes/helpers for OmrExamConfig that both the "use server"
 * actions file and plain Server/Client Components need — kept out of
 * actions.ts because a "use server" file may only export async functions.
 */
import type { Subject } from "./types";

export const ALL_SERIES_LETTERS = ["P", "Q", "R", "S"] as const;
export type SeriesLetter = (typeof ALL_SERIES_LETTERS)[number];
export type AnswerKeys = Record<SeriesLetter, Record<number, string>>;

export const EMPTY_ANSWER_KEYS: AnswerKeys = { P: {}, Q: {}, R: {}, S: {} };

export function totalQuestions(subjects: Subject[]) {
  return subjects.reduce((s, x) => s + x.count, 0);
}
