import { HardHat, MapPin, Star } from "lucide-react";
import type { CityContent } from "@/content/cities";
import { formatInteger, formatMonthYear, formatOneDecimal } from "@/lib/format";
import { CountUp } from "./CountUp";
import styles from "./SocialProof.module.css";

const initials = (name: string) =>
  name
    .replace(/^The\s+/i, "")
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();

function Rating({ value }: { value: number }) {
  return (
    <span className={styles.rating}>
      <Star size={15} aria-hidden="true" className={styles.star} />
      <span>
        {formatOneDecimal(value)}
        <span className="visually-hidden"> out of 5</span>
      </span>
    </span>
  );
}

export function SocialProof({ city }: { city: CityContent }) {
  return (
    <section id="reviews" className={`section ${styles.section}`} aria-labelledby="reviews-title">
      <div className="container">
        <header className="section-head" data-stagger="">
          <p className="eyebrow">
            <MapPin size={16} aria-hidden="true" />
            From {city.city} homeowners
          </p>
          <h2 id="reviews-title">Neighbors who checked the math first</h2>
          <p>
            {formatInteger(city.installsCompleted)} installs across {city.metroArea}, rated{" "}
            {formatOneDecimal(city.avgRating)} out of 5 on average.
          </p>
        </header>

        <ul className={styles.quotes} data-stagger="">
          {city.testimonials.map((t, i) => (
            <li key={t.author} className={`${styles.quoteCard} ${i === 0 ? styles.featured : ""}`} data-tilt="6">
              <figure>
                <blockquote className={styles.quote}>
                  <p>{t.quote}</p>
                </blockquote>
                <figcaption className={styles.cite}>
                  <span className={styles.avatar} aria-hidden="true">
                    {initials(t.author)}
                  </span>
                  <span>
                    <strong>{t.author}</strong>
                    <span className={styles.meta}>
                      {t.neighborhood} · <time dateTime={t.date}>{formatMonthYear(t.date)}</time>
                    </span>
                  </span>
                </figcaption>
              </figure>
            </li>
          ))}
        </ul>

        <div className={styles.crewsHead} data-reveal="">
          <h3>The crews who&rsquo;ll be on your roof</h3>
          <p>
            {city.crewsAvailable} local crews, based in {city.city}. Here are three of them.
          </p>
        </div>

        <ul className={styles.crews} data-stagger="">
          {city.crews.map((crew) => (
            <li key={crew.name} className={styles.crew} data-tilt="6">
              <div className={styles.crewTop}>
                <span className={styles.crewBadge} aria-hidden="true">
                  <HardHat size={20} />
                </span>
                <Rating value={crew.rating} />
              </div>
              <h4 className={styles.crewName}>{crew.name}</h4>
              <p className={styles.crewBlurb}>{crew.blurb}</p>
              <dl className={styles.crewStats}>
                <div>
                  <dt>Installs</dt>
                  <dd>
                    <CountUp value={formatInteger(crew.installs)} />
                  </dd>
                </div>
                <div>
                  <dt>With us since</dt>
                  <dd>{crew.since}</dd>
                </div>
              </dl>
            </li>
          ))}
        </ul>

        <p className={styles.areas} data-reveal="">
          <MapPin size={16} aria-hidden="true" />
          <span>
            Popular with homeowners in {city.popularNeighborhoods.slice(0, -1).join(", ")} and{" "}
            {city.popularNeighborhoods.at(-1)}.
          </span>
        </p>
      </div>
    </section>
  );
}
