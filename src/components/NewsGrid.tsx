interface NewsArticle {
  title: string;
  description?: string;
  summary?: string;
  url: string;
  source?: string;
  publishedAt?: string;
  published_at?: string;
  image?: string;
  imageUrl?: string;
  urlToImage?: string;
}

async function fetchNews(): Promise<NewsArticle[]> {
  try {
    const res = await fetch("https://global-event-hub.replit.app/api/news", {
      next: { revalidate: 3600 },
    });
    if (!res.ok) return [];
    const data = await res.json();
    const articles = Array.isArray(data) ? data : data.articles || [];
    return articles.slice(0, 6);
  } catch {
    return [];
  }
}

export default async function NewsGrid() {
  const articles = await fetchNews();

  if (articles.length === 0) {
    return (
      <div className="text-center py-12 text-cream-300 font-body text-lg">
        News feed is currently unavailable. Check back soon.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {articles.map((article, i) => {
        const imageUrl = article.image || article.imageUrl || article.urlToImage;
        const description = article.description || article.summary || "";
        const date = article.publishedAt || article.published_at;

        return (
          <a
            key={i}
            href={article.url}
            target="_blank"
            rel="noopener noreferrer"
            className="group block bg-forest-800/50 border border-forest-600/30 hover:border-gold-400/40 transition-all duration-500 overflow-hidden"
          >
            {imageUrl && (
              <div className="aspect-[16/10] overflow-hidden bg-forest-700/30">
                <img
                  src={imageUrl}
                  alt={article.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  loading="lazy"
                />
              </div>
            )}
            <div className="p-5">
              <div className="flex items-center gap-2 mb-3">
                {article.source && (
                  <span className="text-gold-400 font-body text-xs tracking-widest uppercase">
                    {typeof article.source === "string" ? article.source : (article.source as { name?: string }).name || ""}
                  </span>
                )}
                {date && (
                  <span className="text-cream-400 font-body text-xs">
                    {new Date(date).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })}
                  </span>
                )}
              </div>
              <h3 className="font-display text-lg text-cream-100 group-hover:text-gold-300 transition-colors duration-300 leading-snug line-clamp-2">
                {article.title}
              </h3>
              {description && (
                <p className="mt-2 text-cream-300 font-body text-sm leading-relaxed line-clamp-2">
                  {description}
                </p>
              )}
            </div>
          </a>
        );
      })}
    </div>
  );
}
