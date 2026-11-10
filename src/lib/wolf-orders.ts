import "server-only";
import type Stripe from "stripe";
import { escapeHtml } from "@/lib/email";
import { UserError } from "@/lib/orders";
import { getStripe } from "@/lib/stripe";
import { getWolfProduct, WOLF_MAX_QTY, wolfPrice } from "@/lib/wolf-catalog";

// WOLF Collection orders. Stripe is the record of each order (no database table):
// the Checkout Session carries the item, SKU and colour in its metadata, and the
// shipping address, phone and tax come from Checkout itself.
//
// After payment, Brandon gets an order email with a ready-to-forward drop-ship
// request for WOLF, and the customer gets a confirmation. Emails use Resend
// idempotency keys, so the webhook and the thank-you page can both finalize safely.

/** Rhode Island sales tax, added when the buyer says the order ships to RI (checked against the address after payment). */
const RI_TAX = { percentage: 7, key: "rihoso-ri-sales-tax-7" };

/** Planning numbers for the order email: WOLF wholesale is keystone (50% of retail). */
const WOLF_COST_SHARE = 0.5;
const CARD_FEE = { percent: 0.029, fixedCents: 30 };

let cachedTaxRateId: string | null = null;

async function riTaxRateId() {
  if (cachedTaxRateId) return cachedTaxRateId;
  const stripe = getStripe();
  for await (const rate of stripe.taxRates.list({ active: true, limit: 100 })) {
    if (rate.metadata?.rihoso === RI_TAX.key) {
      cachedTaxRateId = rate.id;
      return rate.id;
    }
  }
  const created = await stripe.taxRates.create({
    display_name: "Sales tax",
    description: "Rhode Island sales tax (7%)",
    jurisdiction: "Rhode Island",
    country: "US",
    state: "RI",
    percentage: RI_TAX.percentage,
    inclusive: false,
    tax_type: "sales_tax",
    metadata: { rihoso: RI_TAX.key },
  });
  cachedTaxRateId = created.id;
  return created.id;
}

/** Opens Stripe Checkout for one WOLF item. The price always comes from the catalog, never the browser. */
export async function startWolfCheckout(input: { slug: string; sku: string; quantity: number; shipState: string }, base: string) {
  const product = getWolfProduct(input.slug);
  if (!product) throw new UserError("That item isn't available.");
  const color = product.colors.find((c) => c.sku === input.sku);
  if (!color) throw new UserError("Please choose a color.");
  const quantity = Math.floor(input.quantity);
  if (!Number.isFinite(quantity) || quantity < 1 || quantity > WOLF_MAX_QTY) {
    throw new UserError(`Please choose a quantity from 1 to ${WOLF_MAX_QTY}.`);
  }

  // The buyer says up front whether it ships to Rhode Island; we check the real address after payment.
  const shipState = input.shipState.toUpperCase();
  if (shipState !== "RI" && shipState !== "OTHER") throw new UserError("Please tell us whether this ships to Rhode Island.");
  const taxed = shipState === "RI";

  const label = product.colors.length > 1 ? `${product.name} — ${color.name}` : product.name;
  const meta = {
    kind: "wolf",
    slug: product.slug,
    sku: color.sku,
    color: color.name,
    quantity: String(quantity),
    ship_state: shipState,
  };

  const session = await getStripe().checkout.sessions.create({
    mode: "payment",
    line_items: [
      {
        quantity,
        ...(taxed ? { tax_rates: [await riTaxRateId()] } : {}),
        price_data: {
          currency: "usd",
          unit_amount: product.priceCents,
          product_data: {
            name: label,
            description: `WOLF 1834 · Item ${color.sku} · Ships directly from WOLF`,
            images: color.images.slice(0, 1),
            metadata: { sku: color.sku },
          },
        },
      },
    ],
    shipping_address_collection: { allowed_countries: ["US"] },
    shipping_options: [
      {
        shipping_rate_data: {
          type: "fixed_amount",
          display_name: "Free shipping — direct from WOLF",
          fixed_amount: { amount: 0, currency: "usd" },
          delivery_estimate: { minimum: { unit: "business_day", value: 3 }, maximum: { unit: "business_day", value: 10 } },
        },
      },
    ],
    phone_number_collection: { enabled: true },
    billing_address_collection: "auto",
    payment_intent_data: {
      description: `RIHOSO WOLF Collection — ${label} × ${quantity}`,
      metadata: meta,
    },
    metadata: meta,
    expires_at: Math.floor(Date.now() / 1000) + 60 * 60,
    success_url: `${base}/wolf/thank-you?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${base}/wolf/${product.slug}`,
  });
  if (!session.url) throw new Error("Stripe did not return a checkout URL");
  return { url: session.url };
}

export type WolfOrder = {
  ref: string;
  paid: boolean;
  productName: string;
  slug: string;
  sku: string;
  color: string;
  quantity: number;
  subtotalCents: number;
  taxCents: number;
  totalCents: number;
  email: string;
  name: string;
  phone: string;
  shipTo: string[];
  /** Set when the address the buyer entered at checkout isn't in the state they picked (so tax may be wrong). */
  stateMismatch: string;
};

export function orderRef(sessionId: string) {
  return `W-${sessionId.slice(-8).toUpperCase()}`;
}

function shippingLines(session: Stripe.Checkout.Session) {
  const ship = session.collected_information?.shipping_details ?? null;
  const a = ship?.address;
  if (!ship || !a) return [];
  return [
    ship.name,
    a.line1 ?? "",
    a.line2 ?? "",
    `${a.city ?? ""}, ${a.state ?? ""} ${a.postal_code ?? ""}`.trim(),
    a.country && a.country !== "US" ? a.country : "",
  ].filter(Boolean);
}

/** Reads a WOLF checkout and, once it's paid, sends the order emails (once). */
export async function finalizeWolfCheckout(sessionId: string): Promise<WolfOrder | null> {
  const session = await getStripe().checkout.sessions.retrieve(sessionId);
  const m = session.metadata ?? {};
  if (m.kind !== "wolf") return null;
  const product = getWolfProduct(m.slug ?? "");

  const order: WolfOrder = {
    ref: orderRef(session.id),
    paid: session.payment_status === "paid",
    productName: product?.name ?? m.slug ?? "WOLF item",
    slug: m.slug ?? "",
    sku: m.sku ?? "",
    color: m.color ?? "",
    quantity: Number(m.quantity ?? 1) || 1,
    subtotalCents: session.amount_subtotal ?? 0,
    taxCents: session.total_details?.amount_tax ?? 0,
    totalCents: session.amount_total ?? 0,
    email: session.customer_details?.email ?? "",
    name: session.collected_information?.shipping_details?.name ?? session.customer_details?.name ?? "",
    phone: session.customer_details?.phone ?? "",
    shipTo: shippingLines(session),
    stateMismatch: "",
  };
  const declaredRI = m.ship_state === "RI";
  const actual = (session.collected_information?.shipping_details?.address?.state ?? "").toUpperCase();
  if (actual && declaredRI !== (actual === "RI")) {
    order.stateMismatch = declaredRI
      ? `Buyer chose Rhode Island (7% tax charged) but is shipping to ${actual}. Consider refunding the tax in Stripe.`
      : "Buyer chose outside Rhode Island (no tax charged) but is shipping to a Rhode Island address. RI sales tax is owed on this sale.";
  }
  if (!order.paid) return order;

  await Promise.all([sendOrderToBrandon(order, session.id), sendCustomerConfirmation(order, session.id)]);
  return order;
}

/* ───────────────────────── emails ───────────────────────── */

async function resend(idempotencyKey: string, payload: Record<string, unknown>) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.error("[wolf] RESEND_API_KEY is not set — email not sent", payload.subject);
    return;
  }
  const res = await fetch(process.env.RESEND_API_URL || "https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json", "Idempotency-Key": idempotencyKey },
    body: JSON.stringify(payload),
  });
  // 409 = this email was already sent for this order (e.g. by the webhook) — that's fine.
  if (!res.ok && res.status !== 409) console.error("[wolf] Resend error", res.status, await res.text().catch(() => ""));
}

function table(rows: [string, string][]) {
  return `<table style="border-collapse:collapse;margin:16px 0;border-left:3px solid #c9a84c;background:#f5f0e8">${rows
    .map(
      ([k, v]) =>
        `<tr><td style="padding:6px 16px;font-weight:bold;vertical-align:top;white-space:nowrap">${escapeHtml(k)}</td><td style="padding:6px 16px;white-space:pre-wrap">${escapeHtml(v || "—")}</td></tr>`
    )
    .join("")}</table>`;
}

function itemLine(o: WolfOrder) {
  return `${o.productName}${o.color ? ` — ${o.color}` : ""} (WOLF item ${o.sku}) × ${o.quantity}`;
}

async function sendOrderToBrandon(o: WolfOrder, sessionId: string) {
  const retail = o.subtotalCents;
  const cost = Math.round(retail * WOLF_COST_SHARE);
  const fees = Math.round(o.totalCents * CARD_FEE.percent) + CARD_FEE.fixedCents;
  const profit = retail - cost - fees;

  const dropShip = [
    `Drop-ship request — PO ${o.ref}`,
    "Please BLIND SHIP: no invoice, packing slip pricing or promotional material in the package.",
    "Bill to: Providence Diamond (WOLF dealer account).",
    "",
    `Item: ${itemLine(o)}`,
    "",
    "Ship to:",
    ...o.shipTo,
    o.phone ? `Phone: ${o.phone}` : "",
    "",
    "Please reply with tracking once shipped. Thank you!",
  ]
    .filter((l, i, all) => !(l === "" && all[i - 1] === ""))
    .join("\n");

  const summary: [string, string][] = [
    ["Order", o.ref],
    ["Item", itemLine(o)],
    ["Customer", `${o.name}\n${o.email}${o.phone ? `\n${o.phone}` : ""}`],
    ["Ship to", o.shipTo.join("\n")],
    ["Paid", `${wolfPrice(o.totalCents)} (items ${wolfPrice(retail)}${o.taxCents ? ` + RI sales tax ${wolfPrice(o.taxCents)}` : ", no sales tax — ships outside RI"})`],
    [
      "Estimated split",
      `WOLF cost ~${wolfPrice(cost)} · card fees ~${wolfPrice(fees)} · profit ~${wolfPrice(profit)} → ~${wolfPrice(Math.round(profit / 2))} each to RIHOSO and Providence Diamond`,
    ],
    ...(o.stateMismatch ? ([["⚠ Check tax", o.stateMismatch]] as [string, string][]) : []),
    ["Stripe", sessionId],
  ];

  const html = `
    <div style="font-family:Georgia,serif;color:#1a2e1a;max-width:600px">
      <h2 style="margin:0 0 8px">New WOLF order ${escapeHtml(o.ref)} — send to WOLF</h2>
      <p style="font-size:15px">Paid in full on rihoso.com. Forward the drop-ship request below to WOLF.</p>
      ${table(summary)}
      <p style="font-size:15px;font-weight:bold;margin-top:24px">Drop-ship request (copy &amp; send to WOLF)</p>
      <pre style="font-family:Menlo,Consolas,monospace;font-size:13px;background:#fff;border:1px solid #e0d4be;padding:14px;white-space:pre-wrap">${escapeHtml(dropShip)}</pre>
      <p style="margin-top:24px;color:#666;font-size:12px">rihoso.com · WOLF Collection</p>
    </div>`;
  const text = `New WOLF order ${o.ref} — send to WOLF\n\n${summary.map(([k, v]) => `${k}: ${v}`).join("\n")}\n\n--- Drop-ship request (copy & send to WOLF) ---\n${dropShip}`;

  await resend(`wolf-${sessionId}-brandon`, {
    from: process.env.FORM_FROM_EMAIL || "RIHOSO Website <website@rihoso.com>",
    to: (process.env.WOLF_ORDER_EMAIL || process.env.FORM_NOTIFY_EMAIL || "brandonsalomon@gmail.com").split(",").map((s) => s.trim()),
    reply_to: o.email || undefined,
    subject: `WOLF order ${o.ref}: ${o.productName}${o.color ? ` (${o.color})` : ""} × ${o.quantity} — ${wolfPrice(o.totalCents)}`,
    html,
    text,
  });
}

async function sendCustomerConfirmation(o: WolfOrder, sessionId: string) {
  if (!o.email) return;
  const first = (o.name.split(/\s+/)[0] || "").trim();
  const rows: [string, string][] = [
    ["Order", o.ref],
    ["Item", `${o.productName}${o.color ? ` — ${o.color}` : ""} × ${o.quantity}`],
    ["Total paid", `${wolfPrice(o.totalCents)}${o.taxCents ? ` (includes ${wolfPrice(o.taxCents)} RI sales tax)` : ""}`],
    ["Shipping to", o.shipTo.join("\n")],
  ];
  const paragraphs = [
    "Your order ships directly from WOLF. We'll email your tracking number as soon as it's on its way.",
    "Every purchase supports the Rhode Island Horological Society and its watchmaking scholarships. If you have any questions, simply reply to this email.",
    "With warm regards,\nThe Rhode Island Horological Society",
  ];
  const html = `
    <div style="font-family:Georgia,serif;color:#1a2e1a;max-width:560px">
      <p style="font-size:16px">${escapeHtml(first ? `Dear ${first}, thank you for your order.` : "Thank you for your order.")}</p>
      ${table(rows)}
      ${paragraphs.map((p) => `<p style="font-size:16px;white-space:pre-wrap">${escapeHtml(p)}</p>`).join("")}
      <p style="margin-top:24px;color:#666;font-size:12px">rihoso.com · membership@rihoso.com</p>
    </div>`;
  const text = [
    first ? `Dear ${first}, thank you for your order.` : "Thank you for your order.",
    rows.map(([k, v]) => `${k}: ${v}`).join("\n"),
    ...paragraphs,
    "rihoso.com · membership@rihoso.com",
  ].join("\n\n");

  await resend(`wolf-${sessionId}-customer`, {
    from: process.env.FORM_FROM_EMAIL || "RIHOSO <website@rihoso.com>",
    to: [o.email],
    reply_to: "membership@rihoso.com",
    subject: `Your RIHOSO order ${o.ref} — ${o.productName}`,
    html,
    text,
  });
}
