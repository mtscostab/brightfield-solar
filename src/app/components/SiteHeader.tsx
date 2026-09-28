import { Phone } from "lucide-react";
import type { CityContent } from "@/content/cities";
import { cityPath, telHref } from "@/lib/site";
import { BrandMark } from "./BrandMark";
import styles from "./SiteHeader.module.css";

const NAV = [
  { href: "#estimate", label: "Estimate" },
  { href: "#how-it-works", label: "How it works" },
  { href: "#reviews", label: "Reviews" },
  { href: "#faq", label: "FAQ" },
];

export function SiteHeader({ city }: { city: CityContent }) {
  return (
    <header className={styles.header}>
      <div className={`container ${styles.inner}`}>
        <a href={cityPath(city.slug)} className={styles.brand}>
          <BrandMark />
          <span className={styles.wordmark}>
            Brightfield <span>Solar</span>
          </span>
          <span className="visually-hidden">, {city.city} home page</span>
        </a>

        <nav aria-label="On this page" className={styles.nav}>
          <ul>
            {NAV.map((item) => (
              <li key={item.href}>
                <a href={item.href}>{item.label}</a>
              </li>
            ))}
          </ul>
        </nav>

        <a
          href={telHref(city.phone)}
          className={`btn btn-ghost ${styles.call}`}
          data-cta="header_call"
          data-cta-location="header"
        >
          <Phone size={18} aria-hidden="true" />
          <span className={styles.callText}>{city.phone}</span>
          <span className="visually-hidden">Call Brightfield Solar {city.city}</span>
        </a>
      </div>
    </header>
  );
}
