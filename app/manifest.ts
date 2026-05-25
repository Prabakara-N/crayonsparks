import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "CrayonSparks — AI Story, Coloring & Activity Books",
    short_name: "CrayonSparks",
    description:
      "Create kids' books in minutes. Story books, coloring books and activity books for parents and Amazon KDP creators.",
    start_url: "/",
    display: "standalone",
    background_color: "#000000",
    theme_color: "#8b5cf6",
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
  };
}
