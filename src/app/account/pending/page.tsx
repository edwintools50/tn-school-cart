import { requireUser } from "@/lib/auth";

export default async function AccountPendingPage() {
  const user = await requireUser();

  const message =
    user.status === "REJECTED"
      ? "Your account application was not approved. Please contact TN School Cart support for details."
      : user.status === "SUSPENDED"
        ? "Your account has been suspended by the TN School Cart admin team."
        : "Your account is awaiting review by the TN School Cart admin team. This usually takes 1-2 business days. You'll be able to publish listings as soon as you're approved.";

  return (
    <div className="flex-1 flex items-center justify-center px-4 py-16">
      <div className="card max-w-lg p-8 text-center">
        <h1 className="text-xl font-bold mb-2">
          Account status: {user.status.toLowerCase()}
        </h1>
        <p className="text-sm text-foreground/70">{message}</p>
      </div>
    </div>
  );
}
