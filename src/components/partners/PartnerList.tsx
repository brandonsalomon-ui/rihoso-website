import type { RepairPartner } from "@/lib/repair-partners";

/** Cards for the current RIHOSO repair partner workshops. Public details only: no phone, address or website — customers go through RIHOSO. */
export default function PartnerList({ partners }: { partners: Pick<RepairPartner, "id" | "business_name" | "city" | "blurb">[] }) {
  if (!partners.length) {
    return <p className="text-center text-cream-300">Our first repair partners are joining now. Check back soon.</p>;
  }
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
      {partners.map((p) => (
        <div key={p.id} className="card-lux rounded-xl p-6">
          <p className="text-xs uppercase tracking-[0.25em] text-gold-400 mb-2">RIHOSO Repair Partner</p>
          <h3 className="font-display text-xl text-cream-50">{p.business_name}</h3>
          {p.city && <p className="text-sm text-cream-300 mt-1">{p.city}</p>}
          {p.blurb && <p className="text-sm text-cream-200 mt-3 leading-relaxed">{p.blurb}</p>}
        </div>
      ))}
    </div>
  );
}
