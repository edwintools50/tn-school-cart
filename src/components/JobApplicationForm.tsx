"use client";

import { useActionState } from "react";
import { submitApplicationAction } from "@/app/jobs/actions";

export default function JobApplicationForm({
  jobVacancyId,
  existing,
}: {
  jobVacancyId: string;
  existing?: { coverNote: string } | null;
}) {
  const [state, formAction, pending] = useActionState(submitApplicationAction, undefined);

  return (
    <form action={formAction} className="card p-4 space-y-3">
      <input type="hidden" name="jobVacancyId" value={jobVacancyId} />
      <h3 className="font-semibold text-sm">
        {existing ? "Update your application" : "Apply for this role"}
      </h3>
      <div>
        <label className="block text-xs font-medium mb-1" htmlFor="coverNote">
          Cover note to the school
        </label>
        <textarea
          id="coverNote"
          name="coverNote"
          required
          rows={3}
          placeholder="Briefly introduce yourself and why you're a good fit."
          defaultValue={existing?.coverNote}
          className="w-full rounded-md border border-border px-3 py-2 text-sm"
        />
      </div>
      {state?.error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">
          {state.error}
        </p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="bg-accent text-white font-semibold rounded-md px-4 py-2 text-sm hover:bg-accent-dark transition-colors disabled:opacity-60"
      >
        {pending ? "Submitting..." : existing ? "Update application" : "Submit application"}
      </button>
    </form>
  );
}
