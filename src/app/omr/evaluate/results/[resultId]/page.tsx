import { notFound, redirect } from "next/navigation";
import { requireOmrAccess } from "@/lib/omr/access";
import { db } from "@/lib/db";

// Suite-wide pages (Dashboard, Progress Tracker) link to a result without
// knowing which exam it belongs to — this resolves that and forwards to the
// canonical nested URL rather than duplicating the result-detail page here.
export default async function ResultRedirectPage({ params }: { params: Promise<{ resultId: string }> }) {
  const user = await requireOmrAccess();
  const { resultId } = await params;

  const result = await db.omrResult.findUnique({ where: { id: resultId }, select: { ownerId: true, examConfigId: true } });
  if (!result || result.ownerId !== user.id) notFound();

  redirect(`/omr/evaluate/${result.examConfigId}/results/${resultId}`);
}
