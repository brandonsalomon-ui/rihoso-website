import { OrnamentDivider } from "./ornaments";

export default function SectionHeading({
  title,
  subtitle,
  centered = true,
  light = false,
}: {
  title: string;
  subtitle?: string;
  centered?: boolean;
  light?: boolean;
}) {
  return (
    <div className={centered ? "text-center" : ""}>
      <h2
        className={`font-display text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight ${
          light ? "text-forest-800" : "text-cream-50"
        }`}
      >
        {title}
      </h2>
      {subtitle && (
        <p
          className={`mt-4 font-body text-lg sm:text-xl max-w-2xl ${
            centered ? "mx-auto" : ""
          } ${light ? "text-forest-600" : "text-cream-300"}`}
        >
          {subtitle}
        </p>
      )}
      <OrnamentDivider className={`mt-6 ${centered ? "" : "!justify-start"}`} />
    </div>
  );
}
