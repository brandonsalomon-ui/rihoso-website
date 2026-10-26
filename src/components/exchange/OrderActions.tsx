"use client";

import type { FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { inputClass } from "./SignInForm";

type Props = {
  orderId: string;
  role: "buyer" | "seller";
  status: string;
  fulfillment: "ship" | "pickup";
  inspectionHours: number;
  shipOverdue: boolean;
  deliveryReported: boolean;
  handoverReported: boolean;
  returnApproved: boolean;
  returnShipped: boolean;
  returnProblem: boolean;
};

const CARRIERS = ["UPS", "FedEx", "USPS", "DHL", "Other"];

export default function OrderActions(p: Props) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [showDispute, setShowDispute] = useState(false);
  const [showReturnProblem, setShowReturnProblem] = useState(false);

  async function act(body: Record<string, unknown>) {
    setBusy(true);
    setError("");
    const res = await fetch(`/api/marketplace/orders/${p.orderId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const json = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) setError(json.error || "Something went wrong.");
    else router.refresh();
  }

  function trackingSubmit(action: string) {
    return (e: FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      const f = new FormData(e.currentTarget);
      act({ action, carrier: f.get("carrier"), tracking: f.get("tracking") });
    };
  }

  const ship = p.fulfillment === "ship";
  const gold = "btn-gold px-6 py-2 rounded font-semibold disabled:opacity-60";
  const danger = "px-6 py-2 rounded border border-red-300/40 text-red-200 hover:bg-red-900/20 disabled:opacity-60";

  const trackingForm = (action: string, label: string) => (
    <form onSubmit={trackingSubmit(action)} className="space-y-3">
      <div className="grid sm:grid-cols-3 gap-3">
        <select name="carrier" required className={inputClass} defaultValue="">
          <option value="" disabled>Carrier</option>
          {CARRIERS.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
        <input name="tracking" required minLength={6} placeholder="Tracking number" className={inputClass + " sm:col-span-2"} />
      </div>
      <button disabled={busy} className={gold}>{label}</button>
    </form>
  );

  const disputeForm = () => (
    <>
      <button disabled={busy} onClick={() => setShowDispute((v) => !v)} className={danger}>
        Report a problem
      </button>
      {showDispute && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            act({ action: "dispute", reason: new FormData(e.currentTarget).get("reason") });
          }}
          className="space-y-3 w-full"
        >
          <textarea
            name="reason"
            required
            minLength={10}
            rows={4}
            className={inputClass}
            placeholder="What's wrong? Not received, not as described (which details differ), damaged… Photos can be sent in your messages."
          />
          <p className="text-xs text-cream-400">
            Keep the packaging, and don&apos;t alter, service, resize or open the watch while RIHOSO reviews it. Payment stays held.
          </p>
          <button disabled={busy} className="px-6 py-2 rounded bg-red-800/60 text-cream-50 disabled:opacity-60">Send to RIHOSO</button>
        </form>
      )}
    </>
  );

  let body: React.ReactNode = null;

  if (p.role === "seller") {
    if (ship && p.status === "paid_held") {
      body = (
        <>
          <p className="text-cream-100 font-semibold">Ship the watch</p>
          <p className="text-sm text-cream-300">
            Insure it for the full sale price with adult signature required (check your policy actually covers watches), then
            enter the tracking details.
          </p>
          {trackingForm("ship", "Mark as shipped")}
        </>
      );
    } else if (ship && p.status === "shipped") {
      body = p.deliveryReported ? (
        <p className="text-sm text-cream-300">
          You reported delivery. Waiting for the buyer to confirm receipt (or RIHOSO to verify tracking) — the buyer&apos;s{" "}
          {p.inspectionHours}-hour inspection starts then.
        </p>
      ) : (
        <>
          <p className="text-sm text-cream-300">
            When tracking shows the watch was delivered with a signature, let the buyer and RIHOSO know. The buyer&apos;s{" "}
            {p.inspectionHours}-hour inspection starts once receipt is verified.
          </p>
          <button disabled={busy} onClick={() => act({ action: "report_delivery" })} className={gold}>
            Tracking shows delivered
          </button>
        </>
      );
    } else if (!ship && p.status === "paid_held") {
      body = p.handoverReported ? (
        <p className="text-sm text-cream-300">
          You recorded the handover. Waiting for the buyer to confirm collection — their {p.inspectionHours}-hour inspection
          starts then.
        </p>
      ) : (
        <>
          <p className="text-sm text-cream-300">
            Arrange pickup in your messages. Meet somewhere public and check the buyer is the account holder. Record the
            handover here when it happens; the buyer confirms too.
          </p>
          <button
            disabled={busy}
            onClick={() => {
              if (confirm("Record that you handed the watch to the buyer just now?")) act({ action: "report_handover" });
            }}
            className={gold}
          >
            I&apos;ve handed the watch over
          </button>
        </>
      );
    } else if (p.status === "delivered") {
      body = (
        <p className="text-sm text-cream-300">
          Receipt is verified. Payment releases when the buyer accepts the watch, or at the end of the {p.inspectionHours}-hour
          inspection if no problem is reported.
        </p>
      );
    } else if (p.status === "disputed" && p.returnApproved && !p.returnProblem) {
      body = (
        <>
          <p className="text-cream-100 font-semibold">Approved return</p>
          <p className="text-sm text-cream-300">
            Send the buyer a prepaid return label in your messages, insured for the full price with signature required.
            {p.returnShipped ? " The buyer has shipped it — see the tracking above." : ""} When it arrives, inspect it within 2
            business days.
          </p>
          <div className="flex flex-wrap gap-3">
            <button
              disabled={busy}
              onClick={() => {
                if (confirm("Confirm the watch is back with you in the condition it was sent? The buyer is refunded in full.")) act({ action: "return_received" });
              }}
              className={gold}
            >
              It&apos;s back as sent — refund the buyer
            </button>
            <button disabled={busy} onClick={() => setShowReturnProblem((v) => !v)} className={danger}>
              It arrived with a problem
            </button>
          </div>
          {showReturnProblem && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                act({ action: "return_problem", problem: new FormData(e.currentTarget).get("problem") });
              }}
              className="space-y-3"
            >
              <textarea name="problem" required minLength={10} rows={3} className={inputClass} placeholder="Describe the specific problem; send photos in your messages." />
              <button disabled={busy} className="px-6 py-2 rounded bg-red-800/60 text-cream-50 disabled:opacity-60">Send to RIHOSO</button>
            </form>
          )}
        </>
      );
    }
  } else {
    if (ship && p.status === "paid_held") {
      body = p.shipOverdue ? (
        <>
          <p className="text-cream-100 font-semibold">The seller missed the shipping deadline.</p>
          <p className="text-sm text-cream-300">You can cancel for a full refund, or keep waiting — your payment stays held.</p>
          <div className="flex flex-wrap gap-3">
            <button
              disabled={busy}
              onClick={() => {
                if (confirm("Cancel this order and get a full refund?")) act({ action: "cancel_overdue" });
              }}
              className={danger}
            >
              Cancel for a full refund
            </button>
          </div>
        </>
      ) : (
        <p className="text-cream-100 font-semibold">Waiting for the seller to ship.</p>
      );
    } else if ((ship && p.status === "shipped") || (!ship && p.status === "paid_held")) {
      body = (
        <>
          <p className="text-cream-100 font-semibold">{ship ? "Has your watch arrived?" : "Have you collected the watch?"}</p>
          <p className="text-sm text-cream-300">
            Confirm {ship ? "receipt" : "the collection"} to start your {p.inspectionHours}-hour inspection. The seller isn&apos;t
            paid until you accept it or the inspection period ends with no problem reported.
          </p>
          <div className="flex flex-wrap gap-3">
            <button
              disabled={busy}
              onClick={() => {
                if (confirm(ship ? "Confirm the watch has arrived?" : "Confirm you've collected the watch from the seller?")) act({ action: "received" });
              }}
              className={gold}
            >
              {ship ? "It arrived — start my inspection" : "I've collected it — start my inspection"}
            </button>
            {disputeForm()}
          </div>
        </>
      );
    } else if (p.status === "delivered") {
      body = (
        <>
          <p className="text-cream-100 font-semibold">Inspect your watch</p>
          <p className="text-sm text-cream-300">If it&apos;s as described, accept it to pay the seller now. If not, report the problem before the inspection period ends.</p>
          <div className="flex flex-wrap gap-3">
            <button
              disabled={busy}
              onClick={() => {
                if (confirm("Accept the watch as described? This releases payment to the seller.")) act({ action: "accept" });
              }}
              className={gold}
            >
              Accept — it&apos;s as described
            </button>
            {disputeForm()}
          </div>
        </>
      );
    } else if (p.status === "disputed" && p.returnApproved && !p.returnShipped) {
      body = (
        <>
          <p className="text-cream-100 font-semibold">Ship the return</p>
          <p className="text-sm text-cream-300">
            Use the prepaid insured label the seller sends in your messages. Pack the complete watch and everything it came with,
            ship within 5 business days of getting the label, then enter the tracking here.
          </p>
          {trackingForm("return_shipped", "Return shipped")}
        </>
      );
    }
  }

  if (!body && !error) return null;
  return (
    <div className="panel-lux rounded-xl p-6 space-y-4">
      {body}
      {error && <p className="text-sm text-red-300" role="alert">{error}</p>}
      {!busy ? null : <p className="text-xs text-cream-400">Working…</p>}
    </div>
  );
}
