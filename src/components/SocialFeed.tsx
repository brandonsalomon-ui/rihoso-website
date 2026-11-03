import Image from "next/image";
import { SOCIAL, getInstagramPosts } from "@/lib/social";
import { FacebookIcon, InstagramIcon } from "./SocialIcons";

function FollowButtons() {
  return (
    <div className="flex flex-col sm:flex-row gap-4 justify-center">
      <a
        href={SOCIAL.instagram.url}
        target="_blank"
        rel="noopener noreferrer"
        className="btn-gold inline-flex items-center justify-center gap-3 px-7 py-3 tracking-widest uppercase text-sm"
      >
        <InstagramIcon className="w-5 h-5" />
        <span className="sm:hidden">Follow on Instagram</span>
        <span className="hidden sm:inline">Follow @{SOCIAL.instagram.handle}</span>
      </a>
      <a
        href={SOCIAL.facebook.url}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center justify-center gap-3 px-7 py-3 border border-cream-300/30 text-cream-200 tracking-widest uppercase text-sm hover:border-gold-400 hover:text-gold-400 hover:bg-gold-400/5 transition-colors duration-300"
      >
        <FacebookIcon className="w-5 h-5" />
        Like us on Facebook
      </a>
    </div>
  );
}

function shortCaption(caption: string) {
  const firstLine = caption.split("\n").find((l) => l.trim()) || "";
  return firstLine.length > 120 ? `${firstLine.slice(0, 117).trimEnd()}…` : firstLine;
}

/** Latest Instagram posts, each linking to the post, plus follow links for Instagram and Facebook. */
export default async function SocialFeed() {
  const posts = await getInstagramPosts(8);

  return (
    <div>
      {posts.length > 0 && (
        <ul className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
          {posts.map((post) => (
            <li key={post.id}>
              <a
                href={post.permalink}
                target="_blank"
                rel="noopener noreferrer"
                className="group relative block aspect-square overflow-hidden rounded-xl border border-gold-400/20 bg-forest-900"
                aria-label={`View on Instagram: ${shortCaption(post.caption) || "RIHOSO post"}`}
              >
                <Image
                  src={post.image}
                  alt={shortCaption(post.caption) || "RIHOSO Instagram post"}
                  fill
                  sizes="(min-width: 768px) 25vw, 50vw"
                  className="object-cover transition-transform duration-700 group-hover:scale-105"
                />
                {(post.isCarousel || post.isVideo) && (
                  <span className="absolute top-2 right-2 rounded-full bg-forest-950/70 px-2 py-0.5 text-[10px] tracking-widest uppercase text-cream-100">
                    {post.isVideo ? "Video" : "Carousel"}
                  </span>
                )}
                <span className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-forest-950/90 via-forest-950/30 to-transparent p-3 sm:p-4 opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100 transition-opacity duration-300">
                  <span className="text-cream-100 text-sm leading-snug line-clamp-3">{shortCaption(post.caption)}</span>
                  <span className="mt-2 inline-flex items-center gap-1.5 text-gold-300 text-xs tracking-widest uppercase">
                    <InstagramIcon className="w-4 h-4" />
                    View post
                  </span>
                </span>
              </a>
            </li>
          ))}
        </ul>
      )}

      <div className={posts.length > 0 ? "mt-12" : ""}>
        <FollowButtons />
      </div>
    </div>
  );
}
