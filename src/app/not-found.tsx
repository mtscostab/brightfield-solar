import type { Metadata } from "next";
import Link from "next/link";
import { getAllCities } from "@/content/cities";
import { cityPath } from "@/lib/site";

export const metadata: Metadata = {
  title: "Page not found",
  robots: { index: false },
};

export default function NotFound() {
  const cities = getAllCities();
  return (
    <main className="nf-main">
      <p className="eyebrow">404</p>
      <h1 className="nf-title">We don&rsquo;t have a page for that address yet.</h1>
      <p className="nf-lede">
        Brightfield city pages live at <code>/solar/city-state</code>. Here&rsquo;s where we install today:
      </p>
      <ul className="nf-list">
        {cities.map((c) => (
          <li key={c.slug}>
            <Link href={cityPath(c.slug)} className="btn btn-cta">
              Solar in {c.city}, {c.state}
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
