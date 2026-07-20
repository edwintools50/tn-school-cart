"use client";

import { useActionState } from "react";
import { createGigRequestAction } from "@/app/gigs/actions";
import { GIG_CATEGORY_LABELS, TN_DISTRICTS } from "@/lib/constants";

const inputClass =
  "w-full rounded-md border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand";
const labelClass = "block text-sm font-medium mb-1";

export default function GigRequestForm({
  defaultCategory,
  defaultUdiseNumber,
}: {
  defaultCategory?: string;
  defaultUdiseNumber?: string;
}) {
  const [state, formAction, pending] = useActionState(createGigRequestAction, undefined);

  return (
    <form action={formAction} className="space-y-4">
      <div>
        <label className={labelClass} htmlFor="category">
          Type of work
        </label>
        <select
          id="category"
          name="category"
          required
          defaultValue={defaultCategory ?? ""}
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
          Job title
        </label>
        <input
          id="title"
          name="title"
          required
          placeholder="e.g. Repair leaking pipe in staff toilet"
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
          placeholder="Describe the work needed, scope, access details etc."
          className={inputClass}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelClass} htmlFor="schoolName">
            School name
          </label>
          <input id="schoolName" name="schoolName" required className={inputClass} />
        </div>
        <div>
          <label className={labelClass} htmlFor="udiseNumber">
            UDISE number
          </label>
          <input
            id="udiseNumber"
            name="udiseNumber"
            inputMode="numeric"
            pattern="\d{11}"
            maxLength={11}
            placeholder="11-digit code"
            defaultValue={defaultUdiseNumber ?? ""}
            required
            className={inputClass}
          />
        </div>
      </div>

      <div>
        <label className={labelClass} htmlFor="district">
          District
        </label>
        <select id="district" name="district" required defaultValue="" className={inputClass}>
          <option value="">Select district</option>
          {TN_DISTRICTS.map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className={labelClass} htmlFor="taluk">
            Taluk
          </label>
          <input id="taluk" name="taluk" required className={inputClass} />
        </div>
        <div>
          <label className={labelClass} htmlFor="block">
            Block
          </label>
          <input id="block" name="block" required className={inputClass} />
        </div>
        <div>
          <label className={labelClass} htmlFor="pinCode">
            Pin code
          </label>
          <input
            id="pinCode"
            name="pinCode"
            inputMode="numeric"
            pattern="\d{6}"
            maxLength={6}
            required
            className={inputClass}
          />
        </div>
      </div>

      <div>
        <label className={labelClass} htmlFor="address">
          School address
        </label>
        <input id="address" name="address" required className={inputClass} />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelClass} htmlFor="preferredDate">
            Preferred date (optional)
          </label>
          <input id="preferredDate" name="preferredDate" type="date" className={inputClass} />
        </div>
        <div>
          <label className={labelClass} htmlFor="budget">
            Budget in &#8377; (optional)
          </label>
          <input id="budget" name="budget" type="number" min="0" className={inputClass} />
        </div>
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
        {pending ? "Posting..." : "Post gig request"}
      </button>
    </form>
  );
}
