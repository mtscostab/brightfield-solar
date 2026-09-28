import { Calculator, Phone } from "lucide-react";
import type { CityContent } from "@/content/cities";
import { telHref } from "@/lib/site";
import styles from "./MobileCtaBar.module.css";

/** Thumb-reach actions for phones; hidden from 768px up, where the header has them. */
export function MobileCtaBar({ city }: { city: CityContent }) {
  return (
    <nav className={styles.bar} aria-label="Quick actions">
      <a href="#estimate" className={`btn btn-ghost ${styles.btn}`} data-cta="mobile_bar_estimate" data-cta-location="mobile_bar">
        <Calculator size={18} aria-hidden="true" />
        Estimate
      </a>
      <a href={telHref(city.phone)} className={`btn btn-cta ${styles.btn}`} data-cta="mobile_bar_call" data-cta-location="mobile_bar">
        <Phone size={18} aria-hidden="true" />
        Call now
      </a>
    </nav>
  );
}
