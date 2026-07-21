"use client";

import { useActionState } from "react";
import { PRODUCT_CATEGORY_LABELS } from "@/lib/constants";
import type { ActionState } from "@/app/dashboard/supplier/actions";

const inputClass =
  "w-full rounded-md border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand";
const labelClass = "block text-sm font-medium mb-1";

export default function ProductForm({
  action,
  defaultValues,
  submitLabel,
}: {
  action: (prevState: ActionState, formData: FormData) => Promise<ActionState>;
  defaultValues?: {
    productId?: string;
    title?: string;
    description?: string;
    category?: string;
    price?: number;
    unit?: string;
    stock?: number;
    imageUrl?: string | null;
  };
  submitLabel: string;
}) {
  const [state, formAction, pending] = useActionState(action, undefined);

  return (
    <form action={formAction} className="space-y-4">
      {defaultValues?.productId && (
        <input type="hidden" name="productId" value={defaultValues.productId} />
      )}
      {!defaultValues?.productId && defaultValues?.imageUrl && (
        <input type="hidden" name="existingImageUrl" value={defaultValues.imageUrl} />
      )}

      <div>
        <label className={labelClass} htmlFor="title">
          Product title
        </label>
        <input
          id="title"
          name="title"
          required
          defaultValue={defaultValues?.title}
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
          <label className={labelClass} htmlFor="category">
            Category
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
            {Object.entries(PRODUCT_CATEGORY_LABELS).map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelClass} htmlFor="unit">
            Unit
          </label>
          <input
            id="unit"
            name="unit"
            placeholder="piece, box, dozen..."
            defaultValue={defaultValues?.unit ?? "piece"}
            required
            className={inputClass}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelClass} htmlFor="price">
            Price (&#8377;)
          </label>
          <input
            id="price"
            name="price"
            type="number"
            step="0.01"
            min="0"
            required
            defaultValue={defaultValues?.price}
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass} htmlFor="stock">
            Stock available
          </label>
          <input
            id="stock"
            name="stock"
            type="number"
            min="0"
            required
            defaultValue={defaultValues?.stock}
            className={inputClass}
          />
        </div>
      </div>

      <div>
        <label className={labelClass} htmlFor="imagePhoto">
          Product photo (optional)
        </label>
        {defaultValues?.imageUrl && (
          <img
            src={defaultValues.imageUrl}
            alt="Current product photo"
            className="h-20 w-20 object-cover rounded-md border border-border mb-2"
          />
        )}
        <input
          id="imagePhoto"
          name="imagePhoto"
          type="file"
          accept="image/*"
          className={inputClass}
        />
        {defaultValues?.imageUrl && (
          <p className="text-xs text-foreground/50 mt-1">
            Leave blank to keep the current photo.
          </p>
        )}
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
