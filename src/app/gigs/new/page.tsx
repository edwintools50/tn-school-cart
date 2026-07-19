import { requireUser } from "@/lib/auth";
import GigRequestForm from "@/components/GigRequestForm";

export default async function NewGigRequestPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  await requireUser(["PRINCIPAL"]);
  const { category } = await searchParams;

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 w-full">
      <h1 className="text-2xl font-bold mb-1">Post a gig request</h1>
      <p className="text-sm text-foreground/60 mb-6">
        Describe the job and gig workers in your area will send you offers.
      </p>
      <div className="card p-6">
        <GigRequestForm defaultCategory={category} />
      </div>
    </div>
  );
}
