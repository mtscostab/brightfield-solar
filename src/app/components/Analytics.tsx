"use client";

import { useEffect } from "react";
import { getSessionUtms } from "@/lib/analytics/attribution";
import { track } from "@/lib/analytics/client";

/**
 * Mounted once per page. It:
 *  1. captures UTMs on landing (persisted for the session), and
 *  2. tracks `cta_clicked` through one delegated listener, so CTAs can stay in
 *     Server Components and only need `data-cta` / `data-cta-location`.
 */
export function Analytics({ city }: { city: string }) {
  useEffect(() => {
    getSessionUtms();

    function onClick(event: MouseEvent) {
      const target = event.target;
      if (!(target instanceof Element)) return;
      const el = target.closest<HTMLElement>("[data-cta]");
      if (!el) return;
      track("cta_clicked", city, {
        cta: el.dataset.cta ?? "unknown",
        location: el.dataset.ctaLocation ?? "unknown",
        href: el.getAttribute("href"),
      });
    }

    // Capture phase: runs before navigation (tel:, anchors) or share sheets.
    document.addEventListener("click", onClick, { capture: true });
    return () => document.removeEventListener("click", onClick, { capture: true });
  }, [city]);

  return null;
}
