import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";

export default async function AdminDashboardPage() {
  await requireAdmin();

  const [
    pendingUsers,
    pendingProducts,
    pendingServices,
    totalOrders,
    totalGigRequests,
    totalPrincipals,
    totalSuppliers,
    totalWorkers,
  ] = await Promise.all([
    db.user.count({ where: { status: "PENDING" } }),
    db.product.count({ where: { status: "PENDING" } }),
    db.gigService.count({ where: { status: "PENDING" } }),
    db.order.count(),
    db.gigRequest.count(),
    db.user.count({ where: { role: "PRINCIPAL" } }),
    db.user.count({ where: { role: "SUPPLIER" } }),
    db.user.count({ where: { role: "WORKER" } }),
  ]);

  const cards = [
    { label: "Accounts awaiting approval", value: pendingUsers, href: "/admin/users?status=PENDING" },
    { label: "Products awaiting review", value: pendingProducts, href: "/admin/products?status=PENDING" },
    { label: "Services awaiting review", value: pendingServices, href: "/admin/services?status=PENDING" },
    { label: "Total orders placed", value: totalOrders, href: "/admin/orders" },
    { label: "Total gig requests posted", value: totalGigRequests, href: "/admin/gigs" },
  ];

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 w-full">
      <h1 className="text-2xl font-bold mb-1">Admin dashboard</h1>
      <p className="text-sm text-foreground/60 mb-6">
        {totalPrincipals} principals /HMs &middot; {totalSuppliers} suppliers &middot; {totalWorkers} gig workers
      </p>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {cards.map((c) => (
          <Link key={c.label} href={c.href} className="card p-5 hover:border-brand transition-colors">
            <p className="text-3xl font-bold">{c.value}</p>
            <p className="text-sm text-foreground/60 mt-1">{c.label}</p>
          </Link>
        ))}
      </div>

      <div className="flex flex-wrap gap-3">
        <Link href="/admin/users" className="border border-border font-semibold rounded-md px-4 py-2 text-sm hover:border-brand">
          Manage users
        </Link>
        <Link href="/admin/products" className="border border-border font-semibold rounded-md px-4 py-2 text-sm hover:border-brand">
          Moderate products
        </Link>
        <Link href="/admin/services" className="border border-border font-semibold rounded-md px-4 py-2 text-sm hover:border-brand">
          Moderate services
        </Link>
        <Link href="/admin/orders" className="border border-border font-semibold rounded-md px-4 py-2 text-sm hover:border-brand">
          View orders
        </Link>
        <Link href="/admin/gigs" className="border border-border font-semibold rounded-md px-4 py-2 text-sm hover:border-brand">
          View gig requests
        </Link>
      </div>
    </div>
  );
}
