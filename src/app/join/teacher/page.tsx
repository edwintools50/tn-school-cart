import QuickSignupForm from "@/components/QuickSignupForm";
import { Role } from "@/generated/prisma/enums";

export const metadata = {
  title: "Join as a Teacher — TN School Cart",
  description: "Sign up in a minute and get listed in the TN School Cart teacher directory.",
};

export default function JoinTeacherPage() {
  return <QuickSignupForm role={Role.TEACHER} />;
}
