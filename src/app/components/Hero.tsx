import { ArrowRight, MapPin, Phone, Star } from "lucide-react";
import type { CSSProperties } from "react";
import type { CityContent } from "@/content/cities";
import { formatInteger, formatOneDecimal, formatUsdWhole } from "@/lib/format";
import { telHref } from "@/lib/site";
import { estimateSolar, monthlyKwhPerPanel } from "@/lib/solar";
import { CountUp } from "./CountUp";
import { HeroArt } from "./HeroArt";
import styles from "./Hero.module.css";

const order = (i: number) => ({ "--i": i }) as CSSProperties;

export function Hero({ city }: { city: CityContent }) {
  const creditPct = Math.round(city.federalCreditRate * 100);

  // The typical home the simulator opens with: its bill today vs. with solar.
  const typical = estimateSolar(city.simulatorDefaults, city);
  const billAfter = Math.max(0, typical.monthlyBill - typical.monthlySavings);
  const afterShare = Math.round((billAfter / typical.monthlyBill) * 100);

  const stats = [
    { value: formatInteger(city.installsCompleted), label: `homes installed across the ${city.metroArea} area` },
    { value: formatOneDecimal(city.avgRating), label: "average customer rating, out of 5", star: true },
    { value: formatInteger(city.crewsAvailable), label: `local install crews based in ${city.city}` },
    { value: `${city.avgPermitDays} days`, label: "average permit time — we tell you upfront" },
  ];

  return (
    <section className={styles.hero} aria-labelledby="hero-title" data-pointer="" data-parallax="">
      <div className={`container ${styles.grid}`}>
        <div className={styles.copy}>
          <p className="eyebrow" style={order(0)}>
            <MapPin size={16} aria-hidden="true" className={styles.pin} />
            {city.city}, {city.stateFull} · Home solar
          </p>

          <h1 id="hero-title" className={styles.title} style={order(1)}>
            Solar panels in {city.city}, {city.state},{" "}
            <em>
              <span className={styles.swash}>sized to the bill you actually&nbsp;pay.</span>
            </em>
          </h1>

          <p className={styles.lede} style={order(2)}>
            Tell us what you pay {city.utilityName} each month. We&rsquo;ll show you how many panels you need,
            the price after the {creditPct}% federal tax credit and when it pays for itself &mdash; with the math on
            the page, not hidden behind a monthly payment.
          </p>

          <div className={styles.actions} style={order(3)}>
            <a
              href="#estimate"
              className="btn btn-cta"
              data-cta="hero_estimate"
              data-cta-location="hero"
              data-magnetic=""
            >
              See my savings estimate
              <ArrowRight size={18} aria-hidden="true" />
            </a>
            <a
              href={telHref(city.phone)}
              className="btn btn-ghost"
              data-cta="hero_call"
              data-cta-location="hero"
              data-magnetic=""
            >
              <Phone size={18} aria-hidden="true" />
              Call {city.phone}
            </a>
          </div>
          <p className={styles.reassure} style={order(4)}>
            Free, instant and anonymous. No email needed to see your numbers.
          </p>
        </div>

        <div className={styles.visual}>
          <div className={styles.artWrap}>
            <HeroArt className={styles.art} />
          </div>
          <p className={`${styles.chip} ${styles.chipTop}`} style={order(0)}>
            <strong>
              <CountUp value={formatOneDecimal(city.peakSunHoursPerDay)} />
            </strong>{" "}
            peak sun hours a day in {city.city}
          </p>
          <div className={`${styles.chip} ${styles.chipBill}`} style={order(1)}>
            <p className={styles.billTitle}>A typical {formatUsdWhole(typical.monthlyBill)} bill</p>
            <dl className={styles.bills}>
              <div>
                <dt>Today</dt>
                <dd>
                  {formatUsdWhole(typical.monthlyBill)}
                  <span className={styles.bar} aria-hidden="true" />
                </dd>
              </div>
              <div>
                <dt>With solar</dt>
                <dd>
                  ≈ {formatUsdWhole(billAfter)}
                  <span
                    className={`${styles.bar} ${styles.barAfter}`}
                    style={{ "--to": `${Math.max(4, afterShare)}%` } as CSSProperties}
                    aria-hidden="true"
                  />
                </dd>
              </div>
            </dl>
          </div>
          <p className={`${styles.chip} ${styles.chipBottom}`} style={order(2)}>
            <strong>
              ≈ <CountUp value={`${formatInteger(monthlyKwhPerPanel(city))} kWh`} />
            </strong>{" "}
            per panel, every month
          </p>
        </div>
      </div>

      <div className="container">
        <dl className={styles.stats} data-stagger="">
          {stats.map((s) => (
            <div key={s.label} className={styles.stat}>
              <dt className={styles.statLabel}>{s.label}</dt>
              <dd className={styles.statValue}>
                <CountUp value={s.value} duration={1800} />
                {s.star ? <Star size={18} aria-hidden="true" className={styles.star} /> : null}
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
