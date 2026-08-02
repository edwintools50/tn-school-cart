import { NextResponse } from "next/server";
import { requireOmrAccess } from "@/lib/omr/access";
import { TEMPLATE_CSV } from "@/lib/omr/roster";

export async function GET() {
  await requireOmrAccess();
  return new NextResponse(TEMPLATE_CSV, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="roster-template.csv"',
    },
  });
}
