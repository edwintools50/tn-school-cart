import Link from "next/link";
import { ArrowRight } from "lucide-react";
import {
  PRODUCT_CATEGORY_LABELS,
  GIG_CATEGORY_LABELS,
  TEACHING_SUBJECT_LABELS,
  POPULAR_TEACHING_SUBJECTS,
} from "@/lib/constants";

const roleCards = [
  {
    title: "School Principals /HMs",
    body: "Browse verified suppliers, order stationery, furniture, notebooks, educational content and health & hygiene supplies. Post gig-work requests for plumbing, electrical and cleaning jobs.",
    cta: "Sign up to buy",
    href: "/register",
    accent: "#1e3a5f",
  },
  {
    title: "Suppliers",
    body: "List your stationery, furniture, notebooks, educational content or health & hygiene products with pricing and stock, and reach schools across Tamil Nadu.",
    cta: "Become a supplier",
    href: "/register",
    accent: "#2f7a4f",
  },
  {
    title: "Gig Workers",
    body: "List your plumbing, electrical, cleaning, carpentry or other campus-service skills, and pick up school jobs near you.",
    cta: "List your services",
    href: "/register",
    accent: "#a3572e",
  },
  {
    title: "Teachers",
    body: "Apply to teaching job vacancies posted by schools and coaching centres across Tamil Nadu — browse openings by subject and district.",
    cta: "Apply for jobs",
    href: "/register",
    accent: "#6b4472",
  },
  {
    title: "Coaching Centres",
    body: "Post job vacancies for NEET, JEE, CUET, CLAT and other competitive-exam faculty, and hire qualified, experienced teachers from across Tamil Nadu.",
    cta: "Hire teaching faculty",
    href: "/register",
    accent: "#b8862f",
  },
];

export default function Home() {
  return (
    <div className="flex-1">
      <section className="relative overflow-hidden border-b border-border">
        <div
          className="absolute inset-0 -z-10"
          style={{
            background:
              "radial-gradient(1100px 480px at 50% -10%, var(--brand-light), transparent)",
          }}
        />
        <div className="mx-auto max-w-6xl px-4 py-20 sm:py-28 flex flex-col items-center text-center gap-6">
          <span className="inline-flex items-center gap-2 rounded-full border border-gold/30 bg-gold-light text-gold-dark text-xs font-semibold tracking-wide px-3 py-1.5 uppercase">
            Tamil Nadu &middot; All 38 districts
          </span>
          <h1 className="font-display text-4xl sm:text-6xl font-semibold tracking-tight max-w-3xl leading-[1.08]">
            The edu-commerce marketplace for{" "}
            <span className="text-brand">Tamil Nadu schools</span>
          </h1>
          <p className="max-w-2xl text-foreground-muted text-base sm:text-lg leading-relaxed">
            TN School Cart connects school principals /HMs with trusted suppliers of
            stationery, furniture, notebooks, educational content and health &amp; hygiene
            products &mdash; plus on-demand gig workers for plumbing, electrical and campus
            maintenance work.
          </p>
          <div className="flex flex-wrap gap-3 justify-center mt-2">
            <Link
              href="/marketplace"
              className="flex items-center gap-2 bg-brand text-white font-semibold rounded-full px-6 py-3 hover:bg-brand-dark transition-colors"
            >
              Browse the marketplace
              <ArrowRight size={16} />
            </Link>
            <Link
              href="/register"
              className="border border-border bg-surface font-semibold rounded-full px-6 py-3 hover:border-brand transition-colors"
            >
              Create an account
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-14 sm:py-16">
        <h2 className="font-display text-2xl sm:text-3xl font-semibold mb-2">Built for every role on campus</h2>
        <p className="text-foreground-muted mb-8 max-w-2xl">
          One account type per person, one clear path to what they need.
        </p>
        <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-5">
          {roleCards.map((c) => (
            <div
              key={c.title}
              className="card p-6 flex flex-col gap-3"
              style={{ borderTop: `3px solid ${c.accent}` }}
            >
              <h3 className="font-display font-semibold text-lg leading-snug">{c.title}</h3>
              <p className="text-sm text-foreground-muted flex-1 leading-relaxed">{c.body}</p>
              <Link
                href={c.href}
                className="flex items-center gap-1 text-sm font-semibold hover:underline"
                style={{ color: c.accent }}
              >
                {c.cta}
                <ArrowRight size={14} />
              </Link>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-12 border-t border-border">
        <h2 className="font-display text-xl sm:text-2xl font-semibold mb-5">Shop by category</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {Object.entries(PRODUCT_CATEGORY_LABELS)
            .filter(([key]) => key !== "OTHER")
            .map(([key, label]) => (
              <Link
                key={key}
                href={`/marketplace?category=${key}`}
                className="card p-4 text-sm font-medium hover:border-brand hover:text-brand transition-colors text-center"
              >
                {label}
              </Link>
            ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-12 border-t border-border">
        <h2 className="font-display text-xl sm:text-2xl font-semibold mb-5">Popular gig work</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {Object.entries(GIG_CATEGORY_LABELS)
            .filter(([key]) => key !== "OTHER")
            .map(([key, label]) => (
              <Link
                key={key}
                href={`/services?category=${key}`}
                className="card p-4 text-sm font-medium hover:border-accent hover:text-accent transition-colors text-center"
              >
                {label}
              </Link>
            ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-12 border-t border-border">
        <h2 className="font-display text-xl sm:text-2xl font-semibold mb-5">Teaching subjects in demand</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {POPULAR_TEACHING_SUBJECTS.map((key) => (
            <Link
              key={key}
              href={`/jobs?subject=${key}`}
              className="card p-4 text-sm font-medium text-center transition-colors hover:border-[#6b4472] hover:text-[#6b4472]"
            >
              {TEACHING_SUBJECT_LABELS[key]}
            </Link>
          ))}
        </div>
        <p className="text-xs text-foreground-muted mt-4">
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
