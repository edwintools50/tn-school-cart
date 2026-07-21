import { requireUser } from "@/lib/auth";
import { ROLE_LABELS } from "@/lib/constants";
import ChangePasswordForm from "@/components/ChangePasswordForm";

export default async function AccountSettingsPage() {
  const user = await requireUser();

  return (
    <div className="mx-auto max-w-lg px-4 py-8 w-full">
      <h1 className="text-2xl font-bold mb-1">Account settings</h1>
      <p className="text-sm text-foreground/60 mb-6">
        {user.name} &middot; {user.email} &middot; {ROLE_LABELS[user.role]}
      </p>

      <div className="card p-6">
        <h2 className="font-semibold mb-4 text-sm">Change password</h2>
        <ChangePasswordForm />
      </div>
    </div>
  );
}
