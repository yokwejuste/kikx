import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "kikx",
    short_name: "kikx",
    description: "Vendor real, editable infrastructure files into your project",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#0a0a0a",
    icons: [
      { src: "/kikx-icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/kikx-icon-512.png", sizes: "512x512", type: "image/png" },
    ],
  };
}
