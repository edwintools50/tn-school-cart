"use client";

import { useActionState } from "react";
import Image from "next/image";
import Link from "next/link";
import { loginAction } from "../actions";

const inputClass =
  "w-full rounded-xl border border-border bg-surface px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand/40 focus:border-brand transition-shadow";

export default function LoginPage() {
  const [state, formAction, pending] = useActionState(loginAction, undefined);

  return (
    <div className="flex-1 flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center text-center gap-2 mb-8">
          <Image src="/logo.svg" alt="TN School Cart" width={44} height={44} />
          <h1 className="font-display text-2xl font-semibold">Welcome back</h1>
          <p className="text-sm text-foreground-muted">
            Principals /HMs, suppliers and gig workers all sign in here.
          </p>
        </div>

        <div className="card p-7">
          <form action={formAction} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1.5" htmlFor="email">
                Email
              </label>
              <input id="email" name="email" type="email" required className={inputClass} />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-sm font-medium" htmlFor="password">
                  Password
                </label>
                <Link href="/forgot-password" className="text-xs text-brand hover:underline">
                  Forgot password?
                </Link>
              </div>
              <input id="password" name="password" type="password" required className={inputClass} />
            </div>

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
              {pending ? "Logging in..." : "Log in"}
            </button>
          </form>
        </div>

        <p className="text-sm text-foreground-muted text-center mt-6">
          New to TN School Cart?{" "}
          <Link href="/register" className="text-brand font-semibold hover:underline">
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
}
