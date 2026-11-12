import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { cleanSections, firstOfMonth, getIssue, getIssueBySlug, sendNewsletter, sendNewsletterTest } from "@/lib/newsletter";
import { SECTIONS } from "@/lib/newsletter-sections";
import { isAdmin } from "@/lib/orders";
import { siteUrl } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase/admin";
import { getUser } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const maxDuration = 300;

const str = (v: unknown, max: number) => (typeof v === "string" ? v.replace(/\r\n/g, "\n").trim().slice(0, max) : "");

/**
 * Admin only. Actions:
 *  save      { id, title, intro, sections }  — edits text, photos and captions (draft or approved issues)
 *  approve   { id }                          — it will go out on its issue date (or the next morning if that has passed)
 *  unapprove { id }
 *  test      { id }                          — emails the admin a test copy of the teaser
 *  send      { id }                          — sends an approved issue right now
 *  create    { issue_date }                  — starts a blank issue for a month (if the writer didn't)
 */
export async function POST(request: Request) {
  const { user } = await getUser();
  if (!user || !(await isAdmin(user.id))) return NextResponse.json({ error: "Not allowed." }, { status: 403 });
  let data: Record<string, unknown>;
  try {
    data = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
  const action = String(data.action ?? "");
  const admin = createAdminClient();
  const base = siteUrl(request);

  if (action === "create") {
    const issueDate = str(data.issue_date, 10);
    if (!firstOfMonth(issueDate)) return NextResponse.json({ error: "Pick a month." }, { status: 400 });
    const slug = issueDate.slice(0, 7);
    if (await getIssueBySlug(slug)) return NextResponse.json({ error: "That month already has an issue." }, { status: 409 });
    const sections = SECTIONS.map((d) => ({ key: d.key, title: "", blurb: "", body: "", photos: [], sources: [] }));
    const { error } = await admin
      .from("newsletters")
      .insert({ slug, issue_date: issueDate, title: `The RIHOSO Monthly`, intro: "", sections, created_by: "admin", edited_at: new Date().toISOString() });
    if (error) return NextResponse.json({ error: "Couldn't create the issue." }, { status: 500 });
    return NextResponse.json({ ok: true, slug });
  }

  const issue = await getIssue(str(data.id, 40));
  if (!issue) return NextResponse.json({ error: "Issue not found." }, { status: 404 });
  const done = () => {
    revalidatePath("/newsletter");
    revalidatePath(`/newsletter/${issue.slug}`);
  };

  if (action === "save") {
    if (issue.status !== "draft" && issue.status !== "approved") {
      return NextResponse.json({ error: "This issue has already gone out and can't be edited." }, { status: 409 });
    }
    const title = str(data.title, 140);
    if (title.length < 5) return NextResponse.json({ error: "The issue needs a title (at least 5 characters)." }, { status: 400 });
    const { sections, problems } = cleanSections(data.sections, { strict: false, previous: issue.sections });
    // Photos must live in this issue's folder of the newsletter bucket.
    for (const s of sections) s.photos = s.photos.filter((p) => p.path.startsWith(`${issue.slug}/`));
    if (problems.length) return NextResponse.json({ error: problems.join("; ") }, { status: 400 });
    const { error } = await admin
      .from("newsletters")
      .update({ title, intro: str(data.intro, 1200), sections, edited_at: new Date().toISOString() })
      .eq("id", issue.id)
      .in("status", ["draft", "approved"]);
    if (error) return NextResponse.json({ error: "Couldn't save." }, { status: 500 });
    done();
    return NextResponse.json({ ok: true });
  }

  if (action === "approve" || action === "unapprove") {
    const from = action === "approve" ? "draft" : "approved";
    const to = action === "approve" ? "approved" : "draft";
    const { data: row, error } = await admin
      .from("newsletters")
      .update({ status: to, approved_at: to === "approved" ? new Date().toISOString() : null, approved_by: to === "approved" ? user.id : null })
      .eq("id", issue.id)
      .eq("status", from)
      .select("id")
      .maybeSingle();
    if (error || !row) return NextResponse.json({ error: `This issue isn't ${from === "draft" ? "a draft" : "approved"} anymore. Refresh the page.` }, { status: 409 });
    done();
    return NextResponse.json({ ok: true, status: to });
  }

  if (action === "test") {
    if (!user.email) return NextResponse.json({ error: "Your account has no email address." }, { status: 400 });
    const r = await sendNewsletterTest(issue, user.email, base);
    if (r.error) return NextResponse.json({ error: r.error }, { status: 502 });
    return NextResponse.json({ ok: true, sentTo: user.email });
  }

  if (action === "send") {
    const r = await sendNewsletter(issue.id, base, user.id);
    if (!r.ok) return NextResponse.json({ error: r.error }, { status: 409 });
    done();
    return NextResponse.json(r);
  }

  return NextResponse.json({ error: "Unknown action." }, { status: 400 });
}
