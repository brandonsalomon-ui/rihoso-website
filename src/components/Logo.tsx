import Image from "next/image";

export default function Logo({ size = "default" }: { size?: "small" | "default" | "large" }) {
  // Large (home page hero): the full seal on its own — it already carries the society's name.
  if (size === "large") {
    return (
      <Image
        src="/rihoso-seal.png"
        alt="Rhode Island Horological Society seal"
        width={600}
        height={600}
        priority
        className="w-56 h-56 sm:w-64 sm:h-64 lg:w-72 lg:h-72 drop-shadow-[0_4px_24px_rgba(0,0,0,0.35)]"
      />
    );
  }

  const dimensions = {
    small: { emblem: 48, text: "text-lg", subtitle: "text-[9px]" },
    default: { emblem: 64, text: "text-2xl", subtitle: "text-[10px]" },
  };
  const d = dimensions[size];

  return (
    <div className="flex items-center gap-3">
      <Image
        src="/rihoso-seal.png"
        alt="Rhode Island Horological Society seal"
        width={d.emblem * 2}
        height={d.emblem * 2}
        priority={size === "small"}
        className="flex-shrink-0"
        style={{ width: d.emblem, height: d.emblem }}
      />
      <div className="flex flex-col">
        <span className={`${d.text} font-display font-bold tracking-[0.2em] text-cream-100 leading-none`}>
          RIHOSO
        </span>
        <span className={`${d.subtitle} font-body tracking-[0.15em] text-gold-400 uppercase leading-tight mt-0.5`}>
          Rhode Island Horological Society
        </span>
      </div>
    </div>
  );
}
