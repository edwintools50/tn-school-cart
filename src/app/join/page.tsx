import QRCode from "qrcode";
import { GraduationCap, Wrench, Store, ArrowRight, Download } from "lucide-react";
import CopyLinkButton from "@/components/CopyLinkButton";

export const metadata = {
  title: "Join TN School Cart",
  description: "Shareable sign-up links and QR codes for teachers, gig workers, and vendors.",
};

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.tnschoolcart.com";

const roles = [
  {
    key: "teacher",
    icon: GraduationCap,
    title: "Teachers",
    body: "Get listed in our teacher directory so schools can find and contact you directly.",
    path: "/join/teacher",
  },
  {
    key: "worker",
    icon: Wrench,
    title: "Gig Workers",
    body: "List a service — plumbing, electrical, cleaning and more — for schools in your area.",
    path: "/join/worker",
  },
  {
    key: "vendor",
    icon: Store,
    title: "Vendors",
    body: "List your first product and start selling supplies to schools across Tamil Nadu.",
    path: "/join/vendor",
  },
];

export default async function JoinHubPage() {
  const cards = await Promise.all(
    roles.map(async (role) => {
      const url = `${BASE_URL}${role.path}`;
      const qr = await QRCode.toDataURL(url, {
        margin: 1,
        width: 320,
        color: { dark: "#0d3f6e", light: "#ffffff" },
      });
      return { ...role, url, qr };
    })
  );

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:py-14 w-full">
      <div className="text-center mb-10">
        <h1 className="text-2xl sm:text-3xl font-bold">Join TN School Cart</h1>
        <p className="text-sm text-foreground/60 mt-2 max-w-lg mx-auto">
          Share a link or QR code below — sign-up takes under a minute, verified by a quick
          email code. Our team reviews every submission before it goes live.
        </p>
      </div>

      <div className="grid sm:grid-cols-3 gap-5">
        {cards.map((role) => {
          const Icon = role.icon;
          return (
            <div key={role.key} className="card p-5 rounded-2xl flex flex-col items-center text-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-brand/10 flex items-center justify-center">
                <Icon size={22} className="text-brand" />
              </div>
              <div>
                <p className="font-semibold">{role.title}</p>
                <p className="text-xs text-foreground/60 mt-1">{role.body}</p>
              </div>

              <div className="rounded-xl border border-border p-2 bg-white">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={role.qr} alt={`QR code for ${role.title} sign-up`} className="w-36 h-36" />
              </div>

              <a
                href={role.qr}
                download={`tn-school-cart-${role.key}-qr.png`}
                className="flex items-center gap-1.5 text-xs font-semibold text-foreground/60 hover:text-brand"
              >
                <Download size={13} />
                Download QR
              </a>

              <div className="w-full pt-2 border-t border-border flex flex-col gap-2">
                <p className="text-[11px] text-foreground/50 break-all">{role.url}</p>
                <div className="flex items-center justify-center gap-4">
                  <CopyLinkButton url={role.url} />
                  <a
                    href={role.path}
                    className="flex items-center gap-1 text-xs font-semibold text-brand hover:underline"
                  >
                    Open form
                    <ArrowRight size={13} />
                  </a>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
