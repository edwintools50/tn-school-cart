"use client";

import { useActionState } from "react";
import { submitOfferAction } from "@/app/gigs/actions";

export default function GigOfferForm({
  gigRequestId,
  existing,
}: {
  gigRequestId: string;
  existing?: { quotedPrice: number; message: string } | null;
}) {
  const [state, formAction, pending] = useActionState(submitOfferAction, undefined);

  return (
    <form action={formAction} className="card p-4 space-y-3">
      <input type="hidden" name="gigRequestId" value={gigRequestId} />
      <h3 className="font-semibold text-sm">
        {existing ? "Update your offer" : "Submit an offer"}
      </h3>
      <div>
        <label className="block text-xs font-medium mb-1" htmlFor="quotedPrice">
          Your quote (&#8377;)
        </label>
        <input
          id="quotedPrice"
          name="quotedPrice"
          type="number"
          min="0"
          step="0.01"
          required
          defaultValue={existing?.quotedPrice}
          className="w-full rounded-md border border-border px-3 py-2 text-sm"
        />
      </div>
      <div>
        <label className="block text-xs font-medium mb-1" htmlFor="message">
          Message to the school
        </label>
        <textarea
          id="message"
          name="message"
          required
          rows={3}
          defaultValue={existing?.message}
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
        {pending ? "Submitting..." : existing ? "Update offer" : "Submit offer"}
      </button>
    </form>
  );
}
