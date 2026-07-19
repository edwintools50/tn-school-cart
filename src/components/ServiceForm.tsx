"use client";

import { useActionState, useState } from "react";
import { GIG_CATEGORY_LABELS, TN_DISTRICTS } from "@/lib/constants";
import type { ActionState } from "@/app/dashboard/worker/actions";

const inputClass =
  "w-full rounded-md border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand";
const labelClass = "block text-sm font-medium mb-1";

export default function ServiceForm({
  action,
  defaultValues,
  submitLabel,
}: {
  action: (prevState: ActionState, formData: FormData) => Promise<ActionState>;
  defaultValues?: {
    serviceId?: string;
    category?: string;
    title?: string;
    description?: string;
    priceType?: string;
    price?: number | null;
    serviceArea?: string;
  };
  submitLabel: string;
}) {
  const [state, formAction, pending] = useActionState(action, undefined);
  const [priceType, setPriceType] = useState(defaultValues?.priceType ?? "QUOTE");

  return (
    <form action={formAction} className="space-y-4">
      {defaultValues?.serviceId && (
        <input type="hidden" name="serviceId" value={defaultValues.serviceId} />
      )}

      <div>
        <label className={labelClass} htmlFor="category">
          Type of work
        </label>
        <select
          id="category"
          name="category"
          required
          defaultValue={defaultValues?.category ?? ""}
          className={inputClass}
        >
          <option value="" disabled>
            Select category
          </option>
          {Object.entries(GIG_CATEGORY_LABELS).map(([key, label]) => (
            <option key={key} value={key}>
              {label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className={labelClass} htmlFor="title">
          Service title
        </label>
        <input
          id="title"
          name="title"
          required
          defaultValue={defaultValues?.title}
          placeholder="e.g. Licensed electrician for wiring & repairs"
          className={inputClass}
        />
      </div>

      <div>
        <label className={labelClass} htmlFor="description">
          Description
        </label>
        <textarea
          id="description"
          name="description"
          required
          rows={4}
          defaultValue={defaultValues?.description}
          className={inputClass}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelClass} htmlFor="priceType">
            Pricing
          </label>
          <select
            id="priceType"
            name="priceType"
            value={priceType}
            onChange={(e) => setPriceType(e.target.value)}
            className={inputClass}
          >
            <option value="QUOTE">Quote per job</option>
            <option value="FIXED">Fixed price</option>
            <option value="HOURLY">Hourly rate</option>
          </select>
        </div>
        {priceType !== "QUOTE" && (
          <div>
            <label className={labelClass} htmlFor="price">
              Price (&#8377;)
            </label>
            <input
              id="price"
              name="price"
              type="number"
              min="0"
              step="0.01"
              defaultValue={defaultValues?.price ?? undefined}
              className={inputClass}
            />
          </div>
        )}
      </div>

      <div>
        <label className={labelClass} htmlFor="serviceArea">
          Service area (district)
        </label>
        <select
          id="serviceArea"
          name="serviceArea"
          required
          defaultValue={defaultValues?.serviceArea ?? ""}
          className={inputClass}
        >
          <option value="" disabled>
            Select district
          </option>
          {TN_DISTRICTS.map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </select>
      </div>

      {state?.error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="bg-brand text-white font-semibold rounded-md px-5 py-2.5 hover:bg-brand-dark transition-colors disabled:opacity-60"
      >
        {pending ? "Saving..." : submitLabel}
      </button>
    </form>
  );
}
