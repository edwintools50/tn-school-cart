import { requireOmrAccess } from "@/lib/omr/access";
import { db } from "@/lib/db";
import BrandingForm from "@/components/omr/BrandingForm";
import { updateBrandingAction, removeLogoAction } from "./actions";

export default async function BrandingPage() {
  const user = await requireOmrAccess();
  const branding = await db.omrBranding.findUnique({ where: { ownerId: user.id } });

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 w-full">
      <h1 className="text-2xl font-bold mb-1">White-label Branding</h1>
      <p className="text-sm text-foreground/60 mb-6">
        Put your own institute&apos;s name, logo, and color on generated OMR sheets and PDF report cards.
      </p>

      <BrandingForm
        action={updateBrandingAction}
        removeLogoAction={removeLogoAction}
        initialInstituteName={branding?.instituteName || ""}
        initialPrimaryColor={branding?.primaryColor || "#1E3A8A"}
        initialLogoUrl={branding?.logoUrl || null}
      />
    </div>
  );
}
