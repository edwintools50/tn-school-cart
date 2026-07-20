"use client";

import { useActionState } from "react";
import Link from "next/link";
import { requestPasswordResetAction } from "../actions";

const inputClass =
  "w-full rounded-md border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand";
const labelClass = "block text-sm font-medium mb-1";

export default function ForgotPasswordPage() {
  const [state, formAction, pending] = useActionState(requestPasswordResetAction, undefined);

  return (
    <div className="flex-1 flex items-center justify-center px-4 py-12">
      <div className="card w-full max-w-md p-8">
        <h1 className="text-2xl font-bold mb-1">Reset your password</h1>
        <p className="text-sm text-foreground/60 mb-6">
          Enter the email on your account and we&apos;ll send you a link to set a
          new password.
        </p>

        {state?.success ? (
          <p className="text-sm text-accent bg-accent/10 border border-accent/30 rounded-md px-3 py-2">
            If an account exists for that email, a reset link has been sent.
            Check your inbox.
          </p>
        ) : (
          <form action={formAction} className="space-y-4">
            <div>
              <label className={labelClass} htmlFor="email">
                Email
              </label>
              <input id="email" name="email" type="email" required className={inputClass} />
            </div>

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
              {pending ? "Sending..." : "Send reset link"}
            </button>
          </form>
        )}

        <p className="text-sm text-foreground/60 mt-6">
          <Link href="/login" className="text-brand font-medium hover:underline">
            Back to log in
          </Link>
        </p>
      </div>
    </div>
  );
}
