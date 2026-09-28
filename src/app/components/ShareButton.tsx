"use client";

import { Check, Share2 } from "lucide-react";
import { useEffect, useState } from "react";

type Status = "idle" | "copied" | "manual";

interface ShareButtonProps {
  /** Analytics identifier, picked up by the delegated listener in <Analytics>. */
  cta: string;
  location: string;
  /** City name, used in the share sheet text. */
  city: string;
  /** "light" = outlined for dark backgrounds, "dark" = outlined for light ones. */
  variant?: "light" | "dark";
  label?: string;
}

/**
 * Shares the current address. Because the simulator mirrors its inputs into
 * the query string, the link opens with the same estimate for whoever
 * receives it — and existing UTM parameters travel with it.
 */
export function ShareButton({ cta, location, city, variant = "dark", label = "Share this estimate" }: ShareButtonProps) {
  const [status, setStatus] = useState<Status>("idle");

  useEffect(() => {
    if (status === "idle") return;
    const t = window.setTimeout(() => setStatus("idle"), 4000);
    return () => window.clearTimeout(t);
  }, [status]);

  async function share() {
    const url = window.location.href;
    const data = { title: `Solar estimate for ${city}`, text: `Here's the solar estimate I ran for our home in ${city}:`, url };

    if (typeof navigator.share === "function" && (!navigator.canShare || navigator.canShare(data))) {
      try {
        await navigator.share(data);
        return;
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") return; // user closed the sheet
      }
    }

    try {
      await navigator.clipboard.writeText(url);
      setStatus("copied");
    } catch {
      setStatus("manual");
    }
  }

  return (
    <span className="share">
      <button
        type="button"
        className={`btn ${variant === "light" ? "btn-ghost-light" : "btn-ghost"}`}
        onClick={share}
        data-cta={cta}
        data-cta-location={location}
      >
        {status === "copied" ? <Check size={18} aria-hidden="true" /> : <Share2 size={18} aria-hidden="true" />}
        {status === "copied" ? "Link copied" : label}
      </button>
      <span role="status" className={status === "manual" ? "share-status" : "visually-hidden"}>
        {status === "copied" && "Link copied to your clipboard."}
        {status === "manual" && "Copy the address from your browser bar to share it."}
      </span>
    </span>
  );
}
