"use client";

import { useEffect } from "react";

/**
 * One client island that drives every motion effect on the page. Server
 * components opt in with data attributes, so nothing else ships to the client:
 *
 *  - data-reveal            element fades/rises in when it enters the viewport
 *  - data-stagger           same, applied to each direct child in sequence
 *  - data-count             number counts up from zero when revealed
 *  - data-parallax          receives --p (-1 → 1) as it crosses the viewport
 *  - data-pointer           receives --mx/--my (-1 → 1, eased) while hovered
 *  - data-tilt              receives --rx/--ry/--gx/--gy for a 3D tilt + spotlight
 *  - data-magnetic          drifts toward the pointer (uses the `translate` property)
 *
 * The root also gets --page-scroll (0 → 1) and data-scrolled for the header.
 * With prefers-reduced-motion nothing is initialised and content renders static.
 */
export function MotionController() {
  useEffect(() => {
    const root = document.documentElement;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) return;
    const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

    root.classList.add("motion-ready");
    const cleanups: (() => void)[] = [];

    /* ------------------------------ Reveal + count ------------------------------ */

    document.querySelectorAll<HTMLElement>("[data-stagger]").forEach((el) => {
      Array.from(el.children).forEach((child, i) => (child as HTMLElement).style.setProperty("--i", String(i)));
    });

    const revealObserver = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const el = entry.target as HTMLElement;
          el.classList.add("is-in");
          el.querySelectorAll<HTMLElement>("[data-count]").forEach(countUp);
          if (el.hasAttribute("data-count")) countUp(el);
          revealObserver.unobserve(el);
        }
      },
      { rootMargin: "0px 0px -12% 0px", threshold: 0.12 },
    );
    document.querySelectorAll("[data-reveal], [data-stagger], [data-count]").forEach((el) => revealObserver.observe(el));
    cleanups.push(() => revealObserver.disconnect());

    /* ------------------------------ Scroll ------------------------------ */

    const parallaxEls = Array.from(document.querySelectorAll<HTMLElement>("[data-parallax]"));
    let scrollQueued = false;
    const onScroll = () => {
      if (scrollQueued) return;
      scrollQueued = true;
      requestAnimationFrame(() => {
        scrollQueued = false;
        const vh = window.innerHeight;
        const max = document.documentElement.scrollHeight - vh;
        root.style.setProperty("--page-scroll", max > 0 ? (window.scrollY / max).toFixed(4) : "0");
        root.toggleAttribute("data-scrolled", window.scrollY > 8);
        for (const el of parallaxEls) {
          const r = el.getBoundingClientRect();
          if (r.bottom < -vh * 0.5 || r.top > vh * 1.5) continue;
          // 0 when the element's centre sits at the viewport centre.
          const p = (r.top + r.height / 2 - vh / 2) / (vh / 2 + r.height / 2);
          el.style.setProperty("--p", Math.max(-1, Math.min(1, p)).toFixed(4));
        }
      });
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    cleanups.push(() => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    });

    if (!finePointer) return () => cleanups.forEach((fn) => fn());

    /* ------------------------------ Pointer follow (eased) ------------------------------ */

    document.querySelectorAll<HTMLElement>("[data-pointer]").forEach((el) => {
      let tx = 0;
      let ty = 0;
      let x = 0;
      let y = 0;
      let raf = 0;
      const tick = () => {
        x += (tx - x) * 0.08;
        y += (ty - y) * 0.08;
        el.style.setProperty("--mx", x.toFixed(4));
        el.style.setProperty("--my", y.toFixed(4));
        raf = Math.abs(tx - x) + Math.abs(ty - y) > 0.001 ? requestAnimationFrame(tick) : 0;
      };
      const kick = () => {
        if (!raf) raf = requestAnimationFrame(tick);
      };
      const move = (e: PointerEvent) => {
        const r = el.getBoundingClientRect();
        tx = ((e.clientX - r.left) / r.width) * 2 - 1;
        ty = ((e.clientY - r.top) / r.height) * 2 - 1;
        kick();
      };
      const leave = () => {
        tx = 0;
        ty = 0;
        kick();
      };
      el.addEventListener("pointermove", move);
      el.addEventListener("pointerleave", leave);
      cleanups.push(() => {
        cancelAnimationFrame(raf);
        el.removeEventListener("pointermove", move);
        el.removeEventListener("pointerleave", leave);
      });
    });

    /* ------------------------------ Tilt + spotlight ------------------------------ */

    document.querySelectorAll<HTMLElement>("[data-tilt]").forEach((el) => {
      const strength = Number(el.dataset.tilt) || 6;
      const move = (e: PointerEvent) => {
        const r = el.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width;
        const py = (e.clientY - r.top) / r.height;
        el.style.setProperty("--rx", `${((0.5 - py) * strength).toFixed(2)}deg`);
        el.style.setProperty("--ry", `${((px - 0.5) * strength).toFixed(2)}deg`);
        el.style.setProperty("--gx", `${(px * 100).toFixed(1)}%`);
        el.style.setProperty("--gy", `${(py * 100).toFixed(1)}%`);
      };
      const leave = () => {
        el.style.setProperty("--rx", "0deg");
        el.style.setProperty("--ry", "0deg");
      };
      el.addEventListener("pointermove", move);
      el.addEventListener("pointerleave", leave);
      cleanups.push(() => {
        el.removeEventListener("pointermove", move);
        el.removeEventListener("pointerleave", leave);
      });
    });

    /* ------------------------------ Magnetic buttons ------------------------------ */

    document.querySelectorAll<HTMLElement>("[data-magnetic]").forEach((el) => {
      const move = (e: PointerEvent) => {
        const r = el.getBoundingClientRect();
        const dx = e.clientX - (r.left + r.width / 2);
        const dy = e.clientY - (r.top + r.height / 2);
        el.style.translate = `${(dx * 0.18).toFixed(1)}px ${(dy * 0.28).toFixed(1)}px`;
      };
      const leave = () => {
        el.style.translate = "";
      };
      el.addEventListener("pointermove", move);
      el.addEventListener("pointerleave", leave);
      cleanups.push(() => {
        el.removeEventListener("pointermove", move);
        el.removeEventListener("pointerleave", leave);
      });
    });

    return () => cleanups.forEach((fn) => fn());
  }, []);

  return null;
}

/** Animates the first number inside the element from 0, keeping its formatting. */
function countUp(el: HTMLElement) {
  if (el.dataset.counted) return;
  el.dataset.counted = "1";
  const text = el.textContent ?? "";
  const match = text.match(/\d[\d,]*(\.\d+)?/);
  if (!match || match.index === undefined) return;
  const target = Number(match[0].replace(/,/g, ""));
  const decimals = match[1] ? match[1].length - 1 : 0;
  const grouped = match[0].includes(",");
  const before = text.slice(0, match.index);
  const after = text.slice(match.index + match[0].length);
  const fmt = new Intl.NumberFormat("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
    useGrouping: grouped,
  });
  const duration = Number(el.dataset.countDuration) || 1600;
  const start = performance.now();
  const frame = (now: number) => {
    const t = Math.min(1, (now - start) / duration);
    const eased = 1 - Math.pow(1 - t, 4);
    el.textContent = `${before}${fmt.format(target * eased)}${after}`;
    if (t < 1) requestAnimationFrame(frame);
  };
  requestAnimationFrame(frame);
}
