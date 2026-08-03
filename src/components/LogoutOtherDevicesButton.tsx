"use client";

import { useActionState } from "react";
import { logoutOtherDevicesAction } from "@/app/account/settings/actions";

export default function LogoutOtherDevicesButton() {
  const [state, formAction, pending] = useActionState(logoutOtherDevicesAction, undefined);

  if (state?.success) {
    return (
      <p className="text-sm text-accent bg-accent/10 border border-accent/30 rounded-md px-3 py-2">
        {state.count && state.count > 0
          ? `Signed out ${state.count} other device${state.count === 1 ? "" : "s"}.`
          : "No other devices were signed in."}
      </p>
    );
  }

  return (
    <form action={formAction}>
      <button
        type="submit"
        disabled={pending}
        className="text-sm font-semibold text-red-600 hover:underline disabled:opacity-60"
      >
        {pending ? "Signing out other devices..." : "Log out of all other devices"}
      </button>
    </form>
  );
}
