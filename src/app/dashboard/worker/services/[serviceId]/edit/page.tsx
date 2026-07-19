import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import ServiceForm from "@/components/ServiceForm";
import { updateServiceAction } from "../../../actions";

export default async function EditServicePage({
  params,
}: {
  params: Promise<{ serviceId: string }>;
}) {
  const { serviceId } = await params;
  const user = await requireUser(["WORKER"]);

  const service = await db.gigService.findUnique({ where: { id: serviceId } });
  if (!service || service.workerId !== user.id) notFound();

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 w-full">
      <h1 className="text-2xl font-bold mb-6">Edit service</h1>
      <p className="text-xs text-foreground/50 mb-4">
        Saving changes will send this listing back for admin review.
      </p>
      <div className="card p-6">
        <ServiceForm
          action={updateServiceAction}
          submitLabel="Save changes"
          defaultValues={{
            serviceId: service.id,
            category: service.category,
            title: service.title,
            description: service.description,
            priceType: service.priceType,
            price: service.price,
            serviceArea: service.serviceArea,
          }}
        />
      </div>
    </div>
  );
}
