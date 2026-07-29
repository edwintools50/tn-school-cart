import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "TN School Cart — Edu-commerce Marketplace",
    short_name: "TN School Cart",
    description:
      "The Edu-commerce marketplace connecting Tamil Nadu school principals /HMs with trusted suppliers, gig workers, teachers, and coaching centres.",
    start_url: "/",
    display: "standalone",
    background_color: "#f7f9fc",
    theme_color: "#145c9e",
    orientation: "portrait-primary",
    icons: [
      {
        src: "/icon.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
    categories: ["education", "shopping", "business"],
  };
}
