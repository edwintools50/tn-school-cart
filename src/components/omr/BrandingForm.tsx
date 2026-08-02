"use client";

import { useActionState, useState } from "react";
import type { BrandingActionState } from "@/app/omr/branding/actions";

const inputClass =
  "w-full rounded-md border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand";
const labelClass = "block text-sm font-medium mb-1";

export default function BrandingForm({
  action,
  removeLogoAction,
  initialInstituteName,
  initialPrimaryColor,
  initialLogoUrl,
}: {
  action: (prevState: BrandingActionState, formData: FormData) => Promise<BrandingActionState>;
  removeLogoAction: (formData: FormData) => Promise<void>;
  initialInstituteName: string;
  initialPrimaryColor: string;
  initialLogoUrl: string | null;
}) {
  const [state, formAction, pending] = useActionState(action, undefined);
  const [primaryColor, setPrimaryColor] = useState(initialPrimaryColor);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  return (
    <div className="space-y-6">
      <form action={formAction} className="card p-6 space-y-4">
        <div>
          <label className={labelClass} htmlFor="instituteName">
            Institute name
          </label>
          <input
            id="instituteName"
            name="instituteName"
            defaultValue={initialInstituteName}
            placeholder="e.g. Sri Vidya Academy"
            maxLength={48}
            className={inputClass}
          />
          <p className="text-xs text-foreground/50 mt-1">
            Shown at the top of generated sheets and report cards instead of &ldquo;OMNI OMR Creator&rdquo;. Leave
            blank to keep the default branding.
          </p>
        </div>

        <div>
          <label className={labelClass} htmlFor="primaryColorPicker">
            Primary color
          </label>
          <div className="flex items-center gap-3">
            <input
              id="primaryColorPicker"
              type="color"
              value={primaryColor}
              onChange={(e) => setPrimaryColor(e.target.value)}
              className="h-10 w-14 rounded border border-border cursor-pointer"
            />
            <input
              name="primaryColor"
              value={primaryColor}
              onChange={(e) => setPrimaryColor(e.target.value)}
              pattern="^#[0-9a-fA-F]{6}$"
              className={`${inputClass} w-32 font-mono`}
            />
          </div>
          <p className="text-xs text-foreground/50 mt-1">Used for the masthead title and report card accents.</p>
        </div>

        <div>
          <label className={labelClass} htmlFor="logo">
            Logo
          </label>
          {(logoPreview || initialLogoUrl) && (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={logoPreview || initialLogoUrl || ""}
              alt="Current logo"
              className="h-16 w-16 object-contain rounded-md border border-border mb-2 bg-white"
            />
          )}
          <input
            id="logo"
            name="logo"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={(e) => {
              const file = e.target.files?.[0];
              setLogoPreview(file ? URL.createObjectURL(file) : null);
            }}
            className={inputClass}
          />
          <p className="text-xs text-foreground/50 mt-1">
            JPG, PNG, or WEBP, max 3MB — automatically resized to fit a small corner logo.
          </p>
        </div>

        {state?.error && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">{state.error}</p>
        )}
        {state?.saved && (
          <p className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-md px-3 py-2">
            Branding saved.
          </p>
        )}

        <button
          type="submit"
          disabled={pending}
          className="bg-brand text-white font-semibold rounded-md px-5 py-2.5 hover:bg-brand-dark transition-colors disabled:opacity-60"
        >
          {pending ? "Saving..." : "Save branding"}
        </button>
      </form>

      {initialLogoUrl && (
        <form action={removeLogoAction}>
          <button type="submit" className="text-sm text-red-600 hover:underline">
            Remove current logo
          </button>
        </form>
      )}
    </div>
  );
}
