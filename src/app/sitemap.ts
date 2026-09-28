import type { MetadataRoute } from "next";
import { getAllCities } from "@/content/cities";
import { SITE_URL, cityPath } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  return getAllCities().map((city) => ({
    url: `${SITE_URL}${cityPath(city.slug)}`,
    changeFrequency: "monthly",
    priority: 0.8,
  }));
}
