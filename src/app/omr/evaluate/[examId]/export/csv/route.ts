import { NextResponse } from "next/server";
import { notFound } from "next/navigation";
import { requireOmrAccess } from "@/lib/omr/access";
import { db } from "@/lib/db";

const HEADERS = [
  "id",
  "createdAt",
  "studentName",
  "rollNumber",
  "examTitle",
  "totalQuestions",
  "bookletSeries",
  "score",
  "correctCount",
  "wrongCount",
  "unattemptedCount",
  "multipleCount",
] as const;

function escape(v: unknown): string {
  return `"${String(v ?? "").replace(/"/g, '""')}"`;
}

export async function GET(_request: Request, { params }: { params: Promise<{ examId: string }> }) {
  const user = await requireOmrAccess();
  const { examId } = await params;

  const config = await db.omrExamConfig.findUnique({ where: { id: examId } });
  if (!config || config.ownerId !== user.id) notFound();

  const results = await db.omrResult.findMany({
    where: { examConfigId: examId },
    orderBy: { createdAt: "asc" },
  });

  const lines = [HEADERS.join(",")];
  for (const r of results) {
    lines.push(
      HEADERS.map((h) => escape(h === "createdAt" ? r.createdAt.toISOString() : (r as unknown as Record<string, unknown>)[h])).join(",")
    );
  }

  return new NextResponse(lines.join("\r\n"), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="omr_results_${Date.now()}.csv"`,
    },
  });
}
