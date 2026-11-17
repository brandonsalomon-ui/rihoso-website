import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { clean } from "@/lib/email";
import { UserError, isAdmin } from "@/lib/orders";
import { addComplimentaryPartner } from "@/lib/repair-partners";
import { siteUrl } from "@/lib/stripe";
import { getUser } from "@/lib/supabase/server";

export const runtime = "nodejs";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Admin: add a repair partner at no charge (active immediately until the chosen date). */
export async function POST(request: Request) {
  const { user } = await getUser();
  if (!user || !(await isAdmin(user.id))) return NextResponse.json({ error: "Not allowed." }, { status: 403 });

  let data: Record<string, unknown>;
  try {
    data = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
  const d = {
    email: clean(data.email, 200).toLowerCase(),
    businessName: clean(data.businessName, 120),
    contactName: clean(data.contactName, 120),
    phone: clean(data.phone, 40),
    website: clean(data.website, 200),
    city: clean(data.city, 80),
    address: clean(data.address, 200),
    blurb: clean(data.blurb, 600),
  };
  const day = clean(data.through, 10);
  // End of that day in Rhode Island.
  const through = /^\d{4}-\d{2}-\d{2}$/.test(day) ? new Date(`${day}T23:59:59-05:00`) : null;

  const missing = [
    d.businessName.length < 2 && "the business name",
    !d.contactName && "a contact name",
    !EMAIL.test(d.email) && "a valid email (it's their sign-in)",
    (!through || Number.isNaN(through.getTime()) || through <= new Date()) && "a free-through date in the future",
  ].filter(Boolean);
  if (missing.length) return NextResponse.json({ error: `Please add ${missing.join(", ")}.` }, { status: 400 });

  try {
    const result = await addComplimentaryPartner(
      { ...d, through: through!, sendWelcome: data.sendWelcome !== false },
      siteUrl(request)
    );
    revalidatePath("/marketplace/admin");
    revalidatePath("/repairs");
    revalidatePath("/repair-partners");
    revalidatePath("/marketplace/repair");
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    if (err instanceof UserError) return NextResponse.json({ error: err.message }, { status: 400 });
    console.error("[admin] add partner failed", err);
    return NextResponse.json({ error: "Couldn't add the partner. Please try again." }, { status: 500 });
  }
}
