"use server";

import Jimp from "jimp";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireOmrAccess } from "@/lib/omr/access";
import { db } from "@/lib/db";
import {
  getResponseGridLayout,
  getRollNumberGridLayout,
  getBookletCodeGridLayout,
} from "@/lib/omr/omrLayout";
import { canonicalPixelSize, readResponses, readRollNumber, readBookletCode } from "@/lib/omr/scanner";
import { warpToGrayscale, type Point } from "@/lib/omr/perspectiveWarp";
import { scoreExam } from "@/lib/omr/scoring";
import { buildOverlayImage } from "@/lib/omr/render";
import { uploadOmrScanImage, uploadOmrOverlayImage } from "@/lib/omr/storage";
import { ALL_SERIES_LETTERS, EMPTY_ANSWER_KEYS, totalQuestions, type SeriesLetter, type AnswerKeys } from "@/lib/omr/examConfig";
import type { Subject, MarkingRules } from "@/lib/omr/types";

const DEFAULT_SUBJECTS: Subject[] = [
  { name: "Physics", count: 45 },
  { name: "Chemistry", count: 45 },
  { name: "Biology", count: 90 },
];
const DEFAULT_RULES: MarkingRules = { marksCorrect: 4, marksWrong: -1, marksUnattempted: 0, marksMultiple: -1 };

async function getOwnedExamConfig(examId: string, userId: string) {
  const config = await db.omrExamConfig.findUnique({ where: { id: examId } });
  if (!config || config.ownerId !== userId) return null;
  return config;
}

export type ExamActionState = { error: string } | undefined;

export async function createExamConfigAction(formData: FormData): Promise<void> {
  const user = await requireOmrAccess();
  const examTitle = String(formData.get("examTitle") || "").trim() || "Untitled Exam";

  const config = await db.omrExamConfig.create({
    data: {
      ownerId: user.id,
      examTitle,
      subjects: DEFAULT_SUBJECTS,
      rules: DEFAULT_RULES,
      activeSets: ["P"],
      answerKeys: EMPTY_ANSWER_KEYS,
    },
  });

  revalidatePath("/omr/evaluate");
  redirect(`/omr/evaluate/${config.id}/settings`);
}

export async function deleteExamConfigAction(formData: FormData) {
  const user = await requireOmrAccess();
  const examId = String(formData.get("examId") || "");
  const existing = await getOwnedExamConfig(examId, user.id);
  if (!existing) throw new Error("Exam not found.");

  await db.omrExamConfig.delete({ where: { id: examId } });
  revalidatePath("/omr/evaluate");
}

export async function updateExamSettingsAction(
  _prevState: ExamActionState,
  formData: FormData
): Promise<ExamActionState> {
  const user = await requireOmrAccess();
  const examId = String(formData.get("examId") || "");
  const existing = await getOwnedExamConfig(examId, user.id);
  if (!existing) return { error: "Exam not found." };

  const MAX_SUBJECTS = 5;
  const subjects: Subject[] = [1, 2, 3, 4, 5]
    .map((i) => ({
      name: String(formData.get(`subject${i}Name`) || "").trim() || `Section ${i}`,
      count: Math.max(0, Number(formData.get(`subject${i}Count`)) || 0),
    }))
    .filter((s, idx) => formData.has(`subject${idx + 1}Name`) || formData.has(`subject${idx + 1}Count`))
    .slice(0, MAX_SUBJECTS);
  if (subjects.length === 0) return { error: "Add at least one section." };
  const total = totalQuestions(subjects);
  if (total <= 0) return { error: "Add at least one question across the sections." };
  if (total > 200) return { error: "This exam supports up to 200 questions in total." };

  const setCount = Math.min(4, Math.max(1, Number(formData.get("setCount")) || 1));
  const activeSets = ALL_SERIES_LETTERS.slice(0, setCount);

  const existingAnswerKeys = { ...EMPTY_ANSWER_KEYS, ...(existing.answerKeys as unknown as Partial<AnswerKeys>) };
  const answerKeys: AnswerKeys = { ...existingAnswerKeys };
  const errors: string[] = [];

  for (const set of ALL_SERIES_LETTERS) {
    if (!activeSets.includes(set)) continue; // inactive sets: leave saved data untouched
    const submitted = [...formData.keys()].some((k) => k.startsWith(`q_${set}_`));
    if (submitted) {
      const answerKey: Record<number, string> = {};
      for (let i = 1; i <= total; i++) {
        const letter = String(formData.get(`q_${set}_${i}`) || "").trim().toUpperCase();
        if (!["A", "B", "C", "D"].includes(letter)) {
          errors.push(`Set ${set} Q${i}: no answer selected`);
          continue;
        }
        answerKey[i] = letter;
      }
      answerKeys[set] = answerKey;
    } else {
      // Locked/untouched — keep whatever was saved, as long as the total
      // still matches (a section-size change invalidates the old mapping).
      const prev = existingAnswerKeys[set] || {};
      answerKeys[set] = Object.keys(prev).length === total ? prev : {};
    }
  }

  if (errors.length > 0) return { error: errors[0] };

  const rules: MarkingRules = {
    marksCorrect: Number(formData.get("marksCorrect")) || 0,
    marksWrong: Number(formData.get("marksWrong")) || 0,
    marksUnattempted: Number(formData.get("marksUnattempted")) || 0,
    marksMultiple: Number(formData.get("marksMultiple")) || 0,
  };

  await db.omrExamConfig.update({
    where: { id: examId },
    data: {
      examTitle: String(formData.get("examTitle") || "").trim() || "Untitled Exam",
      subjects,
      rules,
      activeSets,
      answerKeys,
      sheetsExportEmail: String(formData.get("sheetsExportEmail") || "").trim() || null,
    },
  });

  revalidatePath(`/omr/evaluate/${examId}/settings`);
  redirect(`/omr/evaluate/${examId}/settings?saved=1`);
}

export type ScanActionState = { error: string } | undefined;

export async function scanSheetAction(_prevState: ScanActionState, formData: FormData): Promise<ScanActionState> {
  const user = await requireOmrAccess();
  const examId = String(formData.get("examId") || "");
  const config = await getOwnedExamConfig(examId, user.id);
  if (!config) return { error: "Exam not found." };

  const subjects = config.subjects as unknown as Subject[];
  const total = totalQuestions(subjects);
  const answerKeys = { ...EMPTY_ANSWER_KEYS, ...(config.answerKeys as unknown as Partial<AnswerKeys>) };
  const activeSets = config.activeSets as SeriesLetter[];
  const multiSet = activeSets.length > 1;

  for (const set of activeSets) {
    if (Object.keys(answerKeys[set] || {}).length < total) {
      return {
        error: `Set ${set}'s answer key is not fully configured yet — go to Settings and fill in every active set.`,
      };
    }
  }

  const file = formData.get("sheetImage");
  if (!(file instanceof File) || file.size === 0) return { error: "Please choose a sheet image." };
  if (file.size > 20 * 1024 * 1024) return { error: "Image is too large (max 20MB)." };

  let corners: Point[];
  try {
    corners = JSON.parse(String(formData.get("corners") || ""));
  } catch {
    return { error: "Corner points were missing — click all 4 corners of the sheet before submitting." };
  }
  if (
    !Array.isArray(corners) ||
    corners.length !== 4 ||
    corners.some((p) => !Array.isArray(p) || p.length !== 2)
  ) {
    return { error: "Exactly 4 corner points (top-left, top-right, bottom-right, bottom-left) are required." };
  }

  let resultId: string;
  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    const sourceImage = await Jimp.read(buffer);
    const { width: canonW, height: canonH, scale } = canonicalPixelSize();

    const gray = warpToGrayscale(sourceImage, corners, canonW, canonH);
    const gridLayout = getResponseGridLayout(subjects);
    const rollLayout = getRollNumberGridLayout();

    const detectedAnswers = readResponses(gray, canonW, canonH, gridLayout.bubbles);
    const detectedRoll = readRollNumber(gray, canonW, canonH, rollLayout.bubbles);

    // Multi-set: read which booklet series (P/Q/R/S) this sheet is and score
    // against that set's key instead of always using Set P. If the series
    // can't be confidently read, or reads as a series this exam isn't using,
    // fall back to Set P but flag it clearly rather than silently mis-scoring.
    let detectedSet: string | null = null;
    let bookletCode: string | null = null;
    let setWarning: string | null = null;
    let answerKeyToUse = answerKeys.P;
    if (multiSet) {
      const bookletLayout = getBookletCodeGridLayout();
      const booklet = readBookletCode(gray, canonW, canonH, bookletLayout.bubbles);
      bookletCode = booklet.code;
      if (booklet.detected && booklet.series && activeSets.includes(booklet.series as SeriesLetter)) {
        detectedSet = booklet.series;
        answerKeyToUse = answerKeys[booklet.series as SeriesLetter];
      } else if (booklet.detected) {
        setWarning = `Detected booklet series "${booklet.series}", which isn't one of this exam's active sets (${activeSets.join("/")}) — scored against Set P instead. Verify the student's Test Booklet Code bubble.`;
      } else {
        setWarning =
          "Could not confidently read the Test Booklet Code bubble (series letter) — scored against Set P by default. Verify the student darkened exactly one cell in the Test Booklet Code grid.";
      }
    }

    const scoreResult = scoreExam(detectedAnswers, answerKeyToUse, config.rules as unknown as MarkingRules, total);

    const studentNameInput = String(formData.get("studentName") || "").trim();
    const rollNumberOverride = String(formData.get("rollNumber") || "").trim();
    const rollNumber = rollNumberOverride || detectedRoll.rollNumber;

    const uploadImageUrl = await uploadOmrScanImage(buffer, user.id, file.type || "image/jpeg");
    const overlayImg = buildOverlayImage(gray, canonW, canonH, gridLayout, scoreResult.details, scale);
    const overlayBuffer = await overlayImg.getBufferAsync("image/png");
    const overlayImageUrl = await uploadOmrOverlayImage(overlayBuffer, user.id);

    const record = await db.omrResult.create({
      data: {
        examConfigId: config.id,
        ownerId: user.id,
        rollNumber,
        studentName: studentNameInput || null,
        score: scoreResult.score,
        correctCount: scoreResult.correctCount,
        wrongCount: scoreResult.wrongCount,
        unattemptedCount: scoreResult.unattemptedCount,
        multipleCount: scoreResult.multipleCount,
        details: scoreResult.details,
        bookletSeries: detectedSet,
        setWarning,
        uploadImageUrl,
        overlayImageUrl,
        examTitle: config.examTitle,
        totalQuestions: total,
      },
    });
    resultId = record.id;
    void bookletCode; // kept for parity with the original record shape; not stored as its own column (bookletSeries covers scoring needs)
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed to process the scanned sheet." };
  }

  revalidatePath(`/omr/evaluate/${examId}/results`);
  redirect(`/omr/evaluate/${examId}/results/${resultId}`);
}
