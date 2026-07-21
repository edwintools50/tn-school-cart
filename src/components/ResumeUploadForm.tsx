"use client";

import { useActionState } from "react";
import { updateResumeAction } from "@/app/dashboard/teacher/actions";

export default function ResumeUploadForm() {
  const [state, formAction, pending] = useActionState(updateResumeAction, undefined);

  return (
    <form action={formAction} className="flex items-end gap-3 flex-wrap">
      <div>
        <label className="block text-xs font-medium mb-1" htmlFor="resume">
          Upload / replace resume (PDF)
        </label>
        <input
          id="resume"
          name="resume"
          type="file"
          accept="application/pdf"
          required
          className="text-sm"
        />
      </div>
      <button
        type="submit"
        disabled={pending}
        className="border border-border font-semibold rounded-md px-4 py-2 text-sm hover:border-brand disabled:opacity-60"
      >
        {pending ? "Uploading..." : "Save resume"}
      </button>
      {state?.error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2 w-full">
          {state.error}
        </p>
      )}
    </form>
  );
}
