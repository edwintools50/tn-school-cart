import { requireUser } from "@/lib/auth";
import JobVacancyForm from "@/components/JobVacancyForm";

export default async function NewJobVacancyPage() {
  const user = await requireUser(["PRINCIPAL"]);

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 w-full">
      <h1 className="text-2xl font-bold mb-1">Post a job vacancy</h1>
      <p className="text-sm text-foreground/60 mb-6">
        Describe the teaching role and interested teachers will apply.
      </p>
      <div className="card p-6">
        <JobVacancyForm defaultUdiseNumber={user.udiseNumber ?? undefined} />
      </div>
    </div>
  );
}
