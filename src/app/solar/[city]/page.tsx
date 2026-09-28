import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CityLandingPage } from "@/app/components/CityLandingPage";
import { getAllCities, getCityBySlug } from "@/content/cities";
import { formatInteger, formatOneDecimal } from "@/lib/format";
import { BRAND_NAME, cityPath } from "@/lib/site";

// Only registered cities exist; anything else is a real 404 at build time.
export const dynamicParams = false;

export function generateStaticParams() {
  return getAllCities().map((c) => ({ city: c.slug }));
}

export async function generateMetadata({ params }: PageProps<"/solar/[city]">): Promise<Metadata> {
  const { city: slug } = await params;
  const city = getCityBySlug(slug);
  if (!city) return {};

  const title = `Solar panels in ${city.city}, ${city.state}`;
  const description =
    `See how many solar panels your ${city.city} home needs, the cost after the ${Math.round(city.federalCreditRate * 100)}% federal tax credit and your payback — instantly. ` +
    `${formatInteger(city.installsCompleted)} local installs, rated ${formatOneDecimal(city.avgRating)}/5.`;
  const path = cityPath(city.slug);

  return {
    title, // → "Solar panels in Phoenix, AZ | Brightfield Solar" via the root template
    description,
    alternates: { canonical: path },
    openGraph: {
      type: "website",
      locale: "en_US",
      siteName: BRAND_NAME,
      url: path,
      title: `${title} | ${BRAND_NAME}`,
      description,
    },
    twitter: { card: "summary_large_image", title: `${title} | ${BRAND_NAME}`, description },
    other: { "geo.region": `US-${city.state}`, "geo.placename": city.city },
  };
}

export default async function CityPage({ params }: PageProps<"/solar/[city]">) {
  const { city: slug } = await params;
  const city = getCityBySlug(slug);
  if (!city) notFound();
  return <CityLandingPage city={city} />;
}
