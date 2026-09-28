import { Plus } from "lucide-react";
import type { CityContent } from "@/content/cities";
import styles from "./Faq.module.css";

export function Faq({ city }: { city: CityContent }) {
  return (
    <section id="faq" className="section" aria-labelledby="faq-title">
      <div className={`container ${styles.grid}`}>
        <header className="section-head" data-stagger="">
          <p className="eyebrow">Questions</p>
          <h2 id="faq-title">Straight answers about solar in {city.city}</h2>
          <p>The same numbers as the simulator above. If something isn&rsquo;t covered, call us and ask.</p>
        </header>

        <div className={styles.list} data-stagger="">
          {city.faqs.map((faq, i) => (
            <details key={faq.question} className={styles.item} open={i === 0}>
              <summary className={styles.summary}>
                <h3 className={styles.question}>{faq.question}</h3>
                <Plus size={20} aria-hidden="true" className={styles.icon} />
              </summary>
              <div className={styles.answer}>
                {faq.answer.split("\n\n").map((paragraph) => (
                  <p key={paragraph.slice(0, 32)}>{paragraph}</p>
                ))}
              </div>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
