import Link from "next/link";
import { requireAdmin } from "@/lib/auth";

const tabs = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/users", label: "Users" },
  { href: "/admin/products", label: "Products" },
  { href: "/admin/services", label: "Services" },
  { href: "/admin/orders", label: "Orders" },
  { href: "/admin/gigs", label: "Gigs" },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();

  return (
    <div className="flex-1 flex flex-col">
      <div className="border-b border-border bg-surface">
        <nav className="mx-auto max-w-5xl px-4 flex gap-1 overflow-x-auto">
          {tabs.map((tab) => (
            <Link
              key={tab.href}
              href={tab.href}
              className="text-sm font-medium px-3 py-3 text-foreground/70 hover:text-brand border-b-2 border-transparent hover:border-brand transition-colors whitespace-nowrap"
            >
              {tab.label}
            </Link>
          ))}
        </nav>
      </div>
      {children}
    </div>
  );
}
