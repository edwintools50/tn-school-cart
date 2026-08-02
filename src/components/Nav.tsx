import Link from "next/link";
import Image from "next/image";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { logoutAction } from "@/app/(auth)/actions";
import MobileNav from "@/components/MobileNav";
import {
  Store,
  Wrench,
  ClipboardList,
  Briefcase,
  ShoppingCart,
  LayoutDashboard,
  GraduationCap,
} from "lucide-react";

const linkClass =
  "flex items-center gap-1.5 text-sm font-medium text-foreground/80 hover:text-brand transition-colors";

export default async function Nav() {
  const user = await getCurrentUser();

  let cartCount = 0;
  if (user?.role === "PRINCIPAL") {
    const items = await db.cartItem.aggregate({
      where: { buyerId: user.id },
      _sum: { quantity: true },
    });
    cartCount = items._sum.quantity ?? 0;
  }

  return (
    <header className="border-b border-border bg-surface sticky top-0 z-20">
      <div className="mx-auto max-w-6xl px-4 py-3 flex items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <Image src="/logo.svg" alt="TN School Cart" width={36} height={36} />
          <span className="font-bold text-lg leading-tight">
            <span className="text-brand">TN </span>
            <span className="text-[#d43a2f]">School </span>
            <span className="text-accent">Cart</span>
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-5 flex-wrap justify-end">
          <Link href="/marketplace" className={linkClass}>
            <Store size={16} />
            Marketplace
          </Link>
          <Link href="/services" className={linkClass}>
            <Wrench size={16} />
            Find Services
          </Link>
          <Link href="/teachers" className={linkClass}>
            <GraduationCap size={16} />
            Teachers
          </Link>
          <Link href="/gigs" className={linkClass}>
            <ClipboardList size={16} />
            Gig Requests
          </Link>
          <Link href="/jobs" className={linkClass}>
            <Briefcase size={16} />
            Job Vacancies
          </Link>

          {!user && (
            <>
              <Link href="/login" className={linkClass}>
                Log in
              </Link>
              <Link
                href="/register"
                className="text-sm font-semibold bg-brand text-white px-3 py-1.5 rounded-md hover:bg-brand-dark transition-colors"
              >
                Sign up
              </Link>
            </>
          )}

          {user?.role === "PRINCIPAL" && (
            <>
              <Link href="/gigs/mine" className={linkClass}>
                My Gig Requests
              </Link>
              <Link href="/jobs/mine" className={linkClass}>
                My Job Vacancies
              </Link>
              <Link href="/orders" className={linkClass}>
                My Orders
              </Link>
              <Link href="/cart" className={`${linkClass} relative`}>
                <ShoppingCart size={16} />
                Cart
                {cartCount > 0 && (
                  <span className="ml-1 inline-flex items-center justify-center bg-accent text-white text-xs rounded-full h-5 min-w-5 px-1">
                    {cartCount}
                  </span>
                )}
              </Link>
            </>
          )}

          {user?.role === "SUPPLIER" && (
            <Link href="/dashboard/supplier" className={linkClass}>
              <LayoutDashboard size={16} />
              Supplier Dashboard
            </Link>
          )}

          {user?.role === "WORKER" && (
            <Link href="/dashboard/worker" className={linkClass}>
              <LayoutDashboard size={16} />
              Worker Dashboard
            </Link>
          )}

          {user?.role === "TEACHER" && (
            <Link href="/dashboard/teacher" className={linkClass}>
              <LayoutDashboard size={16} />
              Teacher Dashboard
            </Link>
          )}

          {user?.role === "ADMIN" && (
            <Link href="/admin" className={linkClass}>
              <LayoutDashboard size={16} />
              Admin
            </Link>
          )}

          {user && (
            <div className="flex items-center gap-3 pl-3 border-l border-border">
              <span className="text-sm text-foreground/60 hidden sm:inline">
                {user.name}
                {user.status !== "APPROVED" && (
                  <span className="ml-1 text-xs font-semibold text-amber-600">
                    ({user.status.toLowerCase()})
                  </span>
                )}
              </span>
              <Link href="/account/settings" className={linkClass}>
                Settings
              </Link>
              <form action={logoutAction}>
                <button
                  type="submit"
                  className="text-sm font-medium text-foreground/60 hover:text-red-600 transition-colors"
                >
                  Log out
                </button>
              </form>
            </div>
          )}
        </nav>

        <MobileNav
          user={user ? { name: user.name, role: user.role, status: user.status } : null}
          cartCount={cartCount}
          logoutAction={logoutAction}
        />
      </div>
    </header>
  );
}
