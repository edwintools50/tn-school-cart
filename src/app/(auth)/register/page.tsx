"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { registerAction } from "../actions";
import { TN_DISTRICTS, ROLE_LABELS, TEACHING_SUBJECT_LABELS } from "@/lib/constants";

const inputClass =
  "w-full rounded-md border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand";
const labelClass = "block text-sm font-medium mb-1";

export default function RegisterPage() {
  const [state, formAction, pending] = useActionState(registerAction, undefined);
  const [role, setRole] = useState<"PRINCIPAL" | "SUPPLIER" | "WORKER" | "TEACHER">("PRINCIPAL");

  return (
    <div className="flex-1 flex items-center justify-center px-4 py-12">
      <div className="card w-full max-w-lg p-8">
        <h1 className="text-2xl font-bold mb-1">Create your account</h1>
        <p className="text-sm text-foreground/60 mb-6">
          Join as a school buyer, a supplier, a gig worker, or a teacher looking for a job.
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-6">
          {(["PRINCIPAL", "SUPPLIER", "WORKER", "TEACHER"] as const).map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setRole(r)}
              className={`text-xs sm:text-sm font-semibold rounded-md border px-2 py-2 transition-colors ${
                role === r
                  ? "bg-brand text-white border-brand"
                  : "border-border text-foreground/70 hover:border-brand"
              }`}
            >
              {r === "PRINCIPAL" && "Principal (Buyer)"}
              {r === "SUPPLIER" && "Supplier (Seller)"}
              {r === "WORKER" && "Gig Worker"}
              {r === "TEACHER" && "Teacher"}
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
              minLength={6}
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
                  {Object.entries(TEACHING_SUBJECT_LABELS).map(([key, label]) => (
                    <option key={key} value={key}>
                      {label}
                    </option>
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

          {role !== "PRINCIPAL" && (
            <p className="text-xs text-foreground/60 bg-amber-50 border border-amber-200 rounded-md px-3 py-2">
              {ROLE_LABELS[role]} accounts are reviewed by the TN School Cart admin
              team before you can {role === "TEACHER" ? "apply to job vacancies" : "publish listings"}.
              You can still fill in your details while you wait.
            </p>
          )}

          {state?.error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">
              {state.error}
            </p>
          )}

          <button
            type="submit"
            disabled={pending}
            className="w-full bg-brand text-white font-semibold rounded-md py-2 hover:bg-brand-dark transition-colors disabled:opacity-60"
          >
            {pending ? "Creating account..." : "Create account"}
          </button>
        </form>

        <p className="text-sm text-foreground/60 mt-6">
          Already have an account?{" "}
          <Link href="/login" className="text-brand font-medium hover:underline">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}
