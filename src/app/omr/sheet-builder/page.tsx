import Link from "next/link";
import { ScanLine } from "lucide-react";
import { requireOmrAccess } from "@/lib/omr/access";
import { db } from "@/lib/db";
import SheetBuilderForm from "@/components/omr/SheetBuilderForm";
import GeneratedSheetActions from "@/components/omr/GeneratedSheetActions";
import { generateSheetAction, generateBatchSheetAction } from "./actions";

export default async function SheetBuilderPage() {
  const user = await requireOmrAccess();
  const recentSheets = await db.omrGeneratedSheet.findMany({
    where: { ownerId: user.id },
    orderBy: { createdAt: "desc" },
    take: 10,
  });

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 w-full">
      <div className="flex items-start justify-between gap-4 mb-1">
        <h1 className="text-2xl font-bold">OMR Sheet Builder</h1>
        <div className="flex gap-2 shrink-0">
          <Link
            href="/omr/evaluate"
            className="flex items-center gap-1.5 rounded-md border border-brand/30 px-3 py-1.5 text-sm text-brand-dark hover:bg-brand/5"
          >
            <ScanLine size={15} />
            Scan a Sheet
          </Link>
          <Link href="/omr/branding" className="rounded-md border border-border px-3 py-1.5 text-sm hover:bg-black/5">
            Branding
          </Link>
        </div>
      </div>
      <p className="text-sm text-foreground/60 mb-6">
        Generate printable OMR answer sheets for self-practice mock tests — a
        single copy, or a personalized batch from a roster of students.
      </p>

      <div className="card p-6">
        <SheetBuilderForm generateAction={generateSheetAction} generateBatchAction={generateBatchSheetAction} />
      </div>

      {recentSheets.length > 0 && (
        <div className="mt-8">
          <h2 className="text-lg font-semibold mb-3">Recently generated</h2>
          <ul className="space-y-2">
            {recentSheets.map((sheet) => (
              <li key={sheet.id} className="card p-4 flex flex-col gap-2">
                <div className="flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <p className="font-medium text-sm truncate">{sheet.title}</p>
                    <p className="text-xs text-foreground/50">
                      {sheet.isBatch ? `Batch · ${sheet.studentCount} students` : "Single sheet"} ·{" "}
                      {sheet.createdAt.toLocaleDateString("en-IN")}
                    </p>
                  </div>
                  <a
                    href={sheet.fileUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-sm font-semibold text-brand hover:underline shrink-0"
                  >
                    Download
                  </a>
                </div>
                <GeneratedSheetActions fileUrl={sheet.fileUrl} title={sheet.title} />
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
