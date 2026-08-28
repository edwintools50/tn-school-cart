import ResetPasswordForm from "@/components/ResetPasswordForm";

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;

  return (
    <div className="flex-1 flex items-center justify-center px-4 py-16">
      <div className="card w-full max-w-sm p-7">
        <h1 className="font-display text-2xl font-semibold mb-1">Set a new password</h1>
        <p className="text-sm text-foreground-muted mb-6">
          Choose a new password for your TN School Cart account.
        </p>

        {token ? (
          <ResetPasswordForm token={token} />
        ) : (
          <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl px-3 py-2.5">
            This reset link is missing its token. Request a new one from the{" "}
            <a href="/forgot-password" className="underline font-medium">
              forgot password
            </a>{" "}
            page.
          </p>
        )}
      </div>
    </div>
  );
}
