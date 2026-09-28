import { ClipboardCheck, FileCheck2, PlugZap } from "lucide-react";
import type { CityContent } from "@/content/cities";
import styles from "./Process.module.css";

export function Process({ city }: { city: CityContent }) {
  const steps = [
    {
      icon: ClipboardCheck,
      title: "A written quote that shows the math",
      body: `A local crew lead visits, measures your roof and turns this estimate into an itemized quote built on the same formula you just used. No pressure, no monthly-payment tricks.`,
    },
    {
      icon: FileCheck2,
      title: "Permits and paperwork, handled",
      body: `We file with the City of ${city.city} and ${city.utilityName} for you. Permits here average ${city.avgPermitDays} days, and we tell you that before you sign.`,
    },
    {
      icon: PlugZap,
      title: "Install day, then switch on",
      body: `One of our ${city.crewsAvailable} local crews installs your system. After the city inspection and ${city.utilityName}'s approval, we tell you the day you can switch on.`,
    },
  ];

  return (
    <section id="how-it-works" className="section" aria-labelledby="process-title">
      <div className="container">
        <header className="section-head" data-stagger="">
          <p className="eyebrow">How it works</p>
          <h2 id="process-title">Three steps from estimate to sunshine on your meter</h2>
        </header>

        <ol className={styles.steps} data-stagger="" data-parallax="">
          {steps.map((step, i) => {
            const Icon = step.icon;
            return (
              <li key={step.title} className={styles.step} data-tilt="8">
                <div className={styles.top}>
                  <span className={styles.number} aria-hidden="true">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <Icon size={26} aria-hidden="true" className={styles.icon} />
                </div>
                <h3 className={styles.title}>
                  <span className="visually-hidden">Step {i + 1}: </span>
                  {step.title}
                </h3>
                <p className={styles.body}>{step.body}</p>
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}
