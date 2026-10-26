import Link from "next/link";

/** Small account bar shown at the top of Watch Exchange pages. */
export default function ExchangeNav({ signedIn }: { signedIn: boolean }) {
  return (
    <div className="bg-forest-900/70 border-b border-gold-400/10">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-12 flex items-center justify-between text-sm">
        <Link href="/marketplace" className="text-gold-300 tracking-widest uppercase text-xs">Watch Exchange</Link>
        <nav className="flex items-center gap-5 text-cream-300">
          {signedIn ? (
            <>
              <Link href="/marketplace/messages" className="hover:text-gold-300">Messages</Link>
              <Link href="/marketplace/account" className="hover:text-gold-300">My account</Link>
              <Link href="/marketplace/listings/new" className="text-gold-300 hover:text-gold-200">Sell a watch</Link>
            </>
          ) : (
            <>
              <Link href="/marketplace/sell" className="hover:text-gold-300">Sell a watch</Link>
              <Link href="/marketplace/sign-in" className="text-gold-300 hover:text-gold-200">Sign in</Link>
            </>
          )}
        </nav>
      </div>
    </div>
  );
}
