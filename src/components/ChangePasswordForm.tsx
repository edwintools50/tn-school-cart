"use client";

import { useActionState } from "react";
import { changePasswordAction } from "@/app/account/settings/actions";

const inputClass =
  "w-full rounded-md border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand";
const labelClass = "block text-sm font-medium mb-1";

export default function ChangePasswordForm() {
  const [state, formAction, pending] = useActionState(changePasswordAction, undefined);

  if (state?.success) {
    return (
      <p className="text-sm text-accent bg-accent/10 border border-accent/30 rounded-md px-3 py-2">
        Password updated. Use your new password next time you log in.
      </p>
    );
  }

  return (
    <form action={formAction} className="space-y-4">
      <div>
        <label className={labelClass} htmlFor="currentPassword">
          Current password
        </label>
        <input
          id="currentPassword"
          name="currentPassword"
          type="password"
          required
          className={inputClass}
        />
      </div>
      <div>
        <label className={labelClass} htmlFor="newPassword">
          New password
        </label>
        <input
          id="newPassword"
          name="newPassword"
          type="password"
          minLength={6}
          required
          className={inputClass}
        />
      </div>
      <div>
        <label className={labelClass} htmlFor="confirmPassword">
          Confirm new password
        </label>
        <input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          minLength={6}
          required
          className={inputClass}
        />
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
        {pending ? "Saving..." : "Change password"}
      </button>
    </form>
  );
}
