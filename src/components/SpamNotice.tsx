// Blinking "check your spam folder" notice shown above the submit button on
// every form where the visitor expects an email back from RIHOSO.
// Self-contained colors so it reads on both the dark green and light sections.
export default function SpamNotice({ className = "" }: { className?: string }) {
  return (
    <div
      role="note"
      className={`flex items-start gap-3 rounded-lg border-2 border-gold-400 bg-gold-100 px-4 py-3 text-left text-forest-900 shadow-md ${className}`}
    >
      <span className="relative mt-1.5 flex h-3 w-3 shrink-0" aria-hidden="true">
        <span className="absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75 motion-safe:animate-ping" />
        <span className="relative inline-flex h-3 w-3 rounded-full bg-red-600" />
      </span>
      <p className="text-base leading-snug">
        <strong className="font-semibold uppercase tracking-wide text-red-700 motion-safe:animate-pulse">
          Check your spam folder
        </strong>{" "}
        &mdash; our emails sometimes land there. Look for mail from{" "}
        <span className="whitespace-nowrap font-semibold">rihoso.com</span> and mark it &ldquo;Not spam&rdquo; so you
        don&apos;t miss our reply.
      </p>
    </div>
  );
}
