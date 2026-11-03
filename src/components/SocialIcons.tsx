import { SOCIAL } from "@/lib/social";

export function InstagramIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4.2" />
      <circle cx="17.4" cy="6.6" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function FacebookIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true">
      <path d="M13.5 21v-7.5h2.5l.4-3h-2.9V8.6c0-.87.25-1.46 1.5-1.46h1.55V4.45A20.6 20.6 0 0 0 14.3 4.3c-2.2 0-3.7 1.34-3.7 3.8v2.4H8.1v3h2.5V21h2.9Z" />
    </svg>
  );
}

/** Round Instagram + Facebook icon links, used in the footer and the feed section. */
export default function SocialIcons({ className = "" }: { className?: string }) {
  const links = [
    { href: SOCIAL.instagram.url, label: `RIHOSO on Instagram (@${SOCIAL.instagram.handle})`, Icon: InstagramIcon },
    { href: SOCIAL.facebook.url, label: "RIHOSO on Facebook", Icon: FacebookIcon },
  ];
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {links.map(({ href, label, Icon }) => (
        <a
          key={href}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={label}
          title={label}
          className="flex items-center justify-center w-10 h-10 rounded-full border border-gold-400/40 text-gold-400 hover:bg-gold-400 hover:text-forest-950 hover:border-gold-400 transition-colors duration-300"
        >
          <Icon className="w-5 h-5" />
        </a>
      ))}
    </div>
  );
}
