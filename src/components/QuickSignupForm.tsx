"use client";

import { useActionState } from "react";
import {
  GraduationCap,
  Wrench,
  Store,
  Mail,
  CheckCircle2,
  RefreshCw,
  ShieldCheck,
} from "lucide-react";
import { quickSignupAction, type JoinState } from "@/app/join/actions";
import { Role } from "@/generated/prisma/enums";
import {
  TN_DISTRICTS,
  TEACHING_SUBJECT_GROUPS,
  TEACHING_SUBJECT_LABELS,
  GIG_CATEGORY_LABELS,
  PRODUCT_CATEGORY_LABELS,
} from "@/lib/constants";

const inputClass =
  "w-full rounded-lg border border-border px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand/40 focus:border-brand";
const labelClass = "block text-sm font-medium mb-1";

type JoinableRole = typeof Role.TEACHER | typeof Role.WORKER | typeof Role.SUPPLIER;

const ROLE_META: Record<
  JoinableRole,
  { icon: typeof GraduationCap; title: string; subtitle: string; offeringLabel: string; offeringHint: string }
> = {
  [Role.TEACHER]: {
    icon: GraduationCap,
    title: "Join as a Teacher",
    subtitle: "Get listed in our teacher directory so schools and coaching centres can find you.",
    offeringLabel: "",
    offeringHint: "",
  },
  [Role.WORKER]: {
    icon: Wrench,
    title: "Join as a Gig Worker",
    subtitle: "List your service — plumbing, electrical, cleaning, and more — for schools in your area.",
    offeringLabel: "What service do you offer?",
    offeringHint: "e.g. \"RO water purifier installation & service\"",
  },
  [Role.SUPPLIER]: {
    icon: Store,
    title: "Join as a Vendor",
    subtitle: "List your first product and start selling to schools across Tamil Nadu.",
    offeringLabel: "What do you sell?",
    offeringHint: "e.g. \"200-page ruled notebooks, pack of 6\"",
  },
};

export default function QuickSignupForm({ role }: { role: JoinableRole }) {
  const initialState: JoinState = { step: "form", role };
  const [state, formAction, pending] = useActionState(quickSignupAction, initialState);
  const meta = ROLE_META[role];
  const Icon = meta.icon;

  return (
    <div className="mx-auto max-w-lg px-4 py-10 sm:py-14 w-full">
      <div className="flex flex-col items-center text-center gap-3 mb-8">
        <div className="w-14 h-14 rounded-2xl bg-brand/10 flex items-center justify-center">
          <Icon size={28} className="text-brand" />
        </div>
        <div>
          <h1 className="text-xl sm:text-2xl font-bold">{meta.title}</h1>
          <p className="text-sm text-foreground/60 mt-1 max-w-sm">{meta.subtitle}</p>
        </div>
      </div>

      {state.step === "form" && (
        <form action={formAction} className="card p-5 sm:p-6 rounded-2xl space-y-4">
          <input type="hidden" name="role" value={role} />

          <div>
            <label className={labelClass} htmlFor="name">
              Full name
            </label>
            <input id="name" name="name" required className={inputClass} />
          </div>
          <div>
            <label className={labelClass} htmlFor="email">
              Email address
            </label>
            <input id="email" name="email" type="email" required className={inputClass} />
            <p className="text-xs text-foreground/50 mt-1">We&apos;ll send a 6-digit code here to verify it&apos;s you.</p>
          </div>
          <div>
            <label className={labelClass} htmlFor="phone">
              Phone number
            </label>
            <input id="phone" name="phone" type="tel" required className={inputClass} />
          </div>
          <div>
            <label className={labelClass} htmlFor="district">
              District
            </label>
            <select id="district" name="district" required defaultValue="" className={inputClass}>
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

          {role === Role.TEACHER && (
            <>
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
                <label className={labelClass} htmlFor="qualification">
                  Qualification
                </label>
                <input
                  id="qualification"
                  name="qualification"
                  placeholder="e.g. M.Sc. B.Ed."
                  required
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass} htmlFor="experienceYears">
                  Years of experience
                </label>
                <input
                  id="experienceYears"
                  name="experienceYears"
                  type="number"
                  min={0}
                  required
                  className={inputClass}
                />
              </div>
            </>
          )}

          {(role === Role.WORKER || role === Role.SUPPLIER) && (
            <>
              <div>
                <label className={labelClass} htmlFor="businessName">
                  {role === Role.WORKER ? "Your name / business name" : "Business name"}
                </label>
                <input id="businessName" name="businessName" required className={inputClass} />
              </div>
              <div>
                <label className={labelClass} htmlFor={role === Role.WORKER ? "gigCategory" : "productCategory"}>
                  Category
                </label>
                <select
                  id={role === Role.WORKER ? "gigCategory" : "productCategory"}
                  name={role === Role.WORKER ? "gigCategory" : "productCategory"}
                  required
                  defaultValue=""
                  className={inputClass}
                >
                  <option value="" disabled>
                    Select category
                  </option>
                  {Object.entries(role === Role.WORKER ? GIG_CATEGORY_LABELS : PRODUCT_CATEGORY_LABELS).map(
                    ([key, label]) => (
                      <option key={key} value={key}>
                        {label}
                      </option>
                    )
                  )}
                </select>
              </div>

              <div className="pt-2 border-t border-border">
                <p className="text-xs font-semibold text-accent uppercase tracking-wide mb-3">
                  Your first listing
                </p>
                <label className={labelClass} htmlFor="offeringTitle">
                  {meta.offeringLabel}
                </label>
                <input
                  id="offeringTitle"
                  name="offeringTitle"
                  placeholder={meta.offeringHint}
                  required
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass} htmlFor="offeringDescription">
                  Short description
                </label>
                <textarea
                  id="offeringDescription"
                  name="offeringDescription"
                  rows={3}
                  required
                  className={inputClass}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass} htmlFor="offeringPrice">
                    Price (&#8377;){role === Role.WORKER && <span className="text-foreground/40 font-normal"> (optional)</span>}
                  </label>
                  <input
                    id="offeringPrice"
                    name="offeringPrice"
                    type="number"
                    step="0.01"
                    min="0"
                    required={role === Role.SUPPLIER}
                    className={inputClass}
                  />
                </div>
                {role === Role.SUPPLIER && (
                  <div>
                    <label className={labelClass} htmlFor="offeringUnit">
                      Unit
                    </label>
                    <input
                      id="offeringUnit"
                      name="offeringUnit"
                      placeholder="piece, box..."
                      defaultValue="piece"
                      required
                      className={inputClass}
                    />
                  </div>
                )}
              </div>
              {role === Role.SUPPLIER && (
                <div>
                  <label className={labelClass} htmlFor="offeringStock">
                    How many do you have in stock?
                  </label>
                  <input
                    id="offeringStock"
                    name="offeringStock"
                    type="number"
                    min="1"
                    required
                    className={inputClass}
                  />
                </div>
              )}
            </>
          )}

          {state.error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">
              {state.error}
            </p>
          )}

          <button
            type="submit"
            disabled={pending}
            className="w-full flex items-center justify-center gap-2 bg-brand text-white font-semibold rounded-xl py-3 hover:bg-brand-dark active:scale-95 transition-all disabled:opacity-60"
          >
            <Mail size={18} />
            {pending ? "Sending code..." : "Send verification code"}
          </button>
        </form>
      )}

      {state.step === "otp" && (
        <form action={formAction} className="card p-5 sm:p-6 rounded-2xl space-y-4 text-center">
          <input type="hidden" name="role" value={role} />
          <input type="hidden" name="email" value={state.email} />
          <input type="hidden" name="name" value={state.name} />

          <Mail size={32} className="mx-auto text-brand" />
          <div>
            <p className="font-semibold">Check your email</p>
            <p className="text-sm text-foreground/60 mt-1">
              We sent a 6-digit code to <span className="font-medium text-foreground">{state.email}</span>
            </p>
          </div>

          <input
            name="code"
            inputMode="numeric"
            maxLength={6}
            placeholder="000000"
            required
            className="w-full text-center text-2xl tracking-[0.5em] font-bold rounded-lg border border-border px-3 py-3 focus:outline-none focus:ring-2 focus:ring-brand/40 focus:border-brand"
          />

          {state.error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">
              {state.error}
            </p>
          )}

          <button
            type="submit"
            name="intent"
            value="verify"
            disabled={pending}
            className="w-full flex items-center justify-center gap-2 bg-brand text-white font-semibold rounded-xl py-3 hover:bg-brand-dark active:scale-95 transition-all disabled:opacity-60"
          >
            <ShieldCheck size={18} />
            {pending ? "Verifying..." : "Verify & continue"}
          </button>
          <button
            type="submit"
            name="intent"
            value="resend"
            disabled={pending}
            className="flex items-center justify-center gap-1.5 mx-auto text-xs font-semibold text-brand hover:underline disabled:opacity-60"
          >
            <RefreshCw size={12} />
            Resend code
          </button>
        </form>
      )}

      {state.step === "done" && (
        <div className="card p-6 sm:p-8 rounded-2xl text-center">
          <CheckCircle2 size={40} className="mx-auto text-accent mb-3" />
          <p className="font-bold text-lg">Email verified!</p>
          <p className="text-sm text-foreground/60 mt-2 max-w-sm mx-auto">
            Your details are with our team for a quick review. Once approved, you&apos;ll get an email
            with a link to set your password and manage your listing — and you&apos;ll be live on TN
            School Cart.
          </p>
        </div>
      )}
    </div>
  );
}
