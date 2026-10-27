/** A single headline number with its label and an optional note. */
export default function StatTile({ label, value, note }: { label: string; value: string; note?: string }) {
  return (
    <div className="panel-lux rounded-lg px-5 py-4">
      <p className="text-[11px] uppercase tracking-[0.22em] text-gold-400/90">{label}</p>
      <p className="mt-1 font-display text-3xl text-cream-50 tabular-nums">{value}</p>
      {note && <p className="mt-1 text-xs text-cream-400">{note}</p>}
    </div>
  );
}
