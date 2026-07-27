export const WHATSAPP_BUSINESS_NUMBER = "919943080009";

export function whatsappLink(message: string) {
  const params = new URLSearchParams({ text: message });
  return `https://wa.me/${WHATSAPP_BUSINESS_NUMBER}?${params.toString()}`;
}
