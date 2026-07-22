"use client";

import { useActionState, useState } from "react";
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
    isDigital?: boolean;
    fileUrl?: string | null;
  };
  submitLabel: string;
}) {
  const [state, formAction, pending] = useActionState(action, undefined);
  const [isDigital, setIsDigital] = useState(defaultValues?.isDigital ?? false);

  return (
    <form action={formAction} className="space-y-4">
      {defaultValues?.productId && (
        <input type="hidden" name="productId" value={defaultValues.productId} />
      )}
      {!defaultValues?.productId && defaultValues?.imageUrl && (
        <input type="hidden" name="existingImageUrl" value={defaultValues.imageUrl} />
      )}
      {!defaultValues?.productId && defaultValues?.fileUrl && (
        <input type="hidden" name="existingFileUrl" value={defaultValues.fileUrl} />
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

      <div className="flex items-center gap-2">
        <input
          id="isDigital"
          name="isDigital"
          type="checkbox"
          value="true"
          checked={isDigital}
          onChange={(e) => setIsDigital(e.target.checked)}
          className="h-4 w-4"
        />
        <label htmlFor="isDigital" className="text-sm font-medium">
          This is a digital product (e-content) &mdash; buyers get an emailed
          download link instead of a physical delivery
        </label>
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
          {isDigital ? (
            <input type="hidden" name="unit" value="download" />
          ) : (
            <>
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
            </>
          )}
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
          {isDigital ? (
            <input type="hidden" name="stock" value="999999" />
          ) : (
            <>
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
            </>
          )}
        </div>
      </div>

      {isDigital && (
        <div>
          <label className={labelClass} htmlFor="digitalFile">
            Digital file (PDF, ZIP, DOC, DOCX, PPT, or PPTX &mdash; max 3.5MB)
          </label>
          {defaultValues?.fileUrl && (
            <a
              href={defaultValues.fileUrl}
              target="_blank"
              rel="noreferrer"
              className="text-xs text-brand hover:underline block mb-2"
            >
              Current file &rarr;
            </a>
          )}
          <input
            id="digitalFile"
            name="digitalFile"
            type="file"
            accept=".pdf,.zip,.doc,.docx,.ppt,.pptx"
            required={!defaultValues?.fileUrl}
            className={inputClass}
          />
          {defaultValues?.fileUrl && (
            <p className="text-xs text-foreground/50 mt-1">
              Leave blank to keep the current file.
            </p>
          )}
        </div>
      )}

      <div>
        <label className={labelClass} htmlFor="imagePhoto">
          {isDigital ? "Cover image (optional)" : "Product photo (optional)"}
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
