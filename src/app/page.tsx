import Link from "next/link";
import {
  PRODUCT_CATEGORY_LABELS,
  GIG_CATEGORY_LABELS,
  TEACHING_SUBJECT_LABELS,
  POPULAR_TEACHING_SUBJECTS,
} from "@/lib/constants";
import { OMR_SUITE_PRODUCT_ID } from "@/lib/omr/access";

const roleCards = [
  {
    title: "School Principals /HMs",
    body: "Browse verified suppliers, order stationery, furniture, notebooks, educational content and health & hygiene supplies. Post gig-work requests for plumbing, electrical and cleaning jobs.",
    cta: "Sign up to buy",
    href: "/register",
    accent: "border-t-brand",
  },
  {
    title: "Suppliers",
    body: "List your stationery, furniture, notebooks, educational content or health & hygiene products with pricing and stock, and reach schools across Tamil Nadu.",
    cta: "Become a supplier",
    href: "/register",
    accent: "border-t-accent",
  },
  {
    title: "Gig Workers",
    body: "List your plumbing, electrical, cleaning, carpentry or other campus-service skills, and pick up school jobs near you.",
    cta: "List your services",
    href: "/register",
    accent: "border-t-[#d43a2f]",
  },
  {
    title: "Teachers",
    body: "Apply to teaching job vacancies posted by schools and coaching centres across Tamil Nadu — browse openings by subject and district.",
    cta: "Apply for jobs",
    href: "/register",
    accent: "border-t-purple-600",
  },
  {
    title: "Coaching Centres",
    body: "Post job vacancies for NEET, JEE, CUET, CLAT and other competitive-exam faculty, and hire qualified, experienced teachers from across Tamil Nadu.",
    cta: "Hire teaching faculty",
    href: "/register",
    accent: "border-t-amber-600",
  },
];

export default function Home() {
  return (
    <div className="flex-1">
      <section className="bg-gradient-to-b from-brand/5 to-transparent">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:py-24 flex flex-col items-center text-center gap-6">
          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight max-w-3xl">
            The Edu-commerce marketplace for{" "}
            <span className="text-brand">Tamil Nadu schools</span>
          </h1>
          <p className="max-w-2xl text-foreground/70 text-base sm:text-lg">
            TN School Cart connects school principals /HMs with
            trusted suppliers of stationery, furniture, notebooks, educational
            content and health & hygiene products &mdash; plus on-demand gig
            workers for plumbing, electrical and campus maintenance work.
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            <Link
              href="/marketplace"
              className="bg-brand text-white font-semibold rounded-md px-5 py-2.5 hover:bg-brand-dark transition-colors"
            >
              Browse the marketplace
            </Link>
            <Link
              href="/register"
              className="border border-border font-semibold rounded-md px-5 py-2.5 hover:border-brand transition-colors"
            >
              Create an account
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pt-10">
        <div className="card flex flex-col sm:flex-row sm:items-center gap-4 p-5 sm:p-6">
          <span className="shrink-0 inline-flex items-center gap-2 rounded-full bg-[#fbe4f1] text-[#a5005c] text-xs font-bold tracking-wide px-3 py-1.5 uppercase self-start sm:self-center">
            <span className="w-1.5 h-1.5 rounded-full bg-[#e6007e]" />
            Featured &middot; Exam &amp; Print Stationery
          </span>
          <div className="flex-1">
            <p className="font-bold">
              Axion Omni OMR Suite &mdash; the bubble sheet that grades itself
            </p>
            <p className="text-sm text-foreground/70 mt-0.5">
              Print OMR answer sheets for NEET, JEE, CUET, CLAT and other competitive exams, scan
              filled sheets with a phone camera, and get ranked report cards automatically.
            </p>
          </div>
          <div className="shrink-0 flex flex-col items-start sm:items-end gap-1.5">
            <Link
              href={`/marketplace/${OMR_SUITE_PRODUCT_ID}`}
              className="font-semibold text-sm text-[#a5005c] hover:underline whitespace-nowrap"
            >
              View in Marketplace &rarr;
            </Link>
            <Link
              href="/omr/download"
              className="font-semibold text-sm text-[#a5005c] hover:underline whitespace-nowrap"
            >
              📱 Get the Android app &rarr;
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-12">
        <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-5">
          {roleCards.map((c) => (
            <div key={c.title} className={`card border-t-4 ${c.accent} p-6 flex flex-col gap-3`}>
              <h3 className="font-bold text-lg">{c.title}</h3>
              <p className="text-sm text-foreground/70 flex-1">{c.body}</p>
              <Link href={c.href} className="text-brand font-semibold text-sm hover:underline">
                {c.cta} &rarr;
              </Link>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-12">
        <h2 className="text-xl font-bold mb-4">Shop by category</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {Object.entries(PRODUCT_CATEGORY_LABELS)
            .filter(([key]) => key !== "OTHER")
            .map(([key, label]) => (
            <Link
              key={key}
              href={`/marketplace?category=${key}`}
              className="card p-4 text-sm font-medium hover:border-brand transition-colors text-center"
            >
              {label}
            </Link>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-12">
        <h2 className="text-xl font-bold mb-4">Popular gig work</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {Object.entries(GIG_CATEGORY_LABELS)
            .filter(([key]) => key !== "OTHER")
            .map(([key, label]) => (
              <Link
                key={key}
                href={`/services?category=${key}`}
                className="card p-4 text-sm font-medium hover:border-accent transition-colors text-center"
              >
                {label}
              </Link>
            ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-12">
        <h2 className="text-xl font-bold mb-4">Teaching subjects in demand</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {POPULAR_TEACHING_SUBJECTS.map((key) => (
            <Link
              key={key}
              href={`/jobs?subject=${key}`}
              className="card p-4 text-sm font-medium hover:border-purple-600 transition-colors text-center"
            >
              {TEACHING_SUBJECT_LABELS[key]}
            </Link>
          ))}
        </div>
        <p className="text-xs text-foreground/50 mt-3">
          Plus 45+ more PG Teacher, NEET/JEE and TET coaching specializations —{" "}
          <Link href="/jobs" className="text-brand font-medium hover:underline">
            see all open vacancies
          </Link>
          .
        </p>
      </section>
    </div>
  );
}
