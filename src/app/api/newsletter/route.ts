import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { EVENTS, todayInRI } from "@/lib/events";
import { cleanSections, firstOfMonth, getIssueBySlug, listAllIssues, notifyDraftReady, type Newsletter } from "@/lib/newsletter";
import { sectionDef } from "@/lib/newsletter-sections";
import { siteUrl } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

/** The monthly writer's token. Falls back to the blog writer's token so one secret serves both writing tasks. */
function authorized(request: Request) {
  const expected = process.env.NEWSLETTER_PUBLISH_TOKEN || process.env.BLOG_PUBLISH_TOKEN || "";
  const given = (request.headers.get("authorization") ?? "").replace(/^Bearer\s+/i, "");
  if (expected.length < 32 || given.length !== expected.length) return false;
  return crypto.timingSafeEqual(Buffer.from(given), Buffer.from(expected));
}

const str = (v: unknown, max: number) => (typeof v === "string" ? v.replace(/\r\n/g, "\n").trim().slice(0, max) : "");

/**
 * For the writer: what earlier issues covered (so nothing repeats), RIHOSO's events with RSVP counts
 * (for the "From the Society" recap), and today's date in Rhode Island.
 */
export async function GET(request: Request) {
  if (!authorized(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const issues = await listAllIssues(24);
  const { data: rsvps } = await createAdminClient().from("event_rsvps").select("event_slug, guests");
  const counts = new Map<string, { replies: number; people: number }>();
  for (const r of rsvps ?? []) {
    const c = counts.get(r.event_slug as string) ?? { replies: 0, people: 0 };
    c.replies += 1;
    c.people += 1 + ((r.guests as number) ?? 0);
    counts.set(r.event_slug as string, c);
  }
  return NextResponse.json({
    today: todayInRI(),
    issues: issues.map((i: Newsletter) => ({
      slug: i.slug,
      issue_date: i.issue_date,
      status: i.status,
      title: i.title,
      covered: i.sections.map((s) => ({ section: s.key, label: sectionDef(s.key)?.label, title: s.title })),
    })),
    events: EVENTS.map((e) => ({
      title: e.title,
      date: e.date,
      endsOn: e.endsOn ?? null,
      time: e.time,
      location: e.location,
      description: e.description,
      recurring: Boolean(e.recurring),
      rsvp: e.rsvp ? { slug: e.rsvp.slug, ...(counts.get(e.rsvp.slug) ?? { replies: 0, people: 0 }) } : null,
    })),
  });
}

/**
 * Saves the writer's draft for an issue. Body: { issue_date: "YYYY-MM-01", title, intro, sections: [...], force? }.
 * A draft only replaces an earlier writer draft for the same month that Brandon hasn't touched, and only with force: true.
 * Emails Brandon that the draft is ready for review.
 */
export async function POST(request: Request) {
  if (!authorized(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  let data: Record<string, unknown>;
  try {
    data = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const issueDate = str(data.issue_date, 10);
  const title = str(data.title, 140);
  const intro = str(data.intro, 1200);
  const problems: string[] = [];
  const today = todayInRI();
  if (!firstOfMonth(issueDate)) problems.push("issue_date must be the first of a month, YYYY-MM-01");
  else if (issueDate < today) problems.push("issue_date is in the past");
  else if (new Date(issueDate).getTime() - new Date(today).getTime() > 45 * 86400000) problems.push("issue_date is more than 45 days away");
  if (title.length < 5) problems.push("title is required (5–140 characters)");
  if (intro.length < 150) problems.push("intro must be at least 150 characters");
  if (/<\s*\/?\s*[a-z]/i.test(intro)) problems.push("intro must be plain text");

  const slug = issueDate.slice(0, 7);
  const existing = firstOfMonth(issueDate) ? await getIssueBySlug(slug) : null;
  const { sections, problems: sectionProblems } = cleanSections(data.sections, { strict: true, previous: existing?.sections });
  problems.push(...sectionProblems);
  if (problems.length) return NextResponse.json({ error: "Invalid issue", problems }, { status: 400 });

  const admin = createAdminClient();
  let issue: Newsletter | null = null;
  if (existing) {
    const replaceable = existing.status === "draft" && existing.created_by === "writer" && !existing.edited_at;
    if (!replaceable || data.force !== true) {
      return NextResponse.json(
        {
          error: replaceable
            ? "A draft for this month already exists. Send force: true to replace it."
            : "This month's issue has been edited, approved or sent already; it can't be replaced.",
          existing: { slug: existing.slug, status: existing.status },
        },
        { status: 409 }
      );
    }
    const { error } = await admin.from("newsletters").update({ title, intro, sections }).eq("id", existing.id).eq("status", "draft");
    if (error) return NextResponse.json({ error: "Couldn't save the issue." }, { status: 500 });
  } else {
    const { error } = await admin
      .from("newsletters")
      .insert({ slug, issue_date: issueDate, title, intro, sections, status: "draft", created_by: "writer" });
    if (error) {
      console.error("[newsletter] insert failed", error);
      return NextResponse.json({ error: "Couldn't save the issue." }, { status: 500 });
    }
  }
  issue = await getIssueBySlug(slug);
  if (!issue) return NextResponse.json({ error: "Saved, but couldn't read it back." }, { status: 500 });

  const base = siteUrl(request);
  await notifyDraftReady(issue, base).catch((err) => console.error("[newsletter] notify failed", err));
  return NextResponse.json({
    ok: true,
    slug,
    status: issue.status,
    review: `${base}/marketplace/admin/newsletter?issue=${slug}`,
    preview: `${base}/newsletter/${slug}`,
  });
}
