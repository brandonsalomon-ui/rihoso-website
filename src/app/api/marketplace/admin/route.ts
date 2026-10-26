import { NextResponse } from "next/server";
import { clean } from "@/lib/email";
import { UserError, isAdmin, refundOrder, releaseOrder } from "@/lib/orders";
import { siteUrl } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase/admin";
import { getUser } from "@/lib/supabase/server";

export const runtime = "nodejs";

const UUID = /^[0-9a-f-]{36}$/i;

/** RIHOSO admin actions. Every request is checked against the admins table. */
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
  const id = clean(data.id, 40);
  if (!UUID.test(id)) return NextResponse.json({ error: "Missing id." }, { status: 400 });
  const admin = createAdminClient();
  const base = siteUrl(request);

  try {
    switch (action) {
      case "set_member": {
        const { error } = await admin.from("profiles").update({ is_member: data.value === true }).eq("id", id);
        if (error) throw error;
        break;
      }
      case "refund": {
        await refundOrder(id, base, clean(data.note, 1000) || undefined);
        break;
      }
      case "release": {
        await releaseOrder(id, base, "admin");
        break;
      }
      case "service_status": {
        const status = String(data.status ?? "");
        if (!["requested", "awaiting_payment", "paid", "in_progress", "complete", "cancelled"].includes(status)) {
          throw new UserError("Unknown status.");
        }
        const notes = clean(data.notes, 4000);
        const { data: req, error } = await admin
          .from("service_requests")
          .update({ status, result_notes: notes || null })
          .eq("id", id)
          .select("type, listing_id")
          .single();
        if (error) throw error;
        // Validation results show on the listing.
        if (req.type === "validation" && req.listing_id) {
          const outcome = String(data.outcome ?? "");
          if (status === "in_progress") {
            await admin.from("listings").update({ validation_status: "in_progress" }).eq("id", req.listing_id);
          } else if (status === "complete" && (outcome === "passed" || outcome === "concerns")) {
            await admin.from("listings").update({ validation_status: outcome, validation_notes: notes || null }).eq("id", req.listing_id);
          } else if (status === "cancelled") {
            await admin.from("listings").update({ validation_status: "none" }).eq("id", req.listing_id);
          }
        }
        break;
      }
      default:
        throw new UserError("Unknown action.");
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof UserError) return NextResponse.json({ error: err.message }, { status: 409 });
    console.error("[admin] action failed", action, err);
    return NextResponse.json({ error: "Something went wrong." }, { status: 502 });
  }
}
