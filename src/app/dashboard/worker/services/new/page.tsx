import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import ServiceForm from "@/components/ServiceForm";
import { createServiceAction } from "../../actions";

export default async function NewServicePage({
  searchParams,
}: {
  searchParams: Promise<{ duplicate?: string }>;
}) {
  const user = await requireUser(["WORKER"]);
  const { duplicate } = await searchParams;

  const source = duplicate
    ? await db.gigService.findUnique({ where: { id: duplicate } })
    : null;
  const sourceService = source && source.workerId === user.id ? source : null;

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 w-full">
      <h1 className="text-2xl font-bold mb-1">
        {sourceService ? "Duplicate service" : "List a new service"}
      </h1>
      {sourceService && (
        <p className="text-sm text-foreground/60 mb-6">
          Fields are pre-filled from &ldquo;{sourceService.title}&rdquo;. Edit
          what&apos;s different and submit.
        </p>
      )}
      <div className={sourceService ? "card p-6" : "card p-6 mt-6"}>
        <ServiceForm
          action={createServiceAction}
          submitLabel="Submit for review"
          defaultValues={
            sourceService
              ? {
                  category: sourceService.category,
                  title: sourceService.title,
                  description: sourceService.description,
                  priceType: sourceService.priceType,
                  price: sourceService.price,
                  serviceArea: sourceService.serviceArea,
                }
              : undefined
          }
        />
      </div>
    </div>
  );
}
