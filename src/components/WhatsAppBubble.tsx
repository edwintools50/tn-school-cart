import { whatsappLink } from "@/lib/whatsapp";

export default function WhatsAppBubble() {
  const href = whatsappLink(
    "Hi TN School Cart! 👋 I have a quick question — could someone help me out?"
  );

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat with TN School Cart on WhatsApp"
      title="Chat on WhatsApp"
      className="fixed bottom-5 right-5 z-30 flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] shadow-lg transition-transform hover:scale-105"
    >
      <svg
        viewBox="0 0 32 32"
        aria-hidden="true"
        className="h-8 w-8 fill-white"
      >
        <path d="M16.004 3C9.377 3 4 8.373 4 15c0 2.31.64 4.47 1.75 6.31L4 29l7.86-1.7A11.94 11.94 0 0 0 16.004 27C22.63 27 28 21.627 28 15S22.63 3 16.004 3Zm0 21.8a9.75 9.75 0 0 1-4.97-1.36l-.357-.212-4.663 1.01 1.02-4.54-.234-.37A9.74 9.74 0 0 1 6.2 15c0-5.404 4.4-9.8 9.804-9.8 5.403 0 9.796 4.396 9.796 9.8 0 5.404-4.393 9.8-9.796 9.8Zm5.373-7.34c-.294-.148-1.74-.858-2.01-.956-.27-.099-.467-.148-.664.148-.196.295-.762.955-.934 1.152-.172.196-.344.221-.638.074-.294-.148-1.243-.457-2.368-1.457-.875-.78-1.466-1.744-1.638-2.039-.172-.295-.018-.454.13-.601.134-.133.294-.345.442-.517.147-.172.196-.295.294-.492.098-.196.049-.369-.025-.517-.074-.148-.664-1.6-.91-2.19-.24-.575-.484-.497-.664-.506l-.566-.01c-.196 0-.516.074-.786.369-.27.295-1.03 1.007-1.03 2.456 0 1.45 1.055 2.85 1.202 3.046.147.196 2.077 3.17 5.032 4.445.703.303 1.251.484 1.678.62.705.224 1.347.192 1.855.117.566-.085 1.74-.712 1.985-1.4.245-.688.245-1.278.172-1.4-.074-.123-.27-.196-.564-.344Z" />
      </svg>
    </a>
  );
}
