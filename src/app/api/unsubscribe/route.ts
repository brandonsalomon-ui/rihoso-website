import { NextResponse } from "next/server";
import { unsubscribe, verifyUnsubscribe } from "@/lib/member-mail";
import { siteUrl } from "@/lib/stripe";

export const runtime = "nodejs";

/**
 * POST — one-click unsubscribe (RFC 8058) used by Gmail / Apple Mail's built-in button,
 *        and by the confirm button on /unsubscribe.
 * GET  — someone opened the header link in a browser: send them to the confirm page.
 */
export async function POST(request: Request) {
  const url = new URL(request.url);
  let e = url.searchParams.get("e");
  let t = url.searchParams.get("t");
  if (!e || !t) {
    const form = await request.formData().catch(() => null);
    e = (form?.get("e") as string | null) ?? e;
    t = (form?.get("t") as string | null) ?? t;
  }
  const email = verifyUnsubscribe(e, t);
  if (!email) return NextResponse.json({ error: "This unsubscribe link isn't valid." }, { status: 400 });
  try {
    await unsubscribe(email);
  } catch (err) {
    console.error("[unsubscribe] failed", err);
    return NextResponse.json({ error: "Something went wrong — please reply to the email and we'll remove you." }, { status: 500 });
  }
  // Browser form posts land back on the page; mail-client one-click posts just need a 200.
  if ((request.headers.get("accept") ?? "").includes("text/html")) {
    return NextResponse.redirect(`${siteUrl(request)}/unsubscribe?done=1`, 303);
  }
  return NextResponse.json({ ok: true });
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  return NextResponse.redirect(`${siteUrl(request)}/unsubscribe?${url.searchParams.toString()}`, 303);
}
