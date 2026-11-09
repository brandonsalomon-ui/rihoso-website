import { NextResponse } from "next/server";
import { clean } from "@/lib/email";
import { sendMemberCode, verifyMemberCode } from "@/lib/clinic-bookings";
import { UserError } from "@/lib/orders";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export const runtime = "nodejs";

/**
 * Member rate check for the Watchmaking Clinic booking form.
 *  { action: "send", email }                 → emails a 6-digit code to a current member; returns { codeId }
 *  { action: "verify", codeId, email, code } → confirms the code
 */
export async function POST(request: Request) {
  if (!isSupabaseConfigured()) return NextResponse.json({ error: "Member pricing isn't available right now." }, { status: 503 });
  let data: Record<string, unknown>;
  try {
    data = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
  const email = clean(data.email, 200);
  try {
    if (data.action === "send") {
      const { codeId } = await sendMemberCode(email);
      return NextResponse.json({ ok: true, codeId });
    }
    if (data.action === "verify") {
      await verifyMemberCode(clean(data.codeId, 40), email, clean(data.code, 20));
      return NextResponse.json({ ok: true });
    }
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  } catch (err) {
    if (err instanceof UserError) return NextResponse.json({ error: err.message }, { status: 400 });
    console.error("[clinic] member code failed", err);
    return NextResponse.json({ error: "Couldn't check the membership just now. Please try again." }, { status: 502 });
  }
}
