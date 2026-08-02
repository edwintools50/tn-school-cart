import QuickSignupForm from "@/components/QuickSignupForm";
import { Role } from "@/generated/prisma/enums";

export const metadata = {
  title: "Join as a Gig Worker — TN School Cart",
  description: "Sign up in a minute and list your service for schools across Tamil Nadu.",
};

export default function JoinWorkerPage() {
  return <QuickSignupForm role={Role.WORKER} />;
}
