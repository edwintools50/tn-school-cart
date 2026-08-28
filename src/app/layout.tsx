import type { Metadata, Viewport } from "next";
import { Fraunces, Work_Sans, Geist_Mono } from "next/font/google";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import WhatsAppBubble from "@/components/WhatsAppBubble";
import ServiceWorkerRegistration from "@/components/ServiceWorkerRegistration";
import "./globals.css";

// Fraunces for headings (a warm, characterful serif — reads as an
// established institution) paired with Work Sans for body copy (clean,
// humanist, legible at small UI sizes) — a deliberate pairing over the
// generic Inter/Space-Grotesk defaults.
const fraunces = Fraunces({
  variable: "--font-display",
  subsets: ["latin"],
  axes: ["opsz", "SOFT", "WONK"],
});

const workSans = Work_Sans({
  variable: "--font-body",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "TN School Cart",
  description:
    "The Edu-commerce marketplace connecting Tamil Nadu school principals /HMs with trusted suppliers and gig workers.",
};

export const viewport: Viewport = {
  themeColor: "#1e3a5f",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${fraunces.variable} ${workSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <Nav />
        <main className="flex-1 flex flex-col">{children}</main>
        <Footer />
        <WhatsAppBubble />
        <ServiceWorkerRegistration />
      </body>
    </html>
  );
}
