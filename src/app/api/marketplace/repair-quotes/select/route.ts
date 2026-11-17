import { NextResponse } from "next/server";
import { clean } from "@/lib/email";
import { UserError } from "@/lib/orders";
import { selectQuote } from "@/lib/repair-partners";
import { siteUrl } from "@/lib/stripe";
import { getUser } from "@/lib/supabase/server";

export const runtime = "nodejs";

/** Customer chooses one workshop's quote for their repair request. */
export async function POST(request: Request) {
  const { user } = await getUser();
  if (!user) return NextResponse.json({ error: "Please sign in." }, { status: 401 });
  let data: Record<string, unknown>;
  try {
    data = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
  const quoteId = clean(data.quoteId, 40);
  if (!/^[0-9a-f-]{36}$/i.test(quoteId)) return NextResponse.json({ error: "Missing quote." }, { status: 400 });
  try {
    await selectQuote(user.id, quoteId, siteUrl(request));
    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof UserError) return NextResponse.json({ error: err.message }, { status: 409 });
    console.error("[repair-quotes] select failed", err);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}
