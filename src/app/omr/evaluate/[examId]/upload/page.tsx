import { notFound } from "next/navigation";
import { requireOmrAccess } from "@/lib/omr/access";
import { db } from "@/lib/db";
import ScanUploadForm from "@/components/omr/ScanUploadForm";
import { scanSheetAction } from "../../actions";
import { totalQuestions } from "@/lib/omr/examConfig";
import type { Subject } from "@/lib/omr/types";

export default async function ScanUploadPage({ params }: { params: Promise<{ examId: string }> }) {
  const user = await requireOmrAccess();
  const { examId } = await params;

  const config = await db.omrExamConfig.findUnique({ where: { id: examId } });
  if (!config || config.ownerId !== user.id) notFound();

  const subjects = config.subjects as unknown as Subject[];
  const total = totalQuestions(subjects);
  const answerKeys = config.answerKeys as unknown as Record<string, Record<number, string>>;
  const activeSets = config.activeSets;
  const keyConfigured = total > 0 && activeSets.every((set) => Object.keys(answerKeys[set] || {}).length >= total);

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 w-full">
      <h1 className="text-2xl font-bold mb-1">Scan a Sheet</h1>
      <p className="text-sm text-foreground/60 mb-6">
        {config.examTitle} — photograph the filled sheet flat, well-lit, with all 4 corners visible, then click its
        corners here.
      </p>

      <ScanUploadForm
        action={scanSheetAction}
        examId={examId}
        keyConfigured={keyConfigured}
        multiSet={activeSets.length > 1}
        activeSetsLabel={activeSets.join("/")}
      />
    </div>
  );
}
