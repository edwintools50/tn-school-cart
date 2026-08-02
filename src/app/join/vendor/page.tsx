import QuickSignupForm from "@/components/QuickSignupForm";
import { Role } from "@/generated/prisma/enums";

export const metadata = {
  title: "Join as a Vendor — TN School Cart",
  description: "Sign up in a minute and list your first product for schools across Tamil Nadu.",
};

export default function JoinVendorPage() {
  return <QuickSignupForm role={Role.SUPPLIER} />;
}
