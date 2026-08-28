"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Menu,
  X,
  Store,
  Wrench,
  ClipboardList,
  Briefcase,
  ShoppingCart,
  Settings,
  LogOut,
  LogIn,
  UserPlus,
  LayoutDashboard,
  Smartphone,
  GraduationCap,
} from "lucide-react";

type MobileNavUser = {
  name: string;
  role: string;
  status: string;
} | null;

const MARKETPLACE_BUYER_ROLE_NAMES: string[] = ["PRINCIPAL", "COACHING_CENTRE", "TEACHER"];

const itemClass =
  "flex items-center gap-3 px-4 py-3 text-sm font-medium text-foreground/80 hover:bg-background hover:text-brand transition-colors";

export default function MobileNav({
  user,
  cartCount,
  logoutAction,
}: {
  user: MobileNavUser;
  cartCount: number;
  logoutAction: () => void | Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);

  const dashboardHref =
    user?.role === "SUPPLIER"
      ? "/dashboard/supplier"
      : user?.role === "WORKER"
        ? "/dashboard/worker"
        : user?.role === "TEACHER"
          ? "/dashboard/teacher"
          : user?.role === "ADMIN"
            ? "/admin"
            : null;

  return (
    <div className="md:hidden">
      <button
        type="button"
        aria-label={open ? "Close menu" : "Open menu"}
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="relative flex items-center justify-center h-10 w-10 rounded-lg text-foreground/80 hover:bg-background active:scale-95 transition-transform"
      >
        {open ? <X size={22} /> : <Menu size={22} />}
        {!open && cartCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex items-center justify-center bg-gold text-white text-[10px] font-bold rounded-full h-4 min-w-4 px-1">
            {cartCount}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 bg-black/30 z-30" onClick={close} />
          <div className="absolute left-0 right-0 top-full mt-px bg-surface border-b border-border shadow-lg z-40 max-h-[80vh] overflow-y-auto">
            <nav className="flex flex-col py-2">
              <Link
                href="/download"
                className="flex items-center gap-3 mx-2 my-1 px-3 py-2.5 rounded-xl bg-gold-light text-sm font-semibold text-gold-dark"
                onClick={close}
              >
                <Smartphone size={18} />
                Get the Android App
              </Link>

              <div className="border-t border-border my-1" />

              <Link href="/marketplace" className={itemClass} onClick={close}>
                <Store size={18} className="text-brand" />
                Marketplace
              </Link>
              <Link href="/services" className={itemClass} onClick={close}>
                <Wrench size={18} className="text-brand" />
                Find Services
              </Link>
              <Link href="/teachers" className={itemClass} onClick={close}>
                <GraduationCap size={18} className="text-brand" />
                Teachers
              </Link>
              <Link href="/gigs" className={itemClass} onClick={close}>
                <ClipboardList size={18} className="text-brand" />
                Gig Requests
              </Link>
              <Link href="/jobs" className={itemClass} onClick={close}>
                <Briefcase size={18} className="text-brand" />
                Job Vacancies
              </Link>

              {user && MARKETPLACE_BUYER_ROLE_NAMES.includes(user.role) && (
                <Link href="/cart" className={itemClass} onClick={close}>
                  <ShoppingCart size={18} className="text-brand" />
                  Cart
                  {cartCount > 0 && (
                    <span className="ml-auto inline-flex items-center justify-center bg-accent text-white text-xs font-bold rounded-full h-5 min-w-5 px-1">
                      {cartCount}
                    </span>
                  )}
                </Link>
              )}

              {dashboardHref && (
                <Link href={dashboardHref} className={itemClass} onClick={close}>
                  <LayoutDashboard size={18} className="text-brand" />
                  {user?.role === "ADMIN" ? "Admin" : "Dashboard"}
                </Link>
              )}

              <div className="border-t border-border my-2" />

              {user ? (
                <>
                  <div className="px-4 py-2 text-xs text-foreground/50">
                    Signed in as{" "}
                    <span className="font-semibold text-foreground/80">
                      {user.name}
                    </span>
                    {user.status !== "APPROVED" && (
                      <span className="ml-1 font-semibold text-amber-600">
                        ({user.status.toLowerCase()})
                      </span>
                    )}
                  </div>
                  <Link href="/account/settings" className={itemClass} onClick={close}>
                    <Settings size={18} className="text-foreground/60" />
                    Settings
                  </Link>
                  <form action={logoutAction}>
                    <button
                      type="submit"
                      onClick={close}
                      className={`${itemClass} text-left w-full text-red-600 hover:text-red-600`}
                    >
                      <LogOut size={18} />
                      Log out
                    </button>
                  </form>
                </>
              ) : (
                <>
                  <Link href="/login" className={itemClass} onClick={close}>
                    <LogIn size={18} className="text-foreground/60" />
                    Log in
                  </Link>
                  <Link href="/register" className={itemClass} onClick={close}>
                    <UserPlus size={18} className="text-gold" />
                    Sign up
                  </Link>
                </>
              )}
            </nav>
          </div>
        </>
      )}
    </div>
  );
}
