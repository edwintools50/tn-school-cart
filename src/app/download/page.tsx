import Image from "next/image";
import { Download, ShieldCheck, Smartphone } from "lucide-react";

export const metadata = {
  title: "Download the Android App — TN School Cart",
};

const APK_URL =
  "https://izaqlpeuoatetynz.public.blob.vercel-storage.com/releases/tn-school-cart-latest.apk";

const steps: { title: string; body: string; image: string }[] = [
  {
    title: "Download the file",
    body: 'Tap the download button above. Once it finishes, tap "Open" on the download notification.',
    image: "/install-guide/step1-downloaded.png",
  },
  {
    title: "Allow installs from your browser",
    body: 'The first time, your phone will say it isn\'t allowed to install unknown apps yet. Tap "Settings".',
    image: "/install-guide/step2-permission.png",
  },
  {
    title: "Turn the toggle on",
    body: 'Switch on "Allow from this source", then go back and tap the downloaded file again.',
    image: "/install-guide/step3-allow-toggle.png",
  },
  {
    title: "If you see a red \"Danger\" screen",
    body: "This is a standard Xiaomi/MIUI warning shown for any app installed outside the Play Store — not specific to our app. Tick the checkbox and tap OK to continue.",
    image: "/install-guide/step4-danger-warning.png",
  },
  {
    title: "Confirm the install",
    body: 'You\'ll see the real TN School Cart app icon and name. Tap "Install".',
    image: "/install-guide/step5-confirm.png",
  },
  {
    title: "Let Google Play Protect scan it",
    body: 'Google automatically offers to scan the app for safety. Tap "Scan app" — it only takes a few seconds.',
    image: "/install-guide/step6-play-protect.png",
  },
  {
    title: "Done",
    body: 'You\'ll see a confirmation that the app passed all security checks. Tap "Open" to launch TN School Cart.',
    image: "/install-guide/step7-installed.png",
  },
];

export default function DownloadPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:py-14 w-full">
      <div className="flex flex-col items-center text-center gap-4">
        <div className="w-20 h-20 rounded-2xl overflow-hidden border border-border shadow-sm flex items-center justify-center bg-surface p-3">
          <Image src="/logo.svg" alt="TN School Cart" width={56} height={56} />
        </div>
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Download for Android</h1>
          <p className="text-sm text-foreground/60 mt-1 max-w-md">
            TN School Cart isn&apos;t on the Play Store yet, so you&apos;ll install it
            directly — completely safe, and takes under a minute.
          </p>
        </div>

        <a
          href={APK_URL}
          download
          className="flex items-center gap-2 bg-brand text-white font-semibold rounded-full px-6 py-3 hover:bg-brand-dark active:scale-95 transition-all shadow-sm"
        >
          <Download size={18} />
          Download APK (842 KB)
        </a>

        <div className="flex items-center gap-1.5 text-xs text-foreground/50">
          <ShieldCheck size={14} className="text-accent" />
          Signed, scanned by Google Play Protect on install, no ads
        </div>
      </div>

      <div className="mt-12">
        <h2 className="flex items-center gap-2 text-lg font-bold mb-1">
          <Smartphone size={20} className="text-brand" />
          How to install
        </h2>
        <p className="text-sm text-foreground/60 mb-6">
          These are the real screens you&apos;ll see, in order. Every Android phone
          shows some version of steps 2 &amp; 3 for any app installed outside the
          Play Store — it isn&apos;t a warning specific to this app.
        </p>

        <div className="grid sm:grid-cols-2 gap-4">
          {steps.map((step, i) => (
            <div key={step.title} className="card p-4 rounded-2xl flex gap-3">
              <div className="w-16 shrink-0 rounded-lg overflow-hidden border border-border">
                <Image
                  src={step.image}
                  alt={step.title}
                  width={1080}
                  height={2400}
                  className="w-full h-auto"
                />
              </div>
              <div>
                <p className="text-xs font-semibold text-accent uppercase tracking-wide">
                  Step {i + 1}
                </p>
                <p className="font-semibold text-sm mt-0.5">{step.title}</p>
                <p className="text-xs text-foreground/60 mt-1 leading-relaxed">
                  {step.body}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
