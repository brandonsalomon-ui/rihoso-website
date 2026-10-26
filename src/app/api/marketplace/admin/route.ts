import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { clean } from "@/lib/email";
import { refundMembership } from "@/lib/memberships";
import { UserError, approveReturn, getOrder, isAdmin, partialRefund, refundOrder, releaseOrder, verifyReceipt } from "@/lib/orders";
import { siteUrl } from "@/lib/stripe";
import { cancelServiceRequest, quoteRepair } from "@/lib/services";
import { createAdminClient } from "@/lib/supabase/admin";
import { getUser } from "@/lib/supabase/server";

export const runtime = "nodejs";

const UUID = /^[0-9a-f-]{36}$/i;

/** Decisions on money are explained in writing to both parties. */
function requireNote(data: Record<string, unknown>) {
  const note = clean(data.note, 4000);
  if (note.length < 10) throw new UserError("Please write the decision and the reason — both parties receive it.");
  return note;
}

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
        await refundOrder(id, base, requireNote(data));
        break;
      }
      case "release": {
        await releaseOrder(id, base, "admin", requireNote(data));
        break;
      }
      case "approve_return": {
        await approveReturn(id, base, requireNote(data));
        break;
      }
      case "partial_refund": {
        const cents = Math.round(parseFloat(String(data.amount ?? "").replace(/[$,]/g, "")) * 100);
        await partialRefund(id, cents, base, requireNote(data));
        break;
      }
      case "verify_delivery": {
        await verifyReceipt(id, "admin", base);
        break;
      }
      case "verify_return": {
        const order = await getOrder(id);
        if (!order || order.status !== "disputed" || !order.return_approved_at || !order.return_shipped_at) {
          throw new UserError("No shipped return to verify on this order.");
        }
        if (!order.return_received_at) {
          await admin.from("orders").update({ return_received_at: new Date().toISOString() }).eq("id", id);
        }
        break;
      }
      case "blog_status": {
        const value = data.value === "hidden" ? "hidden" : "published";
        const { data: post, error } = await admin.from("blog_posts").update({ status: value }).eq("id", id).select("slug").single();
        if (error) throw error;
        revalidatePath("/blog");
        revalidatePath(`/blog/${post.slug}`);
        break;
      }
      case "refund_membership": {
        await refundMembership(id, base, data.override === true);
        break;
      }
      case "quote": {
        const cents = Math.round(parseFloat(String(data.amount ?? "").replace(/[$,]/g, "")) * 100);
        await quoteRepair(id, cents, clean(data.note, 4000), base);
        break;
      }
      case "cancel_service": {
        await cancelServiceRequest(id, base);
        break;
      }
      case "service_status": {
        const status = String(data.status ?? "");
        if (!["in_progress", "complete"].includes(status)) {
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
