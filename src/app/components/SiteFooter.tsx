import type { CityContent } from "@/content/cities";
import { formatUsd } from "@/lib/format";
import { telHref } from "@/lib/site";
import { BrandMark } from "./BrandMark";
import styles from "./SiteFooter.module.css";

export function SiteFooter({ city }: { city: CityContent }) {
  return (
    <footer className={styles.footer}>
      <div className={`container ${styles.inner}`}>
        <div className={styles.brand}>
          <BrandMark size={34} />
          <div>
            <p className={styles.name}>Brightfield Solar · {city.city}</p>
            <p>
              Residential solar for the {city.metroArea} area.{" "}
              <a href={telHref(city.phone)} data-cta="footer_call" data-cta-location="footer">
                {city.phone}
              </a>
            </p>
          </div>
        </div>

        <p className={styles.fine}>
          Estimates use a {city.utilityName} rate of {formatUsd(city.utilityRatePerKwh)}/kWh, {city.peakSunHoursPerDay}{" "}
          peak sun hours a day, {city.panelWatts} W panels at {Math.round(city.performanceRatio * 100)}% performance and{" "}
          {formatUsd(city.costPerWattInstalled)} per installed watt. They are illustrations, not quotes or tax advice.
          Brightfield Solar is a fictional company created for a technical case study.
        </p>
      </div>
    </footer>
  );
}
