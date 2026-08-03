import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { ROLE_LABELS } from "@/lib/constants";
import { MAX_CONCURRENT_SESSIONS } from "@/lib/session";
import ChangePasswordForm from "@/components/ChangePasswordForm";
import LogoutOtherDevicesButton from "@/components/LogoutOtherDevicesButton";

export default async function AccountSettingsPage() {
  const user = await requireUser();
  const sessionCount = await db.session.count({ where: { userId: user.id } });

  return (
    <div className="mx-auto max-w-lg px-4 py-8 w-full">
      <h1 className="text-2xl font-bold mb-1">Account settings</h1>
      <p className="text-sm text-foreground/60 mb-6">
        {user.name} &middot; {user.email} &middot; {ROLE_LABELS[user.role]}
      </p>

      <div className="card p-6 mb-6">
        <h2 className="font-semibold mb-4 text-sm">Change password</h2>
        <ChangePasswordForm />
      </div>

      <div className="card p-6">
        <h2 className="font-semibold mb-1 text-sm">Signed-in devices</h2>
        <p className="text-sm text-foreground/60 mb-4">
          This account is currently signed in on {sessionCount} device{sessionCount === 1 ? "" : "s"} (up to{" "}
          {MAX_CONCURRENT_SESSIONS} at a time — signing in on a new one beyond that signs the oldest one out
          automatically). If that number looks higher than you expect, someone else may have your password.
        </p>
        <LogoutOtherDevicesButton />
      </div>
    </div>
  );
}
