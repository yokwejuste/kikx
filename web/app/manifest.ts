import type { MetadataRoute } from "next";
import { getTranslations } from "next-intl/server";

export default async function manifest(): Promise<MetadataRoute.Manifest> {
  const t = await getTranslations("metadata");
  return {
    name: "kikx",
    short_name: "kikx",
    description: t("description"),
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
