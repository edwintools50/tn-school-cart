"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { registerAction } from "../actions";
import {
  TN_DISTRICTS,
  ROLE_LABELS,
  TEACHING_SUBJECT_GROUPS,
  TEACHING_SUBJECT_LABELS,
  COACHING_MODE_LABELS,
  COMPETITIVE_EXAM_LABELS,
} from "@/lib/constants";

const inputClass =
  "w-full rounded-xl border border-border bg-surface px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand/40 focus:border-brand transition-shadow";
const labelClass = "block text-sm font-medium mb-1.5";

export default function RegisterPage() {
  const [state, formAction, pending] = useActionState(registerAction, undefined);
  const [role, setRole] = useState<
    "PRINCIPAL" | "SUPPLIER" | "WORKER" | "TEACHER" | "COACHING_CENTRE"
  >("PRINCIPAL");

  return (
    <div className="flex-1 flex items-center justify-center px-4 py-16">
      <div className="card w-full max-w-lg p-8">
        <h1 className="font-display text-2xl font-semibold mb-1">Create your account</h1>
        <p className="text-sm text-foreground-muted mb-6">
          Join as a school buyer, a supplier, a gig worker, a teacher looking for a job, or a
          coaching centre hiring teachers.
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-6">
          {(["PRINCIPAL", "SUPPLIER", "WORKER", "TEACHER", "COACHING_CENTRE"] as const).map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setRole(r)}
              className={`text-xs sm:text-sm font-semibold rounded-xl border px-2 py-2.5 transition-colors ${
                role === r
                  ? "bg-brand text-white border-brand"
                  : "border-border text-foreground-muted hover:border-brand"
              }`}
            >
              {r === "PRINCIPAL" && "Principal (Buyer)"}
              {r === "SUPPLIER" && "Supplier (Seller)"}
              {r === "WORKER" && "Gig Worker"}
              {r === "TEACHER" && "Teacher"}
              {r === "COACHING_CENTRE" && "Coaching Centre"}
            </button>
          ))}
        </div>

        <form action={formAction} className="space-y-4">
          <input type="hidden" name="role" value={role} />

          <div>
            <label className={labelClass} htmlFor="name">
              Full name
            </label>
            <input id="name" name="name" required className={inputClass} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass} htmlFor="email">
                Email
              </label>
              <input id="email" name="email" type="email" required className={inputClass} />
            </div>
            <div>
              <label className={labelClass} htmlFor="phone">
                Phone
              </label>
              <input id="phone" name="phone" type="tel" required className={inputClass} />
            </div>
          </div>

          <div>
            <label className={labelClass} htmlFor="password">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              minLength={8}
              required
              className={inputClass}
            />
          </div>

          {role === "PRINCIPAL" && (
            <>
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
                    required
                    className={inputClass}
                  />
                </div>
              </div>
              <div>
                <label className={labelClass} htmlFor="district">
                  District
                </label>
                <select id="district" name="district" required className={inputClass}>
                  <option value="">Select district</option>
                  {TN_DISTRICTS.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelClass} htmlFor="schoolPhoto">
                  School photo (signboard/building, optional)
                </label>
                <input
                  id="schoolPhoto"
                  name="schoolPhoto"
                  type="file"
                  accept="image/*"
                  className={inputClass}
                />
                <p className="text-xs text-foreground/50 mt-1">
                  Helps our admin team verify your school faster.
                </p>
              </div>
            </>
          )}

          {(role === "SUPPLIER" || role === "WORKER") && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClass} htmlFor="businessName">
                  {role === "SUPPLIER" ? "Business name" : "Your name / business name"}
                </label>
                <input id="businessName" name="businessName" required className={inputClass} />
              </div>
              <div>
                <label className={labelClass} htmlFor="serviceArea">
                  Service area
                </label>
                <select id="serviceArea" name="serviceArea" required className={inputClass}>
                  <option value="">Select district</option>
                  {TN_DISTRICTS.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {role === "TEACHER" && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClass} htmlFor="qualification">
                  Qualification
                </label>
                <input
                  id="qualification"
                  name="qualification"
                  placeholder="e.g. B.Ed, M.A. Tamil"
                  required
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass} htmlFor="subjectSpecialization">
                  Subject specialization
                </label>
                <select
                  id="subjectSpecialization"
                  name="subjectSpecialization"
                  required
                  defaultValue=""
                  className={inputClass}
                >
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
                <label className={labelClass} htmlFor="experienceYears">
                  Years of experience
                </label>
                <input
                  id="experienceYears"
                  name="experienceYears"
                  type="number"
                  min="0"
                  required
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass} htmlFor="serviceArea">
                  Preferred district
                </label>
                <select id="serviceArea" name="serviceArea" required defaultValue="" className={inputClass}>
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
              <div className="col-span-2">
                <label className={labelClass} htmlFor="resume">
                  Resume / CV (PDF, optional)
                </label>
                <input
                  id="resume"
                  name="resume"
                  type="file"
                  accept="application/pdf"
                  className={inputClass}
                />
                <p className="text-xs text-foreground/50 mt-1">
                  Helps schools review your profile faster. You can add or update this later too.
                </p>
              </div>
            </div>
          )}

          {role === "COACHING_CENTRE" && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClass} htmlFor="businessName">
                    Coaching centre name
                  </label>
                  <input id="businessName" name="businessName" required className={inputClass} />
                </div>
                <div>
                  <label className={labelClass} htmlFor="serviceArea">
                    District
                  </label>
                  <select id="serviceArea" name="serviceArea" required defaultValue="" className={inputClass}>
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
              </div>

              <div>
                <label className={labelClass}>Exams you coach for</label>
                <div className="grid grid-cols-2 gap-2 rounded-md border border-border px-3 py-2">
                  {Object.entries(COMPETITIVE_EXAM_LABELS).map(([key, label]) => (
                    <label key={key} className="flex items-center gap-2 text-sm">
                      <input type="checkbox" name="examsOffered" value={key} />
                      {label}
                    </label>
                  ))}
                </div>
                <p className="text-xs text-foreground/50 mt-1">Select all that apply.</p>
              </div>

              <div>
                <label className={labelClass} htmlFor="coachingMode">
                  Mode of coaching
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

              <div>
                <label className={labelClass} htmlFor="centrePhoto">
                  Centre photo (signboard/building, optional)
                </label>
                <input
                  id="centrePhoto"
                  name="centrePhoto"
                  type="file"
                  accept="image/*"
                  className={inputClass}
                />
                <p className="text-xs text-foreground/50 mt-1">
                  Helps our admin team verify your coaching centre faster.
                </p>
              </div>
            </div>
          )}

          {role !== "PRINCIPAL" && (
            <p className="text-xs text-gold-dark bg-gold-light border border-gold/30 rounded-xl px-3 py-2.5">
              {ROLE_LABELS[role]} accounts are reviewed by the TN School Cart admin
              team before you can{" "}
              {role === "TEACHER"
                ? "apply to job vacancies"
                : role === "COACHING_CENTRE"
                ? "post job vacancies"
                : "publish listings"}
              . You can still fill in your details while you wait.
            </p>
          )}

          {state?.error && (
            <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl px-3 py-2.5">
              {state.error}
            </p>
          )}

          <button
            type="submit"
            disabled={pending}
            className="w-full bg-brand text-white font-semibold rounded-xl py-2.5 hover:bg-brand-dark transition-colors disabled:opacity-60"
          >
            {pending ? "Creating account..." : "Create account"}
          </button>
        </form>

        <p className="text-sm text-foreground-muted mt-6">
          Already have an account?{" "}
          <Link href="/login" className="text-brand font-semibold hover:underline">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}
