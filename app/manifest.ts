import type { MetadataRoute } from "next"

// PWA manifest — makes CertForge installable on mobile and desktop.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "CertForge — AI Exam Prep",
    short_name: "CertForge",
    description:
      "AI-powered, adaptive practice questions for high-stakes certification exams.",
    start_url: "/dashboard",
    display: "standalone",
    orientation: "portrait",
    background_color: "#0e1116",
    theme_color: "#0e1116",
    categories: ["education", "productivity"],
    icons: [
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  }
}
