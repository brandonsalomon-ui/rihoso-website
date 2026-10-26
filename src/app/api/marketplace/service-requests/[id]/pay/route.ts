import { NextResponse } from "next/server";
import { UserError } from "@/lib/orders";
import { startServiceCheckout } from "@/lib/services";
import { siteUrl } from "@/lib/stripe";
import { getUser } from "@/lib/supabase/server";

export const runtime = "nodejs";

/** Requester pays a quoted repair (or retries an unpaid validation). */
export async function POST(request: Request, { params }: { params: { id: string } }) {
  const { user } = await getUser();
  if (!user) return NextResponse.json({ error: "Please sign in first." }, { status: 401 });
  try {
    const url = await startServiceCheckout(params.id, user.id, siteUrl(request));
    return NextResponse.json({ ok: true, url });
  } catch (err) {
    if (err instanceof UserError) return NextResponse.json({ error: err.message }, { status: 409 });
    console.error("[service-pay] failed", err);
    return NextResponse.json({ error: "Couldn't start checkout." }, { status: 502 });
  }
}
