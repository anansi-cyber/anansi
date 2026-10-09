import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

// Nécessaire avec output: "export" : le fichier est généré une fois, au build.
export const dynamic = "force-static";

// Ajouter ici chaque nouvelle page du site (ex. /mentions-legales).
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: SITE_URL,
      changeFrequency: "monthly",
      priority: 1,
    },
    {
      url: `${SITE_URL}/mentions-legales`,
      changeFrequency: "yearly",
      priority: 0.2,
    },
    {
      url: `${SITE_URL}/confidentialite`,
      changeFrequency: "yearly",
      priority: 0.2,
    },
  ];
}
