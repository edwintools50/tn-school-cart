"use client";

import { useActionState } from "react";
import { createJobVacancyAction } from "@/app/jobs/actions";
import {
  TEACHING_SUBJECT_GROUPS,
  TEACHING_SUBJECT_LABELS,
  EMPLOYMENT_TYPE_LABELS,
  COACHING_MODE_LABELS,
  TN_DISTRICTS,
} from "@/lib/constants";

const inputClass =
  "w-full rounded-md border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand";
const labelClass = "block text-sm font-medium mb-1";

export default function JobVacancyForm({
  recruiterRole,
  defaultUdiseNumber,
}: {
  recruiterRole: "PRINCIPAL" | "COACHING_CENTRE";
  defaultUdiseNumber?: string;
}) {
  const [state, formAction, pending] = useActionState(createJobVacancyAction, undefined);
  const isCoachingCentre = recruiterRole === "COACHING_CENTRE";

  return (
    <form action={formAction} className="space-y-4">
      <div>
        <label className={labelClass} htmlFor="subject">
          Subject
        </label>
        <select id="subject" name="subject" required defaultValue="" className={inputClass}>
          <option value="" disabled>
            Select subject
          </option>
          {TEACHING_SUBJECT_GROUPS.map((group) => (
            <optgroup key={group.label} label={group.label}>
              {group.keys.map((key) => (
                <option key={key} value={key}>
                  {TEACHING_SUBJECT_LABELS[key]}
                </option>
              ))}
            </optgroup>
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
          placeholder="e.g. Primary Tamil Teacher (Classes 3-5)"
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
          placeholder="Describe the role, responsibilities, working hours etc."
          className={inputClass}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelClass} htmlFor="schoolName">
            {isCoachingCentre ? "Coaching centre name" : "School name"}
          </label>
          <input id="schoolName" name="schoolName" required className={inputClass} />
        </div>
        {isCoachingCentre ? (
          <div>
            <label className={labelClass} htmlFor="coachingMode">
              Mode for this batch
            </label>
            <select id="coachingMode" name="coachingMode" required defaultValue="" className={inputClass}>
              <option value="" disabled>
                Select mode
              </option>
              {Object.entries(COACHING_MODE_LABELS).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
          </div>
        ) : (
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
        )}
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
          {isCoachingCentre ? "Centre address" : "School address"}
        </label>
        <input id="address" name="address" required className={inputClass} />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelClass} htmlFor="employmentType">
            Employment type
          </label>
          <select id="employmentType" name="employmentType" required defaultValue="" className={inputClass}>
            <option value="" disabled>
              Select type
            </option>
            {Object.entries(EMPLOYMENT_TYPE_LABELS).map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelClass} htmlFor="salaryRange">
            Salary range (optional)
          </label>
          <input
            id="salaryRange"
            name="salaryRange"
            placeholder="e.g. ₹15,000 - ₹20,000/month"
            className={inputClass}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelClass} htmlFor="qualificationRequired">
            Qualification required
          </label>
          <input
            id="qualificationRequired"
            name="qualificationRequired"
            placeholder="e.g. B.Ed with Tamil as a subject"
            required
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass} htmlFor="experienceRequired">
            Experience required
          </label>
          <input
            id="experienceRequired"
            name="experienceRequired"
            placeholder="e.g. 2+ years, or Freshers welcome"
            required
            className={inputClass}
          />
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
        {pending ? "Posting..." : "Post job vacancy"}
      </button>
    </form>
  );
}
