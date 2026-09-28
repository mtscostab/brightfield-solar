import { Phone } from "lucide-react";
import type { CSSProperties } from "react";
import type { CityContent } from "@/content/cities";
import { telHref } from "@/lib/site";
import { ShareButton } from "./ShareButton";
import styles from "./FinalCta.module.css";

export function FinalCta({ city }: { city: CityContent }) {
  return (
    <section id="quote" className={`${styles.section} on-dark`} data-pointer="" aria-labelledby="quote-title">
      <div className={`container ${styles.inner}`}>
        <div className={styles.copy} data-stagger="">
          <p className={styles.eyebrow}>Your written quote</p>
          <h2 id="quote-title" className={styles.title}>
            Ready when you are. <em>Or when whoever you decide with is.</em>
          </h2>
          <p className={styles.lede}>
            Call a {city.city} crew lead to book a free roof visit and a written, itemized quote. Want a second opinion
            first? Share this page &mdash; your numbers come with the link.
          </p>
        </div>

        <div className={styles.actions} data-reveal="" style={{ "--delay": "300ms" } as CSSProperties}>
          <a
            href={telHref(city.phone)}
            className={`btn btn-cta ${styles.call}`}
            data-cta="final_call"
            data-cta-location="final_cta"
            data-magnetic=""
          >
            <Phone size={20} aria-hidden="true" />
            Call {city.phone}
          </a>
          <ShareButton cta="final_share" location="final_cta" city={city.city} variant="light" label="Send my estimate to someone" />
          <p className={styles.fine}>
            Free visit, no obligation. Your estimate isn&rsquo;t stored anywhere &mdash; it lives in the link.
          </p>
        </div>
      </div>
    </section>
  );
}
