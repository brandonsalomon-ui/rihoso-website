"use client";

import { useEffect } from "react";

type Ttq = { track: (event: string, data?: Record<string, unknown>, opts?: { event_id?: string }) => void };

/**
 * Reports a completed payment to the TikTok Pixel, once per Stripe checkout session.
 * Rendered only on the confirmation pages, and only after the payment is confirmed as paid.
 */
export default function TikTokPurchase({
  eventId,
  value,
  contentId,
  contentName,
  quantity = 1,
}: {
  eventId: string;
  value: number;
  contentId: string;
  contentName: string;
  quantity?: number;
}) {
  useEffect(() => {
    const key = `ttq-purchase-${eventId}`;
    try {
      if (sessionStorage.getItem(key)) return; // a page refresh shouldn't count the sale twice
    } catch {}

    let tries = 0;
    const timer = setInterval(() => {
      const ttq = (window as unknown as { ttq?: Ttq }).ttq;
      if (!ttq?.track && ++tries < 40) return; // wait up to ~10s for the pixel to load
      clearInterval(timer);
      if (!ttq?.track) return;
      ttq.track(
        "Purchase",
        {
          value,
          currency: "USD",
          contents: [{ content_id: contentId, content_name: contentName, content_type: "product", quantity }],
        },
        { event_id: eventId },
      );
      try {
        sessionStorage.setItem(key, "1");
      } catch {}
    }, 250);
    return () => clearInterval(timer);
  }, [eventId, value, contentId, contentName, quantity]);

  return null;
}
