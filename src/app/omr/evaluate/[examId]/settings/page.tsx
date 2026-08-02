import { notFound } from "next/navigation";
import { requireOmrAccess } from "@/lib/omr/access";
import { db } from "@/lib/db";
import AnswerKeyForm from "@/components/omr/AnswerKeyForm";
import { updateExamSettingsAction } from "../../actions";
import type { SeriesLetter } from "@/lib/omr/examConfig";
import type { Subject, MarkingRules } from "@/lib/omr/types";

export default async function ExamSettingsPage({
  params,
  searchParams,
}: {
  params: Promise<{ examId: string }>;
  searchParams: Promise<{ saved?: string }>;
}) {
  const user = await requireOmrAccess();
  const { examId } = await params;
  const { saved } = await searchParams;

  const config = await db.omrExamConfig.findUnique({ where: { id: examId } });
  if (!config || config.ownerId !== user.id) notFound();

  const subjects = config.subjects as unknown as Subject[];
  const rules = config.rules as unknown as MarkingRules;
  const answerKeys = {
    P: {},
    Q: {},
    R: {},
    S: {},
    ...(config.answerKeys as unknown as Partial<Record<SeriesLetter, Record<number, string>>>),
  } as Record<SeriesLetter, Record<number, string>>;

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 w-full">
      <h1 className="text-2xl font-bold mb-1">Rules &amp; Answer Key</h1>
      <p className="text-sm text-foreground/60 mb-6">
        These settings must match the blank sheet you printed (section sizes) and your exam&apos;s official key.
      </p>

      <AnswerKeyForm
        action={updateExamSettingsAction}
        examId={config.id}
        initialExamTitle={config.examTitle}
        initialSubjects={subjects}
        initialRules={rules}
        initialActiveSets={config.activeSets as SeriesLetter[]}
        initialAnswerKeys={answerKeys}
        initialSheetsExportEmail={config.sheetsExportEmail || ""}
        saved={saved === "1"}
      />
    </div>
  );
}
