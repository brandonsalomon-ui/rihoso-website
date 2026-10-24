import { Gear, GuillocheRosette, OrnamentDivider } from "./ornaments";

/** Shared banner for interior pages: eyebrow, title, intro, and rotating horological artwork. */
export default function PageHero({
  eyebrow,
  title,
  subtitle,
  children,
}: {
  eyebrow: string;
  title: string;
  subtitle?: string;
  children?: React.ReactNode;
}) {
  return (
    <section className="relative overflow-hidden bg-forest-900 border-b border-gold-400/10">
      {/* glow */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(201,168,76,0.14),transparent_60%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_85%_60%,rgba(61,107,61,0.35),transparent_45%)]" />

      {/* artwork */}
      <div className="pointer-events-none absolute -right-40 top-1/2 -translate-y-1/2 text-gold-400/[0.10]">
        <GuillocheRosette className="w-[560px] h-[560px] animate-rotate-slow" />
      </div>
      <div className="pointer-events-none absolute -left-24 -bottom-24 text-gold-400/[0.07]">
        <Gear className="w-72 h-72 animate-rotate-slow-reverse" teeth={30} />
      </div>
      <div className="pointer-events-none absolute left-40 -bottom-10 text-gold-400/[0.06] hidden md:block">
        <Gear className="w-32 h-32 animate-rotate-slow" teeth={16} />
      </div>

      <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16 sm:pt-24 sm:pb-20 text-center">
        <p
          className="inline-flex items-center gap-3 text-gold-400 text-sm uppercase tracking-[0.3em] animate-fade-in-up opacity-0"
        >
          <span className="h-px w-8 bg-gold-400/60" />
          {eyebrow}
          <span className="h-px w-8 bg-gold-400/60" />
        </p>
        <h1 className="mt-4 text-4xl sm:text-5xl lg:text-6xl font-display font-bold text-cream-50 text-balance animate-fade-in-up opacity-0 animation-delay-200">
          {title}
        </h1>
        {subtitle && (
          <p className="mt-5 text-lg sm:text-xl text-cream-300 max-w-2xl mx-auto leading-relaxed animate-fade-in-up opacity-0 animation-delay-400">
            {subtitle}
          </p>
        )}
        <OrnamentDivider className="mt-8 animate-fade-in-up opacity-0 animation-delay-400" />
        {children && <div className="mt-10 animate-fade-in-up opacity-0 animation-delay-600">{children}</div>}
      </div>
    </section>
  );
}
