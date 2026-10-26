import crypto from "node:crypto";
import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { BLOG_COVERS, getPublishedPosts, slugify } from "@/lib/blog";
import { sendNotification } from "@/lib/email";
import { siteUrl } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

/** Public list of published posts (titles and topics), so the weekly writer never repeats a subject. */
export async function GET() {
  const posts = await getPublishedPosts(500);
  return NextResponse.json({
    posts: posts.map((p) => ({ slug: p.slug, title: p.title, topic: p.topic, published_at: p.published_at, cover: p.cover })),
  });
}

function authorized(request: Request) {
  const expected = process.env.BLOG_PUBLISH_TOKEN ?? "";
  const given = (request.headers.get("authorization") ?? "").replace(/^Bearer\s+/i, "");
  if (expected.length < 32 || given.length !== expected.length) return false;
  return crypto.timingSafeEqual(Buffer.from(given), Buffer.from(expected));
}

function str(v: unknown, max: number) {
  return typeof v === "string" ? v.trim().slice(0, max) : "";
}

/**
 * Publishes a blog post. Token-protected (BLOG_PUBLISH_TOKEN); used by the weekly writing task.
 * Body: { title, excerpt, body (Markdown), sources: [{title, url}], topic?, cover? }
 */
export async function POST(request: Request) {
  if (!authorized(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  let data: Record<string, unknown>;
  try {
    data = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const title = str(data.title, 140);
  const excerpt = str(data.excerpt, 320);
  const body = typeof data.body === "string" ? data.body.replace(/\r\n/g, "\n").trim() : "";
  const topic = str(data.topic, 120) || null;
  const coverIn = str(data.cover, 20);
  const sources = Array.isArray(data.sources)
    ? data.sources
        .map((s) => ({ title: str((s as Record<string, unknown>)?.title, 200), url: str((s as Record<string, unknown>)?.url, 500) }))
        .filter((s) => s.title && /^https:\/\/[^\s]+$/.test(s.url))
        .slice(0, 12)
    : [];

  const problems: string[] = [];
  if (title.length < 5) problems.push("title is required");
  if (excerpt.length < 20) problems.push("excerpt must be at least 20 characters");
  if (body.length < 1500 || body.length > 20000) problems.push("body must be 1,500–20,000 characters of Markdown");
  if (/<\s*\/?\s*[a-z]/i.test(body)) problems.push("body must be plain Markdown, no HTML");
  if (sources.length < 2) problems.push("at least 2 sources with https URLs are required");
  if (problems.length) return NextResponse.json({ error: "Invalid post", problems }, { status: 400 });

  const admin = createAdminClient();

  // Guard against runaway or duplicate runs: at most one automatic post every 5 days.
  const { data: recent } = await admin
    .from("blog_posts")
    .select("slug, published_at")
    .eq("created_by", "weekly-writer")
    .gte("published_at", new Date(Date.now() - 5 * 86400000).toISOString())
    .limit(1);
  if (recent?.length && data.force !== true) {
    return NextResponse.json({ error: "A weekly post was already published in the last 5 days.", existing: recent[0] }, { status: 409 });
  }
  const { data: sameTitle } = await admin.from("blog_posts").select("slug").ilike("title", title).limit(1);
  if (sameTitle?.length) return NextResponse.json({ error: "A post with this title already exists.", existing: sameTitle[0] }, { status: 409 });

  // Unique slug; rotate cover art when none is given.
  const base = slugify(title) || `post-${Date.now()}`;
  let slug = base;
  for (let n = 2; n < 50; n++) {
    const { data: taken } = await admin.from("blog_posts").select("id").eq("slug", slug).maybeSingle();
    if (!taken) break;
    slug = `${base}-${n}`;
  }
  let cover = (BLOG_COVERS as readonly string[]).includes(coverIn) ? coverIn : "";
  if (!cover) {
    const { data: last } = await admin.from("blog_posts").select("cover").order("published_at", { ascending: false }).limit(1).maybeSingle();
    const i = BLOG_COVERS.indexOf((last?.cover as (typeof BLOG_COVERS)[number]) ?? "gears");
    cover = BLOG_COVERS[(i + 1) % BLOG_COVERS.length];
  }

  const { data: created, error } = await admin
    .from("blog_posts")
    .insert({ slug, title, excerpt, body, sources, topic, cover, created_by: "weekly-writer" })
    .select("slug")
    .single();
  if (error || !created) {
    console.error("[blog] insert failed", error);
    return NextResponse.json({ error: "Couldn't save the post." }, { status: 500 });
  }

  revalidatePath("/blog");
  revalidatePath(`/blog/${slug}`);
  const site = siteUrl(request);
  const url = `${site}/blog/${slug}`;
  await sendNotification({
    subject: `New RIHOSO blog post published: ${title}`,
    rows: [
      ["Read it", url],
      ["Topic", topic ?? ""],
      ["Excerpt", excerpt],
      ["Sources", sources.map((s) => `${s.title} — ${s.url}`).join("\n")],
      ["Hide it", `${site}/marketplace/admin (Blog posts section)`],
    ],
  }).catch(() => {});
  return NextResponse.json({ ok: true, slug, url });
}
