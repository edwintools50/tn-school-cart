import Link from "next/link";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { GIG_CATEGORY_LABELS, TN_DISTRICTS } from "@/lib/constants";
import type { GigCategory } from "@/generated/prisma/enums";

export default async function ServicesPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; district?: string }>;
}) {
  const { category, district } = await searchParams;
  const user = await getCurrentUser();

  const services = await db.gigService.findMany({
    where: {
      status: "APPROVED",
      ...(category ? { category: category as GigCategory } : {}),
      ...(district ? { serviceArea: district } : {}),
    },
    include: { worker: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 w-full">
      <h1 className="text-2xl font-bold mb-1">Find gig workers & service providers</h1>
      <p className="text-sm text-foreground/60 mb-6">
        Browse workers offering plumbing, electrical, cleaning, IT, printing,
        catering, transport and other campus services across Tamil Nadu. To
        book one, post a gig request in the same category and they can send
        you an offer.
      </p>

      <form className="flex flex-wrap gap-3 mb-6" method="get">
        <select
          name="category"
          defaultValue={category ?? ""}
          className="rounded-md border border-border px-3 py-2 text-sm"
        >
          <option value="">All categories</option>
          {Object.entries(GIG_CATEGORY_LABELS).map(([key, label]) => (
            <option key={key} value={key}>
              {label}
            </option>
          ))}
        </select>
        <select
          name="district"
          defaultValue={district ?? ""}
          className="rounded-md border border-border px-3 py-2 text-sm"
        >
          <option value="">All districts</option>
          {TN_DISTRICTS.map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </select>
        <button
          type="submit"
          className="bg-brand text-white text-sm font-semibold rounded-md px-4 py-2 hover:bg-brand-dark"
        >
          Filter
        </button>
      </form>

      {services.length === 0 ? (
        <p className="text-sm text-foreground/60">No service providers found.</p>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {services.map((service) => (
            <div key={service.id} className="card p-4 flex flex-col gap-2">
              <span className="text-xs font-semibold text-accent uppercase tracking-wide">
                {GIG_CATEGORY_LABELS[service.category]}
              </span>
              <p className="font-semibold">{service.title}</p>
              <p className="text-xs text-foreground/50">
                {service.worker.businessName ?? service.worker.name} &middot; {service.serviceArea}
              </p>
              <p className="text-sm text-foreground/70">{service.description}</p>
              <p className="font-bold text-sm">
                {service.priceType === "QUOTE"
                  ? "Quote per job"
                  : `₹${service.price?.toFixed(2)}${service.priceType === "HOURLY" ? " / hr" : ""}`}
              </p>
              {user?.role === "PRINCIPAL" ? (
                <Link
                  href={`/gigs/new?category=${service.category}`}
                  className="mt-1 text-center bg-brand text-white text-sm font-semibold rounded-md py-2 hover:bg-brand-dark transition-colors"
                >
                  Post a gig request for this
                </Link>
              ) : !user ? (
                <Link
                  href="/login"
                  className="mt-1 text-center border border-border text-sm font-semibold rounded-md py-2 hover:border-brand"
                >
                  Log in to request this service
                </Link>
              ) : null}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
