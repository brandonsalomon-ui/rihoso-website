import { NextResponse } from "next/server";
import { clean } from "@/lib/email";
import { UserError } from "@/lib/orders";
import { JOB_STATUSES, type JobStatus } from "@/lib/repair-partner-rules";
import { submitQuote, updateJob } from "@/lib/repair-partners";
import { siteUrl } from "@/lib/stripe";
import { getUser } from "@/lib/supabase/server";

export const runtime = "nodejs";

const UUID = /^[0-9a-f-]{36}$/i;

/** Repair partner actions: send/revise a quote, decline to quote, update a chosen job's progress. */
export async function POST(request: Request) {
  const { user } = await getUser();
  if (!user) return NextResponse.json({ error: "Please sign in." }, { status: 401 });
  let data: Record<string, unknown>;
  try {
    data = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
  const requestId = clean(data.requestId, 40);
  if (!UUID.test(requestId)) return NextResponse.json({ error: "Missing request." }, { status: 400 });
  const base = siteUrl(request);

  try {
    switch (data.action) {
      case "quote":
        await submitQuote(
          user.id,
          requestId,
          {
            price: data.price,
            includes: clean(data.includes, 2000),
            turnaround: clean(data.turnaround, 120),
            warranty: clean(data.warranty, 120),
            dropoff: data.dropoff === true,
            notes: clean(data.notes, 2000),
          },
          base
        );
        break;
      case "decline":
        await submitQuote(user.id, requestId, { decline: true, includes: "", turnaround: "", warranty: "", dropoff: false, notes: "" }, base);
        break;
      case "job": {
        const status = String(data.jobStatus ?? "");
        if (!JOB_STATUSES.some((j) => j.value === status) || status === "accepted") throw new UserError("Unknown status.");
        await updateJob(user.id, requestId, status as JobStatus, base);
        break;
      }
      default:
        return NextResponse.json({ error: "Unknown action." }, { status: 400 });
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof UserError) return NextResponse.json({ error: err.message }, { status: 409 });
    console.error("[partner] action failed", err);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}
