"use client";

import { useEffect } from "react";
import { trackTikTok } from "@/lib/tiktok";

/**
 * Tells TikTok someone viewed one of RIHOSO's paid offerings (membership, clinic).
 * Waits briefly for the pixel to load, since this runs as soon as the page appears.
 */
export default function TikTokViewContent({
  contentId,
  contentName,
  value,
}: {
  contentId: string;
  contentName: string;
  value?: number;
}) {
  useEffect(() => {
    let tries = 0;
    const timer = setInterval(() => {
      const ready = typeof (window as unknown as { ttq?: { track?: unknown } }).ttq?.track === "function";
      if (!ready && ++tries < 40) return; // up to ~10s
      clearInterval(timer);
      if (!ready) return;
      trackTikTok("ViewContent", {
        content_id: contentId,
        content_name: contentName,
        content_type: "product",
        value,
        currency: value !== undefined ? "USD" : undefined,
      });
    }, 250);
    return () => clearInterval(timer);
  }, [contentId, contentName, value]);

  return null;
}
