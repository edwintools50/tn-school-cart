import { requireUser } from "@/lib/auth";
import ServiceForm from "@/components/ServiceForm";
import { createServiceAction } from "../../actions";

export default async function NewServicePage() {
  await requireUser(["WORKER"]);

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 w-full">
      <h1 className="text-2xl font-bold mb-6">List a new service</h1>
      <div className="card p-6">
        <ServiceForm action={createServiceAction} submitLabel="Submit for review" />
      </div>
    </div>
  );
}
