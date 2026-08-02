import { NextResponse } from "next/server";
import { notFound } from "next/navigation";
import { requireOmrAccess } from "@/lib/omr/access";
import { db } from "@/lib/db";
import { toOmrResultLike } from "@/lib/omr/resultAdapter";
import { groupKey } from "@/lib/omr/dashboardStats";
import { computeRankInfo, generateReportCardPdf } from "@/lib/omr/reportCard";
import { getActiveBranding } from "@/lib/omr/branding";
import type { Subject, MarkingRules } from "@/lib/omr/types";

export async function GET(_request: Request, { params }: { params: Promise<{ resultId: string }> }) {
  const user = await requireOmrAccess();
  const { resultId } = await params;

  const resultRow = await db.omrResult.findUnique({ where: { id: resultId } });
  if (!resultRow || resultRow.ownerId !== user.id) notFound();

  const examConfig = await db.omrExamConfig.findUnique({ where: { id: resultRow.examConfigId } });
  if (!examConfig) notFound();

  const result = toOmrResultLike(resultRow);
  const otherRows = await db.omrResult.findMany({ where: { ownerId: user.id } });
  const examGroupResults = otherRows.map(toOmrResultLike).filter((r) => groupKey(r) === groupKey(result));
  const rankInfo = computeRankInfo(result, examGroupResults);

  const branding = await getActiveBranding(user.id);
  const buffer = await generateReportCardPdf({
    result,
    subjects: examConfig.subjects as unknown as Subject[],
    rules: examConfig.rules as unknown as MarkingRules,
    rankInfo,
    branding,
  });

  const safeName = (result.studentName || result.rollNumberEntered || result.rollNumberDetected || "student").replace(
    /[^a-z0-9]+/gi,
    "_"
  );

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="ReportCard_${safeName}.pdf"`,
    },
  });
}
