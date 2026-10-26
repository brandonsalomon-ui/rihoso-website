import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export type BlogSource = { title: string; url: string };
export type BlogPost = {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  body: string;
  sources: BlogSource[];
  topic: string | null;
  cover: "dial" | "pocket" | "pendulum" | "gears";
  author: string;
  status: "published" | "hidden";
  published_at: string;
  created_by: string;
};

const COLUMNS = "id, slug, title, excerpt, body, sources, topic, cover, author, status, published_at, created_by";
export const BLOG_COVERS = ["dial", "pocket", "pendulum", "gears"] as const;

export async function getPublishedPosts(limit = 60) {
  if (!isSupabaseConfigured()) return [] as BlogPost[];
  const { data } = await createAdminClient()
    .from("blog_posts")
    .select(COLUMNS)
    .eq("status", "published")
    .lte("published_at", new Date().toISOString())
    .order("published_at", { ascending: false })
    .limit(limit);
  return (data ?? []) as BlogPost[];
}

export async function getPost(slug: string) {
  if (!isSupabaseConfigured() || !/^[a-z0-9-]{1,90}$/.test(slug)) return null;
  const { data } = await createAdminClient().from("blog_posts").select(COLUMNS).eq("slug", slug).eq("status", "published").maybeSingle();
  return (data as BlogPost | null) ?? null;
}

export function slugify(title: string) {
  return title
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80)
    .replace(/-+$/g, "");
}

export function fmtPostDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { timeZone: "America/New_York", month: "long", day: "numeric", year: "numeric" });
}
