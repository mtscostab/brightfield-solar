import type { CityContent } from "@/content/cities";
import { BRAND_NAME, SITE_URL, cityPath, telHref } from "@/lib/site";

/** schema.org structured data for local SEO (business + FAQ rich results). */
export function JsonLd({ city }: { city: CityContent }) {
  const url = `${SITE_URL}${cityPath(city.slug)}`;
  const graph = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "HomeAndConstructionBusiness",
        "@id": `${url}#business`,
        name: `${BRAND_NAME} ${city.city}`,
        url,
        telephone: telHref(city.phone).replace("tel:", ""),
        areaServed: [
          { "@type": "City", name: `${city.city}, ${city.stateFull}` },
          ...city.popularNeighborhoods.map((n) => ({ "@type": "Place", name: `${n}, ${city.city}` })),
        ],
        address: { "@type": "PostalAddress", addressLocality: city.city, addressRegion: city.state, addressCountry: "US" },
      },
      {
        "@type": "FAQPage",
        "@id": `${url}#faq`,
        mainEntity: city.faqs.map((f) => ({
          "@type": "Question",
          name: f.question,
          acceptedAnswer: { "@type": "Answer", text: f.answer.replace(/\n\n/g, " ") },
        })),
      },
    ],
  };

  return (
    <script
      type="application/ld+json"
      // Escape "<" so content can never close the script tag.
      dangerouslySetInnerHTML={{ __html: JSON.stringify(graph).replace(/</g, "\\u003c") }}
    />
  );
}
