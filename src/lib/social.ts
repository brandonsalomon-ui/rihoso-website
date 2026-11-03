// RIHOSO's social accounts, and the latest Instagram posts for the site's feed.

export const SOCIAL = {
  instagram: {
    handle: "rihorologicalsociety",
    url: "https://www.instagram.com/rihorologicalsociety/",
  },
  facebook: {
    name: "Rhode Island Horological Society",
    url: "https://www.facebook.com/profile.php?id=100092576455261",
    // Graph API Page ID (the one Meta Business Suite uses).
    pageId: process.env.FACEBOOK_PAGE_ID || "105239985919975",
  },
};

export interface InstagramPost {
  id: string;
  caption: string;
  image: string;
  permalink: string;
  timestamp: string;
  isVideo: boolean;
  isCarousel: boolean;
}

interface GraphMedia {
  id: string;
  caption?: string;
  media_type?: "IMAGE" | "VIDEO" | "CAROUSEL_ALBUM";
  media_url?: string;
  thumbnail_url?: string;
  permalink?: string;
  timestamp?: string;
}

const GRAPH_VERSION = process.env.META_GRAPH_VERSION || "v23.0";
const FIELDS = "id,caption,media_type,media_url,thumbnail_url,permalink,timestamp";
const REVALIDATE = 3600; // refresh the feed once an hour

async function graphGet<T>(url: string): Promise<T | null> {
  try {
    const res = await fetch(url, { next: { revalidate: REVALIDATE } });
    if (!res.ok) {
      console.error("[social] Instagram feed request failed", res.status, await res.text().catch(() => ""));
      return null;
    }
    return (await res.json()) as T;
  } catch (err) {
    console.error("[social] Instagram feed request error", err);
    return null;
  }
}

/**
 * Latest posts from @rihorologicalsociety.
 *
 * Needs INSTAGRAM_ACCESS_TOKEN in the environment. Two kinds of token work:
 *  - A Meta Business system-user (or Page) token with instagram_basic +
 *    pages_read_engagement. The Instagram account is found through the
 *    Facebook Page, or set INSTAGRAM_USER_ID to skip that lookup.
 *  - An Instagram Login token (starts with "IG"), read via graph.instagram.com.
 *
 * Returns [] when no token is set or Instagram can't be reached, so the page
 * still renders with just the follow links.
 */
export async function getInstagramPosts(limit = 8): Promise<InstagramPost[]> {
  const token = process.env.INSTAGRAM_ACCESS_TOKEN;
  if (!token) return [];

  let mediaUrl: string;
  if (token.startsWith("IG")) {
    mediaUrl = `https://graph.instagram.com/${GRAPH_VERSION}/me/media?fields=${FIELDS}&limit=${limit}&access_token=${encodeURIComponent(token)}`;
  } else {
    let igUserId = process.env.INSTAGRAM_USER_ID;
    if (!igUserId) {
      const page = await graphGet<{ instagram_business_account?: { id: string } }>(
        `https://graph.facebook.com/${GRAPH_VERSION}/${SOCIAL.facebook.pageId}?fields=instagram_business_account&access_token=${encodeURIComponent(token)}`,
      );
      igUserId = page?.instagram_business_account?.id;
      if (!igUserId) return [];
    }
    mediaUrl = `https://graph.facebook.com/${GRAPH_VERSION}/${igUserId}/media?fields=${FIELDS}&limit=${limit}&access_token=${encodeURIComponent(token)}`;
  }

  const data = await graphGet<{ data?: GraphMedia[] }>(mediaUrl);
  return (data?.data || [])
    .map((m): InstagramPost | null => {
      const image = m.media_type === "VIDEO" ? m.thumbnail_url : m.media_url;
      if (!image || !m.permalink) return null;
      return {
        id: m.id,
        caption: (m.caption || "").trim(),
        image,
        permalink: m.permalink,
        timestamp: m.timestamp || "",
        isVideo: m.media_type === "VIDEO",
        isCarousel: m.media_type === "CAROUSEL_ALBUM",
      };
    })
    .filter((p): p is InstagramPost => p !== null)
    .slice(0, limit);
}
