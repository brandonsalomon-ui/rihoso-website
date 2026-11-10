// Small, safe wrapper around the TikTok Pixel (loaded in components/TikTokPixel.tsx).
// Tracking must never break the site, so every call is guarded.

type TikTokProps = {
  value?: number;
  currency?: string;
  content_name?: string;
  content_type?: string;
  content_id?: string;
};

type Ttq = {
  page: () => void;
  track: (event: string, props?: TikTokProps, options?: { event_id?: string }) => void;
};

export function trackTikTok(event: string, props?: TikTokProps, eventId?: string) {
  try {
    const ttq = (window as unknown as { ttq?: Ttq }).ttq;
    if (!ttq || typeof ttq.track !== "function") return;
    ttq.track(event, props, eventId ? { event_id: eventId } : undefined);
  } catch {
    // ignore — analytics is best-effort
  }
}
